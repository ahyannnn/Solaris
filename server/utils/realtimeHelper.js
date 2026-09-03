// server/utils/realtimeHelper.js
// Central helper for real-time table updates via existing Socket.IO instance.
// Reuses server/socket.js singleton (set in server.js). No polling.

const { getIO } = require('../socket');

const ADMIN_ROOM = 'admins';

/**
 * Remove sensitive fields before broadcasting.
 */
function sanitizeRecord(entity, record) {
  if (!record || typeof record !== 'object') return record;
  const obj = typeof record.toObject === 'function' ? record.toObject() : { ...record };
  if (entity === 'users') {
    delete obj.passwordHash;
    delete obj.password;
  }
  return obj;
}

/**
 * Emit a table change to admin clients.
 * @param {string} entity - e.g. 'users' | 'devices' | 'schedules' | 'projects' | 'solar-invoices' | 'bank-transfers' | 'free-quotes' | 'pre-assessments'
 * @param {string} action - 'created' | 'updated' | 'deleted'
 * @param {*} record - Mongoose doc or plain object (may be null for delete)
 */
function emitTableChange(entity, action, record) {
  try {
    const io = getIO();
    if (!io) return;
    const clean = sanitizeRecord(entity, record);
    const id =
      (clean && (clean._id || clean.id)) ||
      (record && (record._id || record.id)) ||
      null;
    const payload = { entity, action, record: clean, id: id ? String(id) : null };
    // Primary channel: single event all tables listen to (with entity filter client-side)
    io.to(ADMIN_ROOM).emit('table:changed', payload);
    // Convenience channel per entity+action (e.g. 'users:created')
    io.to(ADMIN_ROOM).emit(`${entity}:${action}`, payload);
  } catch (err) {
    console.error('[realtimeHelper] emit failed:', err.message);
  }
}

/**
 * Attach Mongoose middleware to a schema so ANY create/update/delete
 * (save, findOneAndUpdate, findByIdAndUpdate, deleteOne, findOneAndDelete, insertMany)
 * automatically broadcasts. Covers status changes too since they go through save/update.
 */
function attachRealtimeHooks(schema, entity) {
  // Capture whether save() is an insert vs update.
  // NOTE: Mongoose 7+ (incl. v9) no longer passes a `next` callback to
  // document pre('save') hooks — use a sync hook with no callback instead.
  schema.pre('save', function () {
    try {
      this._wasNew = this.isNew;
    } catch (e) { /* ignore */ }
  });

  schema.post('save', function (doc) {
    try {
      const action = this._wasNew ? 'created' : 'updated';
      emitTableChange(entity, action, doc);
    } catch (e) { /* ignore */ }
  });

  // findOneAndUpdate / findByIdAndUpdate → updated
  schema.post('findOneAndUpdate', function (doc) {
    try {
      if (doc) emitTableChange(entity, 'updated', doc);
    } catch (e) { /* ignore */ }
  });

  // findOneAndDelete / findByIdAndDelete → deleted
  schema.post('findOneAndDelete', function (doc) {
    try {
      if (doc) emitTableChange(entity, 'deleted', doc);
    } catch (e) { /* ignore */ }
  });

  // Legacy alias (Mongoose < 7 / some code paths)
  try {
    schema.post('findOneAndRemove', function (doc) {
      try {
        if (doc) emitTableChange(entity, 'deleted', doc);
      } catch (e) { /* ignore */ }
    });
  } catch (e) { /* hook may not exist — ignore */ }

  // doc.deleteOne() → deleted (document middleware)
  try {
    schema.post('deleteOne', { document: true, query: false }, function (doc) {
      try {
        if (doc) emitTableChange(entity, 'deleted', doc);
      } catch (e) { /* ignore */ }
    });
  } catch (e) { /* ignore */ }

  // Model.deleteOne(filter) → deleted (query middleware; doc is null, use filter)
  try {
    schema.post('deleteOne', function () {
      // Query middleware post has no doc; emit generic invalidation with filter
      try {
        const filter = typeof this.getFilter === 'function' ? this.getFilter() : null;
        emitTableChange(entity, 'deleted', filter && filter._id ? { _id: filter._id } : null);
      } catch (e) { /* ignore */ }
    });
  } catch (e) { /* ignore */ }

  // insertMany → created (docs array)
  try {
    schema.post('insertMany', function (docs) {
      try {
        const arr = Array.isArray(docs) ? docs : [docs].filter(Boolean);
        arr.forEach((d) => emitTableChange(entity, 'created', d));
      } catch (e) { /* ignore */ }
    });
  } catch (e) { /* ignore */ }
}

module.exports = {
  ADMIN_ROOM,
  emitTableChange,
  attachRealtimeHooks,
};

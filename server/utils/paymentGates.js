// utils/paymentGates.js
// Progress-gated staged payments (50/50, 30/60/10, installment).
//
// Rule: after the initial payment is verified, later invoices stay hidden AND
// unpayable until the engineer acts first:
// - fifty_fifty:      final (50%) unlocks when engineer STARTS installation.
// - thirty_sixty_ten / installment:
//     progress unlocks on engineer START;
//     final unlocks on an engineer photo-update AFTER progress was paid
//     (percentage unchanged — the 60% is already paid).
// - full: single invoice, never gated.
//
// Works for legacy projects too: explicit fields (workStartedAt /
// postProgressUpdateAt) are preferred, otherwise we derive from
// startDate / status / engineer-authored projectUpdates entries.

const STARTED_STATUSES = ['in_progress', 'progress_paid', 'full_paid', 'completed'];

const schedOf = (project, type) =>
  (project?.paymentSchedule || []).find((p) => p.type === type) || null;

const schedPaidAt = (project, type) => {
  const item = schedOf(project, type);
  if (!item || item.status !== 'paid') return null;
  return item.paidAt ? new Date(item.paidAt) : null;
};

const engineerIdOf = (project) => {
  const v = project?.assignedEngineerId;
  if (!v) return '';
  return String(v._id || v);
};

const isEngineerAuthored = (update, project) => {
  if (!update?.updatedBy) return false;
  const eng = engineerIdOf(project);
  if (!eng) return false;
  const by = update.updatedBy;
  return String(by._id || by) === eng;
};

const engineerUpdatesAfter = (project, date) => {
  if (!date) return [];
  const after = new Date(date).getTime();
  if (Number.isNaN(after)) return [];
  return (project?.projectUpdates || []).filter((u) => {
    if (!u?.createdAt) return false;
    const t = new Date(u.createdAt).getTime();
    return !Number.isNaN(t) && t > after && isEngineerAuthored(u, project);
  });
};

const isStarted = (project) => {
  if (!project) return false;
  if (project.workStartedAt || project.startDate) return true;
  return STARTED_STATUSES.includes(project.status);
};

// Final-stage unlock for thirty_sixty_ten / installment: engineer photo-update
// AFTER the progress payment was verified as paid.
const isFinalUnlocked = (project) => {
  if (!project) return false;
  if (project.postProgressUpdateAt) return true;
  const paidAt = schedPaidAt(project, 'progress');
  if (!paidAt) return false;
  return engineerUpdatesAfter(project, paidAt).length > 0;
};

// Locks per payment preference. fifty_fifty has no progress stage
// (progressLocked is irrelevant there — callers check by invoice type).
const getUnlockState = (project) => {
  const pref = project?.paymentPreference || 'installment';
  if (pref === 'full') {
    return { started: true, progressLocked: false, finalLocked: false };
  }
  if (pref === 'fifty_fifty') {
    const started = isStarted(project);
    return { started, progressLocked: true, finalLocked: !started };
  }
  const started = isStarted(project);
  return { started, progressLocked: !started, finalLocked: !isFinalUnlocked(project) };
};

const LOCK_MESSAGES = {
  start: 'Locked: waiting for the engineer to start the installation before this payment opens',
  photos: 'Locked: final payment unlocks after the engineer uploads 60%-completion photos and posts a progress update',
};

// Backend enforcement: can this invoice type be paid/submitted right now?
// initial/full are never gated by engineer progress.
const assertStagePayable = (project, invoiceType) => {
  const pref = project?.paymentPreference || 'installment';
  if (invoiceType === 'initial' || invoiceType === 'full') return { ok: true };
  const locks = getUnlockState(project);
  if (invoiceType === 'progress') {
    if (locks.progressLocked) return { ok: false, message: LOCK_MESSAGES.start };
    return { ok: true };
  }
  if (invoiceType === 'final') {
    if (pref === 'fifty_fifty') {
      if (locks.finalLocked) return { ok: false, message: LOCK_MESSAGES.start };
      return { ok: true };
    }
    if (!schedPaidAt(project, 'progress')) {
      return { ok: false, message: 'Progress payment must be completed first' };
    }
    if (locks.finalLocked) return { ok: false, message: LOCK_MESSAGES.photos };
    return { ok: true };
  }
  // Unknown/legacy types (e.g. retention): allow, keep prior-stage rules in callers.
  return { ok: true };
};

// Customer visibility: locked invoices must not even appear in billing.
const isInvoiceVisibleToCustomer = (project, invoice) => {
  if (!invoice) return false;
  const type = invoice.invoiceType;
  if (type === 'initial' || type === 'full') return true;
  const check = assertStagePayable(project, type);
  return check.ok;
};

module.exports = {
  schedOf,
  schedPaidAt,
  isStarted,
  isFinalUnlocked,
  getUnlockState,
  assertStagePayable,
  isInvoiceVisibleToCustomer,
  LOCK_MESSAGES,
};

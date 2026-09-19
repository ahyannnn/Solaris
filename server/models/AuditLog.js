// models/AuditLog.js

const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    role: {
      type: String,
      required: true
    },

    module: {
      type: String,
      required: true
    },

    action: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for server-side paging/search/sort
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ module: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ role: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
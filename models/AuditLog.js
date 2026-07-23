const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g. "APPROVE_ORGANIZER", "DELETE_EVENT"
    targetType: { type: String }, // e.g. "User", "Event"
    targetId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);

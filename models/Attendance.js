const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    checkInTime: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

attendanceSchema.index({ ticket: 1 }, { unique: true }); // prevents duplicate entry

module.exports = mongoose.model('Attendance', attendanceSchema);

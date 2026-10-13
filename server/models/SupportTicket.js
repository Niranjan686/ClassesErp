const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
  ticketNo: { type: String, required: true, uppercase: true, trim: true },
  reportedByName: { type: String, required: true },
  reportedByEmail: { type: String, required: true },
  reportedByRole: { type: String, default: 'Admin' },
  category: {
    type: String,
    enum: [
      'Bug / System Error',
      'Billing & SaaS Subscription',
      'Feature Request',
      'Hardware & Biometrics',
      'Data Import & Recovery',
      'Other Support'
    ],
    default: 'Bug / System Error',
    index: true,
  },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
    index: true,
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open',
    index: true,
  },
  resolutionNotes: String,
  assignedTo: String,
  replies: [{
    senderName: String,
    senderRole: { type: String, enum: ['School Staff', 'Platform SuperAdmin', 'Technical Support'], default: 'School Staff' },
    message: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

supportTicketSchema.index({ instituteId: 1, ticketNo: 1 }, { unique: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);

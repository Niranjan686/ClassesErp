const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    recipientType: { type: String, enum: ['Student', 'Parent', 'BranchAdmin', 'Staff'], required: true },
    recipientName: { type: String, required: true },
    recipientEmail: { type: String, default: '' },
    recipientPhone: { type: String, default: '' },
    type: { type: String, enum: ['Push', 'Email', 'SMS', 'WhatsApp'], required: true },
    title: { type: String, default: '' },
    subject: { type: String, default: '' },
    message: { type: String, required: true },
    triggerEvent: { 
        type: String, 
        enum: ['Attendance_Present', 'Attendance_Absent', 'Student_Admission', 'Absentee_Parent_Alert', 'Leave_Status_Update', 'Branch_Credentials', 'Fee_Receipt', 'General_Alert'],
        required: true 
    },
    status: { type: String, enum: ['Sent', 'Delivered', 'Simulated', 'Failed'], default: 'Sent' },
    data: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);

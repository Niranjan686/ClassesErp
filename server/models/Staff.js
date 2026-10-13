const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    instituteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institute',
        index: true
    },
    staffId: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    designation: { 
        type: String, 
        enum: ['Senior Instructor', 'Lab Assistant', 'Branch Manager', 'Counselor', 'Faculty', 'Senior Lecturer', 'Accountancy Trainer', 'Lead Software Faculty', 'Teacher', 'Admin Staff', 'Principal', 'Other'],
        default: 'Faculty' 
    },
    department: { type: String, default: 'General' },
    specialization: { type: String, default: 'MS-CIT / Tally' },
    joiningDate: { type: Date, default: Date.now },
    salary: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' }
}, { timestamps: true });

staffSchema.index({ instituteId: 1, staffId: 1 });

module.exports = mongoose.model('Staff', staffSchema);

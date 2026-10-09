const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    designation: { 
        type: String, 
        enum: ['Senior Instructor', 'Lab Assistant', 'Branch Manager', 'Counselor', 'Faculty'],
        default: 'Faculty' 
    },
    specialization: { type: String, default: 'MS-CIT / Tally' },
    joiningDate: { type: Date, default: Date.now },
    salary: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);

const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
    branchName: { type: String, required: true, trim: true }, // e.g. "Keerti Computer Classes - Dadar Central"
    branchCode: { type: String, required: true, unique: true, uppercase: true, trim: true }, // e.g. "KCC-DADAR"
    ownerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: String, required: true },
    city: { type: String, default: 'Mumbai' },
    adminUsername: { type: String, required: true },
    subscriptionPlan: { 
        type: String, 
        enum: ['Starter', 'Professional', 'Enterprise Franchise', 'Lifetime'], 
        default: 'Professional' 
    },
    subscriptionStatus: { 
        type: String, 
        enum: ['Active', 'Trial', 'Suspended', 'Expired'], 
        default: 'Active' 
    },
    maxStudents: { type: Number, default: 500 },
    validUntil: { type: Date, default: () => new Date(Date.now() + 365*24*60*60*1000) } // 1 year default
}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);

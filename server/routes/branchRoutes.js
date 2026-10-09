const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Branch = require('../models/Branch');
const User = require('../models/user');
const Student = require('../models/Students');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const { sendBranchWelcome } = require('../utils/notifyService');

// 1. Get all franchise branches with live metrics (Super Admin)
router.get('/', async (req, res) => {
    try {
        const branches = await Branch.find().sort({ createdAt: -1 }).lean();

        const branchesWithMetrics = await Promise.all(branches.map(async (b) => {
            const [studentCount, batchCount, courseCount] = await Promise.all([
                Student.countDocuments({ branchId: b._id }),
                Batch.countDocuments({ branchId: b._id }),
                Course.countDocuments({ branchId: b._id })
            ]);

            return {
                ...b,
                studentCount,
                batchCount,
                courseCount: courseCount || 5 // default 5 standard courses
            };
        }));

        res.json(branchesWithMetrics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. Super Admin SaaS Overview KPIs
router.get('/super-stats', async (req, res) => {
    try {
        const [totalBranches, activeBranches, totalStudents, totalBatches] = await Promise.all([
            Branch.countDocuments(),
            Branch.countDocuments({ subscriptionStatus: 'Active' }),
            Student.countDocuments(),
            Batch.countDocuments()
        ]);

        res.json({
            totalBranches,
            activeBranches,
            totalStudents,
            totalBatches,
            estimatedMonthlyRevenue: activeBranches * 3999 // SaaS Subscription value
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. Register New Franchise Branch (Auto provisions Branch Admin + Dispatches Email/SMS)
router.post('/', async (req, res) => {
    try {
        const {
            branchName,
            branchCode,
            ownerName,
            phone,
            email,
            address,
            city = 'Mumbai',
            adminUsername,
            adminPassword = 'AdminPassword@123',
            subscriptionPlan = 'Professional',
            maxStudents = 500
        } = req.body;

        if (!branchName || !branchCode || !ownerName || !phone || !email || !adminUsername) {
            return res.status(400).json({ message: 'Please provide all required branch and contact details' });
        }

        // Check if branch code or username already exists
        const existingBranch = await Branch.findOne({ branchCode: branchCode.toUpperCase() });
        if (existingBranch) {
            return res.status(400).json({ message: `Branch code "${branchCode}" already registered` });
        }

        const existingUser = await User.findOne({ username: adminUsername });
        if (existingUser) {
            return res.status(400).json({ message: `Username "${adminUsername}" already taken` });
        }

        // Create Branch
        const branch = new Branch({
            branchName,
            branchCode: branchCode.toUpperCase(),
            ownerName,
            phone,
            email,
            address,
            city,
            adminUsername,
            subscriptionPlan,
            subscriptionStatus: 'Active',
            maxStudents: Number(maxStudents)
        });
        const savedBranch = await branch.save();

        // Create Branch Admin User Account
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const adminUser = new User({
            username: adminUsername,
            password: hashedPassword,
            name: ownerName,
            email,
            phone,
            role: 'admin',
            branchId: savedBranch._id
        });
        await adminUser.save();

        // Shoot Email & SMS with Admin Credentials
        await sendBranchWelcome({
            branch: savedBranch,
            adminUsername,
            plainPassword: adminPassword
        });

        res.status(201).json({
            message: `Branch "${branchName}" registered successfully! Admin login credentials dispatched to ${email}.`,
            branch: savedBranch,
            credentials: {
                username: adminUsername,
                password: adminPassword
            }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 4. Update Branch Details / Subscription Status
router.put('/:id', async (req, res) => {
    try {
        const updated = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Branch not found' });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 5. Delete / Deactivate Branch
router.delete('/:id', async (req, res) => {
    try {
        await Branch.findByIdAndDelete(req.params.id);
        res.json({ message: 'Branch removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Student = require('../models/Students');

// 1. Submit Student Grievance / Complaint
router.post('/', async (req, res) => {
    try {
        const {
            studentId,
            studentName,
            grno,
            branchId,
            courseName,
            batchName,
            category,
            subject,
            description,
            priority = 'Medium'
        } = req.body;

        if (!studentId || !subject || !description) {
            return res.status(400).json({ message: 'Subject, description, and student ID are required' });
        }

        const complaint = new Complaint({
            studentId,
            studentName: studentName || 'Student',
            grno: grno || 'N/A',
            branchId,
            courseName,
            batchName,
            category: category || 'Faculty & Teaching',
            subject,
            description,
            priority,
            status: 'Open'
        });

        const savedComplaint = await complaint.save();
        res.status(201).json({
            message: 'Grievance ticket submitted successfully. Center admin will investigate.',
            complaint: savedComplaint
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 2. Get all complaints (Branch Admin)
router.get('/', async (req, res) => {
    try {
        const { branchId, status, category } = req.query;
        const query = {};
        if (branchId) query.branchId = branchId;
        if (status && status !== 'ALL') query.status = status;
        if (category && category !== 'ALL') query.category = category;

        const complaints = await Complaint.find(query).sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. Get student's own complaints
router.get('/my-complaints/:studentId', async (req, res) => {
    try {
        const complaints = await Complaint.find({ studentId: req.params.studentId }).sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. Resolve / Respond to complaint (Branch Admin)
router.put('/:id/resolve', async (req, res) => {
    try {
        const { status, adminResponse, resolvedBy = 'Center Head' } = req.body;

        const updated = await Complaint.findByIdAndUpdate(
            req.params.id,
            {
                status: status || 'Resolved',
                adminResponse: adminResponse || 'Thank you for reporting. The issue has been reviewed and addressed.',
                resolvedBy,
                resolvedAt: new Date()
            },
            { new: true }
        );

        if (!updated) return res.status(404).json({ message: 'Complaint ticket not found' });
        res.json({
            message: 'Grievance response updated successfully',
            complaint: updated
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;

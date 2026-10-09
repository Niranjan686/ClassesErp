const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');
const Batch = require('../models/Batch');

// Get all staff
router.get('/', async (req, res) => {
    try {
        const staffList = await Staff.find().sort({ createdAt: -1 });
        res.json(staffList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single staff member
router.get('/:id', async (req, res) => {
    try {
        const member = await Staff.findById(req.params.id);
        if (!member) return res.status(404).json({ message: 'Staff member not found' });
        res.json(member);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new staff
router.post('/', async (req, res) => {
    try {
        const newStaff = new Staff(req.body);
        const saved = await newStaff.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update staff
router.put('/:id', async (req, res) => {
    try {
        const updated = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ message: 'Staff member not found' });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete staff
router.delete('/:id', async (req, res) => {
    try {
        await Staff.findByIdAndDelete(req.params.id);
        res.json({ message: 'Staff member removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

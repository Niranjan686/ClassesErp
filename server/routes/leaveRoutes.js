const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const Student = require('../models/Students');
const Staff = require('../models/Staff');
const Attendance = require('../models/Attendance');
const { sendLeaveStatusNotification } = require('../utils/notifyService');

// 1. Apply for Leave (Student or Staff)
router.post('/apply', async (req, res) => {
    try {
        const {
            applicantId,
            applicantType,
            applicantName,
            identifier,
            branchId,
            courseId,
            batchId,
            leaveType,
            startDate,
            endDate,
            reason
        } = req.body;

        if (!applicantId || !applicantType || !startDate || !endDate || !reason) {
            return res.status(400).json({ message: 'Missing required leave fields (dates, applicant, reason)' });
        }

        // Calculate total days
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const newLeave = new Leave({
            applicantId,
            applicantType,
            applicantName,
            identifier,
            branchId,
            courseId,
            batchId,
            leaveType,
            startDate,
            endDate,
            totalDays,
            reason,
            status: 'Pending'
        });

        const savedLeave = await newLeave.save();
        res.status(201).json({
            message: 'Leave application submitted successfully! Pending admin approval.',
            leave: savedLeave
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 2. Get all leaves (Branch Admin review board)
router.get('/', async (req, res) => {
    try {
        const { branchId, status, applicantType } = req.query;
        const query = {};
        if (branchId) query.branchId = branchId;
        if (status && status !== 'ALL') query.status = status;
        if (applicantType && applicantType !== 'ALL') query.applicantType = applicantType;

        const leaves = await Leave.find(query).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. Get my leaves (Student or Staff self view)
router.get('/my-leaves/:applicantId', async (req, res) => {
    try {
        const leaves = await Leave.find({ applicantId: req.params.applicantId }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. Approve or Reject Leave (Branch Admin Action)
router.put('/:id/status', async (req, res) => {
    try {
        const { status, adminRemarks = '', reviewedBy = 'Branch Admin' } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be either Approved or Rejected' });
        }

        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ message: 'Leave application not found' });

        leave.status = status;
        leave.adminRemarks = adminRemarks;
        leave.reviewedBy = reviewedBy;
        leave.reviewedAt = new Date();
        await leave.save();

        // If Approved for a Student, update attendance records to 'Leave' for those dates
        if (status === 'Approved' && leave.applicantType === 'Student') {
            try {
                const student = await Student.findById(leave.applicantId);
                if (student && student.batchId) {
                    const start = new Date(leave.startDate);
                    const end = new Date(leave.endDate);

                    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                        const dateStr = d.toISOString().split('T')[0];

                        // Find or prepare attendance record
                        let attDoc = await Attendance.findOne({ batchId: student.batchId, date: dateStr });
                        if (attDoc) {
                            const recIndex = attDoc.records.findIndex(r => r.studentId.toString() === student._id.toString());
                            if (recIndex >= 0) {
                                attDoc.records[recIndex].status = 'Leave';
                                attDoc.records[recIndex].remarks = `Approved Leave: ${leave.leaveType}`;
                            } else {
                                attDoc.records.push({
                                    studentId: student._id,
                                    status: 'Leave',
                                    remarks: `Approved Leave: ${leave.leaveType}`
                                });
                            }

                            // Recalculate
                            let p = 0, a = 0, l = 0, lv = 0;
                            attDoc.records.forEach(r => {
                                if (r.status === 'Present') p++;
                                else if (r.status === 'Absent') a++;
                                else if (r.status === 'Late') l++;
                                else if (r.status === 'Leave') lv++;
                            });
                            attDoc.presentCount = p;
                            attDoc.absentCount = a;
                            attDoc.lateCount = l;
                            attDoc.leaveCount = lv;
                            await attDoc.save();
                        }
                    }
                }
            } catch (attErr) {
                console.error('Attendance auto-sync error on leave approval:', attErr.message);
            }
        }

        // Send Email/SMS Notification to Applicant
        let applicantUser = null;
        if (leave.applicantType === 'Student') {
            applicantUser = await Student.findById(leave.applicantId);
        } else {
            applicantUser = await Staff.findById(leave.applicantId);
        }
        await sendLeaveStatusNotification({ leave, studentOrStaff: applicantUser });

        res.json({
            message: `Leave application marked as ${status}`,
            leave
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Student = require('../models/Students');
const Attendance = require('../models/Attendance');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const { authenticateAdmin } = require('../middleware/auth');

// 1. Daily Attendance Register (for print & CSV)
router.get('/daily-register', authenticateAdmin, async (req, res) => {
    try {
        const { date = new Date().toISOString().split('T')[0], batchId } = req.query;
        const query = { instituteId: req.instituteId, date };
        if (batchId && batchId !== 'ALL' && batchId !== '') query.batchId = batchId;

        const attendanceDocs = await Attendance.find(query)
            .populate('batchId', 'batchName batchCode timing roomNo')
            .populate('courseId', 'courseName courseCode')
            .lean();

        // Populate student info for all records
        const detailedDocs = await Promise.all(attendanceDocs.map(async (doc) => {
            const recordsWithStudents = await Promise.all((doc.records || []).map(async (rec) => {
                const student = await Student.findOne({ _id: rec.studentId, instituteId: req.instituteId })
                    .select('grno rollno fname lname mobileNo rfid')
                    .lean();
                return {
                    ...rec,
                    student
                };
            }));

            return {
                ...doc,
                records: recordsWithStudents
            };
        }));

        // Flatten records into clean table rows for Reports UI and CSV export
        const flattenedRows = [];
        detailedDocs.forEach(doc => {
            const courseName = doc.courseId?.courseName || 'N/A';
            const batchName = doc.batchId?.batchName || 'N/A';
            const timing = doc.batchId?.timing || 'N/A';

            (doc.records || []).forEach(rec => {
                const student = rec.student || {};
                flattenedRows.push({
                    studentId: student._id || rec.studentId,
                    rollno: student.rollno || 'N/A',
                    grno: student.grno || 'N/A',
                    name: student.fname ? `${student.fname} ${student.lname || ''}`.trim() : 'Unknown',
                    course: courseName,
                    batch: batchName,
                    timing: timing,
                    status: rec.status || 'Absent',
                    inTime: rec.inTime || 'N/A',
                    mobileNo: student.mobileNo || 'N/A'
                });
            });
        });

        res.json({
            date,
            totalBatchesMarked: detailedDocs.length,
            data: flattenedRows,
            records: flattenedRows,
            detailedDocs
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. Low Attendance / Defaulters Report (< 75% or custom threshold)
router.get('/defaulters', authenticateAdmin, async (req, res) => {
    try {
        const threshold = Number(req.query.threshold) || 75;
        const { batchId, courseId } = req.query;

        const studentQuery = { instituteId: req.instituteId, status: 'Active' };
        if (batchId && batchId !== 'ALL' && batchId !== '') studentQuery.batchId = batchId;
        if (courseId && courseId !== 'ALL' && courseId !== '') studentQuery.courseId = courseId;

        const students = await Student.find(studentQuery)
            .populate('courseId', 'courseName courseCode')
            .populate('batchId', 'batchName timing')
            .lean();

        // Calculate attendance % for each student
        const defaulters = [];

        for (const student of students) {
            const attendanceDocs = await Attendance.find({ instituteId: req.instituteId, 'records.studentId': student._id });
            const totalSessions = attendanceDocs.length;

            if (totalSessions > 0) {
                let presentCount = 0;
                let absentCount = 0;
                let lateCount = 0;

                attendanceDocs.forEach(doc => {
                    const rec = (doc.records || []).find(r => r.studentId && r.studentId.toString() === student._id.toString());
                    if (rec) {
                        if (rec.status === 'Present') presentCount++;
                        else if (rec.status === 'Absent') absentCount++;
                        else if (rec.status === 'Late') lateCount++;
                    }
                });

                const percentage = Math.round(((presentCount + lateCount) / totalSessions) * 100);

                if (percentage < threshold) {
                    const cName = student.courseId ? student.courseId.courseName : 'N/A';
                    const bName = student.batchId ? student.batchId.batchName : 'N/A';
                    defaulters.push({
                        studentId: student._id,
                        grno: student.grno || 'N/A',
                        rollno: student.rollno || 'N/A',
                        name: `${student.fname || ''} ${student.lname || ''}`.trim(),
                        mobileNo: student.mobileNo || 'N/A',
                        fatherMobileNo: student.fatherMobileNo || 'N/A',
                        course: cName,
                        courseName: cName,
                        batch: bName,
                        batchName: bName,
                        totalSessions,
                        presentDays: presentCount,
                        presentCount,
                        absentCount,
                        lateCount,
                        percentage
                    });
                }
            }
        }

        res.json({
            success: true,
            threshold,
            totalDefaulters: defaulters.length,
            defaulters: defaulters.sort((a, b) => a.percentage - b.percentage),
            data: defaulters
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. Student Enrollment & Fee Directory Report
router.get('/student-directory', authenticateAdmin, async (req, res) => {
    try {
        const { courseId, batchId, status } = req.query;
        const query = { instituteId: req.instituteId };
        if (courseId && courseId !== 'ALL' && courseId !== '') query.courseId = courseId;
        if (batchId && batchId !== 'ALL' && batchId !== '') query.batchId = batchId;
        if (status && status !== 'ALL' && status !== '') query.status = status;

        const students = await Student.find(query)
            .populate('courseId', 'courseName courseCode totalFees')
            .populate('batchId', 'batchName batchCode timing')
            .sort({ rollno: 1, fname: 1 })
            .lean();

        const formatted = students.map(s => {
            const exp = Number(s.totalFees) || (s.courseId?.totalFees ? Number(s.courseId.totalFees) : 0);
            const paid = Number(s.paidFees) || 0;
            const bal = (s.balanceFees !== undefined && s.balanceFees !== null) ? Number(s.balanceFees) : Math.max(0, exp - paid);

            return {
                studentId: s._id,
                grno: s.grno || 'N/A',
                rollno: s.rollno || 'N/A',
                name: `${s.fname || ''} ${s.lname || ''}`.trim(),
                course: s.courseId ? s.courseId.courseName : 'N/A',
                batch: s.batchId ? s.batchId.batchName : 'N/A',
                totalFees: exp,
                paidFees: paid,
                balanceFees: bal,
                mobileNo: s.mobileNo || 'N/A',
                rfid: s.rfid || 'N/A',
                status: s.status || 'Active'
            };
        });

        res.json({
            count: formatted.length,
            students: formatted,
            data: formatted
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. Financial & Fee Collection Summary (Support both /financial-summary and /fees-summary)
router.get(['/financial-summary', '/fees-summary'], authenticateAdmin, async (req, res) => {
    try {
        const students = await Student.find({ instituteId: req.instituteId }).populate('courseId', 'courseName totalFees').lean();

        let totalExpected = 0;
        let totalCollected = 0;
        let totalBalance = 0;
        const courseMap = {};

        students.forEach(s => {
            const courseName = s.courseId ? s.courseId.courseName : 'Unassigned';
            const expected = Number(s.totalFees) || (s.courseId?.totalFees ? Number(s.courseId.totalFees) : 0);
            const paid = Number(s.paidFees) || 0;
            const balance = (s.balanceFees !== undefined && s.balanceFees !== null) ? Number(s.balanceFees) : Math.max(0, expected - paid);

            totalExpected += expected;
            totalCollected += paid;
            totalBalance += balance;

            if (!courseMap[courseName]) {
                courseMap[courseName] = { courseName, studentCount: 0, expected: 0, collected: 0, balance: 0 };
            }
            courseMap[courseName].studentCount++;
            courseMap[courseName].expected += expected;
            courseMap[courseName].collected += paid;
            courseMap[courseName].balance += balance;
        });

        const summary = {
            totalExpected,
            totalCollected,
            totalBalance,
            courseBreakdown: Object.values(courseMap)
        };

        res.json({
            ...summary,
            data: summary
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

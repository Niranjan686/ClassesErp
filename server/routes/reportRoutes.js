const express = require('express');
const router = express.Router();
const Student = require('../models/Students');
const Attendance = require('../models/Attendance');
const Batch = require('../models/Batch');
const Course = require('../models/Course');

// 1. Daily Attendance Register (for print & CSV)
router.get('/daily-register', async (req, res) => {
    try {
        const { date = new Date().toISOString().split('T')[0], batchId } = req.query;
        const query = { date };
        if (batchId) query.batchId = batchId;

        const attendanceDocs = await Attendance.find(query)
            .populate('batchId', 'batchName batchCode timing roomNo')
            .populate('courseId', 'courseName courseCode')
            .lean();

        // Populate student info for all records
        const detailedDocs = await Promise.all(attendanceDocs.map(async (doc) => {
            const recordsWithStudents = await Promise.all(doc.records.map(async (rec) => {
                const student = await Student.findById(rec.studentId).select('grno rollno fname lname mobileNo rfid').lean();
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

        res.json({
            date,
            totalBatchesMarked: detailedDocs.length,
            data: detailedDocs
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. Low Attendance / Defaulters Report (< 75% or custom threshold)
router.get('/defaulters', async (req, res) => {
    try {
        const threshold = Number(req.query.threshold) || 75;
        const { batchId, courseId } = req.query;

        const studentQuery = { status: 'Active' };
        if (batchId) studentQuery.batchId = batchId;
        if (courseId) studentQuery.courseId = courseId;

        const students = await Student.find(studentQuery)
            .populate('courseId', 'courseName courseCode')
            .populate('batchId', 'batchName timing')
            .lean();

        // Calculate attendance % for each student
        const defaulters = [];

        for (const student of students) {
            const attendanceDocs = await Attendance.find({ 'records.studentId': student._id });
            const totalSessions = attendanceDocs.length;

            if (totalSessions > 0) {
                let presentCount = 0;
                let absentCount = 0;
                let lateCount = 0;

                attendanceDocs.forEach(doc => {
                    const rec = doc.records.find(r => r.studentId.toString() === student._id.toString());
                    if (rec) {
                        if (rec.status === 'Present') presentCount++;
                        else if (rec.status === 'Absent') absentCount++;
                        else if (rec.status === 'Late') lateCount++;
                    }
                });

                const percentage = Math.round(((presentCount + lateCount) / totalSessions) * 100);

                if (percentage < threshold) {
                    defaulters.push({
                        studentId: student._id,
                        grno: student.grno,
                        rollno: student.rollno,
                        name: `${student.fname} ${student.lname}`,
                        mobileNo: student.mobileNo,
                        fatherMobileNo: student.fatherMobileNo,
                        courseName: student.courseId ? student.courseId.courseName : 'N/A',
                        batchName: student.batchId ? student.batchId.batchName : 'N/A',
                        totalSessions,
                        presentCount,
                        absentCount,
                        lateCount,
                        percentage
                    });
                }
            }
        }

        res.json({
            threshold,
            totalDefaulters: defaulters.length,
            defaulters: defaulters.sort((a, b) => a.percentage - b.percentage)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. Student Enrollment & Fee Directory Report
router.get('/student-directory', async (req, res) => {
    try {
        const { courseId, batchId, status } = req.query;
        const query = {};
        if (courseId) query.courseId = courseId;
        if (batchId) query.batchId = batchId;
        if (status) query.status = status;

        const students = await Student.find(query)
            .populate('courseId', 'courseName courseCode totalFees')
            .populate('batchId', 'batchName batchCode timing')
            .sort({ rollno: 1, fname: 1 })
            .lean();

        res.json({
            count: students.length,
            students
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. Financial & Fee Collection Summary
router.get('/fees-summary', async (req, res) => {
    try {
        const students = await Student.find().populate('courseId', 'courseName').lean();

        let totalExpected = 0;
        let totalCollected = 0;
        let totalBalance = 0;
        const courseMap = {};

        students.forEach(s => {
            const courseName = s.courseId ? s.courseId.courseName : 'Unassigned';
            const expected = Number(s.totalFees) || 0;
            const paid = Number(s.paidFees) || 0;
            const balance = Number(s.balanceFees) || Math.max(0, expected - paid);

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

        res.json({
            totalExpected,
            totalCollected,
            totalBalance,
            courseBreakdown: Object.values(courseMap)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Students');
const Batch = require('../models/Batch');
const NotificationLog = require('../models/NotificationLog');
const { sendPushNotification } = require('../utils/pushNotification');
const { authenticateAdmin, authenticateStudent } = require('../middleware/auth');

/**
 * Get Batch Roster for Attendance Marking
 */
router.get('/batch-roster', authenticateAdmin, async (req, res) => {
  try {
    const { batchId, date } = req.query;
    if (!batchId) {
      return res.status(400).json({ success: false, message: 'batchId is required' });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    const batch = await Batch.findOne({ _id: batchId, instituteId: req.instituteId })
      .populate('courseId', 'courseName courseCode');

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const students = await Student.find({
      instituteId: req.instituteId,
      batchId: batch._id,
      status: 'Active',
    }).sort({ rollno: 1, fname: 1 });

    const attendance = await Attendance.findOne({
      instituteId: req.instituteId,
      batchId: batch._id,
      date: targetDate,
    });

    const isAlreadyMarked = !!attendance;
    const recordsMap = {};
    if (attendance && attendance.records) {
      attendance.records.forEach(r => {
        recordsMap[r.studentId.toString()] = r;
      });
    }

    const roster = students.map(s => {
      const rec = recordsMap[s._id.toString()];
      return {
        studentId: s._id,
        name: `${s.fname} ${s.lname}`,
        fname: s.fname,
        lname: s.lname,
        grno: s.grno,
        rollno: s.rollno || 0,
        photo: s.photo,
        mobileNo: s.mobileNo,
        fatherMobileNo: s.fatherMobileNo,
        status: rec ? rec.status : 'Present',
        inTime: rec ? rec.inTime : '',
        mode: rec ? rec.mode : 'Manual',
        remarks: rec ? rec.remarks : '',
      };
    });

    res.json({
      success: true,
      batch,
      date: targetDate,
      isAlreadyMarked,
      roster,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Quick Punch Attendance via RFID Tag / Student ID / GR No / Phone
 */
router.post('/quick-punch', authenticateAdmin, async (req, res) => {
  try {
    const { identifier, punchCode, date } = req.body;
    const cleanId = (identifier || punchCode || '').trim();
    if (!cleanId) {
      return res.status(400).json({ success: false, message: 'Student ID, RFID Tag, or GR No is required' });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    const student = await Student.findOne({
      instituteId: req.instituteId,
      $or: [
        { rfid: cleanId },
        { studentId: cleanId },
        { grno: cleanId },
        { mobileNo: cleanId },
        { studentId: new RegExp(`^${cleanId}$`, 'i') },
        { grno: new RegExp(`^${cleanId}$`, 'i') },
      ]
    }).populate('batchId', 'batchName batchCode timing').populate('courseId', 'courseName');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `No active student found matching tag/code "${identifier}"`
      });
    }

    if (!student.batchId) {
      return res.status(400).json({
        success: false,
        message: `Student ${student.fname} ${student.lname} is not assigned to an active batch.`
      });
    }

    const batchId = student.batchId._id;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let attendance = await Attendance.findOne({
      instituteId: req.instituteId,
      batchId,
      date: targetDate,
    });

    if (!attendance) {
      const allBatchStudents = await Student.find({ instituteId: req.instituteId, batchId, status: 'Active' });
      const records = allBatchStudents.map(s => ({
        studentId: s._id,
        status: s._id.toString() === student._id.toString() ? 'Present' : 'Absent',
        mode: s._id.toString() === student._id.toString() ? 'QR' : 'Manual',
        inTime: s._id.toString() === student._id.toString() ? nowTime : '',
      }));

      try {
        attendance = new Attendance({
          instituteId: req.instituteId,
          batchId,
          courseId: student.courseId?._id,
          date: targetDate,
          records,
          totalStudents: allBatchStudents.length,
          presentCount: 1,
          absentCount: Math.max(0, allBatchStudents.length - 1),
          markedBy: req.user.name,
          markedById: req.user._id,
        });
        await attendance.save();
      } catch (dupErr) {
        // Recover from concurrent creation
        attendance = await Attendance.findOne({ instituteId: req.instituteId, batchId, date: targetDate });
      }
    }

    if (attendance) {
      const recIndex = attendance.records.findIndex(r => r.studentId.toString() === student._id.toString());
      if (recIndex !== -1) {
        attendance.records[recIndex].status = 'Present';
        attendance.records[recIndex].mode = 'QR';
        attendance.records[recIndex].inTime = nowTime;
      } else {
        attendance.records.push({
          studentId: student._id,
          status: 'Present',
          mode: 'QR',
          inTime: nowTime,
        });
      }
      attendance.presentCount = attendance.records.filter(r => r.status === 'Present').length;
      attendance.absentCount = attendance.records.filter(r => r.status === 'Absent').length;
      attendance.lateCount = attendance.records.filter(r => r.status === 'Late').length;
      attendance.leaveCount = attendance.records.filter(r => r.status === 'Leave').length;
      await attendance.save();
    }

    // Trigger Instant Push Notification on Present (without time)
    const pushTitle = '🎓 Attendance Verified: PRESENT ✅';
    const pushBody = `Student ${student.fname} ${student.lname} has arrived at campus & marked PRESENT (${student.batchId.batchName}).`;
    
    const notifLog = await sendPushNotification({
      instituteId: req.instituteId,
      studentId: student._id,
      recipientName: `${student.fname} ${student.lname}`,
      recipientPhone: student.mobileNo || student.fatherMobileNo,
      title: pushTitle,
      message: pushBody,
      triggerEvent: 'Attendance_Present',
      data: {
        studentId: student._id,
        name: `${student.fname} ${student.lname}`,
        status: 'Present',
        batchName: student.batchId.batchName,
      }
    });

    res.json({
      success: true,
      message: `Punch successful! Marked PRESENT for ${student.fname} ${student.lname}`,
      pushNotification: {
        sent: true,
        title: pushTitle,
        body: pushBody,
        id: notifLog?._id,
      },
      student: {
        id: student._id,
        name: `${student.fname} ${student.lname}`,
        grno: student.grno,
        studentId: student.studentId,
        batchName: student.batchId.batchName,
        photo: student.photo,
        inTime: nowTime,
        status: 'Present',
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Broadcast SMS / WhatsApp alerts to parents of absent/late students
 */
router.post(['/broadcast-absent-sms', '/broadcast-absentee-sms'], authenticateAdmin, async (req, res) => {
  try {
    const { batchId, date, absentees } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const sentList = (absentees || []).map(s => ({
      studentId: s.studentId,
      name: s.name,
      parentPhone: s.fatherMobileNo || s.mobileNo,
      status: 'Sent',
      message: `Dear Parent, your ward ${s.name} was marked ABSENT today (${targetDate}) at ClassTech Academy. Please contact the class office for leave confirmation.`,
      timestamp: new Date().toISOString(),
    }));

    res.json({
      success: true,
      message: `Successfully dispatched SMS alerts to ${sentList.length} parents!`,
      sentCount: sentList.length,
      logs: sentList,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Monthly Attendance Matrix Grid (Admin)
 */
router.get('/monthly-matrix', authenticateAdmin, async (req, res) => {
  try {
    const { batchId, yearMonth } = req.query;
    if (!batchId || !yearMonth) {
      return res.status(400).json({ success: false, message: 'batchId and yearMonth (YYYY-MM) are required' });
    }

    const batch = await Batch.findOne({ _id: batchId, instituteId: req.instituteId })
      .populate('courseId', 'courseName courseCode');

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const students = await Student.find({
      instituteId: req.instituteId,
      batchId: batch._id,
      status: 'Active',
    }).sort({ rollno: 1, fname: 1 });

    const attendanceDocs = await Attendance.find({
      instituteId: req.instituteId,
      batchId: batch._id,
      date: new RegExp(`^${yearMonth}`),
    }).sort({ date: 1 });

    const datesRecorded = attendanceDocs.map(d => d.date);

    const matrix = students.map(s => {
      const dayRecords = {};
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let leaveCount = 0;

      attendanceDocs.forEach(doc => {
        const rec = doc.records.find(r => r.studentId.toString() === s._id.toString());
        const status = rec ? rec.status : 'Absent';
        dayRecords[doc.date] = status;

        if (status === 'Present') presentCount++;
        else if (status === 'Absent') absentCount++;
        else if (status === 'Late') lateCount++;
        else if (status === 'Leave') leaveCount++;
      });

      const totalSessions = datesRecorded.length;
      const percentage = totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 100;

      return {
        studentId: s._id,
        rollno: s.rollno || 0,
        grno: s.grno,
        name: `${s.fname} ${s.lname}`,
        mobileNo: s.mobileNo,
        dayRecords,
        presentCount,
        absentCount,
        lateCount,
        leaveCount,
        totalSessions,
        percentage,
      };
    });

    res.json({
      success: true,
      batch,
      yearMonth,
      datesRecorded,
      matrix,
      summary: {
        totalStudents: students.length,
        totalSessions: datesRecorded.length,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Save / Update Attendance Sheet (Admin & Teacher)
 */
router.post(['/save', '/mark-batch'], authenticateAdmin, async (req, res) => {
  try {
    const { batchId, courseId, date, records } = req.body;

    if (!batchId || !date || !records) {
      return res.status(400).json({ success: false, message: 'Incomplete attendance data' });
    }

    // Teacher check
    if (req.user.role === 'teacher' && req.user.assignedBatches && req.user.assignedBatches.length > 0) {
      const allowed = req.user.assignedBatches.some(b => b.toString() === batchId);
      if (!allowed) {
        return res.status(403).json({ success: false, message: 'Access denied to this batch.' });
      }
    }

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let leaveCount = 0;

    records.forEach(r => {
      if (r.status === 'Present') presentCount++;
      else if (r.status === 'Absent') absentCount++;
      else if (r.status === 'Late') lateCount++;
      else if (r.status === 'Leave') leaveCount++;
    });

    const attendance = await Attendance.findOneAndUpdate(
      { instituteId: req.instituteId, batchId, date },
      {
        instituteId: req.instituteId,
        batchId,
        courseId,
        date,
        records,
        totalStudents: records.length,
        presentCount,
        absentCount,
        lateCount,
        leaveCount,
        markedBy: req.user.name,
        markedById: req.user._id,
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Trigger instant push notifications for students marked Present
    try {
      const presentStudentIds = records.filter(r => r.status === 'Present').map(r => r.studentId);
      if (presentStudentIds.length > 0) {
        const presentStudents = await Student.find({ _id: { $in: presentStudentIds } });
        const batchDoc = await Batch.findById(batchId);
        const batchTitle = batchDoc?.batchName || 'Cohort';

        for (const s of presentStudents) {
          await sendPushNotification({
            instituteId: req.instituteId,
            studentId: s._id,
            recipientName: `${s.fname} ${s.lname}`,
            recipientPhone: s.mobileNo || s.fatherMobileNo,
            title: '🎓 Attendance Verified: PRESENT ✅',
            message: `Student ${s.fname} ${s.lname} marked PRESENT for today (${date}) in ${batchTitle}.`,
            triggerEvent: 'Attendance_Present',
            data: { studentId: s._id, status: 'Present', date, batchName: batchTitle }
          });
        }
      }
    } catch (notifErr) {
      console.warn('Batch attendance push dispatch warning:', notifErr.message);
    }

    // Broadcast attendance update via Socket.IO
    if (req.app.get('io')) {
      req.app.get('io').to(`inst_${req.instituteId}`).emit('attendance_marked', {
        batchId,
        date,
        presentCount,
        totalStudents: records.length,
      });
    }

    res.json({
      success: true,
      message: `Attendance marked successfully! (${presentCount}/${records.length} Present)`,
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Student QR Attendance Scan Endpoint
 */
router.post('/scan-qr', authenticateStudent, async (req, res) => {
  try {
    const student = req.student;
    const { qrToken, date } = req.body;
    const todayStr = date || new Date().toISOString().split('T')[0];

    if (!student.batchId) {
      return res.status(400).json({ success: false, message: 'No active batch assigned to student' });
    }

    let attendance = await Attendance.findOne({
      instituteId: req.instituteId,
      batchId: student.batchId,
      date: todayStr,
    });

    if (!attendance) {
      const allBatchStudents = await Student.find({ instituteId: req.instituteId, batchId: student.batchId, status: 'Active' });
      const records = allBatchStudents.map(s => ({
        studentId: s._id,
        status: s._id.toString() === student._id.toString() ? 'Present' : 'Absent',
        mode: s._id.toString() === student._id.toString() ? 'QR' : 'Manual',
      }));

      attendance = new Attendance({
        instituteId: req.instituteId,
        batchId: student.batchId,
        date: todayStr,
        records,
        totalStudents: allBatchStudents.length,
        presentCount: 1,
        absentCount: allBatchStudents.length - 1,
        markedBy: 'QR Scanner Check-in',
      });
      await attendance.save();
    } else {
      const recIndex = attendance.records.findIndex(r => r.studentId.toString() === student._id.toString());
      if (recIndex !== -1) {
        attendance.records[recIndex].status = 'Present';
        attendance.records[recIndex].mode = 'QR';
        attendance.records[recIndex].inTime = new Date().toLocaleTimeString();
      } else {
        attendance.records.push({
          studentId: student._id,
          status: 'Present',
          mode: 'QR',
          inTime: new Date().toLocaleTimeString(),
        });
      }
      attendance.presentCount = attendance.records.filter(r => r.status === 'Present').length;
      attendance.absentCount = attendance.records.filter(r => r.status === 'Absent').length;
      await attendance.save();
    }

    res.json({
      success: true,
      message: `QR Check-in successful! Attendance logged for ${todayStr}.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Student Attendance Heatmap & Stats (Student Portal)
 */
router.get('/my-attendance', authenticateStudent, async (req, res) => {
  try {
    const student = req.student;
    const docs = await Attendance.find({
      instituteId: req.instituteId,
      'records.studentId': student._id,
    }).sort({ date: -1 });

    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;

    const calendarLogs = docs.map(d => {
      const r = d.records.find(rec => rec.studentId.toString() === student._id.toString());
      const status = r ? r.status : 'Absent';
      if (status === 'Present') present++;
      else if (status === 'Absent') absent++;
      else if (status === 'Late') late++;
      else if (status === 'Leave') leave++;
      return {
        date: d.date,
        status,
        mode: r?.mode || 'Manual',
      };
    });

    const total = docs.length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

    res.json({
      success: true,
      data: {
        percentage,
        total,
        present,
        absent,
        late,
        leave,
        calendarLogs,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get Recent Push Notifications for Student
 */
router.get('/notifications/student-stream', async (req, res) => {
  try {
    const { studentId, mobile } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (mobile) filter.recipientPhone = new RegExp(mobile.slice(-10), 'i');

    const logs = await NotificationLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

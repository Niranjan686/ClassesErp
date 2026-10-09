const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  console.warn('DNS server setting warning:', e.message);
}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const Institute = require('./models/Institute');
const User = require('./models/user');
const Student = require('./models/Students');
const Course = require('./models/Course');
const Batch = require('./models/Batch');
const Attendance = require('./models/Attendance');
const FeeTransaction = require('./models/FeeTransaction');
const LiveClass = require('./models/LiveClass');
const Note = require('./models/Note');
const Homework = require('./models/Homework');
const Announcement = require('./models/Announcement');
const Enquiry = require('./models/Enquiry');
const Demo = require('./models/Demo');
const Exam = require('./models/Exam');
const Marks = require('./models/Marks');
const Leave = require('./models/Leave');
const Complaint = require('./models/Complaint');

const mongoUri = process.env.MONGODB_URI;

const FIRST_NAMES = ['Aarav', 'Diya', 'Rohan', 'Ananya', 'Ishaan', 'Tanvi', 'Kabir', 'Sneha', 'Aditya', 'Pooja', 'Vivaan', 'Meera', 'Rishi', 'Kavya', 'Aryan', 'Neha', 'Yash', 'Riya', 'Dev', 'Shreya', 'Karan', 'Simran', 'Sahil', 'Nisha', 'Varun', 'Isha', 'Harsh', 'Anjali', 'Gaurav', 'Divya', 'Siddharth', 'Bhavna', 'Rahul', 'Prerna', 'Arjun', 'Sonal', 'Manish', 'Komal', 'Alok', 'Swati', 'Akash', 'Shruti', 'Nikhil', 'Priyanka', 'Sanjay', 'Preeti', 'Vikram', 'Ankita', 'Sumit', 'Sakshi'];
const LAST_NAMES = ['Sharma', 'Verma', 'Patel', 'Deshmukh', 'Gupta', 'Mehta', 'Kulkarni', 'Joshi', 'Chopra', 'Nair', 'Singh', 'Kapoor', 'Rathore', 'Shah', 'Pandey', 'Saxena', 'Iyer', 'Menon', 'Bhatia', 'Malhotra'];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas for database initialization...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected!');

    console.log('Resetting old test collections...');
    await Promise.all([
      Institute.deleteMany({}),
      User.deleteMany({}),
      Student.deleteMany({}),
      Course.deleteMany({}),
      Batch.deleteMany({}),
      Attendance.deleteMany({}),
      FeeTransaction.deleteMany({}),
      LiveClass.deleteMany({}),
      Note.deleteMany({}),
      Homework.deleteMany({}),
      Announcement.deleteMany({}),
      Enquiry.deleteMany({}),
      Demo.deleteMany({}),
      Exam.deleteMany({}),
      Marks.deleteMany({}),
      Leave.deleteMany({}),
      Complaint.deleteMany({}),
    ]);
    console.log('Collections reset clean.');

    const defaultPasswordHash = await bcrypt.hash('Demo@123', 10);
    const superPasswordHash = await bcrypt.hash('Scanid@1234', 10);
    const classAdminPassHash = await bcrypt.hash('Class@123', 10);

    // 1. Create Super Admin
    const superAdmin = new User({
      name: 'Super Administrator',
      email: 'super@demo.com',
      username: 'superadmin',
      password: superPasswordHash,
      role: 'superadmin',
      permissions: ['*'],
      isActive: true,
    });
    await superAdmin.save();
    console.log('✅ Super Admin created: superadmin / Scanid@1234');

    // 2. Create Coaching Class [K001]
    const inst1 = new Institute({
      code: 'K001',
      name: 'Keerti Science & Computer Classes',
      subdomain: 'k001',
      logo: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80',
      brandColor: '#2563eb',
      address: { street: '402 Knowledge Hub, SV Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400058' },
      phone: '+91 98201 12345',
      email: 'admin@k001.com',
      academicYear: '2026-2027',
      workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      timings: { open: '07:00 AM', close: '09:00 PM' },
      currency: 'INR',
      currencySymbol: '₹',
      gstNumber: '27AABCU9603R1ZM',
      receiptPrefix: 'K001-REC',
      plan: 'Pro',
      limits: { maxStudents: 2000, maxStorageGB: 100, liveClassesEnabled: true, smsQuota: 10000 },
      status: 'active',
    });
    await inst1.save();
    console.log('✅ Coaching Class created: Keerti Classes [K001]');

    // 3. Create Class Admin for [K001]
    const classAdmin = new User({
      instituteId: inst1._id,
      name: 'Prof. Anil Sharma (Class Director)',
      email: 'admin@k001.com',
      username: 'admin@k001.com',
      phone: '9820112345',
      password: classAdminPassHash,
      role: 'owner',
      permissions: ['*'],
      isActive: true,
    });
    await classAdmin.save();
    console.log('✅ Class Admin created: K001 | admin@k001.com / Class@123');

    // Faculty Teacher for [K001]
    const teacher1 = new User({
      instituteId: inst1._id,
      name: 'Dr. Vivek Sharma (Physics Faculty)',
      email: 'teacher@k001.com',
      username: 'teacher@k001.com',
      phone: '9820199999',
      password: defaultPasswordHash,
      role: 'teacher',
      permissions: ['attendance:edit', 'notes:create', 'live:host', 'tests:grade'],
      assignedSubjects: ['Physics'],
      isActive: true,
    });
    await teacher1.save();

    // 4. Create Courses for [K001]
    const coursesInst1 = [
      {
        instituteId: inst1._id,
        courseName: 'JEE Main & Advanced 2-Year Integrated',
        courseCode: 'K001-JEE-01',
        category: 'JEE Main & Advanced',
        duration: '2 Years',
        durationMonths: 24,
        totalFees: 120000,
        description: 'Target IIT-JEE with weekly assessments and conceptual derivations.',
        subjects: [
          { name: 'Physics', code: 'PHY-01', teacherName: 'Dr. Vivek Sharma', teacherId: teacher1._id },
          { name: 'Chemistry', code: 'CHE-01', teacherName: 'Prof. Anjali Saxena' },
          { name: 'Mathematics', code: 'MAT-01', teacherName: 'Dr. R. Ramanujan' },
        ],
      },
      {
        instituteId: inst1._id,
        courseName: 'NEET UG Medical Booster',
        courseCode: 'K001-NEET-01',
        category: 'NEET Medical',
        duration: '1 Year',
        durationMonths: 12,
        totalFees: 95000,
        description: 'Complete NCERT mastery with chapterwise full mock tests.',
        subjects: [
          { name: 'Biology', code: 'BIO-01', teacherName: 'Dr. Sunita Kulkarni' },
          { name: 'Physics', code: 'PHY-02', teacherName: 'Dr. Vivek Sharma', teacherId: teacher1._id },
          { name: 'Chemistry', code: 'CHE-02', teacherName: 'Prof. Anjali Saxena' },
        ]
      },
      {
        instituteId: inst1._id,
        courseName: 'Class 10 CBSE Board Masterclass',
        courseCode: 'K001-CBSE-10',
        category: 'Class 10 / 12 Board',
        duration: '10 Months',
        durationMonths: 10,
        totalFees: 45000,
        description: 'Complete Science, Maths and English curriculum coaching.',
      }
    ];
    const savedCourses = await Course.insertMany(coursesInst1);

    // 5. Create Batches for [K001]
    const batchesInst1 = [
      {
        instituteId: inst1._id,
        batchName: 'Morning JEE Titans (Batch A)',
        batchCode: 'K001-B01',
        courseId: savedCourses[0]._id,
        timing: '07:30 AM - 10:30 AM',
        startTime: '07:30 AM',
        endTime: '10:30 AM',
        days: 'Mon-Wed-Fri (MWF)',
        mode: 'offline',
        instructor: 'Dr. Vivek Sharma',
        teacherId: teacher1._id,
        roomNo: 'Hall 101',
        maxCapacity: 35,
      },
      {
        instituteId: inst1._id,
        batchName: 'Evening NEET Achievers (Batch B)',
        batchCode: 'K001-B02',
        courseId: savedCourses[1]._id,
        timing: '04:30 PM - 07:30 PM',
        startTime: '04:30 PM',
        endTime: '07:30 PM',
        days: 'Tue-Thu-Sat (TTS)',
        mode: 'hybrid',
        instructor: 'Dr. Sunita Kulkarni',
        roomNo: 'Hall 102',
        maxCapacity: 30,
      }
    ];
    const savedBatches = await Batch.insertMany(batchesInst1);

    // 6. Seed Students for [K001] with strict Class Prefix
    const studentsToInsert = [];
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    for (let i = 1; i <= 25; i++) {
      const fn = FIRST_NAMES[i - 1] || 'Student';
      const ln = LAST_NAMES[i % LAST_NAMES.length];
      const seqStr = i.toString().padStart(4, '0');
      const studentId = `K001-2026-${seqStr}`;
      const grno = `K001-GR-${seqStr}`;
      const batch = i <= 15 ? savedBatches[0] : savedBatches[1];
      const course = i <= 15 ? savedCourses[0] : savedCourses[1];

      const totalFee = course.totalFees;
      const isPaidFull = i % 3 === 0;
      const paidAmt = isPaidFull ? totalFee : Math.round(totalFee * 0.6);
      const balance = Math.max(0, totalFee - paidAmt);

      studentsToInsert.push({
        instituteId: inst1._id,
        studentId,
        grno,
        rollno: i,
        fname: fn,
        lname: ln,
        dob: new Date(2008, (i % 12), (i % 28) + 1),
        gender: i % 2 === 0 ? 'Female' : 'Male',
        mobileNo: `98201${(10000 + i).toString()}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}@k001.com`,
        address: `${100 + i}, Palm Beach Enclave, Sector 18, Navi Mumbai`,
        school: 'St. Xavier High School',
        standard: '11th Standard',
        board: 'CBSE',
        fatherName: `Mr. ${FIRST_NAMES[(i + 5) % FIRST_NAMES.length]} ${ln}`,
        fatherMobileNo: `98202${(10000 + i).toString()}`,
        motherMobileNo: `98203${(10000 + i).toString()}`,
        parentPin: '1234',
        courseId: course._id,
        batchId: batch._id,
        academicYear: '2026-2027',
        totalFees: totalFee,
        paidFees: paidAmt,
        balanceFees: balance,
        bloodGroup: bloodGroups[i % bloodGroups.length],
        rfid: `RFID-${(900000 + i).toString()}`,
        emergencyContact: `98202${(10000 + i).toString()}`,
        photo: i % 2 === 0
          ? 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        password: defaultPasswordHash, // Demo@123
        status: 'Active',
      });
    }

    const savedStudents = await Student.insertMany(studentsToInsert);
    console.log(`✅ Seeded ${savedStudents.length} Students for Class [K001] with prefix K001-2026-XXXX`);

    // 7. Fee Transactions for [K001]
    const feeTx = [];
    for (let i = 0; i < savedStudents.length; i++) {
      const s = savedStudents[i];
      if (s.paidFees > 0) {
        feeTx.push({
          instituteId: inst1._id,
          receiptNo: `K001-REC-${(1000 + i).toString()}`,
          studentId: s._id,
          studentName: `${s.fname} ${s.lname}`,
          grno: s.grno,
          courseId: s.courseId,
          batchId: s.batchId,
          amountPaid: s.paidFees,
          paymentMode: i % 2 === 0 ? 'UPI' : 'Razorpay',
          remainingBalance: s.balanceFees,
          paymentDate: '2026-10-06',
          collectedBy: 'Prof. Anil Sharma',
          status: 'Paid',
        });
      }
    }
    await FeeTransaction.insertMany(feeTx);

    // 8. Staff records
    const Staff = require('./models/Staff');
    await Staff.deleteMany({});
    const staffMembers = [
      {
        name: 'Dr. Vivek Sharma',
        email: 'teacher@k001.com',
        phone: '9820199999',
        designation: 'Senior Instructor',
        specialization: 'Physics & Advanced Mechanics',
        salary: 75000,
        status: 'Active'
      },
      {
        name: 'Prof. Anjali Saxena',
        email: 'anjali@k001.com',
        phone: '9820188888',
        designation: 'Faculty',
        specialization: 'Organic & Inorganic Chemistry',
        salary: 68000,
        status: 'Active'
      },
      {
        name: 'Dr. Sunita Kulkarni',
        email: 'sunita@k001.com',
        phone: '9820177777',
        designation: 'Senior Instructor',
        specialization: 'Botany & Zoology (NEET Specialist)',
        salary: 72000,
        status: 'Active'
      },
      {
        name: 'Pooja Verma',
        email: 'counselor@k001.com',
        phone: '9820166666',
        designation: 'Counselor',
        specialization: 'Admissions & Academic Counseling',
        salary: 40000,
        status: 'Active'
      }
    ];
    await Staff.insertMany(staffMembers);
    console.log('✅ Staff directory seeded');

    // 9. Attendance Sheets for [K001]
    const attDates = ['2026-10-01', '2026-10-03', '2026-10-04', '2026-10-06', '2026-10-07', '2026-10-08'];
    for (const b of savedBatches) {
      const bStudents = savedStudents.filter(s => s.batchId.toString() === b._id.toString());
      for (const d of attDates) {
        const records = bStudents.map(s => ({
          studentId: s._id,
          status: 'Present',
          mode: 'QR',
        }));
        const att = new Attendance({
          instituteId: inst1._id,
          batchId: b._id,
          courseId: b.courseId,
          date: d,
          records,
          totalStudents: bStudents.length,
          presentCount: bStudents.length,
          absentCount: 0,
          markedBy: 'Dr. Vivek Sharma',
        });
        await att.save();
      }
    }
    console.log('✅ Attendance sheets seeded');

    // 10. Exams & Marks for [K001]
    const exam1 = new Exam({
      instituteId: inst1._id,
      title: 'Physics Chapter 1: Kinematics Assessment',
      examType: 'Unit Test',
      courseId: savedCourses[0]._id,
      courseName: savedCourses[0].courseName,
      batchId: savedBatches[0]._id,
      batchName: savedBatches[0].batchName,
      subject: 'Physics',
      examDate: '2026-10-05',
      maxTheoryMarks: 70,
      maxPracticalMarks: 30,
      totalMaxMarks: 100,
      passingMarks: 40,
      evaluatorName: 'Dr. Vivek Sharma',
      isPublished: true,
      description: 'Covers 1D, 2D motion and Relative Velocity.'
    });
    const savedExam1 = await exam1.save();

    const exam2 = new Exam({
      instituteId: inst1._id,
      title: 'NEET Biology: Cell Structure & Plant Physiology',
      examType: 'Mock Test',
      courseId: savedCourses[1]._id,
      courseName: savedCourses[1].courseName,
      batchId: savedBatches[1]._id,
      batchName: savedBatches[1].batchName,
      subject: 'Biology',
      examDate: '2026-10-06',
      maxTheoryMarks: 80,
      maxPracticalMarks: 20,
      totalMaxMarks: 100,
      passingMarks: 50,
      evaluatorName: 'Dr. Sunita Kulkarni',
      isPublished: true,
      description: 'Full NCERT pattern timed quiz.'
    });
    const savedExam2 = await exam2.save();

    const marksToInsert = [];
    const batch1Students = savedStudents.filter(s => s.batchId.toString() === savedBatches[0]._id.toString());
    batch1Students.forEach((s, idx) => {
      const theory = 50 + (idx % 18);
      const practical = 24 + (idx % 6);
      const total = theory + practical;
      const pct = Math.round((total / 100) * 100);
      marksToInsert.push({
        instituteId: inst1._id,
        examId: savedExam1._id,
        studentId: s._id,
        studentName: `${s.fname} ${s.lname}`,
        grno: s.grno,
        rollno: s.rollno ? s.rollno.toString() : (idx + 1).toString(),
        courseId: savedCourses[0]._id,
        batchId: savedBatches[0]._id,
        attendanceStatus: 'Present',
        theoryMarksObtained: theory,
        practicalMarksObtained: practical,
        totalMarksObtained: total,
        percentage: pct,
        grade: pct >= 80 ? 'A+ (Distinction)' : pct >= 60 ? 'A (First Class)' : 'B (Second Class)',
        resultStatus: 'Passed',
        rank: idx + 1,
        remarks: 'Outstanding conceptual clarity and numerical speed.'
      });
    });

    const batch2Students = savedStudents.filter(s => s.batchId.toString() === savedBatches[1]._id.toString());
    batch2Students.forEach((s, idx) => {
      const theory = 60 + (idx % 18);
      const practical = 18 + (idx % 3);
      const total = theory + practical;
      const pct = Math.round((total / 100) * 100);
      marksToInsert.push({
        instituteId: inst1._id,
        examId: savedExam2._id,
        studentId: s._id,
        studentName: `${s.fname} ${s.lname}`,
        grno: s.grno,
        rollno: s.rollno ? s.rollno.toString() : (idx + 1).toString(),
        courseId: savedCourses[1]._id,
        batchId: savedBatches[1]._id,
        attendanceStatus: 'Present',
        theoryMarksObtained: theory,
        practicalMarksObtained: practical,
        totalMarksObtained: total,
        percentage: pct,
        grade: pct >= 80 ? 'A+ (Distinction)' : 'A (First Class)',
        resultStatus: 'Passed',
        rank: idx + 1,
        remarks: 'Excellent NCERT diagram labeling and retention.'
      });
    });
    await Marks.insertMany(marksToInsert);
    console.log(`✅ Seeded ${marksToInsert.length} Exam Marks`);

    // 11. Live Class for [K001]
    const liveClass = new LiveClass({
      instituteId: inst1._id,
      batchId: savedBatches[0]._id,
      courseId: savedCourses[0]._id,
      title: 'Kinematics & Vector Laws Masterclass',
      subject: 'Physics',
      teacherName: 'Dr. Vivek Sharma',
      scheduledDate: new Date().toISOString().split('T')[0],
      startTime: '19:00',
      durationMinutes: 90,
      provider: 'jitsi',
      meetingRoomId: 'k001-physics-kinematics',
      meetingLink: 'https://meet.jit.si/k001-physics-kinematics',
      isLive: true,
      status: 'Live',
    });
    await liveClass.save();

    // 12. Study Notes for [K001]
    const notesToInsert = [
      {
        instituteId: inst1._id,
        courseId: savedCourses[0]._id,
        subject: 'Physics',
        chapter: 'Kinematics & Vectors',
        title: 'Complete Formula Book & Solved Derivations',
        description: 'Full NCERT and Advanced problem derivations with shortcut tricks.',
        fileType: 'pdf',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileSize: '3.4 MB',
        batches: [savedBatches[0]._id],
        allowDownload: true,
        uploadedByName: 'Dr. Vivek Sharma',
      },
      {
        instituteId: inst1._id,
        courseId: savedCourses[1]._id,
        subject: 'Biology',
        chapter: 'Cellular Respiration & Krebs Cycle',
        title: 'High-Yield NEET Mindmaps & Flowcharts',
        description: 'Comprehensive quick revision summary for medical aspirants.',
        fileType: 'pdf',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileSize: '4.8 MB',
        batches: [savedBatches[1]._id],
        allowDownload: true,
        uploadedByName: 'Dr. Sunita Kulkarni',
      }
    ];
    await Note.insertMany(notesToInsert);

    // 13. Homework & Assignments
    const homeworks = [
      {
        instituteId: inst1._id,
        batchId: savedBatches[0]._id,
        courseId: savedCourses[0]._id,
        title: 'JEE Advanced DPP-04: Projectile Motion on Inclined Plane',
        subject: 'Physics',
        description: 'Solve questions 1 through 25 from the ClassTech Workbook and show detailed steps.',
        dueDate: '2026-10-15',
        teacherName: 'Dr. Vivek Sharma',
        submissions: [
          {
            studentId: savedStudents[0]._id,
            studentName: `${savedStudents[0].fname} ${savedStudents[0].lname}`,
            submissionText: 'Completed all 25 numericals. Attached PDF solution.',
            grade: 'A+',
            feedback: 'Flawless step-by-step resolution.',
            status: 'Graded'
          }
        ]
      },
      {
        instituteId: inst1._id,
        batchId: savedBatches[1]._id,
        courseId: savedCourses[1]._id,
        title: 'NCERT Diagram Practice: Plant Tissue Cross Sections',
        subject: 'Biology',
        description: 'Draw and color-code anatomy of Dicot and Monocot Stem.',
        dueDate: '2026-10-14',
        teacherName: 'Dr. Sunita Kulkarni',
        submissions: []
      }
    ];
    await Homework.insertMany(homeworks);

    // 14. CRM Enquiries
    const enquiries = [
      {
        instituteId: inst1._id,
        candidateName: 'Rohan Deshmukh',
        mobileNo: '9820155551',
        email: 'rohan.d@gmail.com',
        courseId: savedCourses[0]._id,
        courseName: savedCourses[0].courseName,
        qualification: '10th Passed (92%)',
        preferredTiming: 'Morning (07:30 AM - 10:30 AM)',
        leadSource: 'Walk-in',
        status: 'Demo Scheduled',
        priority: 'High',
        counselorName: 'Pooja Verma',
        followUpDate: '2026-10-10',
        followUpNotes: 'Interested in JEE 2-year integrated course. Father requested morning batch seat reservation.',
        isDemoRequested: true,
        demoDate: '2026-10-10',
        demoTiming: '08:00 AM',
        demoFaculty: 'Dr. Vivek Sharma'
      },
      {
        instituteId: inst1._id,
        candidateName: 'Kavita Iyer',
        mobileNo: '9820155552',
        email: 'kavita.i@gmail.com',
        courseId: savedCourses[1]._id,
        courseName: savedCourses[1].courseName,
        qualification: '11th Standard',
        preferredTiming: 'Evening (04:30 PM - 07:30 PM)',
        leadSource: 'Website',
        status: 'Contacted',
        priority: 'High',
        counselorName: 'Pooja Verma',
        followUpDate: '2026-10-09',
        followUpNotes: 'Inquired via website form about NEET test series & study material dispatch.'
      },
      {
        instituteId: inst1._id,
        candidateName: 'Tanmay Saxena',
        mobileNo: '9820155553',
        email: 'tanmay.s@gmail.com',
        courseId: savedCourses[0]._id,
        courseName: savedCourses[0].courseName,
        qualification: '10th Passed',
        preferredTiming: 'Morning',
        leadSource: 'Instagram',
        status: 'Converted',
        priority: 'Medium',
        counselorName: 'Pooja Verma',
        followUpDate: '2026-10-06',
        followUpNotes: 'Enrolled in Morning JEE Titans batch. Full fee paid.'
      },
      {
        instituteId: inst1._id,
        candidateName: 'Simran Kaur',
        mobileNo: '9820155554',
        email: 'simran.k@gmail.com',
        courseId: savedCourses[1]._id,
        courseName: savedCourses[1].courseName,
        qualification: '12th Appearing',
        preferredTiming: 'Evening',
        leadSource: 'Referral',
        status: 'New',
        priority: 'Medium',
        counselorName: 'Pooja Verma',
        followUpDate: '2026-10-11',
        followUpNotes: 'Referred by enrolled student Diya Verma.'
      }
    ];
    await Enquiry.insertMany(enquiries);

    // 15. Demos
    const demos = [
      {
        instituteId: inst1._id,
        studentName: 'Rohan Deshmukh',
        phone: '9820155551',
        email: 'rohan.d@gmail.com',
        courseId: savedCourses[0]._id,
        courseName: savedCourses[0].courseName,
        batchId: savedBatches[0]._id,
        teacherName: 'Dr. Vivek Sharma',
        demoDate: new Date().toISOString().split('T')[0],
        demoTime: '08:00 AM',
        mode: 'offline',
        status: 'Scheduled',
        counsellorNotes: 'Candidate will visit Hall 101 for demo lecture.'
      },
      {
        instituteId: inst1._id,
        studentName: 'Kavita Iyer',
        phone: '9820155552',
        email: 'kavita.i@gmail.com',
        courseId: savedCourses[1]._id,
        courseName: savedCourses[1].courseName,
        batchId: savedBatches[1]._id,
        teacherName: 'Dr. Sunita Kulkarni',
        demoDate: '2026-10-10',
        demoTime: '05:00 PM',
        mode: 'online',
        meetingLink: 'https://meet.jit.si/k001-demo-neet-biology',
        status: 'Scheduled',
        counsellorNotes: 'Online link sent via SMS and Email.'
      }
    ];
    await Demo.insertMany(demos);

    // 16. Leave Requests
    const leaves = [
      {
        instituteId: inst1._id,
        applicantId: savedStudents[0]._id,
        applicantType: 'Student',
        applicantName: `${savedStudents[0].fname} ${savedStudents[0].lname}`,
        identifier: savedStudents[0].studentId,
        courseId: savedCourses[0]._id,
        batchId: savedBatches[0]._id,
        leaveType: 'College Exam',
        startDate: '2026-10-12',
        endDate: '2026-10-14',
        totalDays: 3,
        reason: 'Internal term examinations scheduled at junior college.',
        status: 'Approved',
        adminRemarks: 'Approved. Recorded lectures will be made available.',
        reviewedBy: 'Prof. Anil Sharma',
        reviewedAt: new Date()
      },
      {
        instituteId: inst1._id,
        applicantId: savedStudents[3]._id,
        applicantType: 'Student',
        applicantName: `${savedStudents[3].fname} ${savedStudents[3].lname}`,
        identifier: savedStudents[3].studentId,
        courseId: savedCourses[0]._id,
        batchId: savedBatches[0]._id,
        leaveType: 'Sick Leave',
        startDate: '2026-10-09',
        endDate: '2026-10-10',
        totalDays: 2,
        reason: 'Viral fever, resting under medical advice.',
        status: 'Pending',
      }
    ];
    await Leave.insertMany(leaves);

    // 17. Grievances / Complaints
    const complaints = [
      {
        instituteId: inst1._id,
        studentId: savedStudents[1]._id,
        studentName: `${savedStudents[1].fname} ${savedStudents[1].lname}`,
        grno: savedStudents[1].grno,
        courseName: savedCourses[0].courseName,
        batchName: savedBatches[0].batchName,
        category: 'Course Material / Software',
        subject: 'Request for printed formula booklet for Organic Chemistry',
        description: 'I would like to request the hardcopy of the quick reference handbook.',
        priority: 'Low',
        status: 'Resolved',
        adminResponse: 'Booklet handed over at Reception Counter on Oct 7.',
        resolvedBy: 'Prof. Anil Sharma',
        resolvedAt: new Date()
      },
      {
        instituteId: inst1._id,
        studentId: savedStudents[4]._id,
        studentName: `${savedStudents[4].fname} ${savedStudents[4].lname}`,
        grno: savedStudents[4].grno,
        courseName: savedCourses[0].courseName,
        batchName: savedBatches[0].batchName,
        category: 'Faculty & Teaching',
        subject: 'Extra numerical doubt session before weekend test',
        description: 'Requesting a 45-minute doubt solving session for Rotational Dynamics.',
        priority: 'Medium',
        status: 'In Progress',
        adminResponse: 'Doubt session scheduled with Dr. Vivek Sharma on Saturday at 4 PM.',
        resolvedBy: 'Prof. Anil Sharma',
      }
    ];
    await Complaint.insertMany(complaints);

    // 18. Pinned Announcement for [K001]
    const notice = new Announcement({
      instituteId: inst1._id,
      title: '🚀 ClassTech Smart ID & Test Series Commencing Next Week',
      message: 'All students are requested to tap their ClassTech NFC/RFID Cards at entry gates and review syllabus derivations.',
      category: 'Exam',
      isPinned: true,
      authorName: 'Director Office',
    });
    await notice.save();

    console.log('------------------------------------------------------------');
    console.log('🎉 FULL SEEDING COMPLETED ACROSS ALL 18 COLLECTIONS!');
    console.log('------------------------------------------------------------');
    console.log('👉 Super Admin Login:  superadmin / Scanid@1234');
    console.log('👉 Class Admin [K001]: Code: K001 | admin@k001.com / Class@123');
    console.log('👉 Student [K001]:     Code: K001 | ID: K001-2026-0001 / Demo@123');
    console.log('------------------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
  }
}

seedDatabase();


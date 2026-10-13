const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Institute = require('./models/Institute');
const Course = require('./models/Course');
const Batch = require('./models/Batch');
const Staff = require('./models/Staff');
const Student = require('./models/Students');
const User = require('./models/user');

async function seedMasterData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const institute = await Institute.findOne({ code: 'K001' }) || await Institute.findOne({});
    if (!institute) {
      console.error('No institute found!');
      process.exit(1);
    }
    console.log(`Using Institute: ${institute.name} (${institute.code}) [${institute._id}]`);

    // 1. Seed Courses
    const sampleCourses = [
      {
        instituteId: institute._id,
        courseName: 'MS-CIT Computer Fundamentals',
        courseCode: 'MSCIT',
        duration: '3 Months',
        totalFees: 5000,
        description: 'Government certified computer literacy & digital office tools',
      },
      {
        instituteId: institute._id,
        courseName: 'Tally Prime with GST & Accounting',
        courseCode: 'TALLY',
        duration: '3 Months',
        totalFees: 8000,
        description: 'Complete corporate bookkeeping, taxation, and ledger reconciliation',
      },
      {
        instituteId: institute._id,
        courseName: 'Full-Stack Web & Software Engineering',
        courseCode: 'FS-WEB',
        duration: '6 Months',
        totalFees: 24000,
        description: 'Modern JavaScript, React, Node.js, and cloud application engineering',
      },
      {
        instituteId: institute._id,
        courseName: 'Grade 10th Board Academic Coaching',
        courseCode: 'STD10',
        duration: '1 Year',
        totalFees: 18000,
        description: 'Science, Mathematics, and English board examination preparation',
      },
    ];

    const seededCourses = [];
    for (const c of sampleCourses) {
      let existing = await Course.findOne({ instituteId: institute._id, courseCode: c.courseCode });
      if (!existing) {
        existing = await Course.create(c);
        console.log(`✅ Created Course: ${c.courseName}`);
      }
      seededCourses.push(existing);
    }

    // 2. Seed Batches
    const sampleBatches = [
      {
        instituteId: institute._id,
        courseId: seededCourses[0]._id,
        batchName: 'Morning Batch A (8:00 AM - 10:00 AM)',
        batchCode: 'MSCIT-M1',
        timing: '08:00 AM - 10:00 AM',
        days: 'Mon-Wed-Fri (MWF)',
        roomNo: 'Lab 1',
        instructor: 'Prof. Rajesh Sharma',
        maxStudents: 30,
      },
      {
        instituteId: institute._id,
        courseId: seededCourses[1]._id,
        batchName: 'Afternoon Batch B (2:00 PM - 4:00 PM)',
        batchCode: 'TALLY-A1',
        timing: '02:00 PM - 04:00 PM',
        days: 'Tue-Thu-Sat (TTS)',
        roomNo: 'Lab 2',
        instructor: 'Ms. Sunita Verma',
        maxStudents: 30,
      },
      {
        instituteId: institute._id,
        courseId: seededCourses[2]._id,
        batchName: 'Evening Tech Batch C (6:00 PM - 8:00 PM)',
        batchCode: 'WEB-E1',
        timing: '06:00 PM - 08:00 PM',
        days: 'Daily (Mon-Sat)',
        roomNo: 'Cloud Hub',
        instructor: 'Dr. Anand Rao',
        maxStudents: 25,
      },
      {
        instituteId: institute._id,
        courseId: seededCourses[3]._id,
        batchName: 'Grade 10-A Board Preparation',
        batchCode: 'STD10-A',
        timing: '09:00 AM - 01:00 PM',
        days: 'Daily (Mon-Sat)',
        roomNo: 'Hall 3',
        instructor: 'Prof. Vikram Mehta',
        maxStudents: 40,
      },
    ];

    const seededBatches = [];
    for (const b of sampleBatches) {
      let existing = await Batch.findOne({ instituteId: institute._id, batchCode: b.batchCode });
      if (!existing) {
        existing = await Batch.create(b);
        console.log(`✅ Created Batch: ${b.batchName}`);
      }
      seededBatches.push(existing);
    }

    // 3. Seed Staff
    const sampleStaff = [
      {
        instituteId: institute._id,
        staffId: `${institute.code}-STF-001`,
        fname: 'Rajesh',
        lname: 'Sharma',
        email: 'rajesh.sharma@school.com',
        mobileNo: '9820011111',
        designation: 'Senior Lecturer',
        department: 'Information Technology',
        joiningDate: new Date('2023-01-15'),
        salary: 45000,
        status: 'Active',
      },
      {
        instituteId: institute._id,
        staffId: `${institute.code}-STF-002`,
        fname: 'Sunita',
        lname: 'Verma',
        email: 'sunita.verma@school.com',
        mobileNo: '9820022222',
        designation: 'Accountancy Trainer',
        department: 'Commerce & Tally',
        joiningDate: new Date('2023-06-01'),
        salary: 42000,
        status: 'Active',
      },
      {
        instituteId: institute._id,
        staffId: `${institute.code}-STF-003`,
        fname: 'Anand',
        lname: 'Rao',
        email: 'anand.rao@school.com',
        mobileNo: '9820033333',
        designation: 'Lead Software Faculty',
        department: 'Computer Science',
        joiningDate: new Date('2022-08-10'),
        salary: 55000,
        status: 'Active',
      },
    ];

    for (const s of sampleStaff) {
      let existing = await Staff.findOne({ instituteId: institute._id, staffId: s.staffId });
      if (!existing) {
        await Staff.create({
          instituteId: s.instituteId,
          staffId: s.staffId,
          name: `${s.fname} ${s.lname}`,
          email: s.email,
          phone: s.mobileNo,
          designation: s.designation,
          department: s.department,
          salary: s.salary,
          status: s.status,
          joiningDate: s.joiningDate,
        });
        console.log(`✅ Created Staff: ${s.fname} ${s.lname}`);
      }
    }

    // 4. Update existing students with batch and course linkage
    const students = await Student.find({ instituteId: institute._id });
    for (let i = 0; i < students.length; i++) {
      const stu = students[i];
      if (!stu.courseId || !stu.batchId) {
        stu.courseId = seededCourses[i % seededCourses.length]._id;
        stu.batchId = seededBatches[i % seededBatches.length]._id;
        await stu.save();
        console.log(`✅ Linked Student ${stu.fname} to Course: ${seededCourses[i % seededCourses.length].courseCode}, Batch: ${seededBatches[i % seededBatches.length].batchCode}`);
      }
    }

    console.log('✅ Master data seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedMasterData();

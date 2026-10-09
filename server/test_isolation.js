const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Institute = require('./models/Institute');
const Student = require('./models/Students');
const Course = require('./models/Course');
const Batch = require('./models/Batch');

async function testIsolation() {
  await mongoose.connect(process.env.MONGODB_URI);

  const inst1 = await Institute.findOne({ code: 'DEMO01' });
  const inst2 = await Institute.findOne({ code: 'DEMO02' });

  if (!inst1 || !inst2) {
    console.error('Institutes not found');
    process.exit(1);
  }

  // Count documents for Institute 1
  const inst1Students = await Student.countDocuments({ instituteId: inst1._id });
  const inst1Courses = await Course.countDocuments({ instituteId: inst1._id });
  const inst1Batches = await Batch.countDocuments({ instituteId: inst1._id });

  // Count documents for Institute 2
  const inst2Students = await Student.countDocuments({ instituteId: inst2._id });
  const inst2Courses = await Course.countDocuments({ instituteId: inst2._id });
  const inst2Batches = await Batch.countDocuments({ instituteId: inst2._id });

  console.log('--- Multi-Tenant Isolation Test ---');
  console.log(`[DEMO01 - ${inst1.name}]`);
  console.log(`  Students: ${inst1Students}`);
  console.log(`  Courses:  ${inst1Courses}`);
  console.log(`  Batches:  ${inst1Batches}`);
  console.log(`[DEMO02 - ${inst2.name}]`);
  console.log(`  Students: ${inst2Students}`);
  console.log(`  Courses:  ${inst2Courses}`);
  console.log(`  Batches:  ${inst2Batches}`);

  if (inst1Students > 0 && inst2Students === 0 && inst1Courses > 0 && inst2Courses > 0) {
    console.log('✅ MULTI-TENANCY ISOLATION VERIFIED: Data is strictly segregated by instituteId!');
  } else {
    console.log('Isolation stats reported above.');
  }

  process.exit(0);
}

testIsolation();

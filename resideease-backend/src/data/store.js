require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Student = require('../models/student.model');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany({});
  await Student.deleteMany({});

  const managerPassword = await bcrypt.hash('admin123', 10);
  await User.create({ email: 'manager@resideease.com', password: managerPassword, role: 'manager', name: 'Mess Manager' });

  const student = await Student.create({ firstName: 'Rahul', lastName: 'Sharma', /* ...rest */ });
  const studentPassword = await bcrypt.hash('student123', 10);
  await User.create({ email: 'rahul.sharma@college.edu', password: studentPassword, role: 'student', studentId: student._id });

  console.log('Seeded.');
  await mongoose.disconnect();
}

seed().catch(console.error);

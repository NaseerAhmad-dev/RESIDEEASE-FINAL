const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth.middleware');
const { ok, fail } = require('../utils/helpers');

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return fail(res, 'Username and password are required');

  const user = await prisma.user.findFirst({
    where: { username, role: { in: ['manager', 'admin'] } },
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return fail(res, 'Invalid credentials', 401);
  }

  const { password: _, ...safeUser } = user;
  const token = signToken({ id: user.id, username: user.username, role: user.role, name: user.name });
  return ok(res, { token, user: safeUser });
};

exports.studentLogin = async (req, res) => {
  const { rollNumber, phone } = req.body;
  if (!rollNumber || !phone) return fail(res, 'Roll number and phone are required');

  const student = await prisma.student.findFirst({
    where: { rollNumber: rollNumber.trim(), phone: phone.trim() },
  });
  if (!student) return fail(res, 'Student not found. Check your roll number and phone.', 401);

  const token = signToken({
    id: student.id,
    role: 'student',
    name: `${student.firstName} ${student.lastName}`,
    rollNumber: student.rollNumber,
  });
  return ok(res, {
    token,
    user: { id: student.id, role: 'student', name: `${student.firstName} ${student.lastName}`, rollNumber: student.rollNumber },
  });
};

exports.getMe = (req, res) => ok(res, req.user);

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
    where: {
      OR: [{ username }, { email: username }],
      role: { name: { in: ['super_admin', 'admin', 'office', 'manager'] } },
    },
    include: { role: true },
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return fail(res, 'Invalid credentials', 401);
  }

  const { password: _, role: roleObj, ...rest } = user;
  const safeUser = { ...rest, role: roleObj.name };
  const token = signToken({
    id: user.id,
    username: user.username,
    role: roleObj.name,
    name: user.name,
    hostelId: user.hostelId ?? null,
    onboardingCompleted: user.onboardingCompleted,
  });
  return ok(res, { token, user: safeUser });
};

exports.studentLogin = async (req, res) => {
  const { rollNumber, password, phone } = req.body;
  if (!rollNumber) return fail(res, 'Roll number is required');

  const student = await prisma.student.findFirst({ where: { rollNumber: rollNumber.trim() } });
  if (!student) return fail(res, 'Invalid credentials', 401);

  // Students onboarded with the new flow have a hashed password.
  // Legacy students (no password set) fall back to phone verification.
  if (student.password) {
    if (!password) return fail(res, 'Password is required');
    if (!(await bcrypt.compare(password, student.password))) return fail(res, 'Invalid credentials', 401);
  } else {
    if (!phone || student.phone !== phone.trim()) return fail(res, 'Invalid credentials', 401);
  }

  const token = signToken({
    id: student.id,
    role: 'student',
    name: `${student.firstName} ${student.lastName}`,
    rollNumber: student.rollNumber,
    hostelId: student.hostelId ?? null,
  });
  return ok(res, {
    token,
    user: { id: student.id, role: 'student', name: `${student.firstName} ${student.lastName}`, rollNumber: student.rollNumber },
  });
};

exports.employeeLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, 'Email and password are required');

  const employee = await prisma.employee.findUnique({
    where: { email },
    select: {
      id: true, name: true, email: true, role: true,
      hostelId: true, status: true, password: true,
    },
  });
  if (!employee || !employee.password) return fail(res, 'Invalid credentials', 401);
  if (employee.status !== 'active') return fail(res, 'Account is inactive', 403);

  if (!(await bcrypt.compare(password, employee.password))) {
    return fail(res, 'Invalid credentials', 401);
  }

  const { password: _, ...safeEmployee } = employee;
  const token = signToken({ id: employee.id, role: employee.role, name: employee.name, hostelId: employee.hostelId });
  return ok(res, { token, user: safeEmployee });
};

exports.getMe = (req, res) => ok(res, req.user);

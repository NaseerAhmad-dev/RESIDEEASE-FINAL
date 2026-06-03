const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  const { status, gender, department, search } = req.query;
  const where = {};
  if (status) where.status = status;
  if (gender) where.gender = gender;
  if (department) where.department = department;
  if (search) {
    where.OR = [
      { firstName:  { contains: search, mode: 'insensitive' } },
      { lastName:   { contains: search, mode: 'insensitive' } },
      { email:      { contains: search, mode: 'insensitive' } },
      { rollNumber: { contains: search, mode: 'insensitive' } },
    ];
  }
  const students = await prisma.student.findMany({ where });
  return ok(res, students);
};

exports.getById = async (req, res) => {
  const student = await prisma.student.findUnique({ where: { id: req.params.id } });
  if (!student) return fail(res, 'Student not found', 404);
  return ok(res, student);
};

exports.create = async (req, res) => {
  const required = ['firstName', 'lastName', 'email', 'phone', 'rollNumber', 'gender', 'checkInDate', 'selectedRoom'];
  const missing = required.filter(f => !req.body[f]);
  if (missing.length) return fail(res, `Missing required fields: ${missing.join(', ')}`);

  const duplicate = await prisma.student.findFirst({
    where: { OR: [{ email: req.body.email }, { rollNumber: req.body.rollNumber }] },
  });
  if (duplicate) return fail(res, 'A student with this email or roll number already exists');

  const student = await prisma.student.create({
    data: { ...req.body, status: req.body.status || 'active' },
  });
  return ok(res, student, 'Student created successfully', 201);
};

exports.update = async (req, res) => {
  const existing = await prisma.student.findUnique({ where: { id: req.params.id } });
  if (!existing) return fail(res, 'Student not found', 404);
  const student = await prisma.student.update({ where: { id: req.params.id }, data: req.body });
  return ok(res, student, 'Student updated');
};

exports.remove = async (req, res) => {
  const existing = await prisma.student.findUnique({ where: { id: req.params.id } });
  if (!existing) return fail(res, 'Student not found', 404);
  await prisma.student.delete({ where: { id: req.params.id } });
  return ok(res, null, 'Student deleted');
};

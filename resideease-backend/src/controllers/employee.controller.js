const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

const SAFE_SELECT = {
  id: true, name: true, email: true, phone: true, jobTitle: true,
  department: true, salary: true, joinDate: true, status: true,
  address: true, notes: true, role: true, hostelId: true,
  createdAt: true, updatedAt: true,
};

exports.getAll = async (req, res) => {
  const { status, department, search } = req.query;
  const where = {};
  if (req.user.hostelId) where.hostelId = req.user.hostelId;
  if (status)     where.status = status;
  if (department) where.department = department;
  if (search) {
    where.OR = [
      { name:       { contains: search, mode: 'insensitive' } },
      { email:      { contains: search, mode: 'insensitive' } },
      { jobTitle:   { contains: search, mode: 'insensitive' } },
      { department: { contains: search, mode: 'insensitive' } },
    ];
  }
  const employees = await prisma.employee.findMany({
    where,
    select: SAFE_SELECT,
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, employees);
};

exports.getById = async (req, res) => {
  const where = { id: req.params.id };
  if (req.user.hostelId) where.hostelId = req.user.hostelId;
  const employee = await prisma.employee.findFirst({ where, select: SAFE_SELECT });
  if (!employee) return fail(res, 'Employee not found', 404);
  return ok(res, employee);
};

exports.create = async (req, res) => {
  const { name, jobTitle, joinDate } = req.body;
  if (!name)      return fail(res, 'Name is required');
  if (!jobTitle)  return fail(res, 'Job title is required');
  if (!joinDate)  return fail(res, 'Join date is required');

  if (req.body.email) {
    const duplicate = await prisma.employee.findUnique({ where: { email: req.body.email } });
    if (duplicate) return fail(res, 'An employee with this email already exists', 409);
  }

  const hashedPassword = req.body.password
    ? await bcrypt.hash(req.body.password, 10)
    : null;

  const employee = await prisma.employee.create({
    data: {
      name,
      email:      req.body.email      ?? null,
      phone:      req.body.phone      ?? null,
      jobTitle,
      department: req.body.department ?? null,
      salary:     req.body.salary     != null ? Number(req.body.salary) : null,
      joinDate,
      status:     req.body.status     || 'active',
      address:    req.body.address    ?? null,
      notes:      req.body.notes      ?? null,
      role:       req.body.role       || 'staff',
      password:   hashedPassword,
      hostelId:   req.body.hostelId   ?? req.user.hostelId ?? null,
    },
    select: SAFE_SELECT,
  });
  return ok(res, employee, 'Employee created successfully', 201);
};

exports.update = async (req, res) => {
  const lookupWhere = { id: req.params.id };
  if (req.user.hostelId) lookupWhere.hostelId = req.user.hostelId;
  const existing = await prisma.employee.findFirst({ where: lookupWhere });
  if (!existing) return fail(res, 'Employee not found', 404);

  const { name, email, phone, jobTitle, department, salary, joinDate, status, address, notes, role, hostelId } = req.body;

  // Resolve hostelId: explicit body value → existing value → admin's hostelId (auto-heal null)
  const resolvedHostelId = hostelId !== undefined
    ? (hostelId || null)
    : (existing.hostelId ?? req.user.hostelId ?? null);

  const data = {
    ...(name       !== undefined && { name }),
    ...(email      !== undefined && { email: email || null }),
    ...(phone      !== undefined && { phone: phone || null }),
    ...(jobTitle   !== undefined && { jobTitle }),
    ...(department !== undefined && { department: department || null }),
    ...(salary     !== undefined && { salary: salary != null ? Number(salary) : null }),
    ...(joinDate   !== undefined && { joinDate }),
    ...(status     !== undefined && { status }),
    ...(address    !== undefined && { address: address || null }),
    ...(notes      !== undefined && { notes: notes || null }),
    ...(role       !== undefined && { role }),
    hostelId: resolvedHostelId,
  };

  if (req.body.password) {
    data.password = await bcrypt.hash(req.body.password, 10);
  }

  const employee = await prisma.employee.update({
    where: { id: req.params.id },
    data,
    select: SAFE_SELECT,
  });
  return ok(res, employee, 'Employee updated');
};

exports.remove = async (req, res) => {
  const lookupWhere = { id: req.params.id };
  if (req.user.hostelId) lookupWhere.hostelId = req.user.hostelId;
  const existing = await prisma.employee.findFirst({ where: lookupWhere });
  if (!existing) return fail(res, 'Employee not found', 404);
  await prisma.employee.delete({ where: { id: req.params.id } });
  return ok(res, null, 'Employee deleted');
};

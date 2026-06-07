const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  const { status, department, search } = req.query;
  const where = {};
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
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, employees);
};

exports.getById = async (req, res) => {
  const employee = await prisma.employee.findUnique({ where: { id: req.params.id } });
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
    },
  });
  return ok(res, employee, 'Employee created successfully', 201);
};

exports.update = async (req, res) => {
  const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
  if (!existing) return fail(res, 'Employee not found', 404);

  const { name, email, phone, jobTitle, department, salary, joinDate, status, address, notes } = req.body;

  const employee = await prisma.employee.update({
    where: { id: req.params.id },
    data: {
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
    },
  });
  return ok(res, employee, 'Employee updated');
};

exports.remove = async (req, res) => {
  const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
  if (!existing) return fail(res, 'Employee not found', 404);
  await prisma.employee.delete({ where: { id: req.params.id } });
  return ok(res, null, 'Employee deleted');
};

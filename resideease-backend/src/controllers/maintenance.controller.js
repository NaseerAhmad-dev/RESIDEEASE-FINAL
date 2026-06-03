const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  const { status, category, priority } = req.query;
  const where = {};
  if (status)   where.status   = status;
  if (category) where.category = category;
  if (priority) where.priority = priority;
  const requests = await prisma.maintenanceRequest.findMany({ where, orderBy: { raisedAt: 'desc' } });
  return ok(res, requests);
};

exports.create = async (req, res) => {
  const { studentName, rollNumber, roomNumber, category, title, description } = req.body;
  if (!studentName || !rollNumber || !roomNumber || !category || !title || !description) {
    return fail(res, 'Missing required fields: studentName, rollNumber, roomNumber, category, title, description');
  }
  const count = await prisma.maintenanceRequest.count();
  const ticketNumber = 'TKT-' + String(1000 + count + 1).padStart(4, '0');
  const request = await prisma.maintenanceRequest.create({
    data: { ticketNumber, studentName, rollNumber, roomNumber, category, title, description, priority: req.body.priority || 'medium', status: 'open' },
  });
  return ok(res, request, 'Maintenance request created', 201);
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!status) return fail(res, 'Status is required');
  const existing = await prisma.maintenanceRequest.findUnique({ where: { id: req.params.id } });
  if (!existing) return fail(res, 'Maintenance request not found', 404);
  const data = { status };
  if (status === 'resolved') data.resolvedAt = new Date();
  const request = await prisma.maintenanceRequest.update({ where: { id: req.params.id }, data });
  return ok(res, request, 'Status updated');
};

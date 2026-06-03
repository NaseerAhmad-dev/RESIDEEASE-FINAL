const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  const { status, category } = req.query;
  const where = {};
  if (status)   where.status   = status;
  if (category) where.category = category;
  const bills = await prisma.supplierBill.findMany({ where, orderBy: { registeredAt: 'desc' } });
  return ok(res, bills);
};

exports.create = async (req, res) => {
  const { billNumber, supplierName, category, amount, billDate, description } = req.body;
  if (!billNumber || !supplierName || !category || !amount || !billDate || !description) {
    return fail(res, 'Missing required fields: billNumber, supplierName, category, amount, billDate, description');
  }
  const existing = await prisma.supplierBill.findUnique({ where: { billNumber } });
  if (existing) return fail(res, 'Bill number already exists');
  const bill = await prisma.supplierBill.create({
    data: { billNumber, supplierName, category, amount: parseFloat(amount), billDate, description, photoData: req.body.photoData || null, status: 'pending' },
  });
  return ok(res, bill, 'Supplier bill registered', 201);
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!status) return fail(res, 'Status is required');
  const existing = await prisma.supplierBill.findUnique({ where: { id: req.params.id } });
  if (!existing) return fail(res, 'Bill not found', 404);
  const bill = await prisma.supplierBill.update({ where: { id: req.params.id }, data: { status } });
  return ok(res, bill, 'Status updated');
};

exports.remove = async (req, res) => {
  const existing = await prisma.supplierBill.findUnique({ where: { id: req.params.id } });
  if (!existing) return fail(res, 'Bill not found', 404);
  await prisma.supplierBill.delete({ where: { id: req.params.id } });
  return ok(res, null, 'Bill deleted');
};

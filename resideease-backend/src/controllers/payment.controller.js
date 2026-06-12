const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');
const { createAdminNotif } = require('../utils/notif');

// POST /payments — record a payment and update the student balance
exports.create = async (req, res) => {
  const { studentId, amount, method, notes, paidAt } = req.body;

  if (!studentId || !amount || Number(amount) <= 0)
    return fail(res, 'studentId and a positive amount are required');

  const hostelId = req.user.hostelId;
  const where    = { id: studentId };
  if (hostelId) where.hostelId = hostelId;

  const student = await prisma.student.findFirst({ where });
  if (!student) return fail(res, 'Student not found', 404);

  const effectiveHostelId = hostelId ?? student.hostelId;
  if (!effectiveHostelId) return fail(res, 'Cannot determine hostel for this payment');

  const dateStr = paidAt || new Date().toISOString().split('T')[0];
  const newPaid = (student.paidAmount ?? 0) + Number(amount);
  const total   = student.totalPayment ?? 0;
  const newStatus = total > 0 && newPaid >= total ? 'paid' : 'partial';

  const [tx, updatedStudent] = await prisma.$transaction([
    prisma.paymentTransaction.create({
      data: {
        studentId,
        hostelId: effectiveHostelId,
        amount:   Number(amount),
        method:   method || 'cash',
        notes:    notes || null,
        paidAt:   dateStr,
      },
    }),
    prisma.student.update({
      where: { id: studentId },
      data:  { paidAmount: newPaid, paymentStatus: newStatus, lastPaymentDate: dateStr },
    }),
  ]);

  createAdminNotif(effectiveHostelId, {
    type:    'success',
    title:   'Payment received',
    message: `₹${Number(amount).toLocaleString('en-IN')} received from ${student.firstName} ${student.lastName} (Roll: ${student.rollNumber}).`,
  });

  return ok(res, { transaction: tx, student: updatedStudent }, 'Payment recorded', 201);
};

// GET /payments — all transactions for this hostel, newest first
exports.getAll = async (req, res) => {
  const where = {};
  if (req.user.hostelId) where.hostelId = req.user.hostelId;

  const transactions = await prisma.paymentTransaction.findMany({
    where,
    include: {
      student: {
        select: {
          id: true, firstName: true, lastName: true,
          rollNumber: true, roomNumber: true,
          totalPayment: true, paidAmount: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, transactions);
};

// GET /payments/student/:studentId — history for one student
exports.getByStudent = async (req, res) => {
  const { studentId } = req.params;
  const hostelId = req.user.hostelId;
  const where = { id: studentId };
  if (hostelId) where.hostelId = hostelId;

  const student = await prisma.student.findFirst({ where });
  if (!student) return fail(res, 'Student not found', 404);

  const transactions = await prisma.paymentTransaction.findMany({
    where:   { studentId },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, transactions);
};

const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

const VALID_DAYS = [10, 14, 28];

exports.getAll = async (req, res) => {
  const requests = await prisma.rebateRequest.findMany({ orderBy: { requestedAt: 'desc' } });
  return ok(res, requests);
};

exports.submit = async (req, res) => {
  const { studentId, days } = req.body;
  if (!studentId || !days) return fail(res, 'studentId and days are required');
  if (!VALID_DAYS.includes(Number(days))) return fail(res, 'days must be 10, 14, or 28');

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return fail(res, 'Student not found', 404);

  const hasPending = await prisma.rebateRequest.findFirst({ where: { studentId, status: 'pending' } });
  if (hasPending) return fail(res, 'Student already has a pending rebate request');

  const request = await prisma.rebateRequest.create({
    data: {
      studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      rollNumber: student.rollNumber,
      days: Number(days),
    },
  });
  return ok(res, request, 'Rebate request submitted', 201);
};

exports.getPending = async (req, res) => {
  const result = await prisma.rebateRequest.findMany({ where: { status: 'pending' } });
  return ok(res, result);
};

exports.getByStudent = async (req, res) => {
  const result = await prisma.rebateRequest.findMany({
    where: { studentId: req.params.studentId },
    orderBy: { requestedAt: 'desc' },
  });
  return ok(res, result);
};

async function reviewRequest(req, res, newStatus) {
  const request = await prisma.rebateRequest.findUnique({ where: { id: req.params.id } });
  if (!request) return fail(res, 'Request not found', 404);
  if (request.status !== 'pending') return fail(res, `Request is already ${request.status}`);

  const updated = await prisma.rebateRequest.update({
    where: { id: req.params.id },
    data: {
      status: newStatus,
      reviewedAt: new Date(),
      reviewedBy: req.body.reviewedBy || req.user.name,
    },
  });
  return ok(res, updated, `Request ${newStatus}`);
}

exports.approve = (req, res) => reviewRequest(req, res, 'approved');
exports.reject  = (req, res) => reviewRequest(req, res, 'rejected');

exports.cancel = async (req, res) => {
  const request = await prisma.rebateRequest.findUnique({ where: { id: req.params.id } });
  if (!request) return fail(res, 'Request not found', 404);
  if (!['pending', 'approved'].includes(request.status)) {
    return fail(res, 'Only pending or approved requests can be cancelled');
  }
  const updated = await prisma.rebateRequest.update({
    where: { id: req.params.id },
    data: { status: 'cancelled' },
  });
  return ok(res, updated, 'Request cancelled');
};

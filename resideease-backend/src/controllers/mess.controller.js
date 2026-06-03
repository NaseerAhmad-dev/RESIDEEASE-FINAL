const { prisma } = require('../config/db');
const { generateCouponNumber, todayString, ok, fail } = require('../utils/helpers');

exports.getEnrollments = async (req, res) => {
  const enrollments = await prisma.messEnrollment.findMany();
  return ok(res, enrollments);
};

exports.createEnrollment = async (req, res) => {
  const { studentId, mealType } = req.body;
  if (!studentId || !mealType) return fail(res, 'studentId and mealType are required');
  if (!['lunch', 'dinner', 'both'].includes(mealType)) return fail(res, 'mealType must be lunch, dinner, or both');

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return fail(res, 'Student not found', 404);

  const today = todayString();
  const alreadyEnrolled = await prisma.messEnrollment.findFirst({
    where: { studentId, enrollmentDate: today, NOT: { status: 'cancelled' } },
  });
  if (alreadyEnrolled) return fail(res, 'Student is already enrolled for today');

  const enrollment = await prisma.messEnrollment.create({
    data: {
      studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      rollNumber: student.rollNumber,
      couponNumber: generateCouponNumber(),
      enrollmentDate: today,
      mealType,
    },
  });
  return ok(res, enrollment, 'Enrollment created', 201);
};

exports.getTodayEnrollments = async (req, res) => {
  const today = todayString();
  const result = await prisma.messEnrollment.findMany({
    where: { enrollmentDate: today, NOT: { status: 'cancelled' } },
  });
  return ok(res, result);
};

exports.getPendingEnrollments = async (req, res) => {
  const today = todayString();
  const result = await prisma.messEnrollment.findMany({
    where: { enrollmentDate: today, status: 'enrolled' },
  });
  return ok(res, result);
};

exports.getByCoupon = async (req, res) => {
  const enrollment = await prisma.messEnrollment.findUnique({
    where: { couponNumber: req.params.couponNumber },
  });
  if (!enrollment) return fail(res, 'Coupon not found', 404);
  return ok(res, enrollment);
};

exports.serveEnrollment = async (req, res) => {
  const enrollment = await prisma.messEnrollment.findUnique({ where: { id: req.params.id } });
  if (!enrollment) return fail(res, 'Enrollment not found', 404);
  if (enrollment.status !== 'enrolled') {
    return fail(res, `Cannot serve — enrollment status is '${enrollment.status}'`);
  }
  const updated = await prisma.messEnrollment.update({
    where: { id: req.params.id },
    data: {
      status: 'served',
      servedAt: new Date().toISOString(),
      servedBy: req.body.servedBy || req.user.name,
    },
  });
  return ok(res, updated, 'Meal served successfully');
};

exports.getNotifications = async (req, res) => {
  const notifications = await prisma.messNotification.findMany();
  return ok(res, notifications);
};

exports.createNotification = async (req, res) => {
  const { type, title, message, priority, expiresAt } = req.body;
  if (!type || !title || !message) return fail(res, 'type, title, and message are required');

  const notification = await prisma.messNotification.create({
    data: {
      type, title, message,
      priority: priority || 'medium',
      ...(expiresAt && { expiresAt }),
    },
  });
  return ok(res, notification, 'Notification created', 201);
};

exports.markRead = async (req, res) => {
  const existing = await prisma.messNotification.findUnique({ where: { id: req.params.id } });
  if (!existing) return fail(res, 'Notification not found', 404);
  const notification = await prisma.messNotification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });
  return ok(res, notification, 'Marked as read');
};

exports.getTodayStats = async (req, res) => {
  const today = todayString();
  const enrollments = await prisma.messEnrollment.findMany({
    where: { enrollmentDate: today, NOT: { status: 'cancelled' } },
  });
  return ok(res, {
    totalSubscribed: enrollments.length,
    totalServed: enrollments.filter(e => e.status === 'served').length,
    pendingStudents: enrollments.filter(e => e.status === 'enrolled').length,
    todayDate: today,
  });
};

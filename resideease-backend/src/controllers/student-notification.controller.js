const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

exports.getByStudent = async (req, res) => {
  const notifications = await prisma.studentNotification.findMany({
    where: { studentId: req.params.studentId },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, notifications);
};

exports.addMany = async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) return fail(res, 'items array is required');
  const data = items.map(n => ({
    studentId: n.studentId,
    type:      n.type,
    title:     n.title,
    message:   n.message,
    isRead:    false,
  }));
  await prisma.studentNotification.createMany({ data });
  return ok(res, null, `${data.length} notification(s) sent`, 201);
};

exports.markRead = async (req, res) => {
  const existing = await prisma.studentNotification.findUnique({ where: { id: req.params.id } });
  if (!existing) return fail(res, 'Notification not found', 404);
  const notif = await prisma.studentNotification.update({ where: { id: req.params.id }, data: { isRead: true } });
  return ok(res, notif, 'Marked as read');
};

exports.markAllRead = async (req, res) => {
  await prisma.studentNotification.updateMany({
    where: { studentId: req.params.studentId, isRead: false },
    data:  { isRead: true },
  });
  return ok(res, null, 'All notifications marked as read');
};

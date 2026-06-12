const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  const where = {};
  if (req.user.hostelId) where.hostelId = req.user.hostelId;

  const notifications = await prisma.adminNotification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return ok(res, notifications);
};

exports.markRead = async (req, res) => {
  const where = { id: req.params.id };
  if (req.user.hostelId) where.hostelId = req.user.hostelId;

  const existing = await prisma.adminNotification.findFirst({ where });
  if (!existing) return fail(res, 'Notification not found', 404);

  const notif = await prisma.adminNotification.update({
    where: { id: req.params.id },
    data:  { isRead: true },
  });
  return ok(res, notif, 'Marked as read');
};

exports.markAllRead = async (req, res) => {
  const where = { isRead: false };
  if (req.user.hostelId) where.hostelId = req.user.hostelId;

  await prisma.adminNotification.updateMany({ where, data: { isRead: true } });
  return ok(res, null, 'All notifications marked as read');
};

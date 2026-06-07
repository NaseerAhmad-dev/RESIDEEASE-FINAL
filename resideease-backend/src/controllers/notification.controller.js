const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  const notifications = await prisma.adminNotification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return ok(res, notifications);
};

exports.markRead = async (req, res) => {
  const existing = await prisma.adminNotification.findUnique({ where: { id: req.params.id } });
  if (!existing) return fail(res, 'Notification not found', 404);
  const notif = await prisma.adminNotification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });
  return ok(res, notif, 'Marked as read');
};

exports.markAllRead = async (req, res) => {
  await prisma.adminNotification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });
  return ok(res, null, 'All notifications marked as read');
};

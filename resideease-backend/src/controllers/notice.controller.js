const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  const where = {};
  if (req.user.hostelId) where.hostelId = req.user.hostelId;
  const notices = await prisma.notice.findMany({ where, orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] });
  return ok(res, notices);
};

exports.create = async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return fail(res, 'Missing required fields: title, content');
  const notice = await prisma.notice.create({
    data: {
      title,
      content,
      category:  req.body.category  || 'general',
      priority:  req.body.priority  || 'normal',
      postedBy:  req.body.postedBy  || 'Office Admin',
      isPinned:  req.body.isPinned  ?? false,
      expiresAt: req.body.expiresAt || null,
      hostelId:  req.user.hostelId  ?? null,
    },
  });
  return ok(res, notice, 'Notice created', 201);
};

exports.update = async (req, res) => {
  const existing = await prisma.notice.findUnique({ where: { id: req.params.id } });
  if (!existing) return fail(res, 'Notice not found', 404);
  const notice = await prisma.notice.update({ where: { id: req.params.id }, data: req.body });
  return ok(res, notice, 'Notice updated');
};

exports.remove = async (req, res) => {
  const existing = await prisma.notice.findUnique({ where: { id: req.params.id } });
  if (!existing) return fail(res, 'Notice not found', 404);
  await prisma.notice.delete({ where: { id: req.params.id } });
  return ok(res, null, 'Notice deleted');
};

exports.togglePin = async (req, res) => {
  const existing = await prisma.notice.findUnique({ where: { id: req.params.id } });
  if (!existing) return fail(res, 'Notice not found', 404);
  const notice = await prisma.notice.update({ where: { id: req.params.id }, data: { isPinned: !existing.isPinned } });
  return ok(res, notice, 'Pin toggled');
};

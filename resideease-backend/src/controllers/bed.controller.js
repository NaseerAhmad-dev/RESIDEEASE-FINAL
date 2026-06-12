const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

exports.getByRoom = async (req, res) => {
  const { roomId } = req.params;
  const room = await prisma.room.findFirst({
    where: { id: roomId, ...(req.user.hostelId ? { hostelId: req.user.hostelId } : {}) },
  });
  if (!room) return fail(res, 'Room not found', 404);

  const beds = await prisma.bed.findMany({
    where: { roomId },
    include: { student: { select: { id: true, firstName: true, lastName: true, rollNumber: true } } },
    orderBy: { bedNumber: 'asc' },
  });
  return ok(res, beds);
};

exports.create = async (req, res) => {
  const { roomId } = req.params;
  const { bedNumber, status } = req.body;
  if (!bedNumber) return fail(res, 'bedNumber is required');

  const room = await prisma.room.findFirst({
    where: { id: roomId, ...(req.user.hostelId ? { hostelId: req.user.hostelId } : {}) },
  });
  if (!room) return fail(res, 'Room not found', 404);

  const existing = await prisma.bed.findFirst({ where: { roomId, bedNumber } });
  if (existing) return fail(res, `Bed "${bedNumber}" already exists in this room`);

  const bed = await prisma.bed.create({
    data: { roomId, bedNumber, status: status || 'available' },
  });
  return ok(res, bed, 'Bed created', 201);
};

exports.bulkCreate = async (req, res) => {
  const { roomId } = req.params;
  const { beds } = req.body;
  if (!Array.isArray(beds) || beds.length === 0) return fail(res, 'beds array is required');

  const room = await prisma.room.findFirst({
    where: { id: roomId, ...(req.user.hostelId ? { hostelId: req.user.hostelId } : {}) },
  });
  if (!room) return fail(res, 'Room not found', 404);

  const created = await prisma.$transaction(
    beds.map(b => prisma.bed.upsert({
      where: { roomId_bedNumber: { roomId, bedNumber: b.bedNumber } },
      create: { roomId, bedNumber: b.bedNumber, status: b.status || 'available' },
      update: { status: b.status || 'available' },
    }))
  );
  return ok(res, created, 'Beds saved', 201);
};

exports.update = async (req, res) => {
  const bed = await prisma.bed.findUnique({ where: { id: req.params.id }, include: { room: true } });
  if (!bed) return fail(res, 'Bed not found', 404);
  if (req.user.hostelId && bed.room.hostelId !== req.user.hostelId) {
    return fail(res, 'Forbidden', 403);
  }

  const { status, studentId } = req.body;
  const data = {};
  if (status    !== undefined) data.status    = status;
  if (studentId !== undefined) data.studentId = studentId || null;

  const updated = await prisma.bed.update({ where: { id: req.params.id }, data });
  return ok(res, updated, 'Bed updated');
};

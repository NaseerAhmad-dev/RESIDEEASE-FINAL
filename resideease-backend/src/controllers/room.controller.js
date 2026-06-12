const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  const { type, status, floor } = req.query;
  const where = {};
  if (req.user.hostelId) where.hostelId = req.user.hostelId;
  if (type)   where.type   = type;
  if (status) where.status = status;
  if (floor)  where.floor  = parseInt(floor, 10);
  const rooms = await prisma.room.findMany({
    where,
    include: { beds: true },
    orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
  });
  return ok(res, rooms);
};

exports.getById = async (req, res) => {
  const where = { id: req.params.id };
  if (req.user.hostelId) where.hostelId = req.user.hostelId;
  const room = await prisma.room.findFirst({ where, include: { beds: true } });
  if (!room) return fail(res, 'Room not found', 404);
  return ok(res, room);
};

exports.create = async (req, res) => {
  const { roomNumber, floor, type, capacity, price, amenities } = req.body;
  if (!roomNumber || floor == null || !type || !capacity || !price) {
    return fail(res, 'Missing required fields: roomNumber, floor, type, capacity, price');
  }
  const hostelId = req.user.hostelId;
  if (!hostelId) return fail(res, 'No hostel associated with your account', 400);

  const existing = await prisma.room.findFirst({ where: { hostelId, roomNumber } });
  if (existing) return fail(res, 'Room number already exists in this hostel');

  const room = await prisma.room.create({
    data: {
      roomNumber,
      floor: parseInt(floor, 10),
      type,
      capacity: parseInt(capacity, 10),
      price: parseFloat(price),
      amenities: amenities ?? [],
      status: req.body.status || 'active',
      hostelId,
    },
    include: { beds: true },
  });
  return ok(res, room, 'Room created', 201);
};

exports.update = async (req, res) => {
  const where = { id: req.params.id };
  if (req.user.hostelId) where.hostelId = req.user.hostelId;
  const existing = await prisma.room.findFirst({ where });
  if (!existing) return fail(res, 'Room not found', 404);
  const data = { ...req.body };
  delete data.hostelId;
  if (data.floor)    data.floor    = parseInt(data.floor, 10);
  if (data.capacity) data.capacity = parseInt(data.capacity, 10);
  if (data.price)    data.price    = parseFloat(data.price);
  const room = await prisma.room.update({ where: { id: req.params.id }, data, include: { beds: true } });
  return ok(res, room, 'Room updated');
};

exports.bulkCreate = async (req, res) => {
  const { rooms } = req.body;
  if (!Array.isArray(rooms) || rooms.length === 0) {
    return fail(res, 'rooms array is required');
  }
  const hostelId = req.user.hostelId;
  if (!hostelId) return fail(res, 'No hostel associated with your account', 400);

  const created = [], skipped = [], errors = [];
  const letters = 'ABCDEFGHIJ';

  for (const r of rooms) {
    try {
      const existing = await prisma.room.findFirst({ where: { hostelId, roomNumber: String(r.roomNumber) } });
      if (existing) { skipped.push(r.roomNumber); continue; }

      const room = await prisma.room.create({
        data: {
          roomNumber: String(r.roomNumber),
          floor:      parseInt(r.floor, 10) || 0,
          type:       r.type || 'single',
          capacity:   parseInt(r.capacity, 10) || 1,
          price:      parseFloat(r.price) || 0,
          amenities:  Array.isArray(r.amenities) ? r.amenities : [],
          status:     r.status || 'active',
          hostelId,
        },
      });

      const cap = parseInt(r.capacity, 10) || 1;
      await prisma.bed.createMany({
        data: Array.from({ length: cap }, (_, i) => ({
          roomId: room.id, bedNumber: letters[i] ?? String(i + 1), status: 'available',
        })),
      });

      created.push(room);
    } catch (e) {
      errors.push({ roomNumber: r.roomNumber, error: e.message });
    }
  }

  return ok(res, { created, skipped, errors }, `Imported ${created.length} room(s)`);
};

exports.remove = async (req, res) => {
  const where = { id: req.params.id };
  if (req.user.hostelId) where.hostelId = req.user.hostelId;
  const existing = await prisma.room.findFirst({ where });
  if (!existing) return fail(res, 'Room not found', 404);
  await prisma.room.delete({ where: { id: req.params.id } });
  return ok(res, null, 'Room deleted');
};

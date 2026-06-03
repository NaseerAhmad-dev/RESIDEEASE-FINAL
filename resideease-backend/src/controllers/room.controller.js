const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  const { type, status, floor } = req.query;
  const where = {};
  if (type)   where.type   = type;
  if (status) where.status = status;
  if (floor)  where.floor  = parseInt(floor, 10);
  const rooms = await prisma.room.findMany({ where, orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }] });
  return ok(res, rooms);
};

exports.getById = async (req, res) => {
  const room = await prisma.room.findUnique({ where: { id: req.params.id } });
  if (!room) return fail(res, 'Room not found', 404);
  return ok(res, room);
};

exports.create = async (req, res) => {
  const { roomNumber, floor, type, capacity, price, amenities } = req.body;
  if (!roomNumber || floor == null || !type || !capacity || !price) {
    return fail(res, 'Missing required fields: roomNumber, floor, type, capacity, price');
  }
  const existing = await prisma.room.findUnique({ where: { roomNumber } });
  if (existing) return fail(res, 'Room number already exists');
  const room = await prisma.room.create({
    data: { roomNumber, floor: parseInt(floor, 10), type, capacity: parseInt(capacity, 10), price: parseFloat(price), amenities: amenities ?? [], status: req.body.status || 'active' },
  });
  return ok(res, room, 'Room created', 201);
};

exports.update = async (req, res) => {
  const existing = await prisma.room.findUnique({ where: { id: req.params.id } });
  if (!existing) return fail(res, 'Room not found', 404);
  const data = { ...req.body };
  if (data.floor)    data.floor    = parseInt(data.floor, 10);
  if (data.capacity) data.capacity = parseInt(data.capacity, 10);
  if (data.price)    data.price    = parseFloat(data.price);
  const room = await prisma.room.update({ where: { id: req.params.id }, data });
  return ok(res, room, 'Room updated');
};

exports.remove = async (req, res) => {
  const existing = await prisma.room.findUnique({ where: { id: req.params.id } });
  if (!existing) return fail(res, 'Room not found', 404);
  await prisma.room.delete({ where: { id: req.params.id } });
  return ok(res, null, 'Room deleted');
};

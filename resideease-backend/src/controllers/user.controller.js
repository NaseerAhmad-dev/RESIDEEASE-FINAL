const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

const STAFF_ROLES = ['admin', 'manager', 'office'];

exports.listUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: { name: { in: STAFF_ROLES } } },
    include: { role: { select: { name: true, description: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const safe = users.map(({ password, roleId, role, ...rest }) => ({
    ...rest,
    role: role.name,
    roleDescription: role.description,
  }));

  return ok(res, safe);
};

exports.createUser = async (req, res) => {
  const { username, email, password, role: roleName, name } = req.body;

  if (!username || !password || !roleName) {
    return fail(res, 'username, password, and role are required');
  }
  if (!STAFF_ROLES.includes(roleName)) {
    return fail(res, `role must be one of: ${STAFF_ROLES.join(', ')}`);
  }

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) return fail(res, 'Role not found', 404);

  const existing = await prisma.user.findFirst({ where: { OR: [{ username }, ...(email ? [{ email }] : [])] } });
  if (existing) return fail(res, 'Username or email already in use', 409);

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email: email || null, password: hashed, roleId: role.id, name: name || null },
    include: { role: { select: { name: true } } },
  });

  const { password: _, roleId, role: roleObj, ...rest } = user;
  return ok(res, { ...rest, role: roleObj.name }, 'User created', 201);
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, role: roleName, name } = req.body;

  const existing = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!existing) return fail(res, 'User not found', 404);
  if (existing.role.name === 'super_admin') return fail(res, 'Cannot modify the super admin account', 403);

  const data = {};
  if (name !== undefined)  data.name  = name;
  if (email !== undefined) data.email = email || null;

  if (username && username !== existing.username) {
    const clash = await prisma.user.findUnique({ where: { username } });
    if (clash) return fail(res, 'Username already in use', 409);
    data.username = username;
  }

  if (roleName) {
    if (!STAFF_ROLES.includes(roleName)) return fail(res, `role must be one of: ${STAFF_ROLES.join(', ')}`);
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) return fail(res, 'Role not found', 404);
    data.roleId = role.id;
  }

  if (password) data.password = await bcrypt.hash(password, 10);

  const updated = await prisma.user.update({
    where: { id },
    data,
    include: { role: { select: { name: true } } },
  });

  const { password: _, roleId, role: roleObj, ...rest } = updated;
  return ok(res, { ...rest, role: roleObj.name });
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!user) return fail(res, 'User not found', 404);
  if (user.role.name === 'super_admin') return fail(res, 'Cannot delete the super admin account', 403);
  if (req.user.id === id) return fail(res, 'Cannot delete your own account', 403);

  await prisma.user.delete({ where: { id } });
  return ok(res, null, 'User deleted');
};

exports.listRoles = async (req, res) => {
  const roles = await prisma.role.findMany({
    where: { name: { in: STAFF_ROLES } },
    select: { id: true, name: true, description: true },
    orderBy: { name: 'asc' },
  });
  return ok(res, roles);
};

const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

function toSlug(str) {
  return str.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function toCode(str) {
  return str.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'HST';
}

// Included in list responses — primary owner only
const LIST_INCLUDE = {
  location: true,
  settings: true,
  owners:   { where: { isPrimary: true }, take: 1 },
};

// Full detail — all owners + current subscription
const DETAIL_INCLUDE = {
  location:      true,
  settings:      true,
  owners:        true,
  subscriptions: { where: { isCurrent: true }, take: 1 },
};

// ── List ───────────────────────────────────────────────────────────────────────
exports.listHostels = async (req, res) => {
  const hostels = await prisma.hostel.findMany({
    where:   { deletedAt: null },
    include: LIST_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, hostels);
};

// ── Get one ────────────────────────────────────────────────────────────────────
exports.getHostel = async (req, res) => {
  const hostel = await prisma.hostel.findFirst({
    where:   { id: req.params.id, deletedAt: null },
    include: DETAIL_INCLUDE,
  });
  if (!hostel) return fail(res, 'Hostel not found', 404);
  return ok(res, hostel);
};

// ── Create + onboard admin ─────────────────────────────────────────────────────
exports.createHostel = async (req, res) => {
  const {
    name,
    hostelType    = 'mixed',
    location      = {},
    owner         = {},
    settings      = {},
    adminEmail,
    adminPassword,
    adminName,
  } = req.body;

  if (!name)          return fail(res, 'Hostel name is required');
  if (!adminEmail)    return fail(res, 'Admin email is required');
  if (!adminPassword) return fail(res, 'Admin password is required');

  const [existingUser, adminRole] = await Promise.all([
    prisma.user.findFirst({ where: { email: adminEmail } }),
    prisma.role.findUnique({ where: { name: 'admin' } }),
  ]);
  if (existingUser) return fail(res, 'A user with this admin email already exists', 409);
  if (!adminRole)   return fail(res, 'Admin role not found — run the seed first', 500);

  // Build unique slug and code
  let slug = toSlug(name);
  let code = toCode(name);
  const [slugTaken, codeTaken] = await Promise.all([
    prisma.hostel.findUnique({ where: { slug } }),
    prisma.hostel.findUnique({ where: { code } }),
  ]);
  if (slugTaken) slug = `${slug}-${Date.now().toString(36)}`;
  if (codeTaken) code = `${code}${Date.now().toString(36).slice(-2).toUpperCase()}`;

  const hostel = await prisma.hostel.create({
    data: {
      name,
      slug,
      code,
      hostelType,
      location: {
        create: { country: 'India', ...location },
      },
      owners: {
        create: {
          name:      owner.name     || adminName || `${name} Owner`,
          email:     owner.email    || adminEmail,
          phone:     owner.phone    ?? null,
          altPhone:  owner.altPhone ?? null,
          isPrimary: true,
        },
      },
      settings: {
        create: { ...settings },
      },
    },
    include: DETAIL_INCLUDE,
  });

  const hashed = await bcrypt.hash(adminPassword, 10);
  await prisma.user.create({
    data: {
      email:    adminEmail,
      username: adminEmail,
      password: hashed,
      name:     adminName || `${name} Admin`,
      roleId:   adminRole.id,
      hostelId: hostel.id,
    },
  });

  return ok(res, hostel, 'Hostel onboarded successfully', 201);
};

// ── Update ─────────────────────────────────────────────────────────────────────
exports.updateHostel = async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.hostel.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return fail(res, 'Hostel not found', 404);

  const { name, hostelType, isActive, isReadOnly, location, settings } = req.body;

  const updated = await prisma.hostel.update({
    where: { id },
    data: {
      ...(name        !== undefined && { name }),
      ...(hostelType  !== undefined && { hostelType }),
      ...(isActive    !== undefined && { isActive }),
      ...(isReadOnly  !== undefined && { isReadOnly }),
      ...(location && {
        location: {
          upsert: {
            create: { country: 'India', ...location },
            update: { ...location },
          },
        },
      }),
      ...(settings && {
        settings: {
          upsert: {
            create: { ...settings },
            update: { ...settings },
          },
        },
      }),
    },
    include: LIST_INCLUDE,
  });
  return ok(res, updated);
};

// ── Delete (soft if billing exists, hard otherwise) ────────────────────────────
exports.deleteHostel = async (req, res) => {
  const { id } = req.params;
  const hostel = await prisma.hostel.findFirst({ where: { id, deletedAt: null } });
  if (!hostel) return fail(res, 'Hostel not found', 404);

  const billingCount = await prisma.hostelSubscription.count({ where: { hostelId: id } });

  if (billingCount > 0) {
    await prisma.hostel.update({
      where: { id },
      data:  { deletedAt: new Date(), isActive: false },
    });
    return ok(res, null, 'Hostel deactivated — billing records retained');
  }

  // No billing records: hard delete (cascades to location, owners, settings, audit logs)
  await prisma.user.deleteMany({ where: { hostelId: id } });
  await prisma.hostel.delete({ where: { id } });
  return ok(res, null, 'Hostel deleted');
};

// ── Owners sub-resource ────────────────────────────────────────────────────────
exports.addOwner = async (req, res) => {
  const { id } = req.params;
  const hostel = await prisma.hostel.findFirst({ where: { id, deletedAt: null } });
  if (!hostel) return fail(res, 'Hostel not found', 404);

  const { name, email, phone, altPhone, isPrimary = false } = req.body;
  if (!name) return fail(res, 'Owner name is required');

  if (isPrimary) {
    await prisma.hostelOwner.updateMany({ where: { hostelId: id }, data: { isPrimary: false } });
  }

  const owner = await prisma.hostelOwner.create({
    data: { hostelId: id, name, email, phone, altPhone, isPrimary },
  });
  return ok(res, owner, 'Owner added', 201);
};

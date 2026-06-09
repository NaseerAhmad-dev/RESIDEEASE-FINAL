const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

async function getHostelForUser(userId) {
  // Check User table first, then fall back to Employee table
  let hostelId = null;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { hostelId: true } });
  if (user?.hostelId) {
    hostelId = user.hostelId;
  } else {
    const employee = await prisma.employee.findUnique({ where: { id: userId }, select: { hostelId: true } });
    if (employee?.hostelId) hostelId = employee.hostelId;
  }

  if (!hostelId) return null;
  return prisma.hostel.findUnique({
    where: { id: hostelId },
    include: {
      location: true,
      settings: true,
      owners: { where: { isPrimary: true }, take: 1 },
    },
  });
}

function mergeHostelData(settingsHostel, hostel) {
  if (!hostel) return settingsHostel;
  const owner = hostel.owners?.[0];
  const loc   = hostel.location;
  const hs    = hostel.settings;
  const addressParts = [loc?.addressLine1, loc?.addressLine2, loc?.city, loc?.state, loc?.pincode]
    .filter(Boolean);
  return {
    ...settingsHostel,
    name:        hostel.name                || settingsHostel.name,
    address:     addressParts.join(', ')    || settingsHostel.address,
    phone:       owner?.phone               || settingsHostel.phone,
    email:       owner?.email               || settingsHostel.email,
    website:     hs?.website                || settingsHostel.website,
    description: hs?.description            || settingsHostel.description,
  };
}

const DEFAULT_SETTINGS = {
  hostel: {
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: '',
  },
  rooms: [
    { id: 'single', label: 'Single Room',     price: 8500, enabled: true },
    { id: 'double', label: 'Double Sharing',   price: 5500, enabled: true },
    { id: 'triple', label: 'Triple Sharing',   price: 3800, enabled: true },
  ],
  meals: [
    { id: 'full-board',     label: 'Full Board',      price: 3200, enabled: true },
    { id: 'half-board',     label: 'Half Board',      price: 2100, enabled: true },
    { id: 'breakfast-only', label: 'Breakfast Only',  price: 900,  enabled: true },
    { id: 'no-mess',        label: 'No Mess Plan',    price: 0,    enabled: true },
  ],
  dietaryOptions: ['Vegetarian', 'Vegan', 'Jain', 'Halal', 'Kosher', 'Gluten-Free', 'Dairy-Free', 'High Protein', 'Low Carb', 'No Nuts'],
  system: {
    allowOnlineBooking:   true,
    requireApproval:      false,
    maintenanceMode:      false,
    notificationsEnabled: true,
  },
  guestFee: 200,
};

async function getOrCreate() {
  return (await prisma.settings.findFirst()) ?? (await prisma.settings.create({ data: DEFAULT_SETTINGS }));
}

exports.getSettings = async (req, res) => {
  const [settings, hostel] = await Promise.all([
    getOrCreate(),
    getHostelForUser(req.user.id),
  ]);
  const result = { ...settings, hostel: mergeHostelData(settings.hostel, hostel) };
  return ok(res, result);
};

exports.updateSettings = async (req, res) => {
  const settings = await getOrCreate();
  const updated = await prisma.settings.update({
    where: { id: settings.id },
    data: req.body,
  });
  return ok(res, updated, 'Settings updated');
};

exports.updateHostelSettings = async (req, res) => {
  const { name, address, phone, email, website, description } = req.body;
  const [settings, hostel] = await Promise.all([
    getOrCreate(),
    getHostelForUser(req.user.id),
  ]);

  const updatedSettings = await prisma.settings.update({
    where: { id: settings.id },
    data: { hostel: { ...settings.hostel, ...req.body } },
  });

  if (hostel) {
    const writes = [];

    if (name !== undefined) {
      writes.push(prisma.hostel.update({ where: { id: hostel.id }, data: { name } }));
    }

    if (website !== undefined || description !== undefined) {
      const hsData = {};
      if (website     !== undefined) hsData.website     = website;
      if (description !== undefined) hsData.description = description;
      writes.push(
        hostel.settings
          ? prisma.hostelSettings.update({ where: { hostelId: hostel.id }, data: hsData })
          : prisma.hostelSettings.create({ data: { hostelId: hostel.id, ...hsData } })
      );
    }

    if (phone !== undefined || email !== undefined) {
      const primaryOwner = hostel.owners?.[0];
      const ownerData = {};
      if (phone !== undefined) ownerData.phone = phone;
      if (email !== undefined) ownerData.email = email;
      if (primaryOwner) {
        writes.push(prisma.hostelOwner.update({ where: { id: primaryOwner.id }, data: ownerData }));
      }
    }

    if (address !== undefined && hostel.location) {
      writes.push(prisma.hostelLocation.update({
        where: { hostelId: hostel.id },
        data: { addressLine1: address },
      }));
    }

    if (writes.length) await Promise.all(writes);
  }

  return ok(res, { ...updatedSettings.hostel, ...req.body }, 'Hostel settings updated');
};

exports.updateRoomSettings = async (req, res) => {
  const settings = await getOrCreate();
  const rooms = settings.rooms;
  const idx = rooms.findIndex(r => r.id === req.params.roomId);
  if (idx === -1) return fail(res, 'Room type not found', 404);
  rooms[idx] = { ...rooms[idx], ...req.body };
  const updated = await prisma.settings.update({
    where: { id: settings.id },
    data: { rooms },
  });
  return ok(res, updated.rooms[idx], 'Room settings updated');
};

exports.updateMealSettings = async (req, res) => {
  const settings = await getOrCreate();
  const meals = settings.meals;
  const idx = meals.findIndex(m => m.id === req.params.mealId);
  if (idx === -1) return fail(res, 'Meal plan not found', 404);
  meals[idx] = { ...meals[idx], ...req.body };
  const updated = await prisma.settings.update({
    where: { id: settings.id },
    data: { meals },
  });
  return ok(res, updated.meals[idx], 'Meal settings updated');
};

exports.updateSystemSettings = async (req, res) => {
  const settings = await getOrCreate();
  const updated = await prisma.settings.update({
    where: { id: settings.id },
    data: { system: { ...settings.system, ...req.body } },
  });
  return ok(res, updated.system, 'System settings updated');
};

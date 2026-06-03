const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

const DEFAULT_SETTINGS = {
  hostel: {
    name: 'ResideEase Hostel',
    address: '123 College Road, University District',
    phone: '+91-9876543210',
    email: 'admin@resideease.com',
    website: 'www.resideease.com',
    description: 'A premium student hostel facility',
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
  return ok(res, await getOrCreate());
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
  const settings = await getOrCreate();
  const updated = await prisma.settings.update({
    where: { id: settings.id },
    data: { hostel: { ...settings.hostel, ...req.body } },
  });
  return ok(res, updated.hostel, 'Hostel settings updated');
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

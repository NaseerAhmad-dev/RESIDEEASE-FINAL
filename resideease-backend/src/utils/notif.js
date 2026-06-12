const { prisma } = require('../config/db');

/**
 * Create an admin notification scoped to a hostel.
 * No-op when hostelId is missing (super-admin actions, tests, etc.).
 */
async function createAdminNotif(hostelId, { type = 'info', title, message }) {
  if (!hostelId) return;
  try {
    await prisma.adminNotification.create({
      data: { hostelId, type, title, message },
    });
  } catch (_) {
    // non-critical — never let a failed notification break the main flow
  }
}

module.exports = { createAdminNotif };

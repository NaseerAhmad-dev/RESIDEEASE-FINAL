const { prisma } = require('../config/db');
const { ok, fail } = require('../utils/helpers');

exports.getStatus = async (req, res) => {
  const hostelId = req.user.hostelId;
  if (!hostelId) return fail(res, 'No hostel associated with your account', 400);

  const [roomCount, bedCount, studentCount] = await Promise.all([
    prisma.room.count({ where: { hostelId } }),
    prisma.bed.count({ where: { room: { hostelId } } }),
    prisma.student.count({ where: { hostelId } }),
  ]);

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { onboardingCompleted: true },
  });

  const hasRoom    = roomCount > 0;
  const hasBeds    = bedCount  > 0;
  const hasStudent = studentCount > 0;
  const complete   = user?.onboardingCompleted ?? false;

  return ok(res, { hasRoom, hasBeds, hasStudent, complete, roomCount, bedCount, studentCount });
};

exports.complete = async (req, res) => {
  const hostelId = req.user.hostelId;
  if (!hostelId) return fail(res, 'No hostel associated with your account', 400);

  const [roomCount, bedCount, studentCount] = await Promise.all([
    prisma.room.count({ where: { hostelId } }),
    prisma.bed.count({ where: { room: { hostelId } } }),
    prisma.student.count({ where: { hostelId } }),
  ]);

  if (!roomCount || !bedCount || !studentCount) {
    return fail(res, 'Complete all setup steps before finishing onboarding', 400);
  }

  await prisma.user.update({
    where: { id: req.user.id },
    data:  { onboardingCompleted: true },
  });

  return ok(res, { onboardingCompleted: true }, 'Onboarding complete');
};

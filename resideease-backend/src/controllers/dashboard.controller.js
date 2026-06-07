const { prisma } = require('../config/db');
const { ok, todayString } = require('../utils/helpers');

exports.getCounts = async (req, res) => {
  const [pendingStudents, overduePayments] = await Promise.all([
    prisma.student.count({ where: { status: 'pending' } }),
    prisma.student.count({ where: { paymentStatus: { not: 'paid' }, status: 'active' } }),
  ]);
  return ok(res, { pendingStudents, overduePayments });
};

exports.getStats = async (req, res) => {
  const today = todayString();
  const now   = new Date();

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const [
    bedsAgg,
    activeCount,
    thisMonthCount,
    overdueCount,
    overdueAgg,
    totalPaidAgg,
    todayCheckOuts,
    todayCheckIns,
    upcomingCount,
    recentStudents,
    allRooms,
    openCount,
    urgentCount,
    todayEnrollments,
  ] = await Promise.all([

    prisma.room.aggregate({ _sum: { capacity: true } }),

    prisma.student.count({ where: { status: 'active' } }),

    prisma.student.count({ where: { createdAt: { gte: monthStart } } }),

    prisma.student.count({ where: { paymentStatus: { not: 'paid' } } }),

    prisma.student.aggregate({
      _sum: { totalPayment: true, paidAmount: true },
      where: { paymentStatus: { not: 'paid' } },
    }),

    prisma.student.aggregate({ _sum: { paidAmount: true } }),

    prisma.student.findMany({
      where: { residenceExpiry: today },
      select: { id: true, firstName: true, lastName: true, roomNumber: true },
      take: 5,
    }),

    prisma.student.findMany({
      where: { checkInDate: today },
      select: { id: true, firstName: true, lastName: true, roomNumber: true },
      take: 5,
    }),

    prisma.student.count({
      where: { checkInDate: { gt: today, lte: weekEndStr } },
    }),

    prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        selectedRoom: true,
        roomNumber: true,
        paymentStatus: true,
        status: true,
        createdAt: true,
        messEnrollments: {
          select: { mealType: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),

    prisma.room.findMany({
      select: { type: true, capacity: true, status: true },
    }),

    prisma.maintenanceRequest.count({ where: { status: 'open' } }),

    prisma.maintenanceRequest.count({ where: { status: 'open', priority: 'high' } }),

    prisma.messEnrollment.findMany({
      where: { enrollmentDate: today, status: { not: 'cancelled' } },
      select: { mealType: true, studentId: true },
    }),

  ]);

  /* ─── KPIs ─────────────────────────────────── */
  const totalBeds    = bedsAgg._sum.capacity || 0;
  const occupied     = activeCount;
  const vacant       = Math.max(0, totalBeds - occupied);
  const pendingAmount = Math.max(
    0,
    (overdueAgg._sum.totalPayment || 0) - (overdueAgg._sum.paidAmount || 0),
  );

  /* ─── Room occupancy by type ────────────────── */
  const typeMap = {};
  for (const room of allRooms) {
    const t = room.type;
    if (!typeMap[t]) typeMap[t] = { type: t, total: 0, totalCapacity: 0, occupied: 0 };
    typeMap[t].total++;
    typeMap[t].totalCapacity += room.capacity;
    if (room.status === 'occupied') typeMap[t].occupied += room.capacity;
  }
  const roomOccupancy = Object.values(typeMap).map(r => ({
    ...r,
    pct: r.totalCapacity > 0 ? Math.round((r.occupied / r.totalCapacity) * 100) : 0,
  }));

  const totalCapacity  = allRooms.reduce((s, r) => s + r.capacity, 0);
  const totalOccupied  = Object.values(typeMap).reduce((s, r) => s + r.occupied, 0);
  const overallOccupancyPct = totalCapacity > 0
    ? Math.round((totalOccupied / totalCapacity) * 100)
    : 0;

  /* ─── Mess today ────────────────────────────── */
  let lunchCount = 0, dinnerCount = 0;
  const uniqueEnrolled = new Set();
  for (const e of todayEnrollments) {
    uniqueEnrolled.add(e.studentId);
    if (e.mealType === 'lunch' || e.mealType === 'both') lunchCount++;
    if (e.mealType === 'dinner' || e.mealType === 'both') dinnerCount++;
  }
  const messAttendancePct = activeCount > 0
    ? Math.round((uniqueEnrolled.size / activeCount) * 100)
    : 0;

  return ok(res, {
    kpis: {
      totalBeds,
      occupied,
      vacant,
      pendingDuesCount:  overdueCount,
      pendingDuesAmount: Math.round(pendingAmount),
    },
    quickStats: {
      totalResidents:    activeCount,
      newThisMonth:      thisMonthCount,
      totalRevenue:      Math.round(totalPaidAgg._sum.paidAmount || 0),
      messAttendancePct,
      openMaintenance:   openCount,
      urgentMaintenance: urgentCount,
    },
    todayCheckOuts: todayCheckOuts.map(s => ({
      id:     s.id,
      name:   `${s.firstName} ${s.lastName}`,
      room:   s.roomNumber || '—',
      avatar: `${s.firstName[0]}${s.lastName[0]}`.toUpperCase(),
    })),
    todayCheckIns: todayCheckIns.map(s => ({
      id:     s.id,
      name:   `${s.firstName} ${s.lastName}`,
      room:   s.roomNumber || '—',
      avatar: `${s.firstName[0]}${s.lastName[0]}`.toUpperCase(),
    })),
    upcomingThisWeek: upcomingCount,
    recentStudents: recentStudents.map(s => ({
      id:            s.id,
      name:          `${s.firstName} ${s.lastName}`,
      room:          s.roomNumber || s.selectedRoom || '—',
      plan:          s.messEnrollments[0]?.mealType || 'no-mess',
      status:        s.status,
      paymentStatus: s.paymentStatus,
      avatar:        `${s.firstName[0]}${s.lastName[0]}`.toUpperCase(),
    })),
    roomOccupancy,
    overallOccupancyPct,
    messToday: {
      totalStudents: activeCount,
      lunch:         lunchCount,
      dinner:        dinnerCount,
    },
  });
};

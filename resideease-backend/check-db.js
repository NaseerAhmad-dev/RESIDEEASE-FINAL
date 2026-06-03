require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const [users, students, rooms, notices, maintenance, bills, audits, studentNotifs] = await Promise.all([
    prisma.user.count(),
    prisma.student.count(),
    prisma.room.count(),
    prisma.notice.count(),
    prisma.maintenanceRequest.count(),
    prisma.supplierBill.count(),
    prisma.auditRecord.count(),
    prisma.studentNotification.count(),
  ]);
  console.log('DB connection: OK');
  console.log('users:', users, '| students:', students, '| rooms:', rooms);
  console.log('notices:', notices, '| maintenance:', maintenance, '| supplier bills:', bills);
  console.log('audit records:', audits, '| student notifications:', studentNotifs);
  await prisma.$disconnect();
}
check().catch(e => { console.error('DB ERROR:', e.message); prisma.$disconnect(); });

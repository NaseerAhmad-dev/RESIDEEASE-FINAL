const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const firstHostel = await prisma.hostel.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!firstHostel) { console.log('No hostels found — skipping backfill'); return; }

  const roomsUpdated = await prisma.room.updateMany({
    where: { hostelId: null },
    data:  { hostelId: firstHostel.id },
  });
  console.log(`Backfilled ${roomsUpdated.count} rooms → hostel "${firstHostel.name}" (${firstHostel.id})`);

  const studentsUpdated = await prisma.student.updateMany({
    where: { hostelId: null },
    data:  { hostelId: firstHostel.id },
  });
  console.log(`Backfilled ${studentsUpdated.count} students → hostel "${firstHostel.name}"`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const s = await p.student.findFirst({ where: { rollNumber: 'EC2021045', phone: '9419005678' } });
  console.log(s ? `FOUND: ${s.firstName} ${s.lastName} | roll: ${s.rollNumber} | phone: ${s.phone}` : 'NOT FOUND');
  // also list all students briefly
  const all = await p.student.findMany({ select: { rollNumber: true, phone: true, firstName: true } });
  console.log('\nAll students:');
  all.forEach(x => console.log(`  ${x.rollNumber} | ${x.phone} | ${x.firstName}`));
  await p.$disconnect();
}
run().catch(e => { console.log('ERROR:', e.message); p.$disconnect(); });

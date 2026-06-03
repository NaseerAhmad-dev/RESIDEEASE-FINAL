const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function connectDB() {
  await prisma.$connect();
  console.log('PostgreSQL connected via Prisma');
}

module.exports = { connectDB, prisma };

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRaw`
    UPDATE "User" SET "isAdmin" = true WHERE email = 'admin.test.final@example.com'
  `;
  console.log(`✓ Updated ${result} user(s) to admin`);
  await prisma.$disconnect();
}

main().catch(console.error);

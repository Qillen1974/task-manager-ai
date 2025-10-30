const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Update the user with the specific email to be admin using raw SQL
    const result = await prisma.$executeRaw`
      UPDATE "User" SET "isAdmin" = true WHERE email = 'charles.wee74@icloud.com'
    `;

    console.log(`✓ Updated ${result} user(s) to admin`);

    // Verify the update
    const user = await prisma.$queryRaw`
      SELECT id, email, "isAdmin" FROM "User" WHERE email = 'charles.wee74@icloud.com'
    `;

    if (user.length > 0) {
      console.log(`\n✓ User confirmed as admin:`);
      console.log(`  Email: ${user[0].email}`);
      console.log(`  ID: ${user[0].id}`);
      console.log(`  isAdmin: ${user[0].isAdmin}`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

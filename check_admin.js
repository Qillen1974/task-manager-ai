const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Find the admin@taskmaster.com user
    const user = await prisma.$queryRaw`
      SELECT id, email, name, "isAdmin" FROM "User" WHERE email = 'admin@taskmaster.com'
    `;

    if (user.length === 0) {
      console.log('User admin@taskmaster.com not found');
    } else {
      console.log('Found user:');
      console.log(user[0]);
    }

    // List all users to see who is admin
    const allUsers = await prisma.$queryRaw`
      SELECT id, email, name, "isAdmin" FROM "User" ORDER BY "createdAt" DESC LIMIT 5
    `;

    console.log('\nLatest 5 users:');
    allUsers.forEach(u => {
      console.log(`  ${u.email} - isAdmin: ${u.isAdmin}`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

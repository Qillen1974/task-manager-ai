const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./lib/authUtils');

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if the user exists
    const existing = await prisma.user.findUnique({
      where: { email: 'charles.wee74@icloud.com' }
    });

    if (!existing) {
      console.error('User not found');
      process.exit(1);
    }

    console.log('Found user:');
    console.log(`  Email: ${existing.email}`);
    console.log(`  Name: ${existing.name}`);
    console.log(`  isAdmin: ${existing.isAdmin}`);
    console.log('\nTo login, use the password you set during registration.');
    console.log('If you forgot the password, we can create a new test admin account.');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

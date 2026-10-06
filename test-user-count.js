const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  // Run multiple queries
  for (let i = 0; i < 3; i++) {
    const count = await prisma.user.count();
    console.log('User count:', count);
  }
  await prisma.$disconnect();
}
test();
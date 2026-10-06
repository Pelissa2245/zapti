const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const userCount = await prisma.user.count();
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
  console.log('Local DB User count:', userCount);
  console.log('Local DB Users:', JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}
test();
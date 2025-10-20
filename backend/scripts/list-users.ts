import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (users.length === 0) {
      console.log('\n❌ No users found in the database.');
      console.log('💡 Sign up in the app first, then run this script again.\n');
      return;
    }

    console.log('\n📋 Registered Users:\n');
    console.log('='.repeat(80));
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.name || 'Not set'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Joined: ${user.createdAt.toLocaleDateString()}`);
      console.log('-'.repeat(80));
    });
    console.log(`\nTotal: ${users.length} user(s)\n`);
    console.log('💡 To make a user admin, run:');
    console.log('   npx tsx scripts/make-admin.ts <email>\n');
  } catch (error) {
    console.error('❌ Error listing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();

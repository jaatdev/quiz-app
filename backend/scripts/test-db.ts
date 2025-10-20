import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...\n');

    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully!\n');

    // Count users
    const userCount = await prisma.user.count();
    console.log(`📊 Current users in database: ${userCount}\n`);

    // List all users
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          clerkId: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      console.log('👥 Users found:');
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.email}`);
        console.log(`   Clerk ID: ${user.clerkId}`);
        console.log(`   Name: ${user.name || 'Not set'}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
      });
    } else {
      console.log('ℹ️  No users found in database.');
      console.log('\n💡 To manually add your Clerk user to the database, run:');
      console.log('   npx tsx scripts/manual-sync.ts <your-clerk-id> <your-email> <your-name>');
    }

    console.log('\n✅ Test complete!');
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();

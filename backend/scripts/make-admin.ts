import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'admin' },
    });
    
    console.log(`✅ User ${user.email} is now an admin!`);
    console.log(`   Name: ${user.name || 'Not set'}`);
    console.log(`   Role: ${user.role}`);
  } catch (error) {
    console.error('❌ Error making user admin:', error);
    console.log('\nMake sure:');
    console.log('1. The email address is correct');
    console.log('2. The user exists in the database');
    console.log('3. You have run the database migration (npx prisma db push)');
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: npx tsx scripts/make-admin.ts <email>');
  console.log('Example: npx tsx scripts/make-admin.ts john@example.com');
  process.exit(1);
}

makeAdmin(email)
  .catch(console.error)
  .finally(() => prisma.$disconnect());

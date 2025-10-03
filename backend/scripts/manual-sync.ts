import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function manualSyncUser() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('\n❌ Missing arguments!');
    console.log('\nUsage: npx tsx scripts/manual-sync.ts <clerk-id> <email> [name]');
    console.log('\nExample: npx tsx scripts/manual-sync.ts user_abc123 john@example.com "John Doe"\n');
    process.exit(1);
  }

  const [clerkId, email, name] = args;
  
  try {
    console.log('\n🔄 Syncing user to database...\n');
    console.log(`Clerk ID: ${clerkId}`);
    console.log(`Email: ${email}`);
    console.log(`Name: ${name || 'Anonymous'}\n`);
    
    const user = await prisma.user.upsert({
      where: { clerkId },
      update: {
        email,
        name: name || 'Anonymous',
      },
      create: {
        clerkId,
        email,
        name: name || 'Anonymous',
        role: 'user',
      },
    });
    
    console.log('✅ User synced successfully!');
    console.log('\n📋 User Details:');
    console.log(`   Database ID: ${user.id}`);
    console.log(`   Clerk ID: ${user.clerkId}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt}\n`);
    
    console.log('💡 You can now make this user an admin by running:');
    console.log(`   npx tsx scripts/make-admin.ts ${user.email}\n`);
    
  } catch (error) {
    console.error('❌ Error syncing user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

manualSyncUser();

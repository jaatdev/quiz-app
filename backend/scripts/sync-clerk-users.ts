import { createClerkClient } from '@clerk/clerk-sdk-node';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

/**
 * Sync all Clerk users to Neon database
 * This is a one-time bulk sync operation
 */
async function syncAllClerkUsers() {
  try {
    console.log('🔄 Starting bulk sync of Clerk users to Neon database...\n');

    if (!process.env.CLERK_SECRET_KEY) {
      console.error('❌ CLERK_SECRET_KEY not found in environment variables');
      console.log('\n💡 Add CLERK_SECRET_KEY to your .env file:');
      console.log('   CLERK_SECRET_KEY=sk_test_xxxxx\n');
      process.exit(1);
    }

    // Initialize Clerk client with API key
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    // Get all users from Clerk
    console.log('📥 Fetching users from Clerk...');
    const clerkUsers = await clerk.users.getUserList({
      limit: 500, // Adjust based on your needs
    });

    console.log(`✅ Found ${clerkUsers.length} users in Clerk\n`);

    if (clerkUsers.length === 0) {
      console.log('ℹ️  No users to sync. Sign up some users first!\n');
      return;
    }

    let syncedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // Sync each user
    for (const clerkUser of clerkUsers) {
      try {
        const primaryEmail = clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId
        );

        if (!primaryEmail) {
          console.log(`⚠️  Skipping user ${clerkUser.id} - no primary email`);
          errorCount++;
          continue;
        }

        const name =
          clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
            : clerkUser.firstName || clerkUser.username || 'Anonymous';

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { clerkId: clerkUser.id },
        });

        const user = await prisma.user.upsert({
          where: { clerkId: clerkUser.id },
          update: {
            email: primaryEmail.emailAddress,
            name: name,
            avatar: clerkUser.imageUrl,
          },
          create: {
            clerkId: clerkUser.id,
            email: primaryEmail.emailAddress,
            name: name,
            avatar: clerkUser.imageUrl,
            role: 'user',
          },
        });

        if (existingUser) {
          console.log(`✅ Updated: ${primaryEmail.emailAddress}`);
          updatedCount++;
        } else {
          console.log(`✅ Created: ${primaryEmail.emailAddress}`);
          syncedCount++;
        }
      } catch (error) {
        console.error(`❌ Error syncing user ${clerkUser.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Sync Summary:');
    console.log('='.repeat(60));
    console.log(`✅ New users created: ${syncedCount}`);
    console.log(`🔄 Existing users updated: ${updatedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📈 Total users in database: ${syncedCount + updatedCount}`);
    console.log('='.repeat(60));
    console.log('\n✨ Sync complete!\n');

    // Show all users
    const allUsers = await prisma.user.findMany({
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

    console.log('👥 All users in database:\n');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Joined: ${user.createdAt.toLocaleDateString()}`);
      console.log();
    });
  } catch (error) {
    console.error('❌ Sync failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncAllClerkUsers();

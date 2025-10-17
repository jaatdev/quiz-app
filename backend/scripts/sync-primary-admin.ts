/**
 * Sync or Create Primary Admin User
 * 
 * This script creates/syncs the primary admin user in the database.
 * It requires the user to exist in Clerk first.
 * 
 * Usage: npx tsx scripts/sync-primary-admin.ts <CLERK_ID>
 * 
 * Example: npx tsx scripts/sync-primary-admin.ts user_2abc123xyz
 */

/// <reference types="node" />

import { PrismaClient } from '@prisma/client';
import { PRIMARY_ADMIN_EMAIL } from '../src/config/admin.config';

const prisma = new PrismaClient();

async function syncPrimaryAdmin(clerkId: string) {
  try {
    console.log('🔐 Syncing primary admin user...');
    console.log(`   Email: ${PRIMARY_ADMIN_EMAIL}`);
    console.log(`   Clerk ID: ${clerkId}`);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: PRIMARY_ADMIN_EMAIL }
    });

    if (existingUser) {
      console.log(`\n⚠️  User already exists in database`);
      console.log(`   Name: ${existingUser.name || 'Not set'}`);
      console.log(`   Role: ${existingUser.role}`);
      
      if (existingUser.role !== 'admin') {
        console.log(`\n🔄 Updating role to admin...`);
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'admin' }
        });
        console.log(`✅ Role updated to admin`);
      } else {
        console.log(`✅ Already has admin role`);
      }
      return;
    }

    // Create new primary admin user
    console.log(`\n✍️  Creating primary admin user...`);
    const user = await prisma.user.create({
      data: {
        clerkId,
        email: PRIMARY_ADMIN_EMAIL,
        name: 'Primary Admin',
        role: 'admin'
      }
    });

    console.log(`\n✅ Primary admin user created successfully!`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Clerk ID: ${user.clerkId}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: 🔐 Protected (cannot be revoked)`);
  } catch (error) {
    console.error('❌ Error syncing primary admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get Clerk ID from command line argument
const clerkId = process.argv[2];

if (!clerkId) {
  console.log('❌ Clerk ID is required\n');
  console.log('Usage: npx tsx scripts/sync-primary-admin.ts <CLERK_ID>');
  console.log('\nExample: npx tsx scripts/sync-primary-admin.ts user_2abc123xyz\n');
  console.log('How to get your Clerk ID:');
  console.log('1. Go to https://dashboard.clerk.com');
  console.log('2. Click "Users"');
  console.log('3. Find your user and copy the ID (starts with "user_")');
  throw new Error('Clerk ID required');
}

syncPrimaryAdmin(clerkId)
  .catch(console.error);

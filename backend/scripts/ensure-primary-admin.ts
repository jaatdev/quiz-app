/**
 * Primary Admin Protection Script
 * 
 * This script ensures that the primary admin (kc90040@gmail.com) always has admin status.
 * Run this after any database operation or on server startup.
 * 
 * Usage: npx tsx scripts/ensure-primary-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import { PRIMARY_ADMIN_EMAIL } from '../src/config/admin.config';

const prisma = new PrismaClient();

async function ensurePrimaryAdmin() {
  try {
    console.log('🔐 Checking primary admin status...');

    const primaryAdmin = await prisma.user.findUnique({
      where: { email: PRIMARY_ADMIN_EMAIL }
    });

    if (!primaryAdmin) {
      console.log(`⚠️  Primary admin user not found in database`);
      console.log(`   Email: ${PRIMARY_ADMIN_EMAIL}`);
      console.log(`   Action: This user will be given admin status when they first login via Clerk`);
      return;
    }

    if (primaryAdmin.role !== 'admin') {
      console.warn(`⚠️  Primary admin status was revoked! Restoring...`);
      await prisma.user.update({
        where: { id: primaryAdmin.id },
        data: { role: 'admin' }
      });
      console.log(`✅ Primary admin status restored for ${PRIMARY_ADMIN_EMAIL}`);
    } else {
      console.log(`✅ Primary admin is properly configured`);
      console.log(`   Email: ${PRIMARY_ADMIN_EMAIL}`);
      console.log(`   Role: ${primaryAdmin.role}`);
      console.log(`   Status: Protected (cannot be revoked)`);
    }
  } catch (error) {
    console.error('❌ Error checking primary admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

ensurePrimaryAdmin();

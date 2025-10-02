import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('📝 DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('📝 DATABASE_URL value:', process.env.DATABASE_URL?.substring(0, 30) + '...');
    
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    const count = await prisma.subject.count();
    console.log(`📊 Found ${count} subjects`);
    
    await prisma.$disconnect();
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Connection failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

testConnection();

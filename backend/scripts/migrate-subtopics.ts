import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting SubTopic migration...');
  
  const topics = await prisma.topic.findMany({ 
    select: { id: true, name: true } 
  });
  
  console.log(`Found ${topics.length} topics`);
  
  for (const t of topics) {
    // Create default SubTopic if not exist
    const sub = await prisma.subTopic.upsert({
      where: { topicId_name: { topicId: t.id, name: 'General' } },
      update: {},
      create: { topicId: t.id, name: 'General' }
    });
    
    console.log(`Created/found SubTopic "General" for topic "${t.name}"`);

    // Assign existing Questions without subTopicId
    const updated = await prisma.question.updateMany({
      where: { topicId: t.id, subTopicId: null },
      data: { subTopicId: sub.id }
    });
    
    console.log(`  Assigned ${updated.count} questions to SubTopic "General"`);
  }
  
  console.log('Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

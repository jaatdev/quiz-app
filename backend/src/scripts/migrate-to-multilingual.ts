// backend/src/scripts/migrate-to-multilingual.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OldQuestion {
  id: string;
  text: string;
  options: any;
  explanation: string | null;
}

interface OldSubject {
  id: string;
  name: string;
  description: string | null;
}

interface OldTopic {
  id: string;
  name: string;
  description: string | null;
}

async function migrateQuestions() {
  console.log('📚 Migrating Questions to multilingual format...\n');

  // Fetch all questions using raw query to avoid Prisma type issues
  const questions: OldQuestion[] = await prisma.$queryRaw`
    SELECT id, text, options, explanation
    FROM "Question"
  `;

  console.log(`Found ${questions.length} questions to migrate`);

  let successCount = 0;
  let errorCount = 0;

  for (const question of questions) {
    try {
      // Parse options if they're stored as string
      let optionsArray = question.options;
      if (typeof optionsArray === 'string') {
        optionsArray = JSON.parse(optionsArray);
      }

      // Create multilingual structure
      const multilingualText = {
        en: question.text,
        hi: '' // Empty - to be filled by admin/translation later
      };

      const multilingualOptions = {
        en: optionsArray,
        hi: [] // Empty - to be filled by admin/translation later
      };

      const multilingualExplanation = question.explanation ? {
        en: question.explanation,
        hi: ''
      } : null;

      // Update using raw SQL to bypass Prisma type checking
      await prisma.$executeRaw`
        UPDATE "Question"
        SET
          text = ${JSON.stringify(multilingualText)}::jsonb,
          options = ${JSON.stringify(multilingualOptions)}::jsonb,
          explanation = ${JSON.stringify(multilingualExplanation)}::jsonb
        WHERE id = ${question.id}
      `;

      successCount++;
      console.log(`✓ Migrated question ${question.id}`);
    } catch (error) {
      errorCount++;
      console.error(`✗ Failed to migrate question ${question.id}:`, error);
    }
  }

  console.log(`\n✓ Questions migration complete: ${successCount} success, ${errorCount} errors\n`);
}

async function migrateSubjects() {
  console.log('📂 Migrating Subjects to multilingual format...\n');

  const subjects: OldSubject[] = await prisma.$queryRaw`
    SELECT id, name, description
    FROM "Subject"
  `;

  console.log(`Found ${subjects.length} subjects to migrate`);

  for (const subject of subjects) {
    try {
      const multilingualName = {
        en: subject.name,
        hi: ''
      };

      const multilingualDescription = subject.description ? {
        en: subject.description,
        hi: ''
      } : null;

      // Generate slug from English name
      const slug = subject.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      await prisma.$executeRaw`
        UPDATE "Subject"
        SET
          name = ${JSON.stringify(multilingualName)}::jsonb,
          description = ${JSON.stringify(multilingualDescription)}::jsonb,
          slug = ${slug}
        WHERE id = ${subject.id}
      `;

      console.log(`✓ Migrated subject: ${subject.name} -> slug: ${slug}`);
    } catch (error) {
      console.error(`✗ Failed to migrate subject ${subject.id}:`, error);
    }
  }

  console.log('\n✓ Subjects migration complete\n');
}

async function migrateTopics() {
  console.log('📋 Migrating Topics to multilingual format...\n');

  const topics: OldTopic[] = await prisma.$queryRaw`
    SELECT id, name, description
    FROM "Topic"
  `;

  console.log(`Found ${topics.length} topics to migrate`);

  for (const topic of topics) {
    try {
      const multilingualName = {
        en: topic.name,
        hi: ''
      };

      const multilingualDescription = topic.description ? {
        en: topic.description,
        hi: ''
      } : null;

      // Generate slug from English name
      const slug = topic.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      await prisma.$executeRaw`
        UPDATE "Topic"
        SET
          name = ${JSON.stringify(multilingualName)}::jsonb,
          description = ${JSON.stringify(multilingualDescription)}::jsonb,
          slug = ${slug}
        WHERE id = ${topic.id}
      `;

      console.log(`✓ Migrated topic: ${topic.name} -> slug: ${slug}`);
    } catch (error) {
      console.error(`✗ Failed to migrate topic ${topic.id}:`, error);
    }
  }

  console.log('\n✓ Topics migration complete\n');
}

async function addLanguagePreferenceToUsers() {
  console.log('👥 Adding language preference to users...\n');

  await prisma.$executeRaw`
    UPDATE "User"
    SET "preferredLang" = 'en'
    WHERE "preferredLang" IS NULL
  `;

  console.log('✓ User language preferences set to English by default\n');
}

async function main() {
  console.log('🚀 Starting multilingual migration...\n');
  console.log('⚠️  IMPORTANT: This will modify your database structure!');
  console.log('⚠️  Make sure you have a backup before proceeding.\n');

  // Wait 5 seconds for user to cancel if needed
  console.log('Starting in 5 seconds... (Press Ctrl+C to cancel)');
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    await migrateQuestions();
    await migrateSubjects();
    await migrateTopics();
    await addLanguagePreferenceToUsers();

    console.log('🎉 All migrations completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Review migrated data in your database');
    console.log('2. Add Hindi translations using the admin panel');
    console.log('3. Test the multilingual functionality');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
import { PrismaClient } from '@prisma/client';
import { normalizeQuiz } from '../src/utils/quizNormalizer';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to DB...');
  const quizzes = await prisma.multilingualQuiz.findMany();
  console.log(`Found ${quizzes.length} quizzes to normalize`);

  for (const q of quizzes) {
    try {
      const normalized = normalizeQuiz(q as any);
      // Update only fields that map to Prisma model
      await prisma.multilingualQuiz.update({
        where: { id: q.id },
        data: {
          title: normalized.title,
          description: normalized.description,
          availableLanguages: normalized.availableLanguages,
          defaultLanguage: normalized.defaultLanguage,
          difficulty: normalized.difficulty,
          timeLimit: normalized.timeLimit,
          tags: normalized.tags,
        },
      });

      // Recreate questions: delete existing and create normalized ones
      await prisma.multilingualQuestion.deleteMany({ where: { quizId: q.id } });
      let seq = 1;
      for (const qq of normalized.questions) {
        await prisma.multilingualQuestion.create({
          data: {
            quizId: q.id,
            sequenceNumber: seq++,
            question: qq.question,
            options: qq.options,
            correctAnswer: qq.correctAnswer,
            explanation: qq.explanation,
            points: qq.points || 10,
            category: qq.category || null,
          }
        });
      }

      console.log('Normalized quiz', q.id);
    } catch (e) {
      console.error('Failed to normalize quiz', q.id, e);
    }
  }

  console.log('Done');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import { normalizeQuiz } from '../src/utils/quizNormalizer';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to DB...');
  const quizzes = await prisma.multilingualQuiz.findMany();
  console.log(`Found ${quizzes.length} quizzes`);

  for (const q of quizzes) {
    try {
      const normalized = normalizeQuiz(q as any);
      normalized.availableLanguages = (normalized.availableLanguages || []).filter((l: string) => ['en', 'hi'].includes(l));
      normalized.isMultilingual = normalized.availableLanguages.length === 2;

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
        }
      });

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

      console.log('Updated', q.id, normalized.availableLanguages, normalized.isMultilingual);
    } catch (e) {
      console.error('Failed to update', q.id, e);
    }
  }

  console.log('Done');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });

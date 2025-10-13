import { PrismaClient } from '@prisma/client';
import { QuizSession, QuizSubmission, QuizResult, QuestionWithAnswer, Option } from '../types';

export class QuizService {
  constructor(private prisma: PrismaClient) {}

  // Get all subjects with their topics
  async getSubjectsWithTopics() {
    return await this.prisma.subject.findMany({
      include: {
        topics: {
          select: {
            id: true,
            name: true,
            notesUrl: true,
            _count: {
              select: { questions: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getSubjectByName(name: string) {
    return await this.prisma.subject.findUnique({
      where: { name },
      include: {
        topics: {
          select: {
            id: true,
            name: true,
            _count: { select: { questions: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  // Get a single topic with subject info
  async getTopicById(topicId: string) {
    return await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        subject: true,
        _count: {
          select: { questions: true }
        }
      }
    });
  }

  // Get random questions for a quiz session
  async getQuizSession(
    topicId: string,
    options?: {
      questionCount?: number | 'all';
      includeTopicIds?: string[];
      durationSeconds?: number | null;
    }
  ): Promise<QuizSession> {
    const primaryTopic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: { subject: true },
    });

    if (!primaryTopic) {
      throw new Error('TOPIC_NOT_FOUND');
    }

    const extraTopicIds = Array.isArray(options?.includeTopicIds)
      ? options.includeTopicIds.filter((id) => id && id !== topicId)
      : [];

    const topicIds = Array.from(new Set([topicId, ...extraTopicIds]));

    const topics = await this.prisma.topic.findMany({
      where: { id: { in: topicIds } },
      include: { subject: true },
    });

    if (!topics.length) {
      throw new Error('TOPIC_NOT_FOUND');
    }

    const topicLookup = new Map(topics.map((t) => [t.id, t] as const));

    const questions = await this.prisma.question.findMany({
      where: { topicId: { in: topicIds } },
      select: {
        id: true,
        text: true,
        options: true,
        difficulty: true,
        topicId: true,
      },
    });

    const shuffledQuestions = this.shuffleArray(questions);

    const requestedCount = options?.questionCount ?? 10;
    const limit = requestedCount === 'all'
      ? shuffledQuestions.length
      : Math.min(requestedCount, shuffledQuestions.length);

    const selectedQuestions = shuffledQuestions.slice(0, limit);

    const formattedQuestions = selectedQuestions.map((q) => ({
      id: q.id,
      text: q.text,
      options: this.shuffleArray(q.options as unknown as Option[]),
    }));

    const resolvedTopicNames = topicIds
      .map((id) => topicLookup.get(id)?.name)
      .filter((name): name is string => Boolean(name));

    const derivedDurationSeconds = options?.durationSeconds && options.durationSeconds > 0
      ? options.durationSeconds
      : Math.max(1, limit) * 30;

    const primary = topicLookup.get(topicId) ?? topics[0];

    return {
      topicId,
      topicName: resolvedTopicNames.length === 1
        ? resolvedTopicNames[0]
        : resolvedTopicNames.join(', '),
      subjectName: primary.subject.name,
      notesUrl: resolvedTopicNames.length === 1 ? primary.notesUrl : null,
      durationSeconds: derivedDurationSeconds,
      questionCount: formattedQuestions.length,
      includedTopicIds: topicIds,
      includedTopicNames: resolvedTopicNames,
      questions: formattedQuestions,
    };
  }

  // Submit quiz and calculate results
  async submitQuiz(submission: QuizSubmission): Promise<QuizResult> {
    // Get all questions with correct answers
    const questionIds = submission.answers.map(a => a.questionId);
    const questions = await this.prisma.question.findMany({
      where: {
        id: { in: questionIds }
      },
      select: {
        id: true,
        correctAnswerId: true,
        explanation: true
      }
    });

    // Create a map for quick lookup
    const correctAnswersMap = new Map(
      questions.map(q => [q.id, q.correctAnswerId])
    );

    // Calculate score
    let correctCount = 0;
    const incorrectAnswers: any[] = [];

    submission.answers.forEach(answer => {
      const correctAnswerId = correctAnswersMap.get(answer.questionId);
      if (answer.selectedOptionId === correctAnswerId) {
        correctCount++;
      } else {
        incorrectAnswers.push({
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
          correctAnswerId
        });
      }
    });

    // Calculate score with negative marking
    const incorrectCount = submission.answers.length - correctCount;
    const score = correctCount - (incorrectCount * 0.25);
    const percentage = (score / submission.answers.length) * 100;

    return {
      score: Math.max(0, score),
      totalQuestions: submission.answers.length,
      correctAnswers: correctCount,
      incorrectAnswers,
      percentage: Math.max(0, percentage)
    };
  }

  // Get questions with answers for review
  async getQuestionsForReview(questionIds: string[]): Promise<QuestionWithAnswer[]> {
    const questions = await this.prisma.question.findMany({
      where: {
        id: { in: questionIds }
      }
    });

    return questions.map(q => ({
      id: q.id,
      text: q.text,
      options: q.options as unknown as Option[],
      correctAnswerId: q.correctAnswerId,
      explanation: q.explanation || undefined
    }));
  }

  // Utility function to shuffle array
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

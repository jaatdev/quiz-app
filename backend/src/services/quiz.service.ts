import { PrismaClient } from '@prisma/client';
import { I18nService, SupportedLanguage } from './i18n.service';

const prisma = new PrismaClient();

export interface QuizQuestion {
  id: string;
  text: string;
  options: Array<{ id: string; text: string }>;
  explanation?: string;
  difficulty: string;
}

export interface QuizSession {
  topicId: string;
  topicName: string;
  difficulty: string;
  totalQuestions: number;
  questions: QuizQuestion[];
  language: SupportedLanguage;
}

export class QuizService {
  /**
   * Get a quiz session with questions in specified language
   */
  static async getQuizSession(
    topicId: string,
    difficulty: string = 'medium',
    language: SupportedLanguage = 'en'
  ): Promise<QuizSession> {
    // Fetch topic details
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: {
        id: true,
        name: true,
        _count: {
          select: { questions: true }
        }
      }
    });

    if (!topic) {
      throw new Error('Topic not found');
    }

    // Fetch questions for this topic and difficulty
    const questions = await prisma.question.findMany({
      where: {
        topicId,
        difficulty
      },
      select: {
        id: true,
        text: true,
        options: true,
        explanation: true,
        correctAnswerId: true,
        difficulty: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (questions.length === 0) {
      throw new Error('No questions available for this topic and difficulty');
    }

    // Select 10 random questions (or all if less than 10)
    const selectedQuestions = this.selectRandomQuestions(questions, 10);

    // Transform questions to user's language
    const localizedQuestions: QuizQuestion[] = selectedQuestions.map(question => {
      const text = I18nService.extractContent(question.text, language);
      const options = I18nService.extractContent(question.options, language);
      const explanation = question.explanation
        ? I18nService.extractContent(question.explanation, language)
        : undefined;

      return {
        id: question.id,
        text,
        options,
        explanation,
        difficulty: question.difficulty
      };
    });

    // Shuffle questions and their options
    const shuffledQuestions = this.shuffleQuestions(localizedQuestions);

    return {
      topicId: topic.id,
      topicName: I18nService.extractContent(topic.name, language),
      difficulty,
      totalQuestions: shuffledQuestions.length,
      questions: shuffledQuestions,
      language
    };
  }

  /**
   * Select random questions from array
   */
  private static selectRandomQuestions<T>(questions: T[], count: number): T[] {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, questions.length));
  }

  /**
   * Shuffle questions and their options
   */
  private static shuffleQuestions(questions: QuizQuestion[]): QuizQuestion[] {
    return questions.map(question => ({
      ...question,
      options: [...question.options].sort(() => Math.random() - 0.5)
    }));
  }

  /**
   * Submit quiz and calculate results
   */
  static async submitQuiz(
    userId: string,
    topicId: string,
    answers: Record<string, string>,
    timeSpent: number,
    language: SupportedLanguage
  ) {
    // Fetch questions with correct answers
    const questionIds = Object.keys(answers);
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds }
      },
      select: {
        id: true,
        correctAnswerId: true,
        difficulty: true
      }
    });

    // Calculate score
    let correctCount = 0;
    let incorrectCount = 0;

    questions.forEach(question => {
      const userAnswer = answers[question.id];
      if (userAnswer === question.correctAnswerId) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const totalQuestions = questions.length;
    const score = correctCount - (incorrectCount * 0.25); // Negative marking
    const percentage = (correctCount / totalQuestions) * 100;

    // Save quiz attempt
    const quizAttempt = await prisma.quizAttempt.create({
      data: {
        userId,
        topicId,
        score,
        totalQuestions,
        correctAnswers: correctCount,
        percentage,
        timeSpent,
        difficulty: questions[0]?.difficulty || 'medium',
        language
      }
    });

    return {
      attemptId: quizAttempt.id,
      score,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      totalQuestions,
      percentage,
      timeSpent
    };
  }

  /**
   * Get all subjects with topics in specified language
   */
  static async getSubjects(language: SupportedLanguage = 'en') {
    const subjects = await prisma.subject.findMany({
      include: {
        topics: {
          include: {
            _count: {
              select: { questions: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return subjects.map(subject => ({
      id: subject.id,
      name: I18nService.extractContent(subject.name, language),
      description: I18nService.extractContent(subject.description, language),
      slug: subject.slug,
      topics: subject.topics.map(topic => ({
        id: topic.id,
        name: I18nService.extractContent(topic.name, language),
        description: I18nService.extractContent(topic.description, language),
        slug: topic.slug,
        questionCount: topic._count.questions
      }))
    }));
  }

  /**
   * Get all subjects with topics (alias for getSubjects)
   */
  static async getSubjectsWithTopics(language: SupportedLanguage = 'en') {
    return this.getSubjects(language);
  }

  /**
   * Get topic by ID
   */
  static async getTopicById(topicId: string, language: SupportedLanguage = 'en') {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        subject: true,
        _count: {
          select: { questions: true }
        }
      }
    });

    if (!topic) return null;

    return {
      id: topic.id,
      name: I18nService.extractContent(topic.name, language),
      description: I18nService.extractContent(topic.description, language),
      slug: topic.slug,
      subjectId: topic.subjectId,
      subjectName: I18nService.extractContent(topic.subject.name, language),
      questionCount: topic._count.questions,
      notesUrl: topic.notesUrl
    };
  }

  /**
   * Get subject by name
   */
  static async getSubjectByName(name: string, language: SupportedLanguage = 'en') {
    const subject = await prisma.subject.findFirst({
      where: {
        OR: [
          { name: { equals: name } },
          { slug: { equals: name } }
        ]
      },
      include: {
        topics: {
          include: {
            _count: {
              select: { questions: true }
            }
          }
        }
      }
    });

    if (!subject) return null;

    return {
      id: subject.id,
      name: I18nService.extractContent(subject.name, language),
      description: I18nService.extractContent(subject.description, language),
      slug: subject.slug,
      topics: subject.topics.map(topic => ({
        id: topic.id,
        name: I18nService.extractContent(topic.name, language),
        description: I18nService.extractContent(topic.description, language),
        slug: topic.slug,
        questionCount: topic._count.questions
      }))
    };
  }

  /**
   * Get subtopics by IDs
   */
  static async getSubTopicsByIds(ids: string[], language: SupportedLanguage = 'en') {
    const topics = await prisma.topic.findMany({
      where: {
        id: { in: ids }
      },
      include: {
        subject: true,
        _count: {
          select: { questions: true }
        }
      }
    });

    return topics.map(topic => ({
      id: topic.id,
      name: I18nService.extractContent(topic.name, language),
      description: I18nService.extractContent(topic.description, language),
      slug: topic.slug,
      subjectId: topic.subjectId,
      subjectName: I18nService.extractContent(topic.subject.name, language),
      questionCount: topic._count.questions
    }));
  }

  /**
   * Get quiz by subtopics
   */
  static async getQuizBySubTopics(subTopicIds: string[], count: number = 10, language: SupportedLanguage = 'en') {
    // Fetch questions from multiple topics
    const questions = await prisma.question.findMany({
      where: {
        topicId: { in: subTopicIds }
      },
      select: {
        id: true,
        text: true,
        options: true,
        explanation: true,
        correctAnswerId: true,
        difficulty: true,
        topic: {
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (questions.length === 0) {
      throw new Error('No questions available for these sub-topics');
    }

    // Select random questions
    const selectedQuestions = this.selectRandomQuestions(questions, count);

    // Transform questions to user's language
    const localizedQuestions: QuizQuestion[] = selectedQuestions.map(question => {
      const text = I18nService.extractContent(question.text, language);
      const options = I18nService.extractContent(question.options, language);
      const explanation = question.explanation
        ? I18nService.extractContent(question.explanation, language)
        : undefined;

      return {
        id: question.id,
        text,
        options,
        explanation,
        difficulty: question.difficulty
      };
    });

    // Shuffle questions and their options
    const shuffledQuestions = this.shuffleQuestions(localizedQuestions);

    return {
      topicId: subTopicIds[0], // Use first topic ID as primary
      topicName: I18nService.extractContent(selectedQuestions[0].topic.name, language),
      difficulty: 'mixed',
      totalQuestions: shuffledQuestions.length,
      questions: shuffledQuestions,
      language
    };
  }

  /**
   * Get questions for review
   */
  static async getQuestionsForReview(questionIds: string[], language: SupportedLanguage = 'en') {
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds }
      },
      select: {
        id: true,
        text: true,
        options: true,
        explanation: true,
        correctAnswerId: true,
        difficulty: true,
        topic: {
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return questions.map(question => ({
      id: question.id,
      text: I18nService.extractContent(question.text, language),
      options: I18nService.extractContent(question.options, language),
      explanation: question.explanation
        ? I18nService.extractContent(question.explanation, language)
        : undefined,
      correctAnswerId: question.correctAnswerId,
      difficulty: question.difficulty,
      topicName: I18nService.extractContent(question.topic.name, language),
      subjectName: I18nService.extractContent(question.topic.subject.name, language)
    }));
  }
}

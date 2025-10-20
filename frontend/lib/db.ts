// lib/db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getSubjectById(id: string) {
  return prisma.subject.findUnique({ where: { id } });
}

export async function getTopicById(id: string) {
  return prisma.topic.findUnique({ where: { id } });
}

export async function getSubTopicById(id: string) {
  return prisma.subTopic.findUnique({ where: { id } });
}

export async function getSubTopicsByTopicId(topicId: string) {
  return prisma.subTopic.findMany({
    where: { topicId },
    include: { topic: true }
  });
}

export async function getTopicsBySubjectId(subjectId: string) {
  return prisma.subject.findUnique({
    where: { id: subjectId },
    include: { topics: { include: { subTopics: true } } }
  });
}

export async function getQuizzesBySubTopicId(subTopicId: string) {
  return prisma.quiz.findMany({
    where: { subTopicId },
    include: { questions: true }
  });
}

export async function getQuizzesByTopicId(topicId: string) {
  const subTopics = await prisma.subTopic.findMany({
    where: { topicId },
    select: { id: true }
  });
  const subTopicIds = subTopics.map((st: { id: string }) => st.id);

  return prisma.quiz.findMany({
    where: { subTopicId: { in: subTopicIds } },
    include: { questions: true }
  });
}

export async function getQuizzesBySubjectId(subjectId: string) {
  const topics = await prisma.topic.findMany({
    where: { subjectId },
    select: { id: true }
  });
  const topicIds = topics.map((t: { id: string }) => t.id);

  const subTopics = await prisma.subTopic.findMany({
    where: { topicId: { in: topicIds } },
    select: { id: true }
  });
  const subTopicIds = subTopics.map((st: { id: string }) => st.id);

  return prisma.quiz.findMany({
    where: { subTopicId: { in: subTopicIds } },
    include: { questions: true }
  });
}
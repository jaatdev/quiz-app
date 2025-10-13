import { Router } from 'express';
import { QuizController } from '../controllers/quiz.controller';

const router = Router();
const quizController = new QuizController();

// Subject and topic routes
router.get('/subjects', (req, res) => quizController.getSubjects(req, res));
router.get('/subjects/by-name/:name', (req, res) => quizController.getSubjectByName(req, res));
router.get('/topics/:topicId', (req, res) => quizController.getTopic(req, res));
router.get('/notes/:topicId/download', (req, res) => quizController.downloadNotes(req, res));

// Quiz session routes
router.get('/quiz/session/:topicId', (req, res) => quizController.startQuizSession(req, res));
router.post('/quiz/submit', (req, res) => quizController.submitQuiz(req, res));
router.post('/quiz/review', (req, res) => quizController.getReviewQuestions(req, res));

export default router;

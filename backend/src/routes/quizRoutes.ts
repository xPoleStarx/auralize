import express from 'express';
import * as quizController from '../controllers/quizController';

const router = express.Router();

// Quiz verilerini getirme
router.get('/:quizType', quizController.getQuiz);

// Quiz yanıtlarını gönderme
router.post('/:quizType/submit', quizController.submitQuiz);

// Kullanıcıya ait tüm quiz sonuçlarını getirme
router.get('/user/:userId/results', quizController.getUserQuizResults);

export default router; 
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

// Quiz verilerini getiren fonksiyon
export const getQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quizType } = req.params;
    
    // Geçerli quiz tipi kontrolü
    if (!['career', 'mood', 'personal', 'creative'].includes(quizType)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Geçersiz quiz tipi',
          code: 'INVALID_QUIZ_TYPE'
        }
      });
    }
    
    // JSON dosyasından quiz verilerini oku
    const quizFilePath = path.join(__dirname, `../data/quizzes/${quizType}Quiz.json`);
    
    if (!fs.existsSync(quizFilePath)) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Quiz verileri bulunamadı',
          code: 'QUIZ_NOT_FOUND'
        }
      });
    }
    
    const quizData = JSON.parse(fs.readFileSync(quizFilePath, 'utf-8'));
    
    return res.json({
      success: true,
      data: quizData
    });
  } catch (error) {
    logger.error('Quiz verilerini getirme hatası:', error);
    next(error);
  }
};

// Quiz yanıtlarını işleyen fonksiyon
export const submitQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quizType } = req.params;
    const { answers, userId } = req.body;
    
    // Girdi doğrulama
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Geçersiz yanıt formatı',
          code: 'INVALID_ANSWER_FORMAT'
        }
      });
    }
    
    // Burada quiz yanıtlarını işleyip sonuç oluşturulacak
    // Gerçek uygulamada bu OpenAI veya DeepSeek ile yapılabilir
    
    // Şimdilik basit bir sonuç döndürüyoruz
    const quizResult = {
      id: `result_${Date.now()}`,
      title: `${quizType.charAt(0).toUpperCase() + quizType.slice(1)} Sonucunuz`,
      description: `Bu sizin ${quizType} türündeki test sonucunuz.`,
      insights: [
        "Örnek içgörü 1",
        "Örnek içgörü 2",
        "Örnek içgörü 3"
      ],
      createdAt: new Date().toISOString()
    };
    
    return res.json({
      success: true,
      data: quizResult
    });
  } catch (error) {
    logger.error('Quiz yanıtlarını gönderme hatası:', error);
    next(error);
  }
};

// Kullanıcıya ait quiz sonuçlarını getiren fonksiyon
export const getUserQuizResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    
    // Bu kısımda gerçekten bir veritabanından kullanıcı sonuçları çekilecek
    // Şimdilik örnek veri döndürüyoruz
    
    const userResults = [
      {
        id: 'result_1',
        title: 'Kariyer Quiz Sonucu',
        description: 'İş hayatınızdaki yol haritanız',
        insights: ['İçgörü 1', 'İçgörü 2'],
        quizType: 'career',
        createdAt: '2023-05-01T12:00:00Z'
      },
      {
        id: 'result_2',
        title: 'Ruh Hali Quiz Sonucu',
        description: 'Duygusal durumunuzun analizi',
        insights: ['İçgörü 1', 'İçgörü 2'],
        quizType: 'mood',
        createdAt: '2023-05-15T12:00:00Z'
      }
    ];
    
    return res.json({
      success: true,
      data: userResults
    });
  } catch (error) {
    logger.error('Kullanıcı quiz sonuçlarını getirme hatası:', error);
    next(error);
  }
}; 
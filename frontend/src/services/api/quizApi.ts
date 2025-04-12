import axios from 'axios';

// API temel URL'si - Gerçek API tamamlandığında güncellenebilir
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface QuizQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
  }[];
}

export interface QuizAnswers {
  quizType: string;
  answers: {
    questionId: string;
    selectedOptionId: string;
  }[];
}

export interface QuizResult {
  id: string;
  title: string;
  description: string;
  insights: string[];
  imageUrl?: string;
}

// Quiz verilerini getiren fonksiyon
export const fetchQuiz = async (quizType: string): Promise<QuizQuestion[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/quizzes/${quizType}`);
    return response.data;
  } catch (error) {
    console.error('Quiz verileri getirilirken hata oluştu:', error);
    // Hata durumunda geçici olarak yerel verileri kullanabiliriz
    const fallbackData = await import(`../../data/quizzes/${quizType}Quiz.json`);
    return fallbackData.default;
  }
};

// Quiz sonuçlarını göndermek için fonksiyon
export const submitQuizAnswers = async (data: QuizAnswers): Promise<QuizResult> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/quizzes/${data.quizType}/submit`, data);
    return response.data;
  } catch (error) {
    console.error('Quiz yanıtları gönderilirken hata oluştu:', error);
    throw error;
  }
}; 
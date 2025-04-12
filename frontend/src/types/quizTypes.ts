export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  value: string;
  color?: string;
  emoji?: string;
  image?: string;
  shape?: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionId: string;
}

export interface QuizSubmission {
  quizType: string;
  answers: QuizAnswer[];
  userId?: string;
}

export interface QuizResult {
  id: string;
  title: string;
  description: string;
  insights: string[];
  imageUrl?: string;
  createdAt?: string;
}

export type QuizType = 'career' | 'mood' | 'personal' | 'creative'; 
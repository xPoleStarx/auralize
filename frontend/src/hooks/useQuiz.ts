import { useState, useEffect } from 'react';

interface QuizQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
  }[];
}

interface Answer {
  questionId: string;
  selectedOptionId: string;
}

interface UseQuizProps {
  quizType: string;
  questions: QuizQuestion[];
}

interface UseQuizReturn {
  currentQuestion: QuizQuestion | null;
  currentQuestionIndex: number;
  answers: Answer[];
  isCompleted: boolean;
  progress: number;
  selectOption: (optionId: string) => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  resetQuiz: () => void;
}

const useQuiz = ({ quizType, questions }: UseQuizProps): UseQuizReturn => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = questions[currentQuestionIndex] || null;
  const progress = questions.length > 0 ? (currentQuestionIndex / questions.length) * 100 : 0;

  const selectOption = (optionId: string) => {
    if (!currentQuestion) return;

    const questionId = currentQuestion.id;
    const existingAnswerIndex = answers.findIndex(a => a.questionId === questionId);

    if (existingAnswerIndex >= 0) {
      // Update existing answer
      const updatedAnswers = [...answers];
      updatedAnswers[existingAnswerIndex] = { questionId, selectedOptionId: optionId };
      setAnswers(updatedAnswers);
    } else {
      // Add new answer
      setAnswers([...answers, { questionId, selectedOptionId: optionId }]);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setIsCompleted(false);
  };

  useEffect(() => {
    resetQuiz();
  }, [quizType]);

  return {
    currentQuestion,
    currentQuestionIndex,
    answers,
    isCompleted,
    progress,
    selectOption,
    goToNextQuestion,
    goToPreviousQuestion,
    resetQuiz,
  };
};

export default useQuiz; 
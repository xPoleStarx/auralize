import React from 'react';

interface QuizQuestionProps {
  question: string;
  questionNumber: number;
  totalQuestions: number;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  questionNumber,
  totalQuestions,
}) => {
  return (
    <div className="quiz-question">
      <div className="question-progress">
        <span>{questionNumber}</span> / {totalQuestions}
      </div>
      <h2 className="question-text">{question}</h2>
    </div>
  );
};

export default QuizQuestion; 
import React from 'react';

interface QuizOptionProps {
  id: string;
  text: string;
  selected: boolean;
  onSelect: (id: string) => void;
}

const QuizOption: React.FC<QuizOptionProps> = ({
  id,
  text,
  selected,
  onSelect,
}) => {
  return (
    <div 
      className={`quiz-option ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(id)}
    >
      <div className="option-indicator"></div>
      <div className="option-text">{text}</div>
    </div>
  );
};

export default QuizOption; 
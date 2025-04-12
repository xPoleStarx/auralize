import React from 'react';

interface LoadingAnimationProps {
  text?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ text = 'Yükleniyor...' }) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingAnimation; 
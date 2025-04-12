import React from 'react';

const InsightLoadingSkeleton: React.FC = () => {
  return (
    <div className="insight-skeleton">
      <div className="skeleton-header"></div>
      <div className="skeleton-content">
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line skeleton-line-short"></div>
      </div>
    </div>
  );
};

export default InsightLoadingSkeleton; 
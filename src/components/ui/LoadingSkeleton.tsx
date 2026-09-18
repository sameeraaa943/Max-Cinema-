import React from 'react';

interface LoadingSkeletonProps {
  lines?: number;
  height?: string;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  lines = 3,
  height = '20px',
  className = '',
}) => {
  return (
    <div className={`space-y-3 w-full ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="shimmer rounded-lg w-full"
          style={{
            height,
            opacity: 1 - i * 0.15,
            border: '1px solid #1a1a1a',
          }}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;


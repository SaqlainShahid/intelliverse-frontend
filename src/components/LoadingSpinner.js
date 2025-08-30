// src/components/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ size = 'lg', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-3 border-gray-300 border-t-primary-600`}></div>
        <p className="text-gray-600 text-sm font-medium">{text}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;

import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6 ${className}`}>
      {title && <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>}
      {children}
    </div>
  );
};

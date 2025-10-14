import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-md p-6 ${className}`}>
      {title && <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>}
      {children}
    </div>
  );
};

import React from 'react';

export const WelcomeScreen: React.FC = () => {
  return (
    <>
      <style>
        {`
          @keyframes fadeInScaleUp {
            0% {
              opacity: 0;
              transform: scale(0.9);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-fade-in-scale-up {
            animation: fadeInScaleUp 1.5s ease-out forwards;
          }
        `}
      </style>
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center animate-fade-in-scale-up">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-wider">
            Tidè Hotels and Resorts
          </h1>
          <p className="text-slate-400 mt-4 text-lg">Property Management System</p>
        </div>
      </div>
    </>
  );
};


import React from 'react';
import { useHotelData } from '../hooks/useHotelData.ts';

export const WelcomeScreen: React.FC = () => {
  const { propertyInfo } = useHotelData();

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
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center animate-fade-in-scale-up px-6">
          <div className="mb-6 flex justify-center">
            <div className="h-1 w-24 bg-indigo-600 rounded-full opacity-50"></div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none">
            {propertyInfo.name}
          </h1>
          <div className="mt-6 flex items-center justify-center gap-4">
             <div className="h-px w-8 bg-slate-700"></div>
             <p className="text-slate-400 text-sm md:text-lg font-black uppercase tracking-[0.4em]">Operational Boot Sequence</p>
             <div className="h-px w-8 bg-slate-700"></div>
          </div>
          <div className="mt-12 flex justify-center">
             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></div>
          </div>
        </div>
      </div>
    </>
  );
};

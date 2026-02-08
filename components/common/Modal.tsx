import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden border-2 border-slate-200 dark:border-slate-800 animate-fade-in-scale">
        <div className="flex justify-between items-center px-8 py-6 border-b-2 border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] leading-none">
            <span className="text-indigo-600 mr-2">█</span>
            {title}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-88px)] custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
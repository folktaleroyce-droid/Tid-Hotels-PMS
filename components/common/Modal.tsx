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
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl w-full max-w-4xl min-h-fit my-auto overflow-hidden border-2 border-slate-200 dark:border-slate-800 animate-fade-in-scale relative">
        <div className="flex justify-between items-center px-10 py-8 border-b-2 border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 sticky top-0 z-20">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] leading-none">
            <span className="text-indigo-600 mr-3">SYSTEM_NODE</span>
            {title}
          </h2>
          <button 
            onClick={onClose} 
            className="p-3 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
          >
            <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-10 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
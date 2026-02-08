import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useHotelData } from '../hooks/useHotelData.ts';
import { Modal } from './common/Modal.tsx';
import { Button } from './common/Button.tsx';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();
  const { propertyInfo, updateStaff, addSyncLogEntry } = useHotelData();
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  const handleChangePassword = () => {
      if (!currentUser) return;
      if (passwords.next !== passwords.confirm) {
          alert("Credential mismatch. Verify inputs.");
          return;
      }
      updateStaff({ ...currentUser, password: passwords.next } as any);
      addSyncLogEntry('Security credentials updated successfully', 'success');
      setIsPassModalOpen(false);
      setPasswords({ current: '', next: '', confirm: '' });
  };

  return (
    <header className="bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center print:hidden shadow-sm">
      <div className="flex items-center space-x-2">
        <div className="h-8 w-1.5 bg-indigo-600 rounded-full"></div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{propertyInfo.name}</h1>
      </div>
      <div className="flex items-center space-x-4">
        {currentUser && (
          <div className="flex flex-col items-end mr-2 group relative cursor-pointer" onClick={() => setIsPassModalOpen(true)}>
            <span className="text-[9px] font-black uppercase text-indigo-500 leading-none tracking-widest">{currentUser.role}</span>
            <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{currentUser.name}</span>
            <div className="absolute top-full right-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[8px] font-black uppercase px-2 py-1 rounded whitespace-nowrap z-50">
              Manage Credentials
            </div>
          </div>
        )}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          )}
        </button>
        {currentUser && (
          <button
            onClick={logout}
            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-transparent hover:border-red-200"
            aria-label="Logout"
            title="Terminate Session"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
      </div>

      <Modal isOpen={isPassModalOpen} onClose={() => setIsPassModalOpen(false)} title="Credential Modification">
          <div className="space-y-4">
              <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Current Secret Key</label>
                  <input type="password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} className="w-full p-2 border rounded font-mono" />
              </div>
              <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Next Authorization Key</label>
                  <input type="password" value={passwords.next} onChange={e => setPasswords({...passwords, next: e.target.value})} className="w-full p-2 border rounded font-mono" />
              </div>
              <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Confirm next key</label>
                  <input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="w-full p-2 border rounded font-mono" />
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t">
                  <Button variant="secondary" onClick={() => setIsPassModalOpen(false)} className="uppercase font-black text-[10px]">Abort</Button>
                  <Button onClick={handleChangePassword} className="uppercase font-black text-[10px]">Commit Credentials</Button>
              </div>
          </div>
      </Modal>
    </header>
  );
};
import React from 'react';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { UserRole } from '../types.ts';
import { useHotelData } from '../hooks/useHotelData.ts';

const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ReceptionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 016-6h4a6 6 0 016 6z" /></svg>;
const HousekeepingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const AccountsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const SuperAdminIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;

type View = 'dashboard' | 'reception' | 'housekeeping' | 'restaurant' | 'kitchen' | 'accounts' | 'people-and-culture' | 'channel-manager' | 'maintenance' | 'financials' | 'loyalty' | 'walk-in' | 'admin' | 'support' | 'inventory' | 'profiles' | 'settings' | 'super-admin' | 'catering';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavItem: React.FC<{
  view: View;
  currentView: View;
  setCurrentView: (view: View) => void;
  icon: React.ReactNode;
  label: string;
}> = ({ view, currentView, setCurrentView, icon, label }) => (
  <li>
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        setCurrentView(view);
      }}
      className={`flex items-center px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all group ${
        currentView === view
          ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 ring-2 ring-indigo-400/20'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <div className={`${currentView === view ? 'text-white' : 'text-indigo-500 group-hover:scale-110 transition-transform'}`}>{icon}</div>
      <span className="ml-4 truncate">{label}</span>
    </a>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { currentUser } = useAuth();
  const { propertyInfo, systemModules } = useHotelData();

  const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;

  return (
    <aside className="w-72 bg-white dark:bg-slate-950 border-r-2 border-slate-100 dark:border-slate-900 print:hidden overflow-y-auto flex flex-col" aria-label="Sidebar">
      <div className="p-8">
        <div className="mb-12 px-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-none uppercase tracking-tighter">
                SMARTWAVE<br/>ENTERPRISE HUB
            </h2>
            <p className="text-[8px] font-black uppercase text-indigo-500 tracking-[0.4em] mt-3 bg-indigo-50 dark:bg-indigo-900/20 py-1 px-2 rounded inline-block">Cloud Node V4</p>
        </div>
        
        <nav className="flex-1">
          <ul className="space-y-2">
            {isSuperAdmin && (
              <div className="mb-8">
                <NavItem view="super-admin" currentView={currentView} setCurrentView={setCurrentView} icon={<SuperAdminIcon />} label="System Kernel" />
                <div className="mt-6 border-t-2 border-slate-100 dark:border-slate-900"></div>
              </div>
            )}
            
            <NavItem view="dashboard" currentView={currentView} setCurrentView={setCurrentView} icon={<DashboardIcon />} label="Terminal Over" />
            
            {systemModules.reception && (
              <NavItem view="reception" currentView={currentView} setCurrentView={setCurrentView} icon={<ReceptionIcon />} label="Front Office" />
            )}
            
            {systemModules.finance && (
              <NavItem view="accounts" currentView={currentView} setCurrentView={setCurrentView} icon={<AccountsIcon />} label="Fiscal Engine" />
            )}
            
            {systemModules.housekeeping && (
              <NavItem view="housekeeping" currentView={currentView} setCurrentView={setCurrentView} icon={<HousekeepingIcon />} label="Facility Hygn" />
            )}
            
            {systemModules.inventory && (
              <NavItem view="inventory" currentView={currentView} setCurrentView={setCurrentView} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>} label="Logistics" />
            )}
            
            {systemModules.restaurant && (
              <NavItem view="restaurant" currentView={currentView} setCurrentView={setCurrentView} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>} label="POS Terminal" />
            )}
            
            {systemModules.maintenance && (
              <NavItem view="maintenance" currentView={currentView} setCurrentView={setCurrentView} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>} label="Engineering" />
            )}

            <NavItem view="people-and-culture" currentView={currentView} setCurrentView={setCurrentView} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>} label="Human Factor" />
          </ul>
        </nav>
        
        <div className="pt-8 mt-12 border-t-2 border-slate-100 dark:border-slate-900">
          <ul className="space-y-2">
            <NavItem view="settings" currentView={currentView} setCurrentView={setCurrentView} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>} label="Config" />
          </ul>
        </div>
      </div>
    </aside>
  );
};
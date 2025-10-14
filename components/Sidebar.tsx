import React from 'react';

type View = 'dashboard' | 'reception' | 'housekeeping' | 'restaurant' | 'kitchen' | 'accounts' | 'people-and-culture' | 'channel-manager';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavItem: React.FC<{
    view: View;
    label: string;
    currentView: View;
    setCurrentView: (view: View) => void;
    // FIX: Replaced JSX.Element with React.ReactNode to resolve namespace error.
    icon: React.ReactNode;
}> = ({ view, label, currentView, setCurrentView, icon }) => {
    const isActive = currentView === view;
    return (
        <button
            onClick={() => setCurrentView(view)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
        >
            {icon}
            <span className="font-semibold">{label}</span>
        </button>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const navItems = [
    { view: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
    { view: 'reception', label: 'Reception', icon: <ReceptionIcon /> },
    { view: 'housekeeping', label: 'Housekeeping', icon: <HousekeepingIcon /> },
    { view: 'restaurant', label: 'Restaurant', icon: <RestaurantIcon /> },
    { view: 'kitchen', label: 'Kitchen', icon: <KitchenIcon /> },
    { view: 'accounts', label: 'Accounts', icon: <AccountsIcon /> },
    { view: 'channel-manager', label: 'Channel Manager', icon: <LinkIcon /> },
    { view: 'people-and-culture', label: 'People & Culture', icon: <PeopleIcon /> },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 p-4 border-r border-slate-200 dark:border-slate-700 flex flex-col">
      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-8">
        Tidé Hotels PMS
      </div>
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <NavItem
            key={item.view}
            view={item.view as View}
            label={item.label}
            currentView={currentView}
            setCurrentView={setCurrentView}
            icon={item.icon}
          />
        ))}
      </nav>
    </aside>
  );
};

// SVG Icons as components
const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
);
const ReceptionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
);
const HousekeepingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);
const RestaurantIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0c-.454-.303-.977-.454-1.5-.454V4.5A2.5 2.5 0 015.5 2h13A2.5 2.5 0 0121 4.5v11.046zM12 12v3" /></svg>
);
const KitchenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h6.172a2 2 0 001.414-.586l1.414-1.414A2 2 0 0116.172 2H17v6z" /></svg>
);
const AccountsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);
const PeopleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>
);
const LinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
);
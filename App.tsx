import React, { useState } from 'react';
// FIX: Added file extensions to imports to resolve module errors.
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Reception } from './components/Reception.tsx';
import { Housekeeping } from './components/Housekeeping.tsx';
import { Restaurant } from './components/Restaurant.tsx';
import { Kitchen } from './components/Kitchen.tsx';
import { Accounts } from './components/Accounts.tsx';
import { PeopleAndCulture } from './components/PeopleAndCulture.tsx';
import { useHotelData } from './hooks/useHotelData.ts';
import { useTheme } from './contexts/ThemeContext.tsx';

type View = 'dashboard' | 'reception' | 'housekeeping' | 'restaurant' | 'kitchen' | 'accounts' | 'people-and-culture';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const hotelData = useHotelData();
  const { theme } = useTheme();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard hotelData={hotelData} />;
      case 'reception':
        return <Reception hotelData={hotelData} />;
      case 'housekeeping':
        return <Housekeeping hotelData={hotelData} />;
      case 'restaurant':
        return <Restaurant hotelData={hotelData} />;
      case 'kitchen':
        return <Kitchen hotelData={hotelData} />;
      case 'accounts':
        return <Accounts hotelData={hotelData} />;
      case 'people-and-culture':
        return <PeopleAndCulture hotelData={hotelData} />;
      default:
        return <Dashboard hotelData={hotelData} />;
    }
  };

  return (
    <div className={`flex h-screen bg-slate-200 dark:bg-slate-900 text-slate-900 dark:text-slate-200 ${theme}`}>
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-200 dark:bg-slate-900 p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
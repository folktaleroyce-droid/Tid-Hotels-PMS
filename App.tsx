
import React, { useState, useEffect } from 'react';
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
import { ChannelManager } from './components/ChannelManager.tsx';
import { Maintenance } from './components/Maintenance.tsx';
import { Financials } from './components/Financials.tsx';
import { LoyaltyProgram } from './components/LoyaltyProgram.tsx';
import { WelcomeScreen } from './components/WelcomeScreen.tsx';
import { WalkIn } from './components/WalkIn.tsx';
import { Admin } from './components/Admin.tsx';
import { Support } from './components/Support.tsx';
import { Inventory } from './components/Inventory.tsx';
import { ProfileManagement } from './components/ProfileManagement.tsx';
import { NotificationContainer } from './components/common/Notification.tsx';
import { useAuth } from './contexts/AuthContext.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';

type View = 'dashboard' | 'reception' | 'housekeeping' | 'restaurant' | 'kitchen' | 'accounts' | 'people-and-culture' | 'channel-manager' | 'maintenance' | 'financials' | 'loyalty' | 'walk-in' | 'admin' | 'support' | 'inventory' | 'profiles';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const hotelData = useHotelData();
  const { theme } = useTheme();
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeScreen(false);
    }, 3000); // Display welcome screen for 3 seconds

    return () => clearTimeout(timer);
  }, []);


  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard hotelData={hotelData} />;
      case 'reception':
        return <Reception hotelData={hotelData} />;
      case 'profiles':
        return <ProfileManagement hotelData={hotelData} />;
      case 'housekeeping':
        return <Housekeeping hotelData={hotelData} />;
      case 'maintenance':
        return <Maintenance hotelData={hotelData} />;
      case 'admin':
        return <Admin />;
      case 'restaurant':
        return <Restaurant hotelData={hotelData} />;
      case 'walk-in':
        return <WalkIn />;
      case 'kitchen':
        return <Kitchen hotelData={hotelData} />;
      case 'inventory':
        return <Inventory hotelData={hotelData} />;
      case 'accounts':
        return <Accounts hotelData={hotelData} />;
      case 'financials':
        return <Financials hotelData={hotelData} />;
      case 'people-and-culture':
        return <PeopleAndCulture />;
      case 'channel-manager':
        return <ChannelManager hotelData={hotelData} />;
      case 'loyalty':
        return <LoyaltyProgram hotelData={hotelData} />;
      case 'support':
        return <Support />;
      default:
        return <Dashboard hotelData={hotelData} />;
    }
  };
  
  if (loading) {
    // A simple loading state while checking auth status
    return (
        <div className="flex items-center justify-center h-screen bg-slate-900">
            <p className="text-white text-lg">Loading Application...</p>
        </div>
    );
  }

  if (!currentUser) {
    // If not logged in, show login screen (after welcome screen)
    if (showWelcomeScreen) {
      return <WelcomeScreen />;
    }
    return <LoginScreen />;
  }

  if (showWelcomeScreen) {
    return <WelcomeScreen />;
  }

  return (
    <>
       <style>
        {`
          @keyframes fadeInRight {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .animate-fade-in-right {
            animation: fadeInRight 0.5s ease-out forwards;
          }
        `}
      </style>
      <div className={`flex h-screen bg-slate-200 dark:bg-slate-900 text-slate-900 dark:text-slate-200 ${theme}`}>
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-200 dark:bg-slate-900 p-6 print:bg-white dark:print:bg-white print:p-0">
            {renderView()}
          </main>
        </div>
        <NotificationContainer logs={hotelData.syncLog} />
      </div>
    </>
  );
}

export default App;

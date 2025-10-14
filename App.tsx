
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Reception } from './components/Reception';
import { Housekeeping } from './components/Housekeeping';
import { Restaurant } from './components/Restaurant';
import { Kitchen } from './components/Kitchen';
import { Accounts } from './components/Accounts';
import { useHotelData } from './hooks/useHotelData';
import type { View } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('Dashboard');
  const hotelData = useHotelData();

  const renderView = () => {
    switch (currentView) {
      case 'Dashboard':
        return <Dashboard hotelData={hotelData} />;
      case 'Reception':
        return <Reception hotelData={hotelData} />;
      case 'Housekeeping':
        return <Housekeeping hotelData={hotelData} />;
      case 'Restaurant':
        return <Restaurant hotelData={hotelData} />;
      case 'Kitchen':
        return <Kitchen hotelData={hotelData} />;
      case 'Accounts':
        return <Accounts hotelData={hotelData} />;
      default:
        return <Dashboard hotelData={hotelData} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentView={currentView} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;

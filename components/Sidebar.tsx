
import React from 'react';
import { ICONS } from '../constants';
import type { View } from '../types';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavItem: React.FC<{
  viewName: View;
  currentView: View;
  setCurrentView: (view: View) => void;
  children: React.ReactNode;
}> = ({ viewName, currentView, setCurrentView, children }) => {
  const isActive = currentView === viewName;
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        setCurrentView(viewName);
      }}
      className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200 ${
        isActive ? 'bg-gray-700 text-white' : ''
      }`}
    >
      <svg className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {children}
      </svg>
      {viewName}
    </a>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex-shrink-0">
      <div className="flex items-center justify-center h-20 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white">Tidé Hotels</h1>
      </div>
      <nav className="p-4 space-y-2">
        <NavItem viewName="Dashboard" currentView={currentView} setCurrentView={setCurrentView}>{ICONS.Dashboard}</NavItem>
        <NavItem viewName="Reception" currentView={currentView} setCurrentView={setCurrentView}>{ICONS.Reception}</NavItem>
        <NavItem viewName="Housekeeping" currentView={currentView} setCurrentView={setCurrentView}>{ICONS.Housekeeping}</NavItem>
        <NavItem viewName="Restaurant" currentView={currentView} setCurrentView={setCurrentView}>{ICONS.Restaurant}</NavItem>
        <NavItem viewName="Kitchen" currentView={currentView} setCurrentView={setCurrentView}>{ICONS.Kitchen}</NavItem>
        <NavItem viewName="Accounts" currentView={currentView} setCurrentView={setCurrentView}>{ICONS.Accounts}</NavItem>
      </nav>
    </div>
  );
};

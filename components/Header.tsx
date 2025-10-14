
import React from 'react';
import type { View } from '../types';

interface HeaderProps {
  currentView: View;
}

export const Header: React.FC<HeaderProps> = ({ currentView }) => {
  return (
    <header className="flex items-center justify-between h-20 px-8 bg-gray-800 border-b border-gray-700">
      <h2 className="text-3xl font-bold text-white">{currentView}</h2>
      <div className="flex items-center">
        <div className="text-right mr-4">
          <p className="font-semibold">Admin User</p>
          <p className="text-sm text-gray-400">Manager</p>
        </div>
        <img
          className="h-12 w-12 rounded-full object-cover"
          src="https://picsum.photos/100"
          alt="User avatar"
        />
      </div>
    </header>
  );
};

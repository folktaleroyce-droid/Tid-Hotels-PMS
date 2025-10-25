import { useContext } from 'react';
import { HotelDataContext } from '../contexts/HotelDataContext.tsx';
import type { HotelData } from '../types.ts';

export const useHotelData = (): HotelData => {
  const context = useContext(HotelDataContext);
  if (context === undefined) {
    throw new Error('useHotelData must be used within a HotelDataProvider');
  }
  return context;
};
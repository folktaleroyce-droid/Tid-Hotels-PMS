
import React from 'react';
import type { Room, Guest, Transaction, Order } from './types';
import { RoomStatus, OrderStatus } from './types';

export const INITIAL_ROOMS: Room[] = [
  { id: 1, number: '101', type: 'Standard', rate: 150, status: RoomStatus.Vacant },
  { id: 2, number: '102', type: 'Standard', rate: 150, status: RoomStatus.Occupied, guestId: 1 },
  { id: 3, number: '103', type: 'Standard', rate: 150, status: RoomStatus.Dirty },
  { id: 4, number: '104', type: 'Standard', rate: 150, status: RoomStatus.Vacant },
  { id: 5, number: '201', type: 'Deluxe', rate: 250, status: RoomStatus.Reserved },
  { id: 6, number: '202', type: 'Deluxe', rate: 250, status: RoomStatus.OutOfOrder },
  { id: 7, number: '203', type: 'Deluxe', rate: 250, status: RoomStatus.Occupied, guestId: 2 },
  { id: 8, number: '204', type: 'Deluxe', rate: 250, status: RoomStatus.Vacant },
  { id: 9, number: '301', type: 'Suite', rate: 400, status: RoomStatus.Vacant },
  { id: 10, number: '302', type: 'Suite', rate: 400, status: RoomStatus.Reserved },
  { id: 11, number: '303', type: 'Suite', rate: 400, status: RoomStatus.Occupied, guestId: 3 },
  { id: 12, number: '304', type: 'Suite', rate: 400, status: RoomStatus.Dirty },
];

export const INITIAL_GUESTS: Guest[] = [
  { id: 1, name: 'John Doe', checkIn: '2024-07-18', checkOut: '2024-07-22', organization: 'ECOWAS' },
  { id: 2, name: 'Jane Smith', checkIn: '2024-07-19', checkOut: '2024-07-21' },
  { id: 3, name: 'Peter Jones', checkIn: '2024-07-20', checkOut: '2024-07-25' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 1, guestId: 1, description: 'Room Charge - 1 Night', amount: 150, date: '2024-07-18' },
  { id: 2, guestId: 1, description: 'Room Service', amount: 45.50, date: '2024-07-19' },
  { id: 3, guestId: 2, description: 'Room Charge - 1 Night', amount: 250, date: '2024-07-19' },
  { id: 4, guestId: 3, description: 'Room Charge - 1 Night', amount: 400, date: '2024-07-20' },
  { id: 5, guestId: 1, description: 'Payment - POS', amount: -195.50, date: '2024-07-20' },
];

export const INITIAL_ORDERS: Order[] = [
    { id: 1, roomId: 2, roomNumber: '102', items: [{ name: 'Club Sandwich', quantity: 1 }, { name: 'Coke', quantity: 2 }], status: OrderStatus.Completed, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, roomId: 7, roomNumber: '203', items: [{ name: 'Steak Frites', quantity: 1 }], status: OrderStatus.InProgress, createdAt: new Date(Date.now() - 600000).toISOString() },
    { id: 3, roomId: 11, roomNumber: '303', items: [{ name: 'Breakfast Set', quantity: 2 }], status: OrderStatus.Pending, createdAt: new Date().toISOString() },
];

export const ROOM_STATUS_COLORS: { [key in RoomStatus]: string } = {
  [RoomStatus.Vacant]: 'bg-green-500 border-green-400',
  [RoomStatus.Occupied]: 'bg-red-500 border-red-400',
  [RoomStatus.Reserved]: 'bg-yellow-500 border-yellow-400',
  [RoomStatus.OutOfOrder]: 'bg-gray-600 border-gray-500',
  [RoomStatus.Dirty]: 'bg-orange-500 border-orange-400',
};

export const ICONS = {
    Dashboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    Reception: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
    Housekeeping: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />,
    Restaurant: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0c-.454-.303-.977-.454-1.5-.454A3.5 3.5 0 002 11.07V19h18v-7.93a3.5 3.5 0 00-1.5-.454zM12 12a3 3 0 100-6 3 3 0 000 6z" />,
    Kitchen: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
    Accounts: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
};

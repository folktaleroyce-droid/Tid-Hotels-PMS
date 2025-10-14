// FIX: Added file extension for types import.
import React from 'react';
import { Room, Guest, Transaction, Order, Employee, RoomStatus, Reservation, MaintenanceRequest, MaintenanceStatus, MaintenancePriority, PaymentStatus } from './types.ts';

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(today.getDate() - 2);
const threeDaysAgo = new Date(today);
threeDaysAgo.setDate(today.getDate() - 3);

export const ID_TYPES = [
  'International Passport',
  'NIN',
  'Driver’s License',
  'Residence Permit',
  'Other',
];

export const INITIAL_ROOMS: Room[] = [
  { id: 1, number: '101', type: 'Standard', rate: 150, status: RoomStatus.Vacant },
  { id: 2, number: '102', type: 'Standard', rate: 150, status: RoomStatus.Occupied, guestId: 1 },
  { id: 3, number: '103', type: 'Standard', rate: 150, status: RoomStatus.Dirty },
  { id: 4, number: '201', type: 'Deluxe', rate: 250, status: RoomStatus.Vacant },
  { id: 5, number: '202', type: 'Deluxe', rate: 250, status: RoomStatus.Occupied, guestId: 2 },
  { id: 6, number: '203', type: 'Deluxe', rate: 250, status: RoomStatus.OutOfOrder },
  { id: 7, number: '301', type: 'Suite', rate: 400, status: RoomStatus.Occupied, guestId: 3 },
  { id: 8, number: '302', type: 'Suite', rate: 400, status: RoomStatus.Cleaning },
];

export const INITIAL_GUESTS: Guest[] = [
  { 
    id: 1, 
    name: 'Alice Johnson', 
    email: 'alice@example.com', 
    phone: '123-456-7890', 
    birthdate: '1990-05-15',
    idType: 'Driver’s License',
    idNumber: 'A12345678', 
    nationality: 'USA',
    address: '123 Wonder Lane, New York, NY',
    arrivalDate: yesterday.toISOString().split('T')[0],
    departureDate: today.toISOString().split('T')[0],
    adults: 2,
    children: 0,
    roomNumber: '102',
    roomType: 'Standard',
    bookingSource: 'Direct',
    specialRequests: 'Prefers high floor.',
  },
  { 
    id: 2, 
    name: 'Bob Smith', 
    email: 'bob@example.com', 
    phone: '098-765-4321', 
    birthdate: '1985-11-20',
    idType: 'International Passport',
    idNumber: 'B87654321', 
    nationality: 'Canada',
    address: '456 Maple Street, Toronto, ON',
    arrivalDate: twoDaysAgo.toISOString().split('T')[0],
    departureDate: tomorrow.toISOString().split('T')[0],
    adults: 1,
    children: 1,
    roomNumber: '202',
    roomType: 'Deluxe',
    bookingSource: 'Booking.com',
  },
    { 
    id: 3, 
    name: 'Carol Danvers', 
    email: 'carol@marvel.com', 
    phone: '555-0101', 
    birthdate: '1988-04-24',
    idType: 'International Passport',
    idNumber: 'C11223344',
    nationality: 'USA',
    address: '10880 Malibu Point, Malibu, CA',
    arrivalDate: yesterday.toISOString().split('T')[0],
    departureDate: tomorrow.toISOString().split('T')[0],
    adults: 1,
    children: 0,
    roomNumber: '301',
    roomType: 'Suite',
    bookingSource: 'Direct',
  },
];


export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Guest 1: Owing (Balance: 170 > Rate: 150)
  { id: 1, guestId: 1, description: 'Room Charge', amount: 150, date: yesterday.toISOString().split('T')[0] },
  { id: 2, guestId: 1, description: 'Room Service', amount: 45.50, date: yesterday.toISOString().split('T')[0] },
  { id: 3, guestId: 1, description: 'Payment - Credit Card', amount: -25.50, date: today.toISOString().split('T')[0] },
  
  // Guest 2: Paid (Balance: 0)
  { id: 4, guestId: 2, description: 'Room Charge', amount: 250, date: twoDaysAgo.toISOString().split('T')[0] },
  { id: 5, guestId: 2, description: 'Laundry Service', amount: 35, date: yesterday.toISOString().split('T')[0] },
  { id: 6, guestId: 2, description: 'Payment - Amex', amount: -285, date: today.toISOString().split('T')[0] },
  
  // Guest 3: Pending (Balance: 100 < Rate: 400)
  { id: 7, guestId: 3, description: 'Room Charge', amount: 400, date: yesterday.toISOString().split('T')[0] },
  { id: 8, guestId: 3, description: 'Minibar', amount: 50, date: today.toISOString().split('T')[0] },
  { id: 9, guestId: 3, description: 'Payment - Cash', amount: -350, date: today.toISOString().split('T')[0] },
];

export const INITIAL_ORDERS: Order[] = [
    { id: 1, roomId: 2, items: [{ name: 'Club Sandwich', price: 18, quantity: 1 }, { name: 'Fries', price: 7, quantity: 1 }], total: 25, status: 'Delivered', createdAt: '2023-10-26T14:30:00Z' },
    { id: 2, roomId: 5, items: [{ name: 'Steak', price: 45, quantity: 2 }], total: 90, status: 'Pending', createdAt: '2023-10-27T19:00:00Z' },
    { id: 3, roomId: 2, items: [{ name: 'Caesar Salad', price: 15, quantity: 1 }], total: 15, status: 'Pending', createdAt: '2023-10-27T20:00:00Z' },
];

export const INITIAL_EMPLOYEES: Employee[] = [
    { id: 1, name: 'Charlie Brown', position: 'General Manager', salary: 90000, hireDate: '2022-01-15' },
    { id: 2, name: 'Diana Prince', position: 'Head of Housekeeping', salary: 65000, hireDate: '2022-03-01' },
    { id: 3, name: 'Ethan Hunt', position: 'Receptionist', salary: 45000, hireDate: '2023-05-20' },
];

export const INITIAL_RESERVATIONS: Reservation[] = [
    { id: 1, guestName: 'Bruce Wayne', guestEmail: 'bruce@wayne.com', guestPhone: '555-0101', checkInDate: today.toISOString().split('T')[0], checkOutDate: tomorrow.toISOString().split('T')[0], roomType: 'Suite', ota: 'Booking.com' },
    { id: 2, guestName: 'Peter Parker', guestEmail: 'peter@dailybugle.com', guestPhone: '555-0102', checkInDate: today.toISOString().split('T')[0], checkOutDate: tomorrow.toISOString().split('T')[0], roomType: 'Standard', ota: 'Expedia' },
];

export const INITIAL_MAINTENANCE_REQUESTS: MaintenanceRequest[] = [
    {
        id: 1,
        roomId: 6,
        location: 'Room 203',
        description: 'Leaky faucet in the bathroom sink.',
        reportedAt: threeDaysAgo.toISOString().split('T')[0],
        status: MaintenanceStatus.Completed,
        priority: MaintenancePriority.Medium,
    },
    {
        id: 2,
        roomId: 8,
        location: 'Room 302',
        description: 'A/C unit is not cooling properly.',
        reportedAt: yesterday.toISOString().split('T')[0],
        status: MaintenanceStatus.InProgress,
        priority: MaintenancePriority.High,
    },
    {
        id: 3,
        location: 'Lobby',
        description: 'Burnt out lightbulb in the main chandelier.',
        reportedAt: today.toISOString().split('T')[0],
        status: MaintenanceStatus.Reported,
        priority: MaintenancePriority.Low,
    },
];

export const ROOM_STATUS_THEME: { [key in RoomStatus]: { light: string; dark: string; text: string; badge: string; fill: string;} } = {
  [RoomStatus.Vacant]: { light: 'bg-green-100', dark: 'dark:bg-green-900', text: 'text-green-800 dark:text-green-200', badge: 'bg-green-500', fill: '#10B981' },
  [RoomStatus.Occupied]: { light: 'bg-blue-100', dark: 'dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200', badge: 'bg-blue-500', fill: '#3B82F6' },
  [RoomStatus.Dirty]: { light: 'bg-yellow-100', dark: 'dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200', badge: 'bg-yellow-500', fill: '#F59E0B' },
  [RoomStatus.Cleaning]: { light: 'bg-indigo-100', dark: 'dark:bg-indigo-900', text: 'text-indigo-800 dark:text-indigo-200', badge: 'bg-indigo-500', fill: '#6366F1' },
  [RoomStatus.OutOfOrder]: { light: 'bg-red-100', dark: 'dark:bg-red-900', text: 'text-red-800 dark:text-red-200', badge: 'bg-red-600', fill: '#EF4444' },
};

export const PAYMENT_STATUS_THEME: { [key in PaymentStatus]: { label: string; bg: string; text: string; icon: React.ReactNode } } = {
  [PaymentStatus.Paid]: {
    label: 'Fully Paid',
    bg: 'bg-green-100 dark:bg-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  [PaymentStatus.Pending]: {
    label: 'Pending',
    bg: 'bg-yellow-100 dark:bg-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  [PaymentStatus.Owing]: {
    label: 'Owing',
    bg: 'bg-red-100 dark:bg-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  },
};

export const MAINTENANCE_PRIORITY_THEME: { [key in MaintenancePriority]: { text: string; bg: string; } } = {
  [MaintenancePriority.Low]: { text: 'text-green-800 dark:text-green-200', bg: 'bg-green-100 dark:bg-green-900' },
  [MaintenancePriority.Medium]: { text: 'text-yellow-800 dark:text-yellow-200', bg: 'bg-yellow-100 dark:bg-yellow-900' },
  [MaintenancePriority.High]: { text: 'text-red-800 dark:text-red-200', bg: 'bg-red-100 dark:bg-red-900' },
};

export const MENU_ITEMS = [
    { name: 'Club Sandwich', price: 18, category: 'Sandwiches' },
    { name: 'Caesar Salad', price: 15, category: 'Salads' },
    { name: 'Steak Frites', price: 45, category: 'Mains' },
    { name: 'Pasta Carbonara', price: 28, category: 'Mains' },
    { name: 'Cheesecake', price: 12, category: 'Desserts' },
    { name: 'Coca-Cola', price: 5, category: 'Drinks' },
];
import React from 'react';
import { Room, Guest, Transaction, Order, Employee, RoomStatus, Reservation, MaintenanceRequest, MaintenanceStatus, MaintenancePriority, PaymentStatus, LoyaltyTier, LoyaltyTransaction, WalkInTransaction, RoomType, TaxSettings } from './types.ts';

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

export const WALK_IN_SERVICES = [
  'Restaurant',
  'Bar',
  'Gym',
  'Swimming Pool',
  'Spa',
  'Laundry Service',
  'Other',
];

export const PAYMENT_METHODS: Array<WalkInTransaction['paymentMethod']> = ['Cash', 'Card', 'Bank Transfer'];

export const CURRENCIES: Array<'NGN' | 'USD'> = ['NGN', 'USD'];

export const DEPARTMENTS = [ 'Management', 'Front Office', 'Housekeeping', 'Food & Beverage', 'Kitchen', 'Maintenance', 'Sales & Marketing', 'Human Resources', 'Finance' ];

export const INITIAL_TAX_SETTINGS: TaxSettings = {
    isEnabled: true,
    rate: 7.5,
};

export const INITIAL_ROOM_TYPES: RoomType[] = [
  { id: 1, name: 'Standard', baseRate: 150000, currency: 'NGN', capacity: 2 },
  { id: 2, name: 'Double', baseRate: 187500, currency: 'NGN', capacity: 2 },
  { id: 3, name: 'Double Executive', baseRate: 210000, currency: 'NGN', capacity: 2 },
  { id: 4, name: 'Studio', baseRate: 300000, currency: 'NGN', capacity: 3 },
  { id: 5, name: 'Aura Studio (Studio Executive)', baseRate: 375000, currency: 'NGN', capacity: 3 },
  { id: 6, name: 'Serenity Suites (Junior Suite)', baseRate: 397500, currency: 'NGN', capacity: 4 },
  { id: 7, name: 'Ile-Ife Suite (Presidential Suite)', baseRate: 450000, currency: 'NGN', capacity: 4 },
];

export const INITIAL_ROOMS: Room[] = [
  { id: 1, number: '101', type: 'Standard', rate: 150000, status: RoomStatus.Vacant },
  { id: 2, number: '102', type: 'Standard', rate: 150000, status: RoomStatus.Occupied, guestId: 1 },
  { id: 3, number: '103', type: 'Standard', rate: 150000, status: RoomStatus.Dirty },
  { id: 4, number: '201', type: 'Deluxe', rate: 250000, status: RoomStatus.Vacant },
  { id: 5, number: '202', type: 'Deluxe', rate: 250000, status: RoomStatus.Occupied, guestId: 2 },
  { id: 6, number: '203', type: 'Deluxe', rate: 250000, status: RoomStatus.Dirty },
  { id: 7, number: '301', type: 'Suite', rate: 400000, status: RoomStatus.Occupied, guestId: 3 },
  { id: 8, number: '302', type: 'Suite', rate: 400000, status: RoomStatus.Vacant },
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
    loyaltyPoints: 1620,
    loyaltyTier: LoyaltyTier.Gold,
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
    specialRequests: 'Requires a baby cot.',
    loyaltyPoints: 480,
    loyaltyTier: LoyaltyTier.Bronze,
  },
  {
    id: 3, 
    name: 'Charles Williams', 
    email: 'charles@example.com', 
    phone: '555-555-5555',
    birthdate: '1978-01-30',
    idType: 'NIN',
    idNumber: '12345678901',
    nationality: 'Nigeria',
    address: '789 Palm Avenue, Lagos, NG',
    arrivalDate: threeDaysAgo.toISOString().split('T')[0],
    departureDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    adults: 2,
    children: 2,
    roomNumber: '301',
    roomType: 'Suite',
    bookingSource: 'Expedia',
    loyaltyPoints: 5150,
    loyaltyTier: LoyaltyTier.Platinum,
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
    { id: 1, guestId: 1, description: 'Room Charge', amount: 150000, date: yesterday.toISOString().split('T')[0] },
    { id: 2, guestId: 1, description: 'Room Service', amount: 12000, date: yesterday.toISOString().split('T')[0] },
    { id: 3, guestId: 2, description: 'Room Charge', amount: 250000, date: twoDaysAgo.toISOString().split('T')[0] },
    { id: 4, guestId: 2, description: 'Room Charge', amount: 250000, date: yesterday.toISOString().split('T')[0] },
    { id: 5, guestId: 3, description: 'Room Charge', amount: 400000, date: threeDaysAgo.toISOString().split('T')[0] },
    { id: 6, guestId: 3, description: 'Payment - Credit Card', amount: -200000, date: threeDaysAgo.toISOString().split('T')[0] },
    { id: 7, guestId: 3, description: 'Room Charge', amount: 400000, date: twoDaysAgo.toISOString().split('T')[0] },
    { id: 8, guestId: 3, description: 'Room Charge', amount: 400000, date: yesterday.toISOString().split('T')[0] },
    { id: 9, guestId: 1, description: 'Payment - Cash', amount: -150000, date: today.toISOString().split('T')[0] },
    { id: 10, guestId: 2, description: 'Restaurant', amount: 20000, date: yesterday.toISOString().split('T')[0] },
];

export const INITIAL_LOYALTY_TRANSACTIONS: LoyaltyTransaction[] = [
    { id: 1, guestId: 1, points: 150, description: 'Points for stay in Room 102', date: '2023-10-15' },
    { id: 2, guestId: 1, points: 12, description: 'Room Service', date: '2023-10-15' },
    { id: 3, guestId: 1, points: 500, description: 'Birthday Bonus', date: '2024-05-15' },
    { id: 4, guestId: 3, points: 5000, description: 'Initial Sign-up Bonus', date: '2023-01-01' },
    { id: 5, guestId: 3, points: -200, description: 'Redeemed for ₦2,000.00 discount', date: yesterday.toISOString().split('T')[0] },
    { id: 6, guestId: 3, points: 350, description: 'Points for stay in Room 301', date: threeDaysAgo.toISOString().split('T')[0] },
    { id: 7, guestId: 2, points: 480, description: 'Points from previous stays', date: '2023-11-20' },
];

export const INITIAL_ORDERS: Order[] = [
    { id: 1, roomId: 2, items: [{ name: 'Jollof Rice', price: 8000, quantity: 1 }, { name: 'Water', price: 1000, quantity: 2 }], total: 10000, status: 'Delivered', createdAt: yesterday.toISOString() },
    { id: 2, roomId: 5, items: [{ name: 'Cheeseburger', price: 12000, quantity: 1 }], total: 12000, status: 'Pending', createdAt: today.toISOString() },
];

export const INITIAL_EMPLOYEES: Employee[] = [
    { id: 1, name: 'John Doe', department: 'Management', jobTitle: 'General Manager', salary: 12000000, hireDate: '2022-01-15', email: 'j.doe@tidehotels.com', phone: '08012345678', emergencyContactName: 'Mary Doe', emergencyContactPhone: '08087654321', profilePicture: '' },
    { id: 2, name: 'Jane Smith', department: 'Front Office', jobTitle: 'Front Desk Officer', salary: 4800000, hireDate: '2022-03-20', email: 'j.smith@tidehotels.com', phone: '08011223344', emergencyContactName: 'Peter Smith', emergencyContactPhone: '08044332211', profilePicture: '' },
    { id: 3, name: 'Sam Wilson', department: 'Kitchen', jobTitle: 'Head Chef', salary: 8400000, hireDate: '2021-11-10', email: 's.wilson@tidehotels.com', phone: '09098765432', emergencyContactName: 'Grace Wilson', emergencyContactPhone: '09023456789', profilePicture: '' },
];

export const INITIAL_RESERVATIONS: Reservation[] = [
    { id: 1, guestName: 'Emily Clark', guestEmail: 'emily@test.com', guestPhone: '111-222-3333', checkInDate: today.toISOString().split('T')[0], checkOutDate: tomorrow.toISOString().split('T')[0], roomType: 'Standard', ota: 'Booking.com' },
    { id: 2, guestName: 'Michael Brown', guestEmail: 'mb@test.com', guestPhone: '444-555-6666', checkInDate: tomorrow.toISOString().split('T')[0], checkOutDate: new Date(new Date().setDate(today.getDate() + 3)).toISOString().split('T')[0], roomType: 'Deluxe', ota: 'Direct' },
];

export const INITIAL_MAINTENANCE_REQUESTS: MaintenanceRequest[] = [
    { id: 1, roomId: 3, location: 'Room 103', description: 'Leaky faucet in bathroom.', reportedAt: yesterday.toISOString().split('T')[0], status: MaintenanceStatus.InProgress, priority: MaintenancePriority.Medium },
    { id: 2, location: 'Lobby', description: 'Main entrance door is sticking.', reportedAt: today.toISOString().split('T')[0], status: MaintenanceStatus.Reported, priority: MaintenancePriority.High },
    { id: 3, roomId: 7, location: 'Room 301', description: 'AC not cooling properly.', reportedAt: threeDaysAgo.toISOString().split('T')[0], status: MaintenanceStatus.Completed, priority: MaintenancePriority.High },
];

// FIX: Added MENU_ITEMS constant to be used by the Restaurant component.
export const MENU_ITEMS: { name: string; price: number }[] = [
    { name: 'Jollof Rice with Chicken', price: 8500 },
    { name: 'Fried Rice with Beef', price: 8000 },
    { name: 'Efo Riro with Pounded Yam', price: 9500 },
    { name: 'Spaghetti Bolognese', price: 12000 },
    { name: 'Classic Cheeseburger & Fries', price: 11500 },
    { name: 'Club Sandwich', price: 10000 },
    { name: 'Chicken Caesar Salad', price: 9000 },
    { name: 'Coca-Cola', price: 1000 },
    { name: 'Bottled Water', price: 800 },
    { name: 'Fresh Orange Juice', price: 2500 },
];


export const ROOM_STATUS_THEME = {
    [RoomStatus.Vacant]: { light: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-300', fill: '#10B981', badge: 'bg-green-500', dark: 'dark:border-green-700' },
    [RoomStatus.Occupied]: { light: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-300', fill: '#3B82F6', badge: 'bg-blue-500', dark: 'dark:border-blue-700' },
    [RoomStatus.Dirty]: { light: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-800 dark:text-yellow-300', fill: '#F59E0B', badge: 'bg-yellow-500', dark: 'dark:border-yellow-700' },
    [RoomStatus.Cleaning]: { light: 'bg-cyan-100 dark:bg-cyan-900/50', text: 'text-cyan-800 dark:text-cyan-300', fill: '#06B6D4', badge: 'bg-cyan-500', dark: 'dark:border-cyan-700' },
    [RoomStatus.OutOfOrder]: { light: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-300', fill: '#EF4444', badge: 'bg-red-500', dark: 'dark:border-red-700' },
};

export const LOYALTY_TIER_THEME = {
    [LoyaltyTier.Bronze]: { bg: 'bg-orange-200 dark:bg-orange-800', text: 'text-orange-800 dark:text-orange-200' },
    [LoyaltyTier.Silver]: { bg: 'bg-slate-300 dark:bg-slate-600', text: 'text-slate-800 dark:text-slate-200' },
    [LoyaltyTier.Gold]: { bg: 'bg-yellow-300 dark:bg-yellow-600', text: 'text-yellow-800 dark:text-yellow-100' },
    [LoyaltyTier.Platinum]: { bg: 'bg-indigo-300 dark:bg-indigo-700', text: 'text-indigo-800 dark:text-indigo-200' },
};

// FIX: Added MAINTENANCE_PRIORITY_THEME for use in the Maintenance component.
export const MAINTENANCE_PRIORITY_THEME = {
    [MaintenancePriority.Low]: { bg: 'bg-green-100 dark:bg-green-800', text: 'text-green-800 dark:text-green-200' },
    [MaintenancePriority.Medium]: { bg: 'bg-yellow-100 dark:bg-yellow-700', text: 'text-yellow-800 dark:text-yellow-100' },
    [MaintenancePriority.High]: { bg: 'bg-red-100 dark:bg-red-800', text: 'text-red-800 dark:text-red-200' },
};

// FIX: Moved icon component declarations before their usage in PAYMENT_STATUS_THEME to fix 'used before declaration' errors.
// FIX: Re-created icon components and added PAYMENT_STATUS_THEME to resolve import errors.
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ExclamationCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

export const PAYMENT_STATUS_THEME = {
    [PaymentStatus.Paid]: { bg: 'bg-green-100 dark:bg-green-800', text: 'text-green-800 dark:text-green-200', icon: <CheckCircleIcon />, label: 'Paid' },
    [PaymentStatus.Pending]: { bg: 'bg-yellow-100 dark:bg-yellow-700', text: 'text-yellow-800 dark:text-yellow-100', icon: <ClockIcon />, label: 'Pending' },
    [PaymentStatus.Owing]: { bg: 'bg-red-100 dark:bg-red-800', text: 'text-red-800 dark:text-red-200', icon: <ExclamationCircleIcon />, label: 'Owing' },
};
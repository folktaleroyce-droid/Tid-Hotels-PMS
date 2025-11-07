import React from 'react';
import { Room, Guest, Transaction, Order, Employee, RoomStatus, Reservation, MaintenanceRequest, MaintenanceStatus, MaintenancePriority, PaymentStatus, LoyaltyTier, LoyaltyTransaction, WalkInTransaction, RoomType, TaxSettings, Staff, UserRole } from './types.ts';

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

export const INITIAL_STAFF: Staff[] = [
    { id: 1, name: 'Faith', email: 'faith@tide.com', password: 'F@i7h#92X!', role: UserRole.FrontDesk },
    { id: 2, name: 'Goodness', email: 'goodness@tide.com', password: 'G00d*N3ss$4', role: UserRole.Housekeeping },
    { id: 3, name: 'Benjamin', email: 'benjamin@tide.com', password: 'B3nJ&9m_84', role: UserRole.Maintenance },
    { id: 4, name: 'Sandra', email: 'sandra@tide.com', password: 'S@ndR4!51%', role: UserRole.Restaurant },
    { id: 5, name: 'David', email: 'david@tide.com', password: 'D@v1D#73Q', role: UserRole.Accounts },
    { id: 6, name: 'Ifeanyi', email: 'ifeanyi@tide.com', password: '1F3@yN!88*', role: UserRole.FrontDesk },
    { id: 7, name: 'Margret', email: 'margret@tide.com', password: 'M@rG7eT_42', role: UserRole.Housekeeping },
    { id: 8, name: 'Miriam', email: 'miriam@tide.com', password: 'M1r!@m#97W', role: UserRole.Restaurant },
    { id: 9, name: 'Francis', email: 'francis@tide.com', password: 'Fr@nC1$62!', role: UserRole.Manager },
];

export const INITIAL_ROOM_TYPES: RoomType[] = [];

export const INITIAL_ROOMS: Room[] = [];

export const INITIAL_GUESTS: Guest[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_LOYALTY_TRANSACTIONS: LoyaltyTransaction[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_EMPLOYEES: Employee[] = [];

export const INITIAL_RESERVATIONS: Reservation[] = [];

export const INITIAL_MAINTENANCE_REQUESTS: MaintenanceRequest[] = [];

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
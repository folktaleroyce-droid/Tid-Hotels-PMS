
import React from 'react';
import { Room, Guest, Transaction, Order, Employee, RoomStatus, Reservation, MaintenanceRequest, MaintenanceStatus, MaintenancePriority, PaymentStatus, LoyaltyTier, LoyaltyTransaction, WalkInTransaction, RoomType, TaxSettings, Staff, UserRole, InventoryItem, Supplier, InventoryCategory } from './types.ts';

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
    { id: 1, name: 'Faith', email: 'faith@tide.com', password: 'F@i7h#92X!', role: UserRole.Manager },
    { id: 2, name: 'Goodness', email: 'goodness@tide.com', password: 'G00d*N3ss$4', role: UserRole.FrontDesk },
    { id: 3, name: 'Benjamin', email: 'benjamin@tide.com', password: 'B3nJ&9m_84', role: UserRole.Manager },
    { id: 4, name: 'Sandra', email: 'sandra@tide.com', password: 'S@ndR4!51%', role: UserRole.Housekeeping },
    { id: 5, name: 'David', email: 'david@tide.com', password: 'D@v1D#73Q', role: UserRole.Maintenance },
    { id: 6, name: 'Ifeanyi', email: 'ifeanyi@tide.com', password: '1F3@yN!88*', role: UserRole.Restaurant },
    { id: 7, name: 'Margret', email: 'margret@tide.com', password: 'M@rG7eT_42', role: UserRole.Accounts },
    { id: 8, name: 'Miriam', email: 'miriam@tide.com', password: 'M1r!@m#97W', role: UserRole.FrontDesk },
    { id: 9, name: 'Francis', email: 'francis@tide.com', password: 'Fr@nC1$62!', role: UserRole.Manager },
];

export const INITIAL_ROOM_TYPES: RoomType[] = [
    { id: 1, name: 'Standard Room', rates: { NGN: 45000, USD: 60 }, capacity: 2 },
    { id: 2, name: 'Deluxe Room', rates: { NGN: 65000, USD: 85 }, capacity: 2 },
    { id: 3, name: 'Executive Suite', rates: { NGN: 95000, USD: 125 }, capacity: 3 },
    { id: 4, name: 'Presidential Suite', rates: { NGN: 250000, USD: 330 }, capacity: 4 },
];

export const INITIAL_ROOMS: Room[] = [
    { id: 101, number: '101', type: 'Standard Room', rate: 45000, status: RoomStatus.Occupied, guestId: 1 },
    { id: 102, number: '102', type: 'Standard Room', rate: 45000, status: RoomStatus.Vacant },
    { id: 103, number: '103', type: 'Standard Room', rate: 45000, status: RoomStatus.Dirty },
    { id: 104, number: '104', type: 'Standard Room', rate: 45000, status: RoomStatus.Cleaning },
    { id: 105, number: '105', type: 'Standard Room', rate: 45000, status: RoomStatus.OutOfOrder },
    { id: 201, number: '201', type: 'Deluxe Room', rate: 65000, status: RoomStatus.Vacant },
    { id: 202, number: '202', type: 'Deluxe Room', rate: 65000, status: RoomStatus.Vacant },
    { id: 203, number: '203', type: 'Deluxe Room', rate: 65000, status: RoomStatus.Vacant },
    { id: 204, number: '204', type: 'Deluxe Room', rate: 65000, status: RoomStatus.Occupied, guestId: 2 },
    { id: 205, number: '205', type: 'Deluxe Room', rate: 65000, status: RoomStatus.Vacant },
    { id: 301, number: '301', type: 'Executive Suite', rate: 95000, status: RoomStatus.Vacant },
    { id: 302, number: '302', type: 'Executive Suite', rate: 95000, status: RoomStatus.Vacant },
    { id: 401, number: '401', type: 'Presidential Suite', rate: 250000, status: RoomStatus.Vacant },
];

export const INITIAL_RESERVATIONS: Reservation[] = [
    {
        id: 1,
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        guestPhone: '1234567890',
        checkInDate: today.toISOString().split('T')[0],
        checkOutDate: tomorrow.toISOString().split('T')[0],
        roomType: 'Deluxe Room',
        ota: 'Booking.com'
    },
    {
        id: 2,
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: '0987654321',
        checkInDate: tomorrow.toISOString().split('T')[0],
        checkOutDate: new Date(tomorrow.getTime() + 86400000 * 2).toISOString().split('T')[0],
        roomType: 'Executive Suite',
        ota: 'Expedia'
    },
    {
        id: 3,
        guestName: 'Michael Johnson',
        guestEmail: 'michael@example.com',
        guestPhone: '5551234567',
        checkInDate: today.toISOString().split('T')[0],
        checkOutDate: tomorrow.toISOString().split('T')[0],
        roomType: 'Standard Room',
        ota: 'Direct'
    }
];

export const ROOM_STATUS_THEME = {
  [RoomStatus.Vacant]: { light: 'bg-green-100', dark: 'dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', border: 'border-green-500', badge: 'bg-green-500', fill: '#22c55e' },
  [RoomStatus.Occupied]: { light: 'bg-blue-100', dark: 'dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-500', badge: 'bg-blue-500', fill: '#3b82f6' },
  [RoomStatus.Dirty]: { light: 'bg-red-100', dark: 'dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', border: 'border-red-500', badge: 'bg-red-500', fill: '#ef4444' },
  [RoomStatus.Cleaning]: { light: 'bg-yellow-100', dark: 'dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-500', badge: 'bg-yellow-500', fill: '#eab308' },
  [RoomStatus.OutOfOrder]: { light: 'bg-slate-300', dark: 'dark:bg-slate-700', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-500', badge: 'bg-slate-500', fill: '#64748b' },
};

export const MAINTENANCE_PRIORITY_THEME = {
    [MaintenancePriority.Low]: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200' },
    [MaintenancePriority.Medium]: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200' },
    [MaintenancePriority.High]: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200' },
};

export const MENU_ITEMS = [
    { name: 'Jollof Rice', price: 4500 },
    { name: 'Fried Rice', price: 4500 },
    { name: 'Grilled Chicken', price: 3500 },
    { name: 'Pepper Soup', price: 3000 },
    { name: 'Coleslaw', price: 1500 },
    { name: 'Bottle Water', price: 500 },
    { name: 'Soda', price: 700 },
    { name: 'Beer', price: 1500 },
];

export const PAYMENT_STATUS_THEME = {
    [PaymentStatus.Paid]: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', label: 'Paid', icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg> },
    [PaymentStatus.Pending]: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200', label: 'Pending', icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
    [PaymentStatus.Owing]: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200', label: 'Owing', icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> },
};

export const LOYALTY_TIER_THEME = {
    [LoyaltyTier.Bronze]: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-800 dark:text-orange-200' },
    [LoyaltyTier.Silver]: { bg: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300' },
    [LoyaltyTier.Gold]: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-800 dark:text-yellow-200' },
    [LoyaltyTier.Platinum]: { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-800 dark:text-indigo-200' },
};

// --- Inventory Constants ---
export const INITIAL_SUPPLIERS: Supplier[] = [
    { id: 1, name: 'Hotel Linens Co.', contactPerson: 'John Doe', email: 'orders@linens.com', phone: '123-456-7890', address: '123 Textile Way', category: InventoryCategory.Housekeeping },
    { id: 2, name: 'Fresh Foods Ltd.', contactPerson: 'Jane Smith', email: 'sales@freshfoods.com', phone: '098-765-4321', address: '456 Market St', category: InventoryCategory.FoodAndBeverage },
    { id: 3, name: 'City Beverages', contactPerson: 'Mike Brown', email: 'mike@citybev.com', phone: '555-123-4567', address: '789 Drink Ave', category: InventoryCategory.FoodAndBeverage }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
    { id: 1, name: 'Bath Towels', category: InventoryCategory.Housekeeping, quantity: 150, unit: 'pcs', reorderLevel: 50, costPerUnit: 2500, supplierId: 1, location: 'Linen Closet A' },
    { id: 2, name: 'Hand Towels', category: InventoryCategory.Housekeeping, quantity: 200, unit: 'pcs', reorderLevel: 80, costPerUnit: 1200, supplierId: 1, location: 'Linen Closet A' },
    { id: 3, name: 'Shampoo (Mini)', category: InventoryCategory.Housekeeping, quantity: 40, unit: 'bottles', reorderLevel: 100, costPerUnit: 150, supplierId: 1, location: 'Storage Room 1' },
    { id: 4, name: 'Soap Bars', category: InventoryCategory.Housekeeping, quantity: 300, unit: 'pcs', reorderLevel: 100, costPerUnit: 100, supplierId: 1, location: 'Storage Room 1' },
    { id: 5, name: 'Toilet Paper', category: InventoryCategory.Housekeeping, quantity: 500, unit: 'rolls', reorderLevel: 150, costPerUnit: 200, supplierId: 1, location: 'Storage Room 1' },
    { id: 6, name: 'Tomatoes', category: InventoryCategory.FoodAndBeverage, quantity: 10, unit: 'kg', reorderLevel: 15, costPerUnit: 1200, supplierId: 2, expiryDate: '2023-12-31', location: 'Kitchen Fridge' },
    { id: 7, name: 'Rice (50kg)', category: InventoryCategory.FoodAndBeverage, quantity: 2, unit: 'bags', reorderLevel: 2, costPerUnit: 45000, supplierId: 2, location: 'Pantry' },
    { id: 8, name: 'Whiskey (Jameson)', category: InventoryCategory.FoodAndBeverage, quantity: 3, unit: 'bottles', reorderLevel: 5, costPerUnit: 15000, supplierId: 3, location: 'Main Bar' },
    { id: 9, name: 'Vodka (Absolut)', category: InventoryCategory.FoodAndBeverage, quantity: 8, unit: 'bottles', reorderLevel: 5, costPerUnit: 12000, supplierId: 3, location: 'Main Bar' },
    { id: 10, name: 'Coca Cola (Crates)', category: InventoryCategory.FoodAndBeverage, quantity: 12, unit: 'crates', reorderLevel: 10, costPerUnit: 3500, supplierId: 3, location: 'Bar Storage' },
];

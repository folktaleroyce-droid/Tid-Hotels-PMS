import type { Dispatch, SetStateAction } from 'react';

export enum RoomStatus {
  Vacant = 'Vacant',
  Occupied = 'Occupied',
  Dirty = 'Dirty',
  Cleaning = 'Cleaning',
  OutOfOrder = 'Out of Order',
}

export enum PaymentStatus {
  Paid = 'Paid',
  Pending = 'Pending',
  Owing = 'Owing',
}

export enum LoyaltyTier {
    Bronze = 'Bronze',
    Silver = 'Silver',
    Gold = 'Gold',
    Platinum = 'Platinum',
}

export interface Room {
  id: number;
  number: string;
  type: string;
  rate: number;
  status: RoomStatus;
  guestId?: number;
}

export interface RoomType {
  id: number;
  name: string;
  rates: {
    NGN: number;
    USD: number;
  };
  capacity: number;
}

export interface Guest {
  id: number;
  name: string;
  email: string;
  phone: string;
  birthdate?: string;
  nationality?: string;
  idType: string;
  idNumber: string;
  idOtherType?: string;
  address?: string;
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children?: number;
  roomNumber: string;
  roomType: string;
  bookingSource: string; // Formerly 'ota'
  currency: 'NGN' | 'USD';
  discount?: number;
  specialRequests?: string;
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier;
}

export interface Reservation {
    id: number;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    checkInDate: string;
    checkOutDate: string;
    roomType: string;
    ota: string;
}

export interface Transaction {
  id: number;
  guestId: number;
  description: string;
  amount: number; // positive for charges, negative for payments
  date: string;
}

export interface LoyaltyTransaction {
    id: number;
    guestId: number;
    points: number; // positive for earned, negative for redeemed
    description: string;
    date: string;
}

export interface WalkInTransaction {
  id: number;
  service: string;
  serviceDetails?: string; // For 'Other'
  amount: number; // Gross Amount / Subtotal
  discount: number;
  tax: number;
  amountPaid: number;
  paymentMethod: 'Cash' | 'Card' | 'Bank Transfer';
  currency: 'NGN' | 'USD';
  date: string;
}

export interface Order {
  id: number;
  roomId: number;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Delivered';
  createdAt: string;
}

export interface Employee {
  id: number;
  name: string;
  department: string;
  jobTitle: string;
  salary: number;
  hireDate: string;
  email: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  profilePicture?: string; // base64 string
}

export interface SyncLogEntry {
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

export enum MaintenanceStatus {
  Reported = 'Reported',
  InProgress = 'In Progress',
  Completed = 'Completed',
}

export enum MaintenancePriority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
}

export interface MaintenanceRequest {
  id: number;
  roomId?: number;
  location: string;
  description: string;
  reportedAt: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
}

export interface TaxSettings {
    isEnabled: boolean;
    rate: number; // e.g., 7.5 for 7.5%
}

export interface HotelData {
  rooms: Room[];
  guests: Guest[];
  reservations: Reservation[];
  transactions: Transaction[];
  loyaltyTransactions: LoyaltyTransaction[];
  walkInTransactions: WalkInTransaction[];
  orders: Order[];
  employees: Employee[];
  syncLog: SyncLogEntry[];
  maintenanceRequests: MaintenanceRequest[];
  roomTypes: RoomType[];
  taxSettings: TaxSettings;
  stopSell: { [roomType: string]: boolean };
  
  // Action functions
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  updateRoomStatus: (roomId: number, status: RoomStatus, guestId?: number) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addWalkInTransaction: (transaction: Omit<WalkInTransaction, 'id' | 'date'>) => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (employee: Employee) => void;
  addReservation: (reservation: Omit<Reservation, 'id'>) => void;
  addSyncLogEntry: (message: string, level?: SyncLogEntry['level']) => void;
  updateRate: (roomType: string, newRate: number, currency: 'NGN' | 'USD') => void;
  updateGuestDetails: (guestId: number, updatedGuest: Partial<Guest>) => void;
  addMaintenanceRequest: (request: Omit<MaintenanceRequest, 'id' | 'reportedAt' | 'status'>) => void;
  updateMaintenanceRequestStatus: (requestId: number, status: MaintenanceStatus) => void;
  addLoyaltyPoints: (guestId: number, points: number, description: string) => void;
  redeemLoyaltyPoints: (guestId: number, pointsToRedeem: number) => { success: boolean, message: string };
  addRoomType: (roomType: Omit<RoomType, 'id'>) => void;
  updateRoomType: (roomType: RoomType) => void;
  deleteRoomType: (roomTypeId: number) => void;
  clearAllTransactions: () => void;
  updateOrderStatus: (orderId: number, status: Order['status']) => void;
  deleteTransaction: (transactionId: number) => void;
  deleteEmployee: (employeeId: number) => void;
  setStopSell: Dispatch<SetStateAction<{ [roomType: string]: boolean }>>; // This can remain as it's UI state
  setTaxSettings: Dispatch<SetStateAction<TaxSettings>>; // This can also remain as it's UI state
}
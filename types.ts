// FIX: Imported Dispatch and SetStateAction from React to resolve namespace errors.
import type { Dispatch, SetStateAction } from 'react';

export enum RoomStatus {
  Vacant = 'Vacant',
  Occupied = 'Occupied',
  Dirty = 'Dirty',
  Cleaning = 'Cleaning',
  OutOfOrder = 'Out of Order',
}

export interface Room {
  id: number;
  number: string;
  type: string;
  rate: number;
  status: RoomStatus;
  guestId?: number;
}

export interface Guest {
  id: number;
  name: string;
  email: string;
  phone: string;
  nationality?: string;
  idNumber?: string;
  address?: string;
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children?: number;
  roomNumber: string;
  roomType: string;
  bookingSource: string; // Formerly 'ota'
  specialRequests?: string;
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
  position: string;
  salary: number;
  hireDate: string;
}

export interface SyncLogEntry {
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

export interface HotelData {
  rooms: Room[];
  guests: Guest[];
  reservations: Reservation[];
  transactions: Transaction[];
  orders: Order[];
  employees: Employee[];
  syncLog: SyncLogEntry[];
  stopSell: { [roomType: string]: boolean };
  // FIX: Replaced React.Dispatch and React.SetStateAction with imported types.
  setRooms: Dispatch<SetStateAction<Room[]>>;
  setGuests: Dispatch<SetStateAction<Guest[]>>;
  setReservations: Dispatch<SetStateAction<Reservation[]>>;
  setTransactions: Dispatch<SetStateAction<Transaction[]>>;
  setOrders: Dispatch<SetStateAction<Order[]>>;
  setEmployees: Dispatch<SetStateAction<Employee[]>>;
  setStopSell: Dispatch<SetStateAction<{ [roomType: string]: boolean }>>;
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  updateRoomStatus: (roomId: number, status: RoomStatus, guestId?: number) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  addReservation: (reservation: Omit<Reservation, 'id'>) => void;
  addSyncLogEntry: (message: string, level?: SyncLogEntry['level']) => void;
  updateRate: (roomType: string, newRate: number) => void;
  updateGuestDetails: (guestId: number, updatedGuest: Partial<Guest>) => void;
}

import type { Dispatch, SetStateAction } from 'react';

export enum RoomStatus {
  Vacant = 'Vacant & Clean',
  Occupied = 'Occupied',
  Reserved = 'Reserved',
  OutOfOrder = 'Out of Order',
  Dirty = 'Dirty',
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
  checkIn: string;
  checkOut: string;
  organization?: string;
}

export interface Transaction {
  id: number;
  guestId: number;
  description: string;
  amount: number;
  date: string;
}

export enum OrderStatus {
  Pending = 'Pending',
  InProgress = 'In Progress',
  Completed = 'Completed',
}

export interface Order {
  id: number;
  roomId: number;
  roomNumber: string;
  items: { name: string; quantity: number }[];
  status: OrderStatus;
  createdAt: string;
}

export type View = 'Dashboard' | 'Reception' | 'Housekeeping' | 'Restaurant' | 'Kitchen' | 'Accounts';

export interface HotelData {
  rooms: Room[];
  guests: Guest[];
  transactions: Transaction[];
  orders: Order[];
  // FIX: Use Dispatch and SetStateAction types from React.
  setRooms: Dispatch<SetStateAction<Room[]>>;
  setGuests: Dispatch<SetStateAction<Guest[]>>;
  setTransactions: Dispatch<SetStateAction<Transaction[]>>;
  setOrders: Dispatch<SetStateAction<Order[]>>;
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  updateRoomStatus: (roomId: number, status: RoomStatus, guestId?: number) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}
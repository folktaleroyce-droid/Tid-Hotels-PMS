import { useState } from 'react';
// FIX: Import RoomStatus as a value, not just a type, as it is used for enum member access.
import { RoomStatus } from '../types';
import type { Room, Guest, Transaction, Order, HotelData } from '../types';
import { INITIAL_ROOMS, INITIAL_GUESTS, INITIAL_TRANSACTIONS, INITIAL_ORDERS } from '../constants';

export const useHotelData = (): HotelData => {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [guests, setGuests] = useState<Guest[]>(INITIAL_GUESTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);

  const addOrder = (order: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = {
      ...order,
      id: orders.length + 1,
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => [newOrder, ...prev]);
  };

  const updateRoomStatus = (roomId: number, status: RoomStatus, guestId?: number) => {
    setRooms(prevRooms =>
      prevRooms.map(room =>
        room.id === roomId ? { ...room, status, guestId: status === RoomStatus.Occupied ? guestId : undefined } : room
      )
    );
  };
  
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: transactions.length + 1,
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  return {
    rooms,
    guests,
    transactions,
    orders,
    setRooms,
    setGuests,
    setTransactions,
    setOrders,
    addOrder,
    updateRoomStatus,
    addTransaction
  };
};
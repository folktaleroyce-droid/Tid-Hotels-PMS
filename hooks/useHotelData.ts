import { useState } from 'react';
// FIX: Added file extensions to fix module resolution errors.
import { RoomStatus } from '../types.ts';
import type { Room, Guest, Transaction, Order, Employee, HotelData } from '../types.ts';
import { INITIAL_ROOMS, INITIAL_GUESTS, INITIAL_TRANSACTIONS, INITIAL_ORDERS, INITIAL_EMPLOYEES } from '../constants.tsx';

export const useHotelData = (): HotelData => {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [guests, setGuests] = useState<Guest[]>(INITIAL_GUESTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);

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

  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employee,
      id: employees.length + 1,
    };
    setEmployees(prev => [...prev, newEmployee]);
  };

  return {
    rooms,
    guests,
    transactions,
    orders,
    employees,
    setRooms,
    setGuests,
    setTransactions,
    setOrders,
    setEmployees,
    addOrder,
    updateRoomStatus,
    addTransaction,
    addEmployee
  };
};
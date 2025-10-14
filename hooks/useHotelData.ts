import { useState } from 'react';
// FIX: Added file extensions to fix module resolution errors.
import { RoomStatus } from '../types.ts';
import type { Room, Guest, Transaction, Order, Employee, HotelData, Reservation, SyncLogEntry } from '../types.ts';
import { INITIAL_ROOMS, INITIAL_GUESTS, INITIAL_TRANSACTIONS, INITIAL_ORDERS, INITIAL_EMPLOYEES, INITIAL_RESERVATIONS } from '../constants.tsx';

const getAvailability = (rooms: Room[]) => {
    const availability: { [key: string]: number } = {};
    rooms.forEach(room => {
        if (room.status === RoomStatus.Vacant) {
            availability[room.type] = (availability[room.type] || 0) + 1;
        }
    });
    return availability;
};

export const useHotelData = (): HotelData => {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [guests, setGuests] = useState<Guest[]>(INITIAL_GUESTS);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [syncLog, setSyncLog] = useState<SyncLogEntry[]>([]);
  const [stopSell, setStopSell] = useState<{ [roomType: string]: boolean }>({});

  const addSyncLogEntry = (message: string, level: SyncLogEntry['level'] = 'info') => {
    const newEntry: SyncLogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      level,
    };
    setSyncLog(prev => [newEntry, ...prev]);
  };

  const addOrder = (order: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = {
      ...order,
      id: orders.length + 1,
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => [newOrder, ...prev]);
  };

  const updateRoomStatus = (roomId: number, status: RoomStatus, guestId?: number) => {
    const oldAvailability = getAvailability(rooms);
    
    setRooms(prevRooms => {
        const newRooms = prevRooms.map(room =>
            room.id === roomId ? { ...room, status, guestId: status === RoomStatus.Occupied ? guestId : undefined } : room
        );

        const newAvailability = getAvailability(newRooms);
        // FIX: The original method of getting unique room types using `new Set()` was causing a TypeScript
        // inference issue, resulting in the `type` variable being `unknown` and causing an indexing error.
        // Replaced it with a `filter`-based approach to ensure correct type inference.
        // Also made the comparison more robust by handling potentially undefined availability counts.
        const roomTypes = newRooms
            .map(r => r.type)
            .filter((value, index, self) => self.indexOf(value) === index);

        roomTypes.forEach(type => {
            if ((oldAvailability[type] || 0) !== (newAvailability[type] || 0)) {
                addSyncLogEntry(`Availability change for ${type} rooms detected. Pushing update to all channels.`, 'info');
            }
        });

        return newRooms;
    });
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
  
  const addReservation = (reservation: Omit<Reservation, 'id'>) => {
    const newReservation: Reservation = {
      ...reservation,
      id: (reservations.length > 0 ? Math.max(...reservations.map(r => r.id)) : 0) + guests.length + 1,
    };
    setReservations(prev => [newReservation, ...prev]);
    addSyncLogEntry(`Successfully fetched 1 new reservation from ${reservation.ota}.`, 'success');
  };
  
  const updateRate = (roomType: string, newRate: number) => {
      setRooms(prev => prev.map(r => r.type === roomType ? {...r, rate: newRate} : r));
      addSyncLogEntry(`Rate for ${roomType} rooms updated to $${newRate}. Pushing update to all channels.`, 'info');
  };

  const updateGuestDetails = (guestId: number, updatedGuest: Partial<Guest>) => {
    let guestName = '';
    let bookingSource = '';
    setGuests(prev => prev.map(g => {
        if (g.id === guestId) {
            const newGuestData = { ...g, ...updatedGuest };
            guestName = newGuestData.name;
            bookingSource = newGuestData.bookingSource;
            return newGuestData;
        }
        return g;
    }));
    addSyncLogEntry(`Guest profile for ${guestName} updated. Pushing changes to ${bookingSource}.`, 'info');
  };

  return {
    rooms,
    guests,
    reservations,
    transactions,
    orders,
    employees,
    syncLog,
    stopSell,
    setRooms,
    setGuests,
    setReservations,
    setTransactions,
    setOrders,
    setEmployees,
    setStopSell,
    addOrder,
    updateRoomStatus,
    addTransaction,
    addEmployee,
    addReservation,
    addSyncLogEntry,
    updateRate,
    updateGuestDetails,
  };
};

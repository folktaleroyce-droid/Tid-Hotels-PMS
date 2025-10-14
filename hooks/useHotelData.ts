import { useState } from 'react';
// FIX: Added file extensions to fix module resolution errors.
// FIX: Imported MaintenanceStatus as a value to use the enum member, and removed it from the type-only import.
import { RoomStatus, MaintenanceStatus } from '../types.ts';
import type { Room, Guest, Transaction, Order, Employee, HotelData, Reservation, SyncLogEntry, MaintenanceRequest } from '../types.ts';
import { INITIAL_ROOMS, INITIAL_GUESTS, INITIAL_TRANSACTIONS, INITIAL_ORDERS, INITIAL_EMPLOYEES, INITIAL_RESERVATIONS, INITIAL_MAINTENANCE_REQUESTS } from '../constants.tsx';

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
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(INITIAL_MAINTENANCE_REQUESTS);
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
    const roomToUpdate = rooms.find(r => r.id === roomId);

    // Do nothing if room is not found or status is already the same
    if (!roomToUpdate || roomToUpdate.status === status) {
      return;
    }
    
    const oldStatus = roomToUpdate.status;
    const oldAvailability = getAvailability(rooms);

    const newRooms = rooms.map(room => {
      if (room.id === roomId) {
        // If the new status is not 'Occupied', the guestId should be cleared.
        const newGuestId = status === RoomStatus.Occupied ? guestId : undefined;
        return { ...room, status, guestId: newGuestId };
      }
      return room;
    });

    // Atomically update the state
    setRooms(newRooms);

    // --- Perform side-effects after state update ---

    // Log the specific status change to provide immediate feedback, as requested.
    addSyncLogEntry(`Room ${roomToUpdate.number} status updated from ${oldStatus} to ${status}.`, 'info');

    // Check for changes in room availability and log for OTA sync simulation.
    const newAvailability = getAvailability(newRooms);
    const roomTypes = [...new Set(newRooms.map(r => r.type))];

    // FIX: Explicitly type `type` as a string to resolve an indexing error where `type` was inferred as `unknown`.
    roomTypes.forEach((type: string) => {
      const oldAvail = oldAvailability[type] || 0;
      const newAvail = newAvailability[type] || 0;
      if (oldAvail !== newAvail) {
        addSyncLogEntry(`Availability for ${type} rooms changed: ${oldAvail} -> ${newAvail}. Pushing update to channels.`, 'info');
      }
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
  
  const addMaintenanceRequest = (request: Omit<MaintenanceRequest, 'id' | 'reportedAt' | 'status'>) => {
    const newRequest: MaintenanceRequest = {
      ...request,
      id: maintenanceRequests.length > 0 ? Math.max(...maintenanceRequests.map(r => r.id)) + 1 : 1,
      reportedAt: new Date().toISOString().split('T')[0],
      // FIX: Used MaintenanceStatus enum member instead of a string literal to fix a type error.
      status: MaintenanceStatus.Reported,
    };
    setMaintenanceRequests(prev => [newRequest, ...prev]);

    if (newRequest.roomId && newRequest.priority === 'High') {
        const room = rooms.find(r => r.id === newRequest.roomId);
        if (room && room.status !== RoomStatus.OutOfOrder) {
            updateRoomStatus(newRequest.roomId, RoomStatus.OutOfOrder);
            addSyncLogEntry(`Room ${room.number} set to 'Out of Order' due to high priority maintenance request.`, 'warn');
        }
    }
  };

  const updateMaintenanceRequestStatus = (requestId: number, status: MaintenanceStatus) => {
    const requestToUpdate = maintenanceRequests.find(req => req.id === requestId);

    setMaintenanceRequests(prev => 
      prev.map(req => req.id === requestId ? { ...req, status } : req)
    );

    if (status === MaintenanceStatus.Completed && requestToUpdate?.roomId) {
      const room = rooms.find(r => r.id === requestToUpdate.roomId);
      if (room && room.status === RoomStatus.OutOfOrder) {
        updateRoomStatus(room.id, RoomStatus.Dirty);
        addSyncLogEntry(`Maintenance for Room ${room.number} completed. Room is now available for housekeeping.`, 'success');
      }
    }
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
    maintenanceRequests,
    setRooms,
    setGuests,
    setReservations,
    setTransactions,
    setOrders,
    setEmployees,
    setMaintenanceRequests,
    setStopSell,
    addOrder,
    updateRoomStatus,
    addTransaction,
    addEmployee,
    addReservation,
    addSyncLogEntry,
    updateRate,
    updateGuestDetails,
    addMaintenanceRequest,
    updateMaintenanceRequestStatus,
  };
};
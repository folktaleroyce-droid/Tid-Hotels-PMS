import React, { createContext, useState, ReactNode } from 'react';
import { RoomStatus, MaintenanceStatus, LoyaltyTier } from '../types.ts';
import type { Room, Guest, Transaction, Order, Employee, HotelData, Reservation, SyncLogEntry, MaintenanceRequest, LoyaltyTransaction, WalkInTransaction, RoomType, TaxSettings } from '../types.ts';
import { INITIAL_ROOMS, INITIAL_GUESTS, INITIAL_TRANSACTIONS, INITIAL_LOYALTY_TRANSACTIONS, INITIAL_ORDERS, INITIAL_EMPLOYEES, INITIAL_RESERVATIONS, INITIAL_MAINTENANCE_REQUESTS, INITIAL_ROOM_TYPES, INITIAL_TAX_SETTINGS } from '../constants.tsx';

export const HotelDataContext = createContext<HotelData | undefined>(undefined);

const getAvailability = (rooms: Room[]) => {
    const availability: { [key: string]: number } = {};
    rooms.forEach(room => {
        if (room.status === RoomStatus.Vacant) {
            availability[room.type] = (availability[room.type] || 0) + 1;
        }
    });
    return availability;
};

const getLoyaltyTierForPoints = (points: number): LoyaltyTier => {
    if (points >= 5000) return LoyaltyTier.Platinum;
    if (points >= 1500) return LoyaltyTier.Gold;
    if (points >= 500) return LoyaltyTier.Silver;
    return LoyaltyTier.Bronze;
};

export const HotelDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [guests, setGuests] = useState<Guest[]>(INITIAL_GUESTS);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>(INITIAL_LOYALTY_TRANSACTIONS);
  const [walkInTransactions, setWalkInTransactions] = useState<WalkInTransaction[]>([]);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [syncLog, setSyncLog] = useState<SyncLogEntry[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(INITIAL_MAINTENANCE_REQUESTS);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>(INITIAL_ROOM_TYPES);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(INITIAL_TAX_SETTINGS);
  const [stopSell, setStopSell] = useState<{ [roomType: string]: boolean }>({});

  const addSyncLogEntry = (message: string, level: SyncLogEntry['level'] = 'info') => {
    const newEntry: SyncLogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      level,
    };
    setSyncLog(prev => [newEntry, ...prev]);
  };
  
  const addLoyaltyPoints = (guestId: number, points: number, description: string) => {
      const newLoyaltyTransaction: LoyaltyTransaction = {
          id: loyaltyTransactions.length + 1,
          guestId,
          points,
          description,
          date: new Date().toISOString().split('T')[0]
      };
      setLoyaltyTransactions(prev => [newLoyaltyTransaction, ...prev]);
      
      setGuests(prevGuests => prevGuests.map(guest => {
          if (guest.id === guestId) {
              const newTotalPoints = guest.loyaltyPoints + points;
              const newTier = getLoyaltyTierForPoints(newTotalPoints);
              if(newTier !== guest.loyaltyTier) {
                addSyncLogEntry(`Guest ${guest.name} has been upgraded to ${newTier} tier!`, 'success');
              }
              return { ...guest, loyaltyPoints: newTotalPoints, loyaltyTier: newTier };
          }
          return guest;
      }));
  };
  
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: transactions.length + 1,
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const addWalkInTransaction = (transaction: Omit<WalkInTransaction, 'id' | 'date'>) => {
    const newTransaction: WalkInTransaction = {
        ...transaction,
        id: walkInTransactions.length > 0 ? Math.max(...walkInTransactions.map(t => t.id)) + 1 : 1,
        date: new Date().toISOString().split('T')[0],
    };
    setWalkInTransactions(prev => [newTransaction, ...prev]);
    const currencySymbol = transaction.currency === 'NGN' ? '₦' : '$';
    const amountDue = transaction.amount - transaction.discount + transaction.tax;
    const balance = amountDue - transaction.amountPaid;
    const serviceName = transaction.service === 'Other' && transaction.serviceDetails ? transaction.serviceDetails : transaction.service;
    addSyncLogEntry(`Walk-in: ${serviceName} - Charge: ${currencySymbol}${amountDue.toLocaleString()}, Paid: ${currencySymbol}${transaction.amountPaid.toLocaleString()}, Balance: ${currencySymbol}${balance.toLocaleString()}`, 'success');
  };

  const redeemLoyaltyPoints = (guestId: number, pointsToRedeem: number): { success: boolean, message: string } => {
      const guest = guests.find(g => g.id === guestId);
      if (!guest) return { success: false, message: 'Guest not found.' };
      if (guest.loyaltyPoints < pointsToRedeem) return { success: false, message: 'Insufficient points.'};
      if (pointsToRedeem <= 0) return { success: false, message: 'Points to redeem must be positive.'};

      // 1 point = ₦10
      const redemptionValue = pointsToRedeem * 10;
      
      // Add a negative loyalty transaction
      addLoyaltyPoints(guestId, -pointsToRedeem, `Redeemed for ₦${redemptionValue.toFixed(2)} discount`);
      
      // Add a payment transaction to the folio
      addTransaction({
          guestId,
          description: `Loyalty Points Redemption (-${pointsToRedeem} pts)`,
          amount: -redemptionValue,
          date: new Date().toISOString().split('T')[0]
      });

      return { success: true, message: `Successfully redeemed ${pointsToRedeem} points for a ₦${redemptionValue.toFixed(2)} discount.` };
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
    
    // --- Loyalty Points Accrual on Check-out ---
    // If a room is changing from Occupied to Dirty, it signifies a check-out.
    if (roomToUpdate.status === RoomStatus.Occupied && status === RoomStatus.Dirty && roomToUpdate.guestId) {
        const checkingOutGuestId = roomToUpdate.guestId;
        const guest = guests.find(g => g.id === checkingOutGuestId);
        
        // Calculate total charges for the stay
        const totalCharges = transactions
            .filter(t => t.guestId === checkingOutGuestId && t.amount > 0)
            .reduce((acc, t) => acc + t.amount, 0);

        // Award points (e.g., 1 point per ₦1000 spent)
        const pointsEarned = Math.floor(totalCharges / 1000);
        
        if (guest && pointsEarned > 0) {
            addLoyaltyPoints(checkingOutGuestId, pointsEarned, `Points for stay in Room ${roomToUpdate.number}`);
            addSyncLogEntry(`${guest.name} earned ${pointsEarned} loyalty points from their stay.`, 'success');
        }
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

    const newAvailability = getAvailability(newRooms);
    
    // Check for changes in availability and log them
    const allRoomTypes = [...new Set([...Object.keys(oldAvailability), ...Object.keys(newAvailability)])];
    allRoomTypes.forEach(roomType => {
        const oldAvail = oldAvailability[roomType] || 0;
        const newAvail = newAvailability[roomType] || 0;
        if (oldAvail !== newAvail) {
             addSyncLogEntry(`${roomType} availability changed from ${oldAvail} to ${newAvail}. Pushing to channels.`, 'info');
        }
    });
  };

  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employee,
      id: employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1,
    };
    setEmployees(prev => [...prev, newEmployee]);
  };
  
  const updateEmployee = (updatedEmployee: Employee) => {
    setEmployees(prev => prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
    addSyncLogEntry(`Profile updated for employee: ${updatedEmployee.name}.`, 'info');
  };

  const addReservation = (reservation: Omit<Reservation, 'id'>) => {
      const availableRooms = rooms.filter(r => r.type === reservation.roomType && r.status === RoomStatus.Vacant).length;
      if(availableRooms <= 0 || stopSell[reservation.roomType]) {
          addSyncLogEntry(`New booking from ${reservation.ota} for ${reservation.roomType} REJECTED due to no availability.`, 'error');
          return;
      }
      const newReservation: Reservation = {
          ...reservation,
          id: reservations.length > 0 ? Math.max(...reservations.map(r => r.id)) + 1 : 1,
      };
      setReservations(prev => [...prev, newReservation]);
      addSyncLogEntry(`New booking received from ${reservation.ota} for ${newReservation.guestName} (${newReservation.roomType}).`, 'success');
  };
  
  const updateRate = (roomType: string, newRate: number) => {
      setRooms(prevRooms => prevRooms.map(room => room.type === roomType ? { ...room, rate: newRate } : room));
      addSyncLogEntry(`Base rate for ${roomType} rooms updated to ₦${newRate.toLocaleString()}.`, 'info');
  };

  const updateGuestDetails = (guestId: number, updatedGuest: Partial<Guest>) => {
      setGuests(prevGuests => prevGuests.map(guest => guest.id === guestId ? { ...guest, ...updatedGuest } : guest));
      addSyncLogEntry(`Profile updated for guest #${guestId}.`, 'info');
  };

  const addMaintenanceRequest = (request: Omit<MaintenanceRequest, 'id' | 'reportedAt' | 'status'>) => {
      const newRequest: MaintenanceRequest = {
          ...request,
          id: maintenanceRequests.length > 0 ? Math.max(...maintenanceRequests.map(r => r.id)) + 1 : 1,
          reportedAt: new Date().toISOString().split('T')[0],
          status: MaintenanceStatus.Reported,
      };
      setMaintenanceRequests(prev => [newRequest, ...prev]);
      addSyncLogEntry(`New maintenance request for ${newRequest.location}: "${newRequest.description}"`, 'warn');
  };

  const updateMaintenanceRequestStatus = (requestId: number, status: MaintenanceStatus) => {
      setMaintenanceRequests(prev => prev.map(req => req.id === requestId ? { ...req, status } : req));
      addSyncLogEntry(`Maintenance request #${requestId} status updated to ${status}.`, 'info');
  };

  const addRoomType = (roomType: Omit<RoomType, 'id'>) => {
    const newRoomType: RoomType = {
      ...roomType,
      id: roomTypes.length > 0 ? Math.max(...roomTypes.map(rt => rt.id)) + 1 : 1,
    };
    setRoomTypes(prev => [...prev, newRoomType]);
    addSyncLogEntry(`New room type "${newRoomType.name}" added.`, 'success');
  };

  const updateRoomType = (updatedRoomType: RoomType) => {
      setRoomTypes(prev => prev.map(rt => rt.id === updatedRoomType.id ? updatedRoomType : rt));
      addSyncLogEntry(`Room type "${updatedRoomType.name}" updated.`, 'info');
  };

  const deleteRoomType = (roomTypeId: number) => {
      const roomTypeToDelete = roomTypes.find(rt => rt.id === roomTypeId);
      if (!roomTypeToDelete) {
        addSyncLogEntry(`Attempted to delete non-existent room type ID #${roomTypeId}.`, 'error');
        return;
      }
      
      const isTypeInUse = rooms.some(room => room.type === roomTypeToDelete.name);
      if (isTypeInUse) {
        alert(`Cannot delete "${roomTypeToDelete.name}" because it is currently assigned to one or more rooms.`);
        addSyncLogEntry(`Deletion of room type "${roomTypeToDelete.name}" failed: type is in use.`, 'warn');
        return;
      }

      setRoomTypes(prev => prev.filter(rt => rt.id !== roomTypeId));
      addSyncLogEntry(`Room type "${roomTypeToDelete.name}" has been deleted.`, 'info');
  };


  const value: HotelData = {
    rooms,
    guests,
    reservations,
    transactions,
    loyaltyTransactions,
    walkInTransactions,
    orders,
    employees,
    syncLog,
    maintenanceRequests,
    roomTypes,
    taxSettings,
    stopSell,
    setRooms,
    setGuests,
    setReservations,
    setTransactions,
    setLoyaltyTransactions,
    setWalkInTransactions,
    setOrders,
    setEmployees,
    setMaintenanceRequests,
    setRoomTypes,
    setTaxSettings,
    setStopSell,
    addOrder,
    updateRoomStatus,
    addTransaction,
    addWalkInTransaction,
    addEmployee,
    updateEmployee,
    addReservation,
    addSyncLogEntry,
    updateRate,
    updateGuestDetails,
    addMaintenanceRequest,
    updateMaintenanceRequestStatus,
    addLoyaltyPoints,
    redeemLoyaltyPoints,
    addRoomType,
    updateRoomType,
    deleteRoomType,
  };

  return (
    <HotelDataContext.Provider value={value}>
      {children}
    </HotelDataContext.Provider>
  );
};
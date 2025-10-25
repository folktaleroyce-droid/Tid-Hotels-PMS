import React, { createContext, useState, ReactNode, useEffect, useRef } from 'react';
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
  const [rooms, _setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [guests, _setGuests] = useState<Guest[]>(INITIAL_GUESTS);
  const [reservations, _setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [transactions, _setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [loyaltyTransactions, _setLoyaltyTransactions] = useState<LoyaltyTransaction[]>(INITIAL_LOYALTY_TRANSACTIONS);
  const [walkInTransactions, _setWalkInTransactions] = useState<WalkInTransaction[]>([]);
  const [orders, _setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [employees, _setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [syncLog, _setSyncLog] = useState<SyncLogEntry[]>([]);
  const [maintenanceRequests, _setMaintenanceRequests] = useState<MaintenanceRequest[]>(INITIAL_MAINTENANCE_REQUESTS);
  const [roomTypes, _setRoomTypes] = useState<RoomType[]>(INITIAL_ROOM_TYPES);
  const [taxSettings, _setTaxSettings] = useState<TaxSettings>(INITIAL_TAX_SETTINGS);
  const [stopSell, _setStopSell] = useState<{ [roomType: string]: boolean }>({});

  const channelRef = useRef<BroadcastChannel>();
  const isExternalUpdate = useRef(false);

  useEffect(() => {
    channelRef.current = new BroadcastChannel('tide_pms_state_sync');
    const channel = channelRef.current;
    
    const handleMessage = (event: MessageEvent) => {
        isExternalUpdate.current = true;
        const { type, payload } = event.data;
        switch (type) {
            case 'SET_ROOMS': _setRooms(payload); break;
            case 'SET_GUESTS': _setGuests(payload); break;
            case 'SET_RESERVATIONS': _setReservations(payload); break;
            case 'SET_TRANSACTIONS': _setTransactions(payload); break;
            case 'SET_LOYALTY_TRANSACTIONS': _setLoyaltyTransactions(payload); break;
            case 'SET_WALKIN_TRANSACTIONS': _setWalkInTransactions(payload); break;
            case 'SET_ORDERS': _setOrders(payload); break;
            case 'SET_EMPLOYEES': _setEmployees(payload); break;
            case 'SET_SYNCLOG': _setSyncLog(payload); break;
            case 'SET_MAINTENANCE_REQUESTS': _setMaintenanceRequests(payload); break;
            case 'SET_ROOMTYPES': _setRoomTypes(payload); break;
            case 'SET_TAX_SETTINGS': _setTaxSettings(payload); break;
            case 'SET_STOPSELL': _setStopSell(payload); break;
        }
        setTimeout(() => { isExternalUpdate.current = false; }, 0);
    };

    channel.addEventListener('message', handleMessage);

    return () => {
        channel.removeEventListener('message', handleMessage);
        channel.close();
    };
  }, []);

  const createSyncedSetter = <T,>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    messageType: string
  ): React.Dispatch<React.SetStateAction<T>> => {
    return (valueOrFn) => {
      setter((prevState) => {
        const newState = typeof valueOrFn === 'function'
          ? (valueOrFn as (prevState: T) => T)(prevState)
          : valueOrFn;
        
        if (!isExternalUpdate.current) {
          channelRef.current?.postMessage({ type: messageType, payload: newState });
        }
        
        return newState;
      });
    };
  };

  const setRooms = createSyncedSetter(_setRooms, 'SET_ROOMS');
  const setGuests = createSyncedSetter(_setGuests, 'SET_GUESTS');
  const setReservations = createSyncedSetter(_setReservations, 'SET_RESERVATIONS');
  const setTransactions = createSyncedSetter(_setTransactions, 'SET_TRANSACTIONS');
  const setLoyaltyTransactions = createSyncedSetter(_setLoyaltyTransactions, 'SET_LOYALTY_TRANSACTIONS');
  const setWalkInTransactions = createSyncedSetter(_setWalkInTransactions, 'SET_WALKIN_TRANSACTIONS');
  const setOrders = createSyncedSetter(_setOrders, 'SET_ORDERS');
  const setEmployees = createSyncedSetter(_setEmployees, 'SET_EMPLOYEES');
  const setSyncLog = createSyncedSetter(_setSyncLog, 'SET_SYNCLOG');
  const setMaintenanceRequests = createSyncedSetter(_setMaintenanceRequests, 'SET_MAINTENANCE_REQUESTS');
  const setRoomTypes = createSyncedSetter(_setRoomTypes, 'SET_ROOMTYPES');
  const setTaxSettings = createSyncedSetter(_setTaxSettings, 'SET_TAX_SETTINGS');
  const setStopSell = createSyncedSetter(_setStopSell, 'SET_STOPSELL');

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
    const guestName = guests.find(g => g.id === transaction.guestId)?.name || 'Unknown Guest';
    const type = transaction.amount > 0 ? 'charge' : 'payment';
    const amount = Math.abs(transaction.amount).toLocaleString();
    const currencySymbol = '₦'; // Assuming NGN for in-house for now
    addSyncLogEntry(`Posted ${type} of ${currencySymbol}${amount} for ${guestName}.`, 'info');
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
      id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1,
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => [newOrder, ...prev]);
    const roomNumber = rooms.find(r => r.id === order.roomId)?.number || 'N/A';
    addSyncLogEntry(`New room service order for Room ${roomNumber} (Total: ₦${order.total.toLocaleString()}).`, 'success');
  };

  const updateRoomStatus = (roomId: number, status: RoomStatus, guestId?: number) => {
    const roomToUpdate = rooms.find(r => r.id === roomId);

    if (!roomToUpdate || roomToUpdate.status === status) {
      return;
    }

    if (roomToUpdate.status === RoomStatus.Occupied && status === RoomStatus.Dirty && roomToUpdate.guestId) {
        const checkingOutGuestId = roomToUpdate.guestId;
        const guest = guests.find(g => g.id === checkingOutGuestId);
        
        const totalCharges = transactions
            .filter(t => t.guestId === checkingOutGuestId && t.amount > 0)
            .reduce((acc, t) => acc + t.amount, 0);

        const pointsEarned = Math.floor(totalCharges / 1000);
        
        if (guest) {
            if (pointsEarned > 0) {
                 const newLoyaltyTransaction: LoyaltyTransaction = {
                    id: loyaltyTransactions.length + 1,
                    guestId: checkingOutGuestId,
                    points: pointsEarned,
                    description: `Points for stay in Room ${roomToUpdate.number}`,
                    date: new Date().toISOString().split('T')[0]
                };
                setLoyaltyTransactions(prev => [newLoyaltyTransaction, ...prev]);
            }

            setGuests(prevGuests => prevGuests.map(g => {
                if (g.id === checkingOutGuestId) {
                    const newTotalPoints = g.loyaltyPoints + pointsEarned;
                    const newTier = getLoyaltyTierForPoints(newTotalPoints);
                    if (newTier !== g.loyaltyTier) {
                        addSyncLogEntry(`Guest ${g.name} has been upgraded to ${newTier} tier!`, 'success');
                    }
                    if (pointsEarned > 0) {
                         addSyncLogEntry(`${g.name} earned ${pointsEarned} loyalty points from their stay.`, 'success');
                    }
                    return { ...g, loyaltyPoints: newTotalPoints, loyaltyTier: newTier, roomNumber: '' };
                }
                return g;
            }));
        }
    }
    
    const oldStatus = roomToUpdate.status;
    const oldAvailability = getAvailability(rooms);

    const newRooms = rooms.map(room => {
      if (room.id === roomId) {
        const newGuestId = status === RoomStatus.Occupied ? guestId : undefined;
        return { ...room, status, guestId: newGuestId };
      }
      return room;
    });

    setRooms(newRooms);

    addSyncLogEntry(`Room ${roomToUpdate.number} status updated from ${oldStatus} to ${status}.`, 'info');

    const newAvailability = getAvailability(newRooms);
    
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
    addSyncLogEntry(`New employee added: ${newEmployee.name} (${newEmployee.jobTitle}).`, 'success');
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
  
  const updateRate = (roomType: string, newRate: number, currency: 'NGN' | 'USD') => {
      setRoomTypes(prev => prev.map(rt => {
        if (rt.name === roomType) {
            const newRates = { ...rt.rates, [currency]: newRate };
            return { ...rt, rates: newRates };
        }
        return rt;
      }));
      setRooms(prevRooms => prevRooms.map(room => {
          if (room.type === roomType && room.status === RoomStatus.Vacant && currency === 'NGN') { 
              return { ...room, rate: newRate };
          }
          return room;
      }));
      const currencySymbol = currency === 'NGN' ? '₦' : '$';
      addSyncLogEntry(`Base rate for ${roomType} rooms updated to ${currencySymbol}${newRate.toLocaleString()} (${currency}).`, 'info');
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
      const oldRoomType = roomTypes.find(rt => rt.id === updatedRoomType.id);
      if (oldRoomType && oldRoomType.rates.NGN !== updatedRoomType.rates.NGN) {
          setRooms(prevRooms => prevRooms.map(room => {
              if (room.type === updatedRoomType.name && room.status === RoomStatus.Vacant) {
                  return { ...room, rate: updatedRoomType.rates.NGN };
              }
              return room;
          }));
      }
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

  const clearAllTransactions = () => {
    setTransactions([]);
    setLoyaltyTransactions([]);
    setWalkInTransactions([]);
    setOrders([]);
    addSyncLogEntry('All transaction data has been cleared.', 'warn');
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
    clearAllTransactions,
  };

  return (
    <HotelDataContext.Provider value={value}>
      {children}
    </HotelDataContext.Provider>
  );
};
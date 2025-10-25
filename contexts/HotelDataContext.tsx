import React, { createContext, useState, ReactNode, useEffect, useRef } from 'react';
import { RoomStatus, MaintenanceStatus, LoyaltyTier } from '../types.ts';
import type { Room, Guest, Transaction, Order, Employee, HotelData, Reservation, SyncLogEntry, MaintenanceRequest, LoyaltyTransaction, WalkInTransaction, RoomType, TaxSettings } from '../types.ts';
import { INITIAL_ROOMS, INITIAL_GUESTS, INITIAL_TRANSACTIONS, INITIAL_LOYALTY_TRANSACTIONS, INITIAL_ORDERS, INITIAL_EMPLOYEES, INITIAL_RESERVATIONS, INITIAL_MAINTENANCE_REQUESTS, INITIAL_ROOM_TYPES, INITIAL_TAX_SETTINGS } from '../constants.tsx';

export const HotelDataContext = createContext<HotelData | undefined>(undefined);

const INITIAL_STATE = {
    rooms: INITIAL_ROOMS,
    guests: INITIAL_GUESTS,
    reservations: INITIAL_RESERVATIONS,
    transactions: INITIAL_TRANSACTIONS,
    loyaltyTransactions: INITIAL_LOYALTY_TRANSACTIONS,
    walkInTransactions: [],
    orders: INITIAL_ORDERS,
    employees: INITIAL_EMPLOYEES,
    syncLog: [],
    maintenanceRequests: INITIAL_MAINTENANCE_REQUESTS,
    roomTypes: INITIAL_ROOM_TYPES,
    taxSettings: INITIAL_TAX_SETTINGS,
    stopSell: {},
};
type HotelState = typeof INITIAL_STATE;


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
  const [state, _setState] = useState<HotelState>(INITIAL_STATE);
  const channelRef = useRef<BroadcastChannel>();
  const isExternalUpdate = useRef(false);

  useEffect(() => {
    channelRef.current = new BroadcastChannel('tide_pms_state_sync');
    const channel = channelRef.current;
    
    const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'STATE_UPDATE') {
            isExternalUpdate.current = true;
            _setState(event.data.payload);
            requestAnimationFrame(() => {
                isExternalUpdate.current = false;
            });
        }
    };

    channel.addEventListener('message', handleMessage);

    return () => {
        channel.removeEventListener('message', handleMessage);
        channel.close();
    };
  }, []);
  
  const setState = (updater: (prevState: HotelState) => HotelState) => {
      _setState(prevState => {
          const newState = updater(prevState);
          if (!isExternalUpdate.current && newState !== prevState) {
              channelRef.current?.postMessage({ type: 'STATE_UPDATE', payload: newState });
          }
          return newState;
      });
  };

  const addSyncLogEntry = (message: string, level: SyncLogEntry['level'] = 'info') => {
    const newEntry: SyncLogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      level,
    };
    setState(prev => ({ ...prev, syncLog: [newEntry, ...prev.syncLog] }));
  };
  
  const addLoyaltyPoints = (guestId: number, points: number, description: string) => {
      setState(prev => {
        const newLoyaltyTransaction: LoyaltyTransaction = {
            id: (prev.loyaltyTransactions[0]?.id || 0) + 1,
            guestId,
            points,
            description,
            date: new Date().toISOString().split('T')[0]
        };
        
        let logMessage: string | null = null;
        const newGuests = prev.guests.map(guest => {
            if (guest.id === guestId) {
                const newTotalPoints = guest.loyaltyPoints + points;
                const newTier = getLoyaltyTierForPoints(newTotalPoints);
                if(newTier !== guest.loyaltyTier) {
                  logMessage = `Guest ${guest.name} has been upgraded to ${newTier} tier!`;
                }
                return { ...guest, loyaltyPoints: newTotalPoints, loyaltyTier: newTier };
            }
            return guest;
        });

        const newSyncLog = logMessage ? [
            { timestamp: new Date().toLocaleTimeString(), message: logMessage, level: 'success' as const },
             ...prev.syncLog
            ] : prev.syncLog;

        return {
          ...prev,
          guests: newGuests,
          loyaltyTransactions: [newLoyaltyTransaction, ...prev.loyaltyTransactions],
          syncLog: newSyncLog,
        };
      });
  };
  
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    setState(prev => {
      const newTransaction: Transaction = {
        ...transaction,
        id: (prev.transactions[0]?.id || 0) + 1,
      };
      
      const guestName = prev.guests.find(g => g.id === transaction.guestId)?.name || 'Unknown Guest';
      const type = transaction.amount > 0 ? 'charge' : 'payment';
      const amount = Math.abs(transaction.amount).toLocaleString();
      const currencySymbol = '₦';
      const logMessage = `Posted ${type} of ${currencySymbol}${amount} for ${guestName}.`;
      const newSyncLogEntry: SyncLogEntry = { timestamp: new Date().toLocaleTimeString(), message: logMessage, level: 'info' };

      return {
        ...prev,
        transactions: [...prev.transactions, newTransaction],
        syncLog: [newSyncLogEntry, ...prev.syncLog],
      };
    });
  };

  const addWalkInTransaction = (transaction: Omit<WalkInTransaction, 'id' | 'date'>) => {
    setState(prev => {
      const newTransaction: WalkInTransaction = {
          ...transaction,
          id: (prev.walkInTransactions[0]?.id || 0) + 1,
          date: new Date().toISOString().split('T')[0],
      };
      
      const currencySymbol = transaction.currency === 'NGN' ? '₦' : '$';
      const amountDue = transaction.amount - transaction.discount + transaction.tax;
      const balance = amountDue - transaction.amountPaid;
      const serviceName = transaction.service === 'Other' && transaction.serviceDetails ? transaction.serviceDetails : transaction.service;
      const logMessage = `Walk-in: ${serviceName} - Charge: ${currencySymbol}${amountDue.toLocaleString()}, Paid: ${currencySymbol}${transaction.amountPaid.toLocaleString()}, Balance: ${currencySymbol}${balance.toLocaleString()}`;
      const newSyncLogEntry: SyncLogEntry = { timestamp: new Date().toLocaleTimeString(), message: logMessage, level: 'success' };

      return {
        ...prev,
        walkInTransactions: [newTransaction, ...prev.walkInTransactions],
        syncLog: [newSyncLogEntry, ...prev.syncLog],
      };
    });
  };

  const redeemLoyaltyPoints = (guestId: number, pointsToRedeem: number): { success: boolean, message: string } => {
      let result = { success: false, message: 'An unknown error occurred.' };
      setState(prev => {
          const guest = prev.guests.find(g => g.id === guestId);
          if (!guest) {
              result = { success: false, message: 'Guest not found.' };
              return prev;
          }
          if (guest.loyaltyPoints < pointsToRedeem) {
              result = { success: false, message: 'Insufficient points.'};
              return prev;
          }
          if (pointsToRedeem <= 0) {
              result = { success: false, message: 'Points to redeem must be positive.'};
              return prev;
          }

          const redemptionValue = pointsToRedeem * 10;
          
          const loyaltyDescription = `Redeemed for ₦${redemptionValue.toFixed(2)} discount`;
          const folioDescription = `Loyalty Points Redemption (-${pointsToRedeem} pts)`;
          result = { success: true, message: `Successfully redeemed ${pointsToRedeem} points for a ₦${redemptionValue.toFixed(2)} discount.` };

          const newLoyaltyTransaction: LoyaltyTransaction = {
              id: (prev.loyaltyTransactions[0]?.id || 0) + 1,
              guestId,
              points: -pointsToRedeem,
              description: loyaltyDescription,
              date: new Date().toISOString().split('T')[0]
          };

          const newFolioTransaction: Transaction = {
              id: (prev.transactions[0]?.id || 0) + 1,
              guestId,
              description: folioDescription,
              amount: -redemptionValue,
              date: new Date().toISOString().split('T')[0]
          };
          
          const newGuests = prev.guests.map(g => g.id === guestId ? { ...g, loyaltyPoints: g.loyaltyPoints - pointsToRedeem } : g);

          return {
              ...prev,
              guests: newGuests,
              transactions: [...prev.transactions, newFolioTransaction],
              loyaltyTransactions: [newLoyaltyTransaction, ...prev.loyaltyTransactions],
          };
      });
      return result;
  };

  const addOrder = (order: Omit<Order, 'id' | 'createdAt'>) => {
    setState(prev => {
      const newOrder: Order = {
        ...order,
        id: (prev.orders[0]?.id || 0) + 1,
        createdAt: new Date().toISOString(),
      };
      const roomNumber = prev.rooms.find(r => r.id === order.roomId)?.number || 'N/A';
      const logMessage = `New room service order for Room ${roomNumber} (Total: ₦${order.total.toLocaleString()}).`;
      const newSyncLogEntry: SyncLogEntry = { timestamp: new Date().toLocaleTimeString(), message: logMessage, level: 'success' };
      return { ...prev, orders: [newOrder, ...prev.orders], syncLog: [newSyncLogEntry, ...prev.syncLog] };
    });
  };

  const updateRoomStatus = (roomId: number, status: RoomStatus, guestId?: number) => {
      setState(prev => {
          const roomToUpdate = prev.rooms.find(r => r.id === roomId);
          if (!roomToUpdate || roomToUpdate.status === status) return prev;
          
          let logMessages: { message: string, level: SyncLogEntry['level'] }[] = [];
          logMessages.push({ message: `Room ${roomToUpdate.number} status updated from ${roomToUpdate.status} to ${status}.`, level: 'info' });

          const oldAvailability = getAvailability(prev.rooms);
          let newGuests = [...prev.guests];
          let newLoyaltyTransactions = [...prev.loyaltyTransactions];

          if (roomToUpdate.status === RoomStatus.Occupied && status === RoomStatus.Dirty && roomToUpdate.guestId) {
              const guest = prev.guests.find(g => g.id === roomToUpdate.guestId);
              const totalCharges = prev.transactions.filter(t => t.guestId === roomToUpdate.guestId && t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
              const pointsEarned = Math.floor(totalCharges / 1000);
              
              if (guest) {
                  if (pointsEarned > 0) {
                       const newLT: LoyaltyTransaction = { id: (prev.loyaltyTransactions[0]?.id || 0) + 1, guestId: guest.id, points: pointsEarned, description: `Points for stay`, date: new Date().toISOString().split('T')[0] };
                       newLoyaltyTransactions = [newLT, ...newLoyaltyTransactions];
                  }
                  newGuests = newGuests.map(g => {
                      if (g.id === guest.id) {
                          const newTotalPoints = g.loyaltyPoints + pointsEarned;
                          const newTier = getLoyaltyTierForPoints(newTotalPoints);
                          if (newTier !== g.loyaltyTier) logMessages.push({ message: `Guest ${g.name} has been upgraded to ${newTier} tier!`, level: 'success' });
                          if (pointsEarned > 0) logMessages.push({ message: `${g.name} earned ${pointsEarned} loyalty points.`, level: 'success' });
                          return { ...g, loyaltyPoints: newTotalPoints, loyaltyTier: newTier, roomNumber: '' };
                      }
                      return g;
                  });
              }
          }

          const newRooms = prev.rooms.map(room => room.id === roomId ? { ...room, status, guestId: status === RoomStatus.Occupied ? guestId : undefined } : room);
          
          const newAvailability = getAvailability(newRooms);
          [...new Set([...Object.keys(oldAvailability), ...Object.keys(newAvailability)])].forEach(roomType => {
              const oldAvail = oldAvailability[roomType] || 0;
              const newAvail = newAvailability[roomType] || 0;
              if (oldAvail !== newAvail) logMessages.push({ message: `${roomType} availability changed: ${oldAvail} -> ${newAvail}.`, level: 'info' });
          });

          const newSyncLogEntries = logMessages.map(log => ({ ...log, timestamp: new Date().toLocaleTimeString() }));
          return { ...prev, rooms: newRooms, guests: newGuests, loyaltyTransactions: newLoyaltyTransactions, syncLog: [...newSyncLogEntries.reverse(), ...prev.syncLog] };
      });
  };

  const addEmployee = (employee: Omit<Employee, 'id'>) => {
      setState(prev => {
          const newEmployee: Employee = { ...employee, id: (prev.employees[0]?.id || 0) + 1 };
          const newSyncLogEntry: SyncLogEntry = { timestamp: new Date().toLocaleTimeString(), message: `New employee added: ${newEmployee.name}.`, level: 'success' };
          return { ...prev, employees: [...prev.employees, newEmployee], syncLog: [newSyncLogEntry, ...prev.syncLog] };
      });
  };
  
  const updateEmployee = (updatedEmployee: Employee) => {
      setState(prev => {
          const newSyncLogEntry: SyncLogEntry = { timestamp: new Date().toLocaleTimeString(), message: `Profile updated for ${updatedEmployee.name}.`, level: 'info' };
          return { ...prev, employees: prev.employees.map(e => e.id === updatedEmployee.id ? updatedEmployee : e), syncLog: [newSyncLogEntry, ...prev.syncLog] };
      });
  };

  const addReservation = (reservation: Omit<Reservation, 'id'>) => {
      setState(prev => {
          const availableRooms = prev.rooms.filter(r => r.type === reservation.roomType && r.status === RoomStatus.Vacant).length;
          if (availableRooms <= 0 || prev.stopSell[reservation.roomType]) {
              const logMessage = `Booking from ${reservation.ota} for ${reservation.roomType} REJECTED (no availability).`;
              const newSyncLogEntry: SyncLogEntry = { timestamp: new Date().toLocaleTimeString(), message: logMessage, level: 'error' };
              return { ...prev, syncLog: [newSyncLogEntry, ...prev.syncLog] };
          }
          const newReservation: Reservation = { ...reservation, id: (prev.reservations[0]?.id || 0) + 1 };
          const logMessage = `New booking from ${reservation.ota} for ${newReservation.guestName} (${newReservation.roomType}).`;
          const newSyncLogEntry: SyncLogEntry = { timestamp: new Date().toLocaleTimeString(), message: logMessage, level: 'success' };
          return { ...prev, reservations: [...prev.reservations, newReservation], syncLog: [newSyncLogEntry, ...prev.syncLog] };
      });
  };
  
  const updateRate = (roomType: string, newRate: number, currency: 'NGN' | 'USD') => {
      setState(prev => {
          const newRoomTypes = prev.roomTypes.map(rt => rt.name === roomType ? { ...rt, rates: { ...rt.rates, [currency]: newRate } } : rt);
          const newRooms = prev.rooms.map(room => (room.type === roomType && room.status === RoomStatus.Vacant && currency === 'NGN') ? { ...room, rate: newRate } : room);
          const logMessage = `Base rate for ${roomType} updated to ${currency === 'NGN' ? '₦' : '$'}${newRate.toLocaleString()} (${currency}).`;
          const newSyncLogEntry: SyncLogEntry = { timestamp: new Date().toLocaleTimeString(), message: logMessage, level: 'info' };
          return { ...prev, roomTypes: newRoomTypes, rooms: newRooms, syncLog: [newSyncLogEntry, ...prev.syncLog] };
      });
  };

  const updateGuestDetails = (guestId: number, updatedGuest: Partial<Guest>) => {
      setState(prev => {
          const logMessage = `Profile updated for guest #${guestId}.`;
          const newSyncLogEntry: SyncLogEntry = { timestamp: new Date().toLocaleTimeString(), message: logMessage, level: 'info' };
          return { ...prev, guests: prev.guests.map(g => g.id === guestId ? { ...g, ...updatedGuest } : g), syncLog: [newSyncLogEntry, ...prev.syncLog] };
      });
  };

  const addMaintenanceRequest = (request: Omit<MaintenanceRequest, 'id' | 'reportedAt' | 'status'>) => {
      setState(prev => {
          const newRequest: MaintenanceRequest = { ...request, id: (prev.maintenanceRequests[0]?.id || 0) + 1, reportedAt: new Date().toISOString().split('T')[0], status: MaintenanceStatus.Reported };
          const logMessage = `New maintenance request for ${newRequest.location}: "${newRequest.description}"`;
          const newSyncLogEntry: SyncLogEntry = { timestamp: new Date().toLocaleTimeString(), message: logMessage, level: 'warn' };
          return { ...prev, maintenanceRequests: [newRequest, ...prev.maintenanceRequests], syncLog: [newSyncLogEntry, ...prev.syncLog] };
      });
  };

  const updateMaintenanceRequestStatus = (requestId: number, status: MaintenanceStatus) => {
      setState(prev => {
          const logMessage = `Maintenance request #${requestId} status updated to ${status}.`;
          const newSyncLogEntry: SyncLogEntry = { timestamp: new Date().toLocaleTimeString(), message: logMessage, level: 'info' };
          return { ...prev, maintenanceRequests: prev.maintenanceRequests.map(req => req.id === requestId ? { ...req, status } : req), syncLog: [newSyncLogEntry, ...prev.syncLog] };
      });
  };

  const addRoomType = (roomType: Omit<RoomType, 'id'>) => {
      setState(prev => {
          const newRoomType: RoomType = { ...roomType, id: (prev.roomTypes[0]?.id || 0) + 1 };
          const logMessage = `New room type "${newRoomType.name}" added.`;
          const newSyncLogEntry: SyncLogEntry = { timestamp: new Date().toLocaleTimeString(), message: logMessage, level: 'success' };
          return { ...prev, roomTypes: [...prev.roomTypes, newRoomType], syncLog: [newSyncLogEntry, ...prev.syncLog] };
      });
  };

  const updateRoomType = (updatedRoomType: RoomType) => {
      setState(prev => {
          const oldRoomType = prev.roomTypes.find(rt => rt.id === updatedRoomType.id);
          let newRooms = prev.rooms;
          if (oldRoomType && oldRoomType.rates.NGN !== updatedRoomType.rates.NGN) {
              newRooms = prev.rooms.map(room => (room.type === updatedRoomType.name && room.status === RoomStatus.Vacant) ? { ...room, rate: updatedRoomType.rates.NGN } : room);
          }
          const logMessage = `Room type "${updatedRoomType.name}" updated.`;
          const newSyncLogEntry: SyncLogEntry = { timestamp: new Date().toLocaleTimeString(), message: logMessage, level: 'info' };
          return { ...prev, rooms: newRooms, roomTypes: prev.roomTypes.map(rt => rt.id === updatedRoomType.id ? updatedRoomType : rt), syncLog: [newSyncLogEntry, ...prev.syncLog] };
      });
  };

  const deleteRoomType = (roomTypeId: number) => {
      setState(prev => {
          const roomTypeToDelete = prev.roomTypes.find(rt => rt.id === roomTypeId);
          if (!roomTypeToDelete) return prev;
          
          if (prev.rooms.some(room => room.type === roomTypeToDelete.name)) {
              alert(`Cannot delete "${roomTypeToDelete.name}" because it is assigned to rooms.`);
              return prev;
          }
          const logMessage = `Room type "${roomTypeToDelete.name}" has been deleted.`;
          const newSyncLogEntry: SyncLogEntry = { timestamp: new Date().toLocaleTimeString(), message: logMessage, level: 'info' };
          return { ...prev, roomTypes: prev.roomTypes.filter(rt => rt.id !== roomTypeId), syncLog: [newSyncLogEntry, ...prev.syncLog] };
      });
  };

  const clearAllTransactions = () => {
      setState(prev => {
          const logMessage = 'All transaction data has been cleared.';
          const newSyncLogEntry: SyncLogEntry = { timestamp: new Date().toLocaleTimeString(), message: logMessage, level: 'warn' };
          return { ...prev, transactions: [], loyaltyTransactions: [], walkInTransactions: [], orders: [], syncLog: [newSyncLogEntry, ...prev.syncLog] };
      });
  };

  const updateOrderStatus = (orderId: number, status: Order['status']) => {
      setState(prev => ({ ...prev, orders: prev.orders.map(o => o.id === orderId ? { ...o, status } : o) }));
  };

  const deleteTransaction = (transactionId: number) => {
      setState(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== transactionId) }));
  };

  const deleteEmployee = (employeeId: number) => {
      setState(prev => ({ ...prev, employees: prev.employees.filter(emp => emp.id !== employeeId) }));
  };

  const setStopSell = (updater: React.SetStateAction<{ [roomType: string]: boolean }>) => {
      setState(prev => {
          const newStopSell = typeof updater === 'function' ? updater(prev.stopSell) : updater;
          return { ...prev, stopSell: newStopSell };
      });
  };

  const setTaxSettings = (updater: React.SetStateAction<TaxSettings>) => {
      setState(prev => {
          const newTaxSettings = typeof updater === 'function' ? updater(prev.taxSettings) : updater;
          return { ...prev, taxSettings: newTaxSettings };
      });
  };

  const value: HotelData = {
    ...state,
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
    updateOrderStatus,
    deleteTransaction,
    deleteEmployee,
    setStopSell,
    setTaxSettings,
  };

  return (
    <HotelDataContext.Provider value={value}>
      {children}
    </HotelDataContext.Provider>
  );
};
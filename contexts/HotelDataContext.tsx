import React, { createContext, useReducer, ReactNode, useEffect, useRef } from 'react';
import { RoomStatus, MaintenanceStatus, LoyaltyTier, HotelAction } from '../types.ts';
import type { SyncLogEntry } from '../types.ts';
import { INITIAL_ROOMS, INITIAL_GUESTS, INITIAL_TRANSACTIONS, INITIAL_LOYALTY_TRANSACTIONS, INITIAL_ORDERS, INITIAL_EMPLOYEES, INITIAL_RESERVATIONS, INITIAL_MAINTENANCE_REQUESTS, INITIAL_ROOM_TYPES, INITIAL_TAX_SETTINGS } from '../constants.tsx';

// Define the shape of our state
type HotelState = {
    rooms: typeof INITIAL_ROOMS;
    guests: typeof INITIAL_GUESTS;
    reservations: typeof INITIAL_RESERVATIONS;
    transactions: typeof INITIAL_TRANSACTIONS;
    loyaltyTransactions: typeof INITIAL_LOYALTY_TRANSACTIONS;
    walkInTransactions: any[]; // Define properly if used
    orders: typeof INITIAL_ORDERS;
    employees: typeof INITIAL_EMPLOYEES;
    syncLog: SyncLogEntry[];
    maintenanceRequests: typeof INITIAL_MAINTENANCE_REQUESTS;
    roomTypes: typeof INITIAL_ROOM_TYPES;
    taxSettings: typeof INITIAL_TAX_SETTINGS;
    stopSell: { [key: string]: boolean };
};

export const HotelDataContext = createContext<any>(undefined);

const INITIAL_STATE: HotelState = {
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

const getAvailability = (rooms: typeof INITIAL_ROOMS) => {
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

// The Grand Reducer: All state logic lives here for consistency
const hotelReducer = (state: HotelState, action: HotelAction): HotelState => {
    // Helper to add a log entry
    const addLog = (message: string, level: SyncLogEntry['level'] = 'info') => {
        const newEntry: SyncLogEntry = { timestamp: new Date().toLocaleTimeString(), message, level };
        return [newEntry, ...state.syncLog];
    };

    switch (action.type) {
        case 'CHECK_IN_GUEST': {
            const { guest, roomId, charge, tax, reservationId } = action.payload;
            const newGuestId = (state.guests[state.guests.length - 1]?.id || 0) + 1;
            const newGuest = { ...guest, id: newGuestId };

            const newTransactions = [...state.transactions];
            // Add main charge
            newTransactions.push({ ...charge, id: (state.transactions[state.transactions.length - 1]?.id || 0) + 1, guestId: newGuestId });
            // Add tax if applicable
            if (tax) {
                newTransactions.push({ ...tax, id: (state.transactions[state.transactions.length - 1]?.id || 0) + 2, guestId: newGuestId });
            }

            return {
                ...state,
                guests: [...state.guests, newGuest],
                rooms: state.rooms.map(r => r.id === roomId ? { ...r, status: RoomStatus.Occupied, guestId: newGuestId } : r),
                transactions: newTransactions,
                reservations: reservationId ? state.reservations.filter(res => res.id !== reservationId) : state.reservations,
                syncLog: addLog(`Guest ${newGuest.name} checked into Room ${newGuest.roomNumber}.`, 'success'),
            };
        }

        case 'UPDATE_ROOM_STATUS': {
            const { roomId, status, guestId } = action.payload;
            const roomToUpdate = state.rooms.find(r => r.id === roomId);
            if (!roomToUpdate || roomToUpdate.status === status) return state;

            let logMessages: { message: string, level: SyncLogEntry['level'] }[] = [];
            logMessages.push({ message: `Room ${roomToUpdate.number} status updated from ${roomToUpdate.status} to ${status}.`, level: 'info' });
            
            let newGuests = [...state.guests];
            let newLoyaltyTransactions = [...state.loyaltyTransactions];

            if (roomToUpdate.status === RoomStatus.Occupied && status === RoomStatus.Dirty && roomToUpdate.guestId) {
              const guest = state.guests.find(g => g.id === roomToUpdate.guestId);
              const totalCharges = state.transactions.filter(t => t.guestId === roomToUpdate.guestId && t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
              const pointsEarned = Math.floor(totalCharges / 1000);
              
              if (guest) {
                  if (pointsEarned > 0) {
                       const newLT = { id: (state.loyaltyTransactions[0]?.id || 0) + 1, guestId: guest.id, points: pointsEarned, description: `Points for stay`, date: new Date().toISOString().split('T')[0] };
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

            const newRooms = state.rooms.map(room => room.id === roomId ? { ...room, status, guestId: status === RoomStatus.Occupied ? guestId : undefined } : room);
            const newSyncLogEntries = logMessages.map(log => ({ ...log, timestamp: new Date().toLocaleTimeString() }));
            return { ...state, rooms: newRooms, guests: newGuests, loyaltyTransactions: newLoyaltyTransactions, syncLog: [...newSyncLogEntries.reverse(), ...state.syncLog] };
        }

        case 'ADD_TRANSACTION': {
            const newTransaction = { ...action.payload, id: (state.transactions[state.transactions.length - 1]?.id || 0) + 1 };
            const guestName = state.guests.find(g => g.id === action.payload.guestId)?.name || 'Unknown';
            const type = action.payload.amount > 0 ? 'charge' : 'payment';
            return {
                ...state,
                transactions: [...state.transactions, newTransaction],
                syncLog: addLog(`Posted ${type} of ₦${Math.abs(action.payload.amount).toLocaleString()} for ${guestName}.`, 'info')
            };
        }

        case 'ADD_RESERVATION': {
            const { payload } = action;
            const availableRooms = state.rooms.filter(r => r.type === payload.roomType && r.status === RoomStatus.Vacant).length;
            if (availableRooms <= 0 || state.stopSell[payload.roomType]) {
                return { ...state, syncLog: addLog(`Booking from ${payload.ota} for ${payload.roomType} REJECTED (no availability).`, 'error') };
            }
            const newReservation = { ...payload, id: (state.reservations[0]?.id || 0) + 1 };
            return {
                ...state,
                reservations: [...state.reservations, newReservation],
                syncLog: addLog(`New booking from ${payload.ota} for ${newReservation.guestName} (${newReservation.roomType}).`, 'success')
            };
        }
        
        // Add other action cases here...
        case 'ADD_EMPLOYEE': {
            const newEmployee = { ...action.payload, id: (state.employees[0]?.id || 0) + 1 };
            return { ...state, employees: [...state.employees, newEmployee], syncLog: addLog(`New employee added: ${newEmployee.name}.`, 'success')};
        }
        case 'UPDATE_EMPLOYEE': {
            return { ...state, employees: state.employees.map(e => e.id === action.payload.id ? action.payload : e), syncLog: addLog(`Profile updated for ${action.payload.name}.`, 'info')};
        }
        case 'DELETE_EMPLOYEE': {
             return { ...state, employees: state.employees.filter(emp => emp.id !== action.payload) };
        }
        case 'CLEAR_ALL_TRANSACTIONS': {
            return {...state, transactions: [], loyaltyTransactions: [], walkInTransactions: [], orders: [], syncLog: addLog('All transaction data has been cleared.', 'warn')}
        }
        case 'DELETE_TRANSACTION': {
             return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
        }
         case 'UPDATE_ORDER_STATUS': {
            const { orderId, status } = action.payload;
            return { ...state, orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o) };
        }
        case 'ADD_SYNC_LOG_ENTRY': {
            return { ...state, syncLog: addLog(action.payload.message, action.payload.level) };
        }
        // Passthrough actions for UI state that doesn't need complex logic
        case 'SET_STOP_SELL': return { ...state, stopSell: action.payload };
        case 'SET_TAX_SETTINGS': return { ...state, taxSettings: action.payload };

        default:
            return state;
    }
};

export const HotelDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(hotelReducer, undefined, () => {
        try {
            const storedState = localStorage.getItem('tide_pms_data');
            return storedState ? JSON.parse(storedState) : INITIAL_STATE;
        } catch (error) {
            console.error("Failed to parse state from localStorage", error);
            return INITIAL_STATE;
        }
    });

    const channelRef = useRef<BroadcastChannel | null>(null);

    // Persist state to localStorage on every change
    useEffect(() => {
        try {
            localStorage.setItem('tide_pms_data', JSON.stringify(state));
        } catch (error) {
            console.error("Failed to save state to localStorage", error);
        }
    }, [state]);

    // Set up broadcast channel listener to sync actions from other tabs
    useEffect(() => {
        channelRef.current = new BroadcastChannel('tide_pms_actions');
        const channel = channelRef.current;
        const handleMessage = (event: MessageEvent) => {
            const action = event.data as HotelAction;
            // When an action is received from another tab, dispatch it locally.
            // This component will not re-broadcast it, preventing loops.
            dispatch(action); 
        };
        channel.addEventListener('message', handleMessage);
        return () => {
            channel.removeEventListener('message', handleMessage);
            channel.close();
        };
    }, []);

    // Wrapped dispatch to also broadcast the action to other tabs
    const broadcastDispatch = (action: HotelAction) => {
        // Dispatch locally first
        dispatch(action);
        // Then broadcast to other tabs
        channelRef.current?.postMessage(action);
    };

    // Create context value with user-friendly action functions
    const value = {
        ...state,
        checkInGuest: (payload: Extract<HotelAction, { type: 'CHECK_IN_GUEST' }>['payload']) => broadcastDispatch({ type: 'CHECK_IN_GUEST', payload }),
        updateRoomStatus: (roomId: number, status: RoomStatus, guestId?: number) => broadcastDispatch({ type: 'UPDATE_ROOM_STATUS', payload: { roomId, status, guestId } }),
        addTransaction: (payload: Omit<any, 'id'>) => broadcastDispatch({ type: 'ADD_TRANSACTION', payload }),
        addReservation: (payload: Omit<any, 'id'>) => broadcastDispatch({ type: 'ADD_RESERVATION', payload }),
        addEmployee: (payload: Omit<any, 'id'>) => broadcastDispatch({ type: 'ADD_EMPLOYEE', payload }),
        updateEmployee: (payload: any) => broadcastDispatch({ type: 'UPDATE_EMPLOYEE', payload }),
        deleteEmployee: (employeeId: number) => broadcastDispatch({ type: 'DELETE_EMPLOYEE', payload: employeeId }),
        clearAllTransactions: () => broadcastDispatch({ type: 'CLEAR_ALL_TRANSACTIONS' }),
        deleteTransaction: (transactionId: number) => broadcastDispatch({ type: 'DELETE_TRANSACTION', payload: transactionId }),
        updateOrderStatus: (orderId: number, status: any) => broadcastDispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } }),
        addSyncLogEntry: (message: string, level?: SyncLogEntry['level']) => broadcastDispatch({ type: 'ADD_SYNC_LOG_ENTRY', payload: { message, level } }),
        setStopSell: (payload: any) => broadcastDispatch({ type: 'SET_STOP_SELL', payload }),
        setTaxSettings: (payload: any) => broadcastDispatch({ type: 'SET_TAX_SETTINGS', payload }),
        // Placeholder for unimplemented actions to prevent crashes
        addOrder: (order: any) => console.warn('addOrder not implemented in reducer'),
        addWalkInTransaction: (transaction: any) => console.warn('addWalkInTransaction not implemented in reducer'),
        updateRate: (roomType: string, newRate: number, currency: 'NGN' | 'USD') => console.warn('updateRate not implemented in reducer'),
        updateGuestDetails: (guestId: number, updatedGuest: Partial<any>) => console.warn('updateGuestDetails not implemented in reducer'),
        addMaintenanceRequest: (request: any) => console.warn('addMaintenanceRequest not implemented in reducer'),
        updateMaintenanceRequestStatus: (requestId: number, status: MaintenanceStatus) => console.warn('updateMaintenanceRequestStatus not implemented in reducer'),
        addLoyaltyPoints: (guestId: number, points: number, description: string) => console.warn('addLoyaltyPoints not implemented in reducer'),
        redeemLoyaltyPoints: (guestId: number, pointsToRedeem: number) => console.warn('redeemLoyaltyPoints not implemented in reducer'),
        addRoomType: (roomType: any) => console.warn('addRoomType not implemented in reducer'),
        updateRoomType: (roomType: any) => console.warn('updateRoomType not implemented in reducer'),
        deleteRoomType: (roomTypeId: number) => console.warn('deleteRoomType not implemented in reducer'),
    };

    return (
        <HotelDataContext.Provider value={value}>
            {children}
        </HotelDataContext.Provider>
    );
};

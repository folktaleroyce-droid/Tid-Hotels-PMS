import React, { createContext, useReducer, ReactNode, useEffect, useRef } from 'react';
import { RoomStatus, MaintenanceStatus, LoyaltyTier, HotelAction, Guest, TaxSettings } from '../types.ts';
import type { SyncLogEntry, WalkInTransaction } from '../types.ts';
import { INITIAL_ROOMS, INITIAL_GUESTS, INITIAL_TRANSACTIONS, INITIAL_LOYALTY_TRANSACTIONS, INITIAL_ORDERS, INITIAL_EMPLOYEES, INITIAL_RESERVATIONS, INITIAL_MAINTENANCE_REQUESTS, INITIAL_ROOM_TYPES, INITIAL_TAX_SETTINGS } from '../constants.tsx';

// Define the shape of our state
type HotelState = {
    rooms: typeof INITIAL_ROOMS;
    guests: typeof INITIAL_GUESTS;
    reservations: typeof INITIAL_RESERVATIONS;
    transactions: typeof INITIAL_TRANSACTIONS;
    loyaltyTransactions: typeof INITIAL_LOYALTY_TRANSACTIONS;
    walkInTransactions: WalkInTransaction[];
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
        
        case 'ADD_WALK_IN_TRANSACTION': {
            const newTransaction = { 
                ...action.payload, 
                id: (state.walkInTransactions[state.walkInTransactions.length - 1]?.id || 0) + 1,
                date: new Date().toISOString().split('T')[0]
            };
            return {
                ...state,
                walkInTransactions: [...state.walkInTransactions, newTransaction],
                syncLog: addLog(`New walk-in transaction of ₦${newTransaction.amountPaid.toLocaleString()} for ${newTransaction.service}.`, 'success')
            };
        }
        
        case 'ADD_ORDER': {
            const newOrder = {
                ...action.payload,
                id: (state.orders[state.orders.length - 1]?.id || 0) + 1,
                createdAt: new Date().toISOString()
            };
            const roomNumber = state.rooms.find(r => r.id === action.payload.roomId)?.number || 'N/A';
            return {
                ...state,
                orders: [...state.orders, newOrder],
                syncLog: addLog(`New room service order for Room ${roomNumber}.`, 'info')
            };
        }
        
        case 'UPDATE_RATE': {
            const { roomType, newRate, currency } = action.payload;
            return {
                ...state,
                roomTypes: state.roomTypes.map(rt => rt.name === roomType ? { ...rt, rates: { ...rt.rates, [currency]: newRate } } : rt),
                syncLog: addLog(`Rate for ${roomType} updated to ${currency}${newRate}. Pushing to channels.`, 'info')
            };
        }
        
        case 'UPDATE_GUEST_DETAILS': {
            const { guestId, updatedGuest } = action.payload;
            const guestName = state.guests.find(g => g.id === guestId)?.name;
            return {
                ...state,
                guests: state.guests.map(g => g.id === guestId ? { ...g, ...updatedGuest } : g),
                syncLog: addLog(`Profile details updated for ${guestName}.`, 'info')
            };
        }
        
        case 'ADD_MAINTENANCE_REQUEST': {
            const newRequest = {
                ...action.payload,
                id: (state.maintenanceRequests[state.maintenanceRequests.length - 1]?.id || 0) + 1,
                reportedAt: new Date().toISOString().split('T')[0],
                status: MaintenanceStatus.Reported,
            };
            return {
                ...state,
                maintenanceRequests: [newRequest, ...state.maintenanceRequests],
                syncLog: addLog(`New maintenance request for ${newRequest.location}: ${newRequest.description}`, 'warn')
            };
        }

        case 'UPDATE_MAINTENANCE_REQUEST_STATUS': {
            const { requestId, status } = action.payload;
            return {
                ...state,
                maintenanceRequests: state.maintenanceRequests.map(req => req.id === requestId ? { ...req, status } : req),
            };
        }

        case 'ADD_LOYALTY_POINTS': {
            const { guestId, points, description } = action.payload;
            const newLT = { id: (state.loyaltyTransactions[0]?.id || 0) + 1, guestId, points, description, date: new Date().toISOString().split('T')[0] };
            const newGuests = state.guests.map(g => {
                if (g.id === guestId) {
                    const newTotalPoints = g.loyaltyPoints + points;
                    return { ...g, loyaltyPoints: newTotalPoints, loyaltyTier: getLoyaltyTierForPoints(newTotalPoints) };
                }
                return g;
            });
            return {
                ...state,
                guests: newGuests,
                loyaltyTransactions: [newLT, ...state.loyaltyTransactions],
            };
        }

        case 'REDEEM_LOYALTY_POINTS': {
            const { guestId, pointsToRedeem } = action.payload;
            const guest = state.guests.find(g => g.id === guestId);
            if (!guest || guest.loyaltyPoints < pointsToRedeem) {
                return state; // This logic is handled in the component, but good to have a safeguard
            }

            const redemptionValue = pointsToRedeem * 10; // 100 points = N1000 credit
            const newLT = { id: (state.loyaltyTransactions[0]?.id || 0) + 1, guestId, points: -pointsToRedeem, description: 'Points Redemption', date: new Date().toISOString().split('T')[0] };
            const newTransaction = { id: (state.transactions[state.transactions.length-1]?.id || 0) + 1, guestId, description: `Loyalty Points Redemption (-${pointsToRedeem} pts)`, amount: -redemptionValue, date: new Date().toISOString().split('T')[0] };
            const newGuests = state.guests.map(g => {
                if (g.id === guestId) {
                    const newTotalPoints = g.loyaltyPoints - pointsToRedeem;
                    return { ...g, loyaltyPoints: newTotalPoints, loyaltyTier: getLoyaltyTierForPoints(newTotalPoints) };
                }
                return g;
            });

            return {
                ...state,
                guests: newGuests,
                loyaltyTransactions: [newLT, ...state.loyaltyTransactions],
                transactions: [...state.transactions, newTransaction],
            };
        }
        
        case 'MOVE_GUEST': {
            const { guestId, oldRoomId, newRoomId } = action.payload;
            const guest = state.guests.find(g => g.id === guestId);
            const oldRoom = state.rooms.find(r => r.id === oldRoomId);
            const newRoom = state.rooms.find(r => r.id === newRoomId);

            if (!guest || !oldRoom || !newRoom) return state; // Safety check

            // Update guest's room number
            const updatedGuests = state.guests.map(g => 
                g.id === guestId ? { ...g, roomNumber: newRoom.number } : g
            );

            // Update room statuses
            const updatedRooms = state.rooms.map(r => {
                if (r.id === oldRoomId) return { ...r, status: RoomStatus.Dirty, guestId: undefined };
                if (r.id === newRoomId) return { ...r, status: RoomStatus.Occupied, guestId: guestId };
                return r;
            });
            
            return {
                ...state,
                guests: updatedGuests,
                rooms: updatedRooms,
                syncLog: addLog(`Moved guest ${guest.name} from Room ${oldRoom.number} to Room ${newRoom.number}.`, 'success'),
            };
        }


        case 'ADD_ROOM_TYPE': {
            const newRoomType = { ...action.payload, id: (state.roomTypes[state.roomTypes.length - 1]?.id || 0) + 1 };
            return {
                ...state,
                roomTypes: [...state.roomTypes, newRoomType],
                syncLog: addLog(`New room type created: ${newRoomType.name}.`, 'success')
            };
        }
        case 'UPDATE_ROOM_TYPE': {
            return {
                ...state,
                roomTypes: state.roomTypes.map(rt => rt.id === action.payload.id ? action.payload : rt),
                syncLog: addLog(`Details updated for room type: ${action.payload.name}.`, 'info')
            };
        }
        case 'DELETE_ROOM_TYPE': {
            const roomTypeToDelete = state.roomTypes.find(rt => rt.id === action.payload);
            if (!roomTypeToDelete) return state;

            const roomsToDeleteCount = state.rooms.filter(r => r.type === roomTypeToDelete.name).length;
            const updatedRooms = state.rooms.filter(r => r.type !== roomTypeToDelete.name);

            return {
                ...state,
                roomTypes: state.roomTypes.filter(rt => rt.id !== action.payload),
                rooms: updatedRooms,
                syncLog: addLog(`Deleted room type '${roomTypeToDelete.name}' and its ${roomsToDeleteCount} associated room(s).`, 'error'),
            };
        }
        
        case 'ADD_ROOM': {
            const { number, type } = action.payload;
            const roomTypeDetails = state.roomTypes.find(rt => rt.name === type);
            if (!roomTypeDetails) return state; // Should not happen with UI dropdown

            const newRoom = {
                id: (state.rooms[state.rooms.length - 1]?.id || 0) + 1,
                number,
                type,
                rate: roomTypeDetails.rates.NGN, // Defaulting to NGN rate
                status: RoomStatus.Vacant,
            };
            return {
                ...state,
                rooms: [...state.rooms, newRoom].sort((a,b) => a.number.localeCompare(b.number, undefined, { numeric: true })),
                syncLog: addLog(`Added new room: ${number} (${type}).`, 'success'),
            };
        }

        case 'DELETE_ROOM': {
            const roomToDelete = state.rooms.find(r => r.id === action.payload);
            return {
                ...state,
                rooms: state.rooms.filter(r => r.id !== action.payload),
                syncLog: addLog(`Deleted room: ${roomToDelete?.number}.`, 'warn'),
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
        
        case 'ADD_EMPLOYEE': {
            const newEmployee = { ...action.payload, id: (state.employees[0]?.id || 0) + 1 };
            return { ...state, employees: [...state.employees, newEmployee], syncLog: addLog(`New employee added: ${newEmployee.name}.`, 'success')};
        }
        case 'UPDATE_EMPLOYEE': {
            return { ...state, employees: state.employees.map(e => e.id === action.payload.id ? action.payload : e), syncLog: addLog(`Profile updated for ${action.payload.name}.`, 'info')};
        }
        case 'DELETE_EMPLOYEE': {
            const employee = state.employees.find(e => e.id === action.payload);
            return { 
                ...state, 
                employees: state.employees.filter(emp => emp.id !== action.payload), 
                syncLog: addLog(`Removed employee: ${employee?.name || `ID ${action.payload}`}.`, 'warn') 
            };
        }
        case 'CLEAR_ALL_DATA': {
            return {
                ...state,
                rooms: [],
                guests: [],
                reservations: [],
                transactions: [],
                loyaltyTransactions: [],
                walkInTransactions: [],
                orders: [],
                employees: [],
                maintenanceRequests: [],
                roomTypes: [],
                syncLog: addLog('All application data has been cleared.', 'error'),
            };
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
        addOrder: (payload: Extract<HotelAction, { type: 'ADD_ORDER' }>['payload']) => broadcastDispatch({ type: 'ADD_ORDER', payload }),
        updateRoomStatus: (roomId: number, status: RoomStatus, guestId?: number) => broadcastDispatch({ type: 'UPDATE_ROOM_STATUS', payload: { roomId, status, guestId } }),
        addTransaction: (payload: Extract<HotelAction, { type: 'ADD_TRANSACTION' }>['payload']) => broadcastDispatch({ type: 'ADD_TRANSACTION', payload }),
        addWalkInTransaction: (payload: Extract<HotelAction, { type: 'ADD_WALK_IN_TRANSACTION' }>['payload']) => broadcastDispatch({ type: 'ADD_WALK_IN_TRANSACTION', payload }),
        addEmployee: (payload: Extract<HotelAction, { type: 'ADD_EMPLOYEE' }>['payload']) => broadcastDispatch({ type: 'ADD_EMPLOYEE', payload }),
        updateEmployee: (payload: Extract<HotelAction, { type: 'UPDATE_EMPLOYEE' }>['payload']) => broadcastDispatch({ type: 'UPDATE_EMPLOYEE', payload }),
        addReservation: (payload: Extract<HotelAction, { type: 'ADD_RESERVATION' }>['payload']) => broadcastDispatch({ type: 'ADD_RESERVATION', payload }),
        addSyncLogEntry: (message: string, level?: SyncLogEntry['level']) => broadcastDispatch({ type: 'ADD_SYNC_LOG_ENTRY', payload: { message, level } }),
        updateRate: (roomType: string, newRate: number, currency: 'NGN' | 'USD') => broadcastDispatch({ type: 'UPDATE_RATE', payload: { roomType, newRate, currency } }),
        updateGuestDetails: (guestId: number, updatedGuest: Partial<Guest>) => broadcastDispatch({ type: 'UPDATE_GUEST_DETAILS', payload: { guestId, updatedGuest } }),
        addMaintenanceRequest: (payload: Extract<HotelAction, { type: 'ADD_MAINTENANCE_REQUEST' }>['payload']) => broadcastDispatch({ type: 'ADD_MAINTENANCE_REQUEST', payload }),
        updateMaintenanceRequestStatus: (requestId: number, status: MaintenanceStatus) => broadcastDispatch({ type: 'UPDATE_MAINTENANCE_REQUEST_STATUS', payload: { requestId, status } }),
        addLoyaltyPoints: (guestId: number, points: number, description: string) => broadcastDispatch({ type: 'ADD_LOYALTY_POINTS', payload: { guestId, points, description } }),
        redeemLoyaltyPoints: (guestId: number, pointsToRedeem: number) => {
            const guest = state.guests.find((g: any) => g.id === guestId);
            if (!guest || guest.loyaltyPoints < pointsToRedeem) {
                const message = `Redemption failed: Not enough points for ${guest?.name || 'guest'}.`;
                dispatch({ type: 'ADD_SYNC_LOG_ENTRY', payload: { message, level: 'error' } });
                return { success: false, message };
            }
            broadcastDispatch({ type: 'REDEEM_LOYALTY_POINTS', payload: { guestId, pointsToRedeem } });
            const message = `Successfully redeemed ${pointsToRedeem} points for ${guest.name}.`;
            return { success: true, message };
        },
        addRoomType: (payload: Extract<HotelAction, { type: 'ADD_ROOM_TYPE' }>['payload']) => broadcastDispatch({ type: 'ADD_ROOM_TYPE', payload }),
        updateRoomType: (payload: Extract<HotelAction, { type: 'UPDATE_ROOM_TYPE' }>['payload']) => broadcastDispatch({ type: 'UPDATE_ROOM_TYPE', payload }),
        deleteRoomType: (roomTypeId: number) => broadcastDispatch({ type: 'DELETE_ROOM_TYPE', payload: roomTypeId }),
        addRoom: (payload: Extract<HotelAction, { type: 'ADD_ROOM' }>['payload']) => broadcastDispatch({ type: 'ADD_ROOM', payload }),
        deleteRoom: (roomId: number) => broadcastDispatch({ type: 'DELETE_ROOM', payload: roomId }),
        clearAllData: () => broadcastDispatch({ type: 'CLEAR_ALL_DATA' }),
        updateOrderStatus: (orderId: number, status: any) => broadcastDispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } }),
        deleteTransaction: (transactionId: number) => broadcastDispatch({ type: 'DELETE_TRANSACTION', payload: transactionId }),
        deleteEmployee: (employeeId: number) => broadcastDispatch({ type: 'DELETE_EMPLOYEE', payload: employeeId }),
        moveGuest: (payload: Extract<HotelAction, { type: 'MOVE_GUEST' }>['payload']) => broadcastDispatch({ type: 'MOVE_GUEST', payload }),
        setStopSell: (valueOrFn: React.SetStateAction<{ [roomType: string]: boolean }>) => {
            const newPayload = typeof valueOrFn === 'function' 
                ? (valueOrFn as (prevState: { [roomType: string]: boolean }) => { [roomType: string]: boolean })(state.stopSell) 
                : valueOrFn;
            broadcastDispatch({ type: 'SET_STOP_SELL', payload: newPayload });
        },
        setTaxSettings: (valueOrFn: React.SetStateAction<TaxSettings>) => {
            const newPayload = typeof valueOrFn === 'function' 
                ? (valueOrFn as (prevState: TaxSettings) => TaxSettings)(state.taxSettings) 
                : valueOrFn;
            broadcastDispatch({ type: 'SET_TAX_SETTINGS', payload: newPayload });
        },
    };

    return (
        <HotelDataContext.Provider value={value}>
            {children}
        </HotelDataContext.Provider>
    );
};
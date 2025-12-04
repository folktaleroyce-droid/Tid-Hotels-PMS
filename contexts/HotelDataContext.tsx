
import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import type { HotelData, Room, Guest, Reservation, Transaction, LoyaltyTransaction, WalkInTransaction, Order, Employee, SyncLogEntry, MaintenanceRequest, RoomType, TaxSettings, RoomStatus, MaintenanceStatus, InventoryItem, Supplier } from '../types.ts';
import { INITIAL_ROOMS, INITIAL_ROOM_TYPES, INITIAL_TAX_SETTINGS, INITIAL_RESERVATIONS, INITIAL_INVENTORY, INITIAL_SUPPLIERS } from '../constants.tsx';
import { RoomStatus as RoomStatusEnum } from '../types.ts';

// Define the shape of our state
type HotelState = {
    rooms: Room[];
    guests: Guest[];
    reservations: Reservation[];
    transactions: Transaction[];
    loyaltyTransactions: LoyaltyTransaction[];
    walkInTransactions: WalkInTransaction[];
    orders: Order[];
    employees: Employee[];
    syncLog: SyncLogEntry[];
    maintenanceRequests: MaintenanceRequest[];
    roomTypes: RoomType[];
    taxSettings: TaxSettings;
    stopSell: { [key: string]: boolean };
    inventory: InventoryItem[];
    suppliers: Supplier[];
};

const INITIAL_STATE: HotelState = {
    rooms: INITIAL_ROOMS,
    guests: [],
    reservations: INITIAL_RESERVATIONS,
    transactions: [],
    loyaltyTransactions: [],
    walkInTransactions: [],
    orders: [],
    employees: [],
    syncLog: [],
    maintenanceRequests: [],
    roomTypes: INITIAL_ROOM_TYPES,
    taxSettings: INITIAL_TAX_SETTINGS,
    stopSell: {},
    inventory: INITIAL_INVENTORY,
    suppliers: INITIAL_SUPPLIERS,
};

export const HotelDataContext = createContext<HotelData | undefined>(undefined);

export const HotelDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Load state from localStorage if available, else use INITIAL_STATE
    const [state, setState] = useState<HotelState>(() => {
        try {
            const savedState = localStorage.getItem('tide_pms_data');
            return savedState ? JSON.parse(savedState) : INITIAL_STATE;
        } catch (error) {
            console.error("Failed to load state from localStorage:", error);
            return INITIAL_STATE;
        }
    });

    // Save state to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('tide_pms_data', JSON.stringify(state));
        } catch (error) {
            console.error("Failed to save state to localStorage:", error);
        }
    }, [state]);

    // --- Helper to log actions ---
    const log = (message: string, level: SyncLogEntry['level'] = 'info') => {
        const newLog: SyncLogEntry = {
            timestamp: new Date().toLocaleTimeString(),
            message,
            level
        };
        setState(prev => ({
            ...prev,
            syncLog: [newLog, ...prev.syncLog].slice(0, 50) // Keep last 50 logs
        }));
    };

    // --- Action Implementations ---

    const checkInGuest = (payload: { guest: Omit<Guest, 'id'>, roomId: number, charge: Omit<Transaction, 'id' | 'guestId'>, tax?: Omit<Transaction, 'id' | 'guestId'>, reservationId?: number }) => {
        setState(prev => {
            const newGuestId = Date.now();
            const newGuest: Guest = { ...payload.guest, id: newGuestId };
            
            // Create Transactions
            const newTransactions = [...prev.transactions];
            newTransactions.push({ ...payload.charge, id: Date.now(), guestId: newGuestId });
            if (payload.tax) {
                newTransactions.push({ ...payload.tax, id: Date.now() + 1, guestId: newGuestId });
            }

            // Update Room
            const updatedRooms = prev.rooms.map(r => 
                r.id === payload.roomId ? { ...r, status: RoomStatusEnum.Occupied, guestId: newGuestId } : r
            );

            // Remove Reservation if exists
            let updatedReservations = prev.reservations;
            if (payload.reservationId) {
                updatedReservations = prev.reservations.filter(r => r.id !== payload.reservationId);
            }

            return {
                ...prev,
                guests: [...prev.guests, newGuest],
                transactions: newTransactions,
                rooms: updatedRooms,
                reservations: updatedReservations
            };
        });
        log(`Checked in ${payload.guest.name} to Room ID ${payload.roomId}`, 'success');
    };

    const updateRoomStatus = (roomId: number, status: RoomStatus, guestId?: number) => {
        setState(prev => ({
            ...prev,
            rooms: prev.rooms.map(r => r.id === roomId ? { ...r, status, guestId } : r)
        }));
        log(`Updated Room ${roomId} status to ${status}`, 'info');
    };

    const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
        setState(prev => ({
            ...prev,
            transactions: [...prev.transactions, { ...transaction, id: Date.now() }]
        }));
        log(`Added transaction: ${transaction.description}`, 'info');
    };

    const deleteTransaction = (transactionId: number) => {
        setState(prev => ({
            ...prev,
            transactions: prev.transactions.filter(t => t.id !== transactionId)
        }));
        log(`Deleted transaction ID ${transactionId}`, 'warn');
    };

    const addOrder = (order: Omit<Order, 'id' | 'createdAt'>) => {
        setState(prev => ({
            ...prev,
            orders: [...prev.orders, { ...order, id: Date.now(), createdAt: new Date().toISOString() }]
        }));
        log(`New order placed for Room ID ${order.roomId}`, 'success');
    };

    const updateOrderStatus = (orderId: number, status: Order['status']) => {
        setState(prev => ({
            ...prev,
            orders: prev.orders.map(o => o.id === orderId ? { ...o, status } : o)
        }));
    };

    const addReservation = (reservation: Omit<Reservation, 'id'>) => {
         setState(prev => ({
            ...prev,
            reservations: [...prev.reservations, { ...reservation, id: Date.now() }]
        }));
        log(`New reservation for ${reservation.guestName}`, 'success');
    };

    const addWalkInTransaction = (transaction: Omit<WalkInTransaction, 'id' | 'date'>) => {
        setState(prev => ({
            ...prev,
            walkInTransactions: [...prev.walkInTransactions, { ...transaction, id: Date.now(), date: new Date().toISOString().split('T')[0] }]
        }));
        log('Processed new walk-in transaction', 'success');
    };

    const addMaintenanceRequest = (request: Omit<MaintenanceRequest, 'id' | 'reportedAt' | 'status'>) => {
        setState(prev => ({
            ...prev,
            maintenanceRequests: [...prev.maintenanceRequests, { 
                ...request, 
                id: Date.now(), 
                reportedAt: new Date().toLocaleDateString(), 
                status: 'Reported' 
            }]
        }));
        log('New maintenance request reported', 'warn');
    };

    const updateMaintenanceRequestStatus = (requestId: number, status: MaintenanceStatus) => {
        setState(prev => ({
            ...prev,
            maintenanceRequests: prev.maintenanceRequests.map(req => req.id === requestId ? { ...req, status } : req)
        }));
    };

    const addEmployee = (employee: Omit<Employee, 'id'>) => {
        setState(prev => ({
            ...prev,
            employees: [...prev.employees, { ...employee, id: Date.now() }]
        }));
        log(`Added new employee: ${employee.name}`, 'info');
    };

    const updateEmployee = (employee: Employee) => {
        setState(prev => ({
            ...prev,
            employees: prev.employees.map(e => e.id === employee.id ? employee : e)
        }));
        log(`Updated employee: ${employee.name}`, 'info');
    };

    const deleteEmployee = (employeeId: number) => {
        setState(prev => ({
            ...prev,
            employees: prev.employees.filter(e => e.id !== employeeId)
        }));
        log('Removed employee', 'warn');
    };

    const updateGuestDetails = (guestId: number, updatedGuest: Partial<Guest>) => {
        setState(prev => ({
            ...prev,
            guests: prev.guests.map(g => g.id === guestId ? { ...g, ...updatedGuest } : g)
        }));
        log('Updated guest details', 'info');
    };

    const moveGuest = (payload: { guestId: number; oldRoomId: number; newRoomId: number }) => {
        setState(prev => {
            const oldRoom = prev.rooms.find(r => r.id === payload.oldRoomId);
            const newRoom = prev.rooms.find(r => r.id === payload.newRoomId);
            const guest = prev.guests.find(g => g.id === payload.guestId);

            if (!oldRoom || !newRoom || !guest) return prev;

            // Update rooms
            const updatedRooms = prev.rooms.map(r => {
                if (r.id === payload.oldRoomId) return { ...r, status: RoomStatusEnum.Dirty, guestId: undefined };
                if (r.id === payload.newRoomId) return { ...r, status: RoomStatusEnum.Occupied, guestId: payload.guestId };
                return r;
            });

            // Update guest
            const updatedGuests = prev.guests.map(g => 
                g.id === payload.guestId ? { ...g, roomNumber: newRoom.number, roomType: newRoom.type } : g
            );

            return {
                ...prev,
                rooms: updatedRooms,
                guests: updatedGuests
            };
        });
        log('Moved guest to new room', 'info');
    };

    const updateRate = (roomType: string, newRate: number, currency: 'NGN' | 'USD') => {
        setState(prev => ({
            ...prev,
            roomTypes: prev.roomTypes.map(rt => 
                rt.name === roomType 
                ? { ...rt, rates: { ...rt.rates, [currency]: newRate } }
                : rt
            ),
            // Also update actual rooms of this type
            rooms: prev.rooms.map(r => 
                r.type === roomType 
                ? { ...r, rate: currency === 'NGN' ? newRate : r.rate } 
                : r
            )
        }));
        log(`Updated base rate for ${roomType}`, 'info');
    };
    
    const addRoomType = (roomType: Omit<RoomType, 'id'>) => {
        setState(prev => ({
            ...prev,
            roomTypes: [...prev.roomTypes, { ...roomType, id: Date.now() }]
        }));
    };

    const updateRoomType = (roomType: RoomType) => {
        setState(prev => ({
            ...prev,
            roomTypes: prev.roomTypes.map(rt => rt.id === roomType.id ? roomType : rt)
        }));
    };

    const deleteRoomType = (roomTypeId: number) => {
        setState(prev => {
            const typeToDelete = prev.roomTypes.find(rt => rt.id === roomTypeId);
            if(!typeToDelete) return prev;
            
            return {
                ...prev,
                roomTypes: prev.roomTypes.filter(rt => rt.id !== roomTypeId),
                rooms: prev.rooms.filter(r => r.type !== typeToDelete.name)
            }
        });
    };

    const addRoom = (room: { number: string; type: string }) => {
        setState(prev => {
            const roomType = prev.roomTypes.find(rt => rt.name === room.type);
            const rate = roomType ? roomType.rates.NGN : 0;
            return {
                ...prev,
                rooms: [...prev.rooms, { id: Date.now(), number: room.number, type: room.type, rate, status: RoomStatusEnum.Vacant }]
            }
        });
    };

    const deleteRoom = (roomId: number) => {
        setState(prev => ({
            ...prev,
            rooms: prev.rooms.filter(r => r.id !== roomId)
        }));
    };

    const setStopSell = (stopSell: { [key: string]: boolean }) => {
        setState(prev => ({ ...prev, stopSell }));
    };

    const setTaxSettings = (taxSettings: TaxSettings) => {
        setState(prev => ({ ...prev, taxSettings }));
    };

    // --- Inventory Actions ---
    const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
        setState(prev => ({
            ...prev,
            inventory: [...prev.inventory, { ...item, id: Date.now() }]
        }));
        log(`Added inventory item: ${item.name}`, 'info');
    };

    const updateInventoryItem = (item: InventoryItem) => {
        setState(prev => ({
            ...prev,
            inventory: prev.inventory.map(i => i.id === item.id ? item : i)
        }));
        log(`Updated inventory: ${item.name}`, 'info');
    };

    const deleteInventoryItem = (itemId: number) => {
        setState(prev => ({
            ...prev,
            inventory: prev.inventory.filter(i => i.id !== itemId)
        }));
        log(`Deleted inventory item`, 'warn');
    };

    const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
        setState(prev => ({
            ...prev,
            suppliers: [...prev.suppliers, { ...supplier, id: Date.now() }]
        }));
        log(`Added supplier: ${supplier.name}`, 'info');
    };

    const updateSupplier = (supplier: Supplier) => {
        setState(prev => ({
            ...prev,
            suppliers: prev.suppliers.map(s => s.id === supplier.id ? supplier : s)
        }));
        log(`Updated supplier: ${supplier.name}`, 'info');
    };

    const deleteSupplier = (supplierId: number) => {
        setState(prev => ({
            ...prev,
            suppliers: prev.suppliers.filter(s => s.id !== supplierId)
        }));
        log(`Deleted supplier`, 'warn');
    };

    const clearAllData = () => {
        setState({ ...INITIAL_STATE, rooms: [], roomTypes: [], inventory: [], suppliers: [] }); 
        localStorage.removeItem('tide_pms_data');
        window.location.reload();
    };
    
    const addLoyaltyPoints = (guestId: number, points: number, description: string) => {
        setState(prev => ({
            ...prev,
            guests: prev.guests.map(g => g.id === guestId ? { ...g, loyaltyPoints: g.loyaltyPoints + points } : g),
            loyaltyTransactions: [...prev.loyaltyTransactions, { id: Date.now(), guestId, points, description, date: new Date().toISOString().split('T')[0] }]
        }));
        log(`Added ${points} loyalty points`, 'success');
    };

    const redeemLoyaltyPoints = async (guestId: number, pointsToRedeem: number): Promise<{ success: boolean, message: string }> => {
        let result = { success: false, message: '' };
        
        setState(prev => {
            const guest = prev.guests.find(g => g.id === guestId);
            if (!guest || guest.loyaltyPoints < pointsToRedeem) {
                result = { success: false, message: 'Insufficient points' };
                return prev;
            }
            
            result = { success: true, message: 'Points redeemed successfully' };
            return {
                ...prev,
                guests: prev.guests.map(g => g.id === guestId ? { ...g, loyaltyPoints: g.loyaltyPoints - pointsToRedeem } : g),
                loyaltyTransactions: [...prev.loyaltyTransactions, { id: Date.now(), guestId, points: -pointsToRedeem, description: 'Redemption', date: new Date().toISOString().split('T')[0] }]
            };
        });
        
        return result;
    };

    const addSyncLogEntry = (message: string, level?: SyncLogEntry['level']) => {
        log(message, level);
    };

    // Context Value
    const value: HotelData = useMemo(() => ({
        ...state,
        checkInGuest,
        updateRoomStatus,
        addTransaction,
        deleteTransaction,
        addOrder,
        updateOrderStatus,
        addReservation,
        addWalkInTransaction,
        addMaintenanceRequest,
        updateMaintenanceRequestStatus,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        updateGuestDetails,
        moveGuest,
        updateRate,
        addRoomType,
        updateRoomType,
        deleteRoomType,
        addRoom,
        deleteRoom,
        setStopSell,
        setTaxSettings,
        clearAllData,
        addLoyaltyPoints,
        redeemLoyaltyPoints,
        addSyncLogEntry,
        // Inventory exports
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        addSupplier,
        updateSupplier,
        deleteSupplier
    }), [state]);

    return (
        <HotelDataContext.Provider value={value}>
            {children}
        </HotelDataContext.Provider>
    );
};

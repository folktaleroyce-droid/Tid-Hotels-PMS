
import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import type { HotelData, Room, Guest, Reservation, Transaction, LoyaltyTransaction, WalkInTransaction, Order, Employee, SyncLogEntry, AuditLogEntry, MaintenanceRequest, RoomType, TaxSettings, RoomStatus, MaintenanceStatus, InventoryItem, Supplier, RatePlan, DiscountRule, TaxCharge } from '../types.ts';
import { INITIAL_ROOMS, INITIAL_ROOM_TYPES, INITIAL_TAX_SETTINGS, INITIAL_RESERVATIONS, INITIAL_INVENTORY, INITIAL_SUPPLIERS } from '../constants.tsx';
import { RoomStatus as RoomStatusEnum, UserRole } from '../types.ts';
import { useAuth } from './AuthContext.tsx';

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
    auditLog: AuditLogEntry[];
    maintenanceRequests: MaintenanceRequest[];
    roomTypes: RoomType[];
    ratePlans: RatePlan[];
    discountRules: DiscountRule[];
    taxCharges: TaxCharge[];
    taxSettings: TaxSettings;
    stopSell: { [key: string]: boolean };
    inventory: InventoryItem[];
    suppliers: Supplier[];
};

const INITIAL_STATE: HotelState = {
    rooms: INITIAL_ROOMS.map(r => ({ ...r, isActive: true })),
    guests: [],
    reservations: INITIAL_RESERVATIONS,
    transactions: [],
    loyaltyTransactions: [],
    walkInTransactions: [],
    orders: [],
    employees: [],
    syncLog: [],
    auditLog: [],
    maintenanceRequests: [],
    roomTypes: INITIAL_ROOM_TYPES.map(rt => ({ ...rt, isActive: true })),
    ratePlans: [
        { id: 1, name: 'Standard Rack Rate', roomTypeId: 1, rates: { NGN: 45000, USD: 60 }, isActive: true, description: 'Base rack rate for standard rooms.' },
        { id: 2, name: 'Deluxe Rack Rate', roomTypeId: 2, rates: { NGN: 65000, USD: 85 }, isActive: true, description: 'Base rack rate for deluxe rooms.' },
    ],
    discountRules: [
        { id: 1, name: 'Early Bird 10%', type: 'percentage', value: 10, isActive: true, applicableRoles: [UserRole.Manager, UserRole.FrontDesk] },
        { id: 2, name: 'Corporate Fixed Discount', type: 'fixed', value: 5000, isActive: true, applicableRoles: [UserRole.Manager] },
    ],
    taxCharges: [
        { id: 1, name: 'VAT', rate: 7.5, isInclusive: false, isActive: true },
        { id: 2, name: 'Service Charge', rate: 5, isInclusive: false, isActive: true },
    ],
    taxSettings: INITIAL_TAX_SETTINGS,
    stopSell: {},
    inventory: INITIAL_INVENTORY,
    suppliers: INITIAL_SUPPLIERS,
};

export const HotelDataContext = createContext<HotelData | undefined>(undefined);

export const HotelDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();

    const [state, setState] = useState<HotelState>(() => {
        try {
            const savedState = localStorage.getItem('tide_pms_data_v2');
            return savedState ? JSON.parse(savedState) : INITIAL_STATE;
        } catch (error) {
            console.error("Failed to load state from localStorage:", error);
            return INITIAL_STATE;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('tide_pms_data_v2', JSON.stringify(state));
        } catch (error) {
            console.error("Failed to save state to localStorage:", error);
        }
    }, [state]);

    const logAudit = (
        action: string, 
        entityType: string, 
        entityId?: string | number, 
        details: string = '', 
        previousValue?: string, 
        newValue?: string
    ) => {
        const entry: AuditLogEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            userId: currentUser?.id || 0,
            userName: currentUser?.name || 'SYSTEM',
            userRole: currentUser?.role || UserRole.Manager,
            action,
            entityType,
            entityId,
            details,
            previousValue,
            newValue
        };
        setState(prev => ({
            ...prev,
            auditLog: [entry, ...prev.auditLog].slice(0, 2000)
        }));
    };

    const log = (message: string, level: SyncLogEntry['level'] = 'info') => {
        const newLog: SyncLogEntry = {
            timestamp: new Date().toLocaleTimeString(),
            message,
            level
        };
        setState(prev => ({
            ...prev,
            syncLog: [newLog, ...prev.syncLog].slice(0, 50)
        }));
    };

    // --- Action Implementations ---

    const checkInGuest = (payload: { guest: Omit<Guest, 'id'>, roomId: number, charge: Omit<Transaction, 'id' | 'guestId'>, tax?: Omit<Transaction, 'id' | 'guestId'>, reservationId?: number }) => {
        setState(prev => {
            const newGuestId = Date.now();
            const newGuest: Guest = { ...payload.guest, id: newGuestId };
            const newTransactions = [...prev.transactions];
            newTransactions.push({ ...payload.charge, id: Date.now(), guestId: newGuestId });
            if (payload.tax) {
                newTransactions.push({ ...payload.tax, id: Date.now() + 1, guestId: newGuestId });
            }
            const updatedRooms = prev.rooms.map(r => 
                r.id === payload.roomId ? { ...r, status: RoomStatusEnum.Occupied, guestId: newGuestId } : r
            );
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
        logAudit('CHECK_IN', 'Guest', payload.guest.name, `User ${currentUser?.name} checked in guest to room ${payload.roomId}`);
    };

    const updateRoomStatus = (roomId: number, status: RoomStatus, guestId?: number) => {
        const oldStatus = state.rooms.find(r => r.id === roomId)?.status;
        setState(prev => ({
            ...prev,
            rooms: prev.rooms.map(r => r.id === roomId ? { ...r, status, guestId } : r)
        }));
        log(`Updated Room ${roomId} status to ${status}`, 'info');
        logAudit('ROOM_STATUS_UPDATE', 'Room', roomId, `Status changed from ${oldStatus} to ${status}`, oldStatus, status);
    };

    const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
        setState(prev => ({
            ...prev,
            transactions: [...prev.transactions, { ...transaction, id: Date.now() }]
        }));
        log(`Added transaction: ${transaction.description}`, 'info');
        logAudit('TRANSACTION_POST', 'Transaction', transaction.guestId, `Posted ${transaction.amount} for ${transaction.description}`);
    };

    const deleteTransaction = (transactionId: number) => {
        const trans = state.transactions.find(t => t.id === transactionId);
        setState(prev => ({
            ...prev,
            transactions: prev.transactions.filter(t => t.id !== transactionId)
        }));
        log(`Deleted transaction ID ${transactionId}`, 'warn');
        logAudit('TRANSACTION_DELETE', 'Transaction', transactionId, `Deleted transaction: ${trans?.description} (Amount: ${trans?.amount})`);
    };

    const addOrder = (order: Omit<Order, 'id' | 'createdAt'>) => {
        setState(prev => ({
            ...prev,
            orders: [...prev.orders, { ...order, id: Date.now(), createdAt: new Date().toISOString() }]
        }));
        log(`New order placed for Room ID ${order.roomId}`, 'success');
        logAudit('ORDER_CREATE', 'Order', order.roomId, `Placed room service order for room ${order.roomId}`);
    };

    const updateOrderStatus = (orderId: number, status: Order['status']) => {
        const oldStatus = state.orders.find(o => o.id === orderId)?.status;
        setState(prev => ({
            ...prev,
            orders: prev.orders.map(o => o.id === orderId ? { ...o, status } : o)
        }));
        logAudit('ORDER_STATUS_UPDATE', 'Order', orderId, `Order ${orderId} status changed to ${status}`, oldStatus, status);
    };

    const addReservation = (reservation: Omit<Reservation, 'id'>) => {
         setState(prev => ({
            ...prev,
            reservations: [...prev.reservations, { ...reservation, id: Date.now() }]
        }));
        log(`New reservation for ${reservation.guestName}`, 'success');
        logAudit('RESERVATION_CREATE', 'Reservation', reservation.guestName, `New reservation from ${reservation.ota}`);
    };

    const addWalkInTransaction = (transaction: Omit<WalkInTransaction, 'id' | 'date'>) => {
        setState(prev => ({
            ...prev,
            walkInTransactions: [...prev.walkInTransactions, { ...transaction, id: Date.now(), date: new Date().toISOString().split('T')[0] }]
        }));
        log('Processed new walk-in transaction', 'success');
        logAudit('WALKIN_TRANSACTION', 'Walk-in', transaction.service, `Processed ${transaction.amount} walk-in service: ${transaction.service}`);
    };

    const addMaintenanceRequest = (request: Omit<MaintenanceRequest, 'id' | 'reportedAt' | 'status'>) => {
        setState(prev => ({
            ...prev,
            maintenanceRequests: [...prev.maintenanceRequests, { 
                ...request, 
                id: Date.now(), 
                reportedAt: new Date().toLocaleDateString(), 
                status: 'Reported' as MaintenanceStatus 
            }]
        }));
        log('New maintenance request reported', 'warn');
        logAudit('MAINTENANCE_REPORT', 'Maintenance', request.location, `Reported issue at ${request.location}: ${request.description}`);
    };

    const updateMaintenanceRequestStatus = (requestId: number, status: MaintenanceStatus) => {
        const oldStatus = state.maintenanceRequests.find(r => r.id === requestId)?.status;
        setState(prev => ({
            ...prev,
            maintenanceRequests: prev.maintenanceRequests.map(req => req.id === requestId ? { ...req, status } : req)
        }));
        logAudit('MAINTENANCE_STATUS_UPDATE', 'Maintenance', requestId, `Status changed to ${status}`, oldStatus, status);
    };

    const addEmployee = (employee: Omit<Employee, 'id'>) => {
        setState(prev => ({
            ...prev,
            employees: [...prev.employees, { ...employee, id: Date.now() }]
        }));
        log(`Added new employee: ${employee.name}`, 'info');
        logAudit('EMPLOYEE_ADD', 'Employee', employee.name, `New employee hired: ${employee.name} as ${employee.jobTitle}`);
    };

    const updateEmployee = (employee: Employee) => {
        setState(prev => ({
            ...prev,
            employees: prev.employees.map(e => e.id === employee.id ? employee : e)
        }));
        log(`Updated employee: ${employee.name}`, 'info');
        logAudit('EMPLOYEE_UPDATE', 'Employee', employee.id, `Updated profile for ${employee.name}`);
    };

    const deleteEmployee = (employeeId: number) => {
        const emp = state.employees.find(e => e.id === employeeId);
        setState(prev => ({
            ...prev,
            employees: prev.employees.filter(e => e.id !== employeeId)
        }));
        log('Removed employee', 'warn');
        logAudit('EMPLOYEE_DELETE', 'Employee', employeeId, `Removed employee: ${emp?.name}`);
    };

    const updateGuestDetails = (guestId: number, updatedGuest: Partial<Guest>) => {
        setState(prev => ({
            ...prev,
            guests: prev.guests.map(g => g.id === guestId ? { ...g, ...updatedGuest } : g)
        }));
        log('Updated guest details', 'info');
        logAudit('GUEST_PROFILE_UPDATE', 'Guest', guestId, `Updated details for guest ID ${guestId}`);
    };

    const moveGuest = (payload: { guestId: number; oldRoomId: number; newRoomId: number }) => {
        setState(prev => {
            const oldRoom = prev.rooms.find(r => r.id === payload.oldRoomId);
            const newRoom = prev.rooms.find(r => r.id === payload.newRoomId);
            const guest = prev.guests.find(g => g.id === payload.guestId);
            if (!oldRoom || !newRoom || !guest) return prev;
            const updatedRooms = prev.rooms.map(r => {
                if (r.id === payload.oldRoomId) return { ...r, status: RoomStatusEnum.Dirty, guestId: undefined };
                if (r.id === payload.newRoomId) return { ...r, status: RoomStatusEnum.Occupied, guestId: payload.guestId };
                return r;
            });
            const updatedGuests = prev.guests.map(g => 
                g.id === payload.guestId ? { ...g, roomNumber: newRoom.number, roomType: newRoom.type } : g
            );
            return { ...prev, rooms: updatedRooms, guests: updatedGuests };
        });
        log('Moved guest to new room', 'info');
        logAudit('GUEST_MOVE', 'Room', payload.guestId, `Moved guest from room ${payload.oldRoomId} to ${payload.newRoomId}`);
    };

    const updateRate = (roomType: string, newRate: number, currency: 'NGN' | 'USD') => {
        const oldRate = state.roomTypes.find(rt => rt.name === roomType)?.rates[currency];
        setState(prev => ({
            ...prev,
            roomTypes: prev.roomTypes.map(rt => 
                rt.name === roomType 
                ? { ...rt, rates: { ...rt.rates, [currency]: newRate } }
                : rt
            ),
            rooms: prev.rooms.map(r => 
                r.type === roomType 
                ? { ...r, rate: currency === 'NGN' ? newRate : r.rate } 
                : r
            )
        }));
        log(`Updated base rate for ${roomType}`, 'info');
        logAudit('RATE_UPDATE', 'RoomType', roomType, `Updated ${currency} rate from ${oldRate} to ${newRate}`, oldRate?.toString(), newRate.toString());
    };
    
    const addRoomType = (roomType: Omit<RoomType, 'id'>) => {
        const id = Date.now();
        setState(prev => ({
            ...prev,
            roomTypes: [...prev.roomTypes, { ...roomType, id, isActive: true }]
        }));
        logAudit('ROOM_TYPE_ADD', 'RoomType', roomType.name, `Created new room type: ${roomType.name}`);
    };

    const updateRoomType = (roomType: RoomType) => {
        setState(prev => ({
            ...prev,
            roomTypes: prev.roomTypes.map(rt => rt.id === roomType.id ? roomType : rt)
        }));
        logAudit('ROOM_TYPE_UPDATE', 'RoomType', roomType.id, `Updated room type ${roomType.name}`);
    };

    const deleteRoomType = (roomTypeId: number) => {
        const rt = state.roomTypes.find(r => r.id === roomTypeId);
        setState(prev => {
            const typeToDelete = prev.roomTypes.find(rt => rt.id === roomTypeId);
            if(!typeToDelete) return prev;
            return {
                ...prev,
                roomTypes: prev.roomTypes.filter(rt => rt.id !== roomTypeId),
                rooms: prev.rooms.filter(r => r.type !== typeToDelete.name)
            }
        });
        logAudit('ROOM_TYPE_DELETE', 'RoomType', roomTypeId, `Deleted room type: ${rt?.name}`);
    };

    const addRoom = (room: { number: string; type: string }) => {
        setState(prev => {
            const roomType = prev.roomTypes.find(rt => rt.name === room.type);
            const rate = roomType ? roomType.rates.NGN : 0;
            return {
                ...prev,
                rooms: [...prev.rooms, { id: Date.now(), number: room.number, type: room.type, rate, status: RoomStatusEnum.Vacant, isActive: true }]
            }
        });
        logAudit('ROOM_ADD', 'Room', room.number, `Added physical room ${room.number} of type ${room.type}`);
    };

    const updateRoom = (room: Room) => {
        setState(prev => ({
            ...prev,
            rooms: prev.rooms.map(r => r.id === room.id ? room : r)
        }));
        logAudit('ROOM_UPDATE', 'Room', room.id, `Updated room details for ${room.number}`);
    };

    const deleteRoom = (roomId: number) => {
        const room = state.rooms.find(r => r.id === roomId);
        setState(prev => ({
            ...prev,
            rooms: prev.rooms.filter(r => r.id !== roomId)
        }));
        logAudit('ROOM_DELETE', 'Room', roomId, `Deleted room ${room?.number}`);
    };

    const addRatePlan = (plan: Omit<RatePlan, 'id'>) => {
        const id = Date.now();
        setState(prev => ({
            ...prev,
            ratePlans: [...prev.ratePlans, { ...plan, id }]
        }));
        logAudit('RATE_PLAN_ADD', 'RatePlan', plan.name, `Added new rate plan: ${plan.name}`);
    };

    const updateRatePlan = (plan: RatePlan) => {
        setState(prev => ({
            ...prev,
            ratePlans: prev.ratePlans.map(p => p.id === plan.id ? plan : p)
        }));
        logAudit('RATE_PLAN_UPDATE', 'RatePlan', plan.id, `Updated rate plan: ${plan.name}`);
    };

    const deleteRatePlan = (id: number) => {
        setState(prev => ({
            ...prev,
            ratePlans: prev.ratePlans.filter(p => p.id !== id)
        }));
        logAudit('RATE_PLAN_DELETE', 'RatePlan', id, `Deleted rate plan ID: ${id}`);
    };

    const addDiscountRule = (rule: Omit<DiscountRule, 'id'>) => {
        const id = Date.now();
        setState(prev => ({
            ...prev,
            discountRules: [...prev.discountRules, { ...rule, id }]
        }));
        logAudit('DISCOUNT_RULE_ADD', 'Discount', rule.name, `Added discount: ${rule.name}`);
    };

    const updateDiscountRule = (rule: DiscountRule) => {
        setState(prev => ({
            ...prev,
            discountRules: prev.discountRules.map(r => r.id === rule.id ? rule : r)
        }));
        logAudit('DISCOUNT_RULE_UPDATE', 'Discount', rule.id, `Updated discount: ${rule.name}`);
    };

    const deleteDiscountRule = (id: number) => {
        setState(prev => ({
            ...prev,
            discountRules: prev.discountRules.filter(r => r.id !== id)
        }));
        logAudit('DISCOUNT_RULE_DELETE', 'Discount', id, `Deleted discount rule ID: ${id}`);
    };

    const addTaxCharge = (charge: Omit<TaxCharge, 'id'>) => {
        const id = Date.now();
        setState(prev => ({
            ...prev,
            taxCharges: [...prev.taxCharges, { ...charge, id }]
        }));
        logAudit('TAX_CHARGE_ADD', 'Tax', charge.name, `Added tax charge: ${charge.name}`);
    };

    const updateTaxCharge = (charge: TaxCharge) => {
        setState(prev => ({
            ...prev,
            taxCharges: prev.taxCharges.map(t => t.id === charge.id ? charge : t)
        }));
        logAudit('TAX_CHARGE_UPDATE', 'Tax', charge.id, `Updated tax charge: ${charge.name}`);
    };

    const deleteTaxCharge = (id: number) => {
        setState(prev => ({
            ...prev,
            taxCharges: prev.taxCharges.filter(t => t.id !== id)
        }));
        logAudit('TAX_CHARGE_DELETE', 'Tax', id, `Deleted tax charge ID: ${id}`);
    };

    const setStopSell = (stopSell: { [key: string]: boolean }) => {
        setState(prev => ({ ...prev, stopSell }));
        logAudit('STOP_SELL_TOGGLE', 'Channel', 'Multiple', 'Updated stop sell restrictions');
    };

    const setTaxSettings = (taxSettings: TaxSettings) => {
        const oldSettings = JSON.stringify(state.taxSettings);
        setState(prev => ({ ...prev, taxSettings }));
        logAudit('TAX_CONFIG_UPDATE', 'System', 'Tax', `Updated tax rate to ${taxSettings.rate}%`, oldSettings, JSON.stringify(taxSettings));
    };

    // --- Inventory Actions ---
    const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
        setState(prev => ({
            ...prev,
            inventory: [...prev.inventory, { ...item, id: Date.now() }]
        }));
        log(`Added inventory item: ${item.name}`, 'info');
        logAudit('INVENTORY_ADD', 'Inventory', item.name, `Added item ${item.name} to ${item.category}`);
    };

    const updateInventoryItem = (item: InventoryItem) => {
        const oldItem = state.inventory.find(i => i.id === item.id);
        setState(prev => ({
            ...prev,
            inventory: prev.inventory.map(i => i.id === item.id ? item : i)
        }));
        logAudit('INVENTORY_UPDATE', 'Inventory', item.id, `Updated stock/details for ${item.name}`, oldItem?.quantity.toString(), item.quantity.toString());
    };

    const deleteInventoryItem = (itemId: number) => {
        const item = state.inventory.find(i => i.id === itemId);
        setState(prev => ({
            ...prev,
            inventory: prev.inventory.filter(i => i.id !== itemId)
        }));
        logAudit('INVENTORY_DELETE', 'Inventory', itemId, `Removed inventory item: ${item?.name}`);
    };

    const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
        setState(prev => ({
            ...prev,
            suppliers: [...prev.suppliers, { ...supplier, id: Date.now() }]
        }));
        logAudit('SUPPLIER_ADD', 'Supplier', supplier.name, `Onboarded new supplier: ${supplier.name}`);
    };

    const updateSupplier = (supplier: Supplier) => {
        setState(prev => ({
            ...prev,
            suppliers: prev.suppliers.map(s => s.id === supplier.id ? supplier : s)
        }));
        logAudit('SUPPLIER_UPDATE', 'Supplier', supplier.id, `Updated profile for supplier: ${supplier.name}`);
    };

    const deleteSupplier = (supplierId: number) => {
        const supp = state.suppliers.find(s => s.id === supplierId);
        setState(prev => ({
            ...prev,
            suppliers: prev.suppliers.filter(s => s.id !== supplierId)
        }));
        logAudit('SUPPLIER_DELETE', 'Supplier', supplierId, `Removed supplier: ${supp?.name}`);
    };

    const clearAllData = () => {
        logAudit('SYSTEM_CLEAR', 'System', 'ALL', 'FULL SYSTEM RESET INITIATED BY ADMIN');
        setState({ ...INITIAL_STATE, rooms: [], roomTypes: [], inventory: [], suppliers: [] }); 
        localStorage.removeItem('tide_pms_data_v2');
        window.location.reload();
    };
    
    const addLoyaltyPoints = (guestId: number, points: number, description: string) => {
        setState(prev => ({
            ...prev,
            guests: prev.guests.map(g => g.id === guestId ? { ...g, loyaltyPoints: g.loyaltyPoints + points } : g),
            loyaltyTransactions: [...prev.loyaltyTransactions, { id: Date.now(), guestId, points, description, date: new Date().toISOString().split('T')[0] }]
        }));
        logAudit('LOYALTY_EARN', 'Loyalty', guestId, `Awarded ${points} points: ${description}`);
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
        if (result.success) {
            logAudit('LOYALTY_REDEEM', 'Loyalty', guestId, `Redeemed ${pointsToRedeem} points`);
        }
        return result;
    };

    const addSyncLogEntry = (message: string, level?: SyncLogEntry['level']) => {
        log(message, level);
    };

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
        updateRoom,
        deleteRoom,
        addRatePlan,
        updateRatePlan,
        deleteRatePlan,
        addDiscountRule,
        updateDiscountRule,
        deleteDiscountRule,
        addTaxCharge,
        updateTaxCharge,
        deleteTaxCharge,
        setStopSell,
        setTaxSettings,
        clearAllData,
        addLoyaltyPoints,
        redeemLoyaltyPoints,
        addSyncLogEntry,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        addSupplier,
        updateSupplier,
        deleteSupplier
    }), [state, currentUser]);

    return (
        <HotelDataContext.Provider value={value}>
            {children}
        </HotelDataContext.Provider>
    );
};

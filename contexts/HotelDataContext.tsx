
import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import type { HotelData, Room, Guest, Reservation, Transaction, LoyaltyTransaction, WalkInTransaction, Order, Employee, SyncLogEntry, AuditLogEntry, MaintenanceRequest, RoomType, TaxSettings, InventoryItem, Supplier, RatePlan, DiscountRule, TaxCharge, CityLedgerAccount, CityLedgerTransaction, InventoryMovement, BaseEntity, PropertyInfo, Staff, Branch, Role, ModulePermissions, CateringAsset, Event, SystemSecuritySettings, SystemIntegrationSettings, Expense, MenuItem, SecurityIncident } from '../types.ts';
import { INITIAL_ROOMS, INITIAL_ROOM_TYPES, INITIAL_RESERVATIONS, INITIAL_INVENTORY, INITIAL_SUPPLIERS, INITIAL_STAFF, MENU_ITEMS as STATIC_MENU } from '../constants.tsx';
import { RoomStatus as RoomStatusEnum, HousekeepingStatus, UserRole, MaintenanceStatus, PaymentStatus, InventoryCategory, LoyaltyTier } from '../types.ts';
import { useAuth } from './AuthContext.tsx';

type HotelState = {
    propertyInfo: PropertyInfo;
    securitySettings: SystemSecuritySettings;
    integrationSettings: SystemIntegrationSettings;
    branches: Branch[];
    customRoles: Role[];
    systemStatus: HotelData['systemStatus'];
    licenseStatus: HotelData['licenseStatus'];
    systemModules: Record<string, boolean>;
    rooms: Room[];
    guests: Guest[];
    reservations: Reservation[];
    transactions: Transaction[];
    cityLedgerAccounts: CityLedgerAccount[];
    cityLedgerTransactions: CityLedgerTransaction[];
    inventoryMovements: InventoryMovement[];
    loyaltyTransactions: LoyaltyTransaction[];
    walkInTransactions: WalkInTransaction[];
    orders: Order[];
    employees: Employee[];
    staff: Staff[];
    syncLog: SyncLogEntry[];
    auditLog: AuditLogEntry[];
    securityIncidents: SecurityIncident[];
    maintenanceRequests: MaintenanceRequest[];
    roomTypes: RoomType[];
    cateringAssets: CateringAsset[];
    events: Event[];
    ratePlans: RatePlan[];
    discountRules: DiscountRule[];
    taxCharges: TaxCharge[];
    taxSettings: TaxSettings;
    stopSell: { [key: string]: boolean };
    inventory: InventoryItem[];
    suppliers: Supplier[];
    expenses: Expense[];
    menuItems: MenuItem[];
};

export const HotelDataContext = createContext<HotelData | undefined>(undefined);

export const HotelDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [clientIp, setClientIp] = useState<string>('N/A');

    const createMetadata = (userName: string): BaseEntity => ({
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userName || 'SYSTEM',
        updatedBy: userName || 'SYSTEM',
        isDeleted: false,
    });

    const INITIAL_STATE: HotelState = {
        propertyInfo: {
            name: 'Smartwave Enterprise HUB',
            address: 'Industrial District Node, Lagos',
            phone: '+234 800 SMARTWAVE',
            email: 'ops@smartwavehub.com',
            website: 'www.smartwavehub.com',
            currency: 'NGN',
            timezone: 'Africa/Lagos',
            language: 'English',
            checkInTime: '14:00',
            checkOutTime: '11:00',
            brandColor: 'indigo'
        },
        securitySettings: {
          passwordPolicy: 'Strong',
          enforce2FA: true,
          loginAttemptLimit: 5,
          sessionTimeoutMinutes: 30,
          ipWhitelist: []
        },
        integrationSettings: {
          paymentGateway: 'Paystack',
          posSystem: 'Lightspeed',
          channelManagerApi: 'Siteminder',
          accountingSoftware: 'Quickbooks'
        },
        branches: [
          { id: 'main', name: 'Smartwave HQ', location: 'Lagos', status: 'Active' },
          { id: 'branch-2', name: 'Smartwave Node B', location: 'Abuja', status: 'Active' }
        ],
        customRoles: [],
        systemStatus: 'Active',
        licenseStatus: 'Paid',
        systemModules: {
            reception: true,
            finance: true,
            housekeeping: true,
            inventory: true,
            catering: true,
            restaurant: true,
            maintenance: true,
            loyalty: true
        },
        staff: INITIAL_STAFF.map(s => ({ ...s, branchId: 'main', status: 'Active', department: 'Management', ...createMetadata('SYSTEM') })),
        rooms: INITIAL_ROOMS.map(r => ({ ...r, floor: Math.floor(parseInt(r.number) / 100), housekeepingStatus: HousekeepingStatus.Clean, isActive: true, statusNotes: '', ...createMetadata('SYSTEM') })) as Room[],
        guests: [
            { id: 1, name: 'Initial Resident A', email: 'guest.a@example.com', phone: '08011111111', arrivalDate: '2023-10-01', departureDate: '2023-10-15', roomNumber: '101', roomType: 'Standard Room', idType: 'NIN', idNumber: '123456789', adults: 1, loyaltyPoints: 100, loyaltyTier: LoyaltyTier.Silver, bookingSource: 'Direct', currency: 'NGN', ...createMetadata('SYSTEM') } as Guest,
            { id: 2, name: 'Initial Resident B', email: 'guest.b@example.com', phone: '08022222222', arrivalDate: '2023-10-05', departureDate: '2023-10-10', roomNumber: '204', roomType: 'Deluxe Room', idType: 'Passport', idNumber: 'A1234567', adults: 2, loyaltyPoints: 50, loyaltyTier: LoyaltyTier.Bronze, bookingSource: 'Booking.com', currency: 'NGN', ...createMetadata('SYSTEM') } as Guest,
        ],
        reservations: INITIAL_RESERVATIONS.map(r => ({ ...r, status: 'Confirmed', paymentStatus: PaymentStatus.Pending, ...createMetadata('SYSTEM') })) as Reservation[],
        transactions: [],
        cityLedgerAccounts: [
            { id: 1, companyName: 'Shell Nigeria', creditLimit: 5000000, currentBalance: 0, contactPerson: 'Billing Dept', email: 'shell@hotels.com', phone: '080-000-0001', paymentTerms: 'Net 30', isActive: true, ...createMetadata('SYSTEM') },
            { id: 2, companyName: 'Nigerian Breweries', creditLimit: 2000000, currentBalance: 0, contactPerson: 'Finance Team', email: 'nb@hotels.com', phone: '080-000-0002', paymentTerms: 'Net 15', isActive: true, ...createMetadata('SYSTEM') },
        ],
        cityLedgerTransactions: [],
        inventoryMovements: [],
        loyaltyTransactions: [],
        walkInTransactions: [],
        orders: [],
        employees: [],
        syncLog: [],
        auditLog: [],
        securityIncidents: [],
        maintenanceRequests: [],
        roomTypes: INITIAL_ROOM_TYPES.map(rt => ({ ...rt, isActive: true, ...createMetadata('SYSTEM') })) as RoomType[],
        cateringAssets: [
          { id: 1, name: 'Chafing Dish (Rectangular)', quantityTotal: 25, quantityAvailable: 25, condition: 'Excellent', ...createMetadata('SYSTEM') },
          { id: 2, name: 'Dinner Plates (Set of 50)', quantityTotal: 10, quantityAvailable: 10, condition: 'Good', ...createMetadata('SYSTEM') },
        ],
        events: [],
        ratePlans: [
            { id: 1, name: 'STANDARD RACK', description: 'Default system pricing manifest', roomTypeId: 1, rates: { NGN: 45000, USD: 60 }, isActive: true, ...createMetadata('SYSTEM') }
        ],
        discountRules: [],
        taxCharges: [],
        taxSettings: {
            isEnabled: true,
            components: [
                { id: 1, name: 'VAT', rate: 7.5, isInclusive: true, showOnReceipt: true, isActive: true, ...createMetadata('SYSTEM') } as TaxCharge
            ]
        },
        stopSell: {},
        inventory: INITIAL_INVENTORY.map(i => ({ ...i, category: InventoryCategory.Housekeeping, ...createMetadata('SYSTEM') })) as InventoryItem[],
        suppliers: INITIAL_SUPPLIERS.map(s => ({ ...s, ...createMetadata('SYSTEM') })) as Supplier[],
        expenses: [],
        menuItems: STATIC_MENU.map((m, idx) => ({ ...m, id: idx + 1, category: 'Food', isActive: true, ...createMetadata('SYSTEM') })) as MenuItem[],
    };

    const [state, setState] = useState<HotelState>(() => {
        try {
            const savedState = localStorage.getItem('smartwave_pms_prod_v5');
            return savedState ? JSON.parse(savedState) : INITIAL_STATE;
        } catch (error) {
            return INITIAL_STATE;
        }
    });

    useEffect(() => {
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => setClientIp(data.ip))
            .catch(() => setClientIp('127.0.0.1'));
    }, []);

    useEffect(() => {
        localStorage.setItem('smartwave_pms_prod_v5', JSON.stringify(state));
    }, [state]);

    const logAudit = (action: string, entityType: string, entityId?: string | number, details: string = '') => {
        const entry: AuditLogEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            userId: currentUser?.id || 0,
            userName: currentUser?.name || 'SYSTEM',
            userRole: currentUser?.role || UserRole.Staff,
            ipAddress: clientIp,
            branchId: currentUser?.branchId,
            action,
            entityType,
            entityId,
            details,
        };
        setState(s => ({ ...s, auditLog: [entry, ...s.auditLog].slice(0, 1000) }));
    };

    const addSyncLogEntry = (message: string, level: SyncLogEntry['level'] = 'info') => {
        setState(s => ({ ...s, syncLog: [{ timestamp: new Date().toLocaleTimeString(), message, level }, ...s.syncLog].slice(0, 50) }));
    };

    const value: HotelData = useMemo(() => ({
        ...state,
        updatePropertyInfo: (i) => {
            setState(s => ({ ...s, propertyInfo: i }));
            logAudit('PROPERTY_CONFIG_ALTERED', 'System', i.name, 'Operational metadata updated');
        },
        updateSecuritySettings: (s) => {
            setState(prev => ({ ...prev, securitySettings: s }));
            logAudit('SECURITY_HARDENING_UPDATED', 'Security', 'Global', 'Access control policies modified');
        },
        updateIntegrationSettings: (s) => setState(prev => ({ ...prev, integrationSettings: s })),
        updateSystemStatus: (s) => {
            setState(prev => ({ ...prev, systemStatus: s }));
            logAudit('SYSTEM_STATE_CHANGED', 'Engine', 'Kernel', `Node transitioned to ${s}`);
        },
        toggleModule: (id) => {
            setState(s => ({ ...s, systemModules: { ...s.systemModules, [id]: !s.systemModules[id] } }));
            logAudit('MODULE_STATE_TOGGLED', 'System', id, `Functional availability altered for ${id}`);
        },
        addBranch: (b) => setState(s => ({ ...s, branches: [...s.branches, { ...b, id: `br-${Date.now()}` }] })),
        updateBranch: (b) => setState(s => ({ ...s, branches: s.branches.map(br => br.id === b.id ? b : br) })),
        addCustomRole: (r) => setState(s => ({ ...s, customRoles: [...s.customRoles, { ...r, id: `role-${Date.now()}` }] })),
        updateCustomRole: (r) => setState(s => ({ ...s, customRoles: s.customRoles.map(ro => ro.id === r.id ? r : ro) })),
        deleteCustomRole: (id) => setState(s => ({ ...s, customRoles: s.customRoles.filter(r => r.id !== id) })),
        addStaff: (m) => {
            const userName = currentUser?.name || 'SYSTEM';
            const meta = createMetadata(userName);
            setState(s => ({ ...s, staff: [...s.staff, { ...m, id: Date.now(), ...meta } as Staff] }));
            logAudit('ACTOR_PROVISIONED', 'Staff', m.name, `New identity created with rank ${m.role}`);
        },
        updateStaff: (m) => {
            const meta = createMetadata(currentUser?.name || 'SYSTEM');
            setState(s => ({ ...s, staff: s.staff.map(st => st.id === m.id ? { ...m, updatedAt: meta.updatedAt } : st) }));
            logAudit('ACTOR_PROFILE_UPDATED', 'Staff', m.name, 'Credentials or permissions modified');
        },
        deleteStaff: (id) => {
            const victim = state.staff.find(s => s.id === id);
            setState(s => ({ ...s, staff: s.staff.filter(st => st.id !== id) }));
            logAudit('ACTOR_REVOKED', 'Staff', victim?.name || id, 'Permanent removal from authoritative registry');
        },
        checkInGuest: (payload) => {
            const newGuestId = Date.now();
            const meta = createMetadata(currentUser?.name || 'SYSTEM');
            const newGuest: Guest = { ...payload.guest, id: newGuestId, ...meta };
            const invoiceNum = `INV-${newGuestId.toString().slice(-6)}`;
            
            // Calculate multiple taxes for base induction charge
            const transPool = [{ ...payload.charge, id: Date.now() + 1, guestId: newGuestId, type: 'charge', invoiceNumber: invoiceNum, ...meta } as Transaction];
            
            if (state.taxSettings.isEnabled) {
                state.taxSettings.components.forEach((comp, idx) => {
                    if (comp.isActive && !comp.isInclusive) {
                         transPool.push({
                            id: Date.now() + 2 + idx,
                            guestId: newGuestId,
                            description: `${comp.name} (${comp.rate}%)`,
                            amount: payload.charge.amount * (comp.rate / 100),
                            date: newGuest.arrivalDate,
                            type: 'charge',
                            invoiceNumber: invoiceNum,
                            ...meta
                         } as Transaction);
                    }
                });
            }

            setState(prev => ({
                ...prev,
                guests: [...prev.guests, newGuest],
                transactions: [...prev.transactions, ...transPool],
                rooms: prev.rooms.map(r => r.id === payload.roomId ? { ...r, status: RoomStatusEnum.Occupied, guestId: newGuestId, updatedAt: meta.updatedAt } : r),
                reservations: payload.reservationId ? prev.reservations.map(r => r.id === payload.reservationId ? { ...r, status: 'CheckedIn' } : r) : prev.reservations
            }));
            logAudit('RESIDENCY_STARTED', 'Guest', newGuest.name, `Check-in complete for Unit ${payload.roomId}`);
            addSyncLogEntry(`Guest ${newGuest.name} checked into Unit ${payload.roomId}`, 'success');
        },
        checkOutGuest: (payload) => {
            const meta = createMetadata(currentUser?.name || 'SYSTEM');
            const transPool = payload.payment ? [{ ...payload.payment, id: Date.now(), guestId: payload.guestId, type: 'payment', ...meta } as Transaction] : [];
            
            setState(prev => ({
                ...prev,
                transactions: [...prev.transactions, ...transPool],
                rooms: prev.rooms.map(r => r.id === payload.roomId ? { ...r, status: RoomStatusEnum.Dirty, guestId: undefined, updatedAt: meta.updatedAt } : r),
                reservations: payload.reservationId ? prev.reservations.map(r => r.id === payload.reservationId ? { ...r, status: 'CheckedOut' } : r) : prev.reservations
            }));
            
            logAudit('RESIDENCY_TERMINATED', 'Guest', payload.guestId, `Checkout and fiscal settlement complete for Unit ${payload.roomId}`);
            addSyncLogEntry(`Residency vacated for Unit ${payload.roomId}`, 'success');
        },
        updateReservation: (res) => {
            setState(s => ({ ...s, reservations: s.reservations.map(r => r.id === res.id ? { ...res, updatedAt: new Date().toISOString() } : r) }));
            logAudit('RESERVATION_MODIFIED', 'Reservation', res.guestName, `Manifest updated for entry #${res.id}`);
        },
        approveReservation: (id) => {
            const res = state.reservations.find(r => r.id === id);
            if (!res) return;
            setState(s => ({ ...s, reservations: s.reservations.map(r => r.id === id ? { ...r, status: 'Confirmed', updatedAt: new Date().toISOString() } : r) }));
            logAudit('RESERVATION_APPROVED', 'Reservation', res.guestName, `Pending entry #${id} transitioned to Confirmed`);
            addSyncLogEntry(`Reservation #${id} for ${res.guestName} Approved`, 'success');
        },
        addSyncLogEntry,
        logAudit,
        updateRoomStatus: (id, status, guestId, notes) => {
            const room = state.rooms.find(r => r.id === id);
            setState(s => ({ 
                ...s, 
                rooms: s.rooms.map(r => r.id === id ? { ...r, status, guestId, statusNotes: notes || r.statusNotes, updatedAt: new Date().toISOString() } : r) 
            }));
            logAudit('INFRASTRUCTURE_STATE_CHANGE', 'Room', room?.number || id, `Unit status set to ${status}. Briefing: ${notes || 'No briefing recorded'}`);
        },
        updateHousekeepingStatus: (id, status) => {
            const room = state.rooms.find(r => r.id === id);
            setState(s => ({ ...s, rooms: s.rooms.map(r => r.id === id ? { ...r, housekeepingStatus: status, updatedAt: new Date().toISOString() } : r) }));
            logAudit('HYGIENE_STATUS_MODIFIED', 'Housekeeping', room?.number || id, `Condition recorded as ${status}`);
        },
        addTransaction: (t) => {
            const meta = createMetadata(currentUser?.name || 'SYSTEM');
            setState(s => ({ ...s, transactions: [...s.transactions, { ...t, id: Date.now(), ...meta } as Transaction] }));
            logAudit('FISCAL_POSTING', 'Accounting', t.description, `New entry recorded: ₦${t.amount.toLocaleString()}`);
        },
        deleteTransaction: (id) => setState(s => ({ ...s, transactions: s.transactions.filter(t => t.id !== id) })),
        addWalkInTransaction: (t) => {
            setState(s => ({ ...s, walkInTransactions: [...s.walkInTransactions, { ...t, id: Date.now(), date: new Date().toISOString().split('T')[0] }] }));
            logAudit('EXTERNAL_REVENUE_CAPTURED', 'POS', t.service, `Walk-in settlement of ₦${t.amountPaid.toLocaleString()}`);
        },
        addOrder: (o) => setState(s => ({ ...s, orders: [...s.orders, { ...o, id: Date.now(), ...createMetadata(currentUser?.name || 'SYSTEM') } as Order] })),
        updateOrderStatus: (id, st) => {
            setState(s => ({ ...s, orders: s.orders.map(o => o.id === id ? { ...o, status: st, updatedAt: new Date().toISOString() } : o) }));
            logAudit('ORDER_STATE_TRANSITION', 'Catering', id, `Service state moved to ${st}`);
        },
        addEmployee: (e) => {
            const id = Date.now();
            const meta = createMetadata(currentUser?.name || 'SYSTEM');
            setState(s => ({ ...s, employees: [...s.employees, { ...e, id, ...meta } as Employee] }));
            logAudit('OPERATIVE_REGISTERED', 'HR', e.name, 'New identity profile archived');
        },
        updateEmployee: (e) => {
            const meta = createMetadata(currentUser?.name || 'SYSTEM');
            setState(s => ({ ...s, employees: s.employees.map(emp => emp.id === e.id ? { ...e, updatedAt: meta.updatedAt } : emp) }));
            logAudit('OPERATIVE_PROFILE_MODIFIED', 'HR', e.name, 'Profile metadata updated');
        },
        deleteEmployee: (id) => {
            const emp = state.employees.find(e => e.id === id);
            setState(s => ({ ...s, employees: s.employees.filter(e => e.id !== id) }));
            logAudit('OPERATIVE_REMOVED', 'HR', emp?.name || id, 'Permanent removal of operative identity');
        },
        addReservation: (r) => {
            const meta = createMetadata(currentUser?.name || 'SYSTEM');
            setState(s => ({ ...s, reservations: [...s.reservations, { ...r, id: Date.now(), status: 'Pending', paymentStatus: PaymentStatus.Pending, ...meta } as Reservation] }));
        },
        updateGuestDetails: (id, g) => setState(s => ({ ...s, guests: s.guests.map(gu => gu.id === id ? { ...gu, ...g, updatedAt: new Date().toISOString() } : gu) })),
        addMaintenanceRequest: (req) => {
            const meta = createMetadata(currentUser?.name || 'SYSTEM');
            setState(s => ({ ...s, maintenanceRequests: [...s.maintenanceRequests, { ...req, id: Date.now(), reportedAt: new Date().toISOString(), status: MaintenanceStatus.Reported, ...meta } as MaintenanceRequest] }));
            logAudit('INFRASTRUCTURE_FAULT_LOGGED', 'Engineering', req.location, `Urgency: ${req.priority}`);
        },
        updateMaintenanceRequestStatus: (id, status) => setState(s => ({ ...s, maintenanceRequests: s.maintenanceRequests.map(r => r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r) })),
        moveGuest: (p) => {
            setState(s => ({
                ...s,
                rooms: s.rooms.map(r => {
                    if (r.id === p.oldRoomId) return { ...r, status: RoomStatusEnum.Vacant, guestId: undefined };
                    if (r.id === p.newRoomId) return { ...r, status: RoomStatusEnum.Occupied, guestId: p.guestId };
                    return r;
                })
            }));
            logAudit('RESIDENCY_RELOCATED', 'Reception', p.guestId, `Moved from Unit ${p.oldRoomId} to ${p.newRoomId}`);
        },
        updateRate: (type, rate, cur) => setState(s => ({ ...s, roomTypes: s.roomTypes.map(rt => rt.name === type ? { ...rt, rates: { ...rt.rates, [cur]: rate } } : rt) })),
        addRoomType: (rt) => setState(s => ({ ...s, roomTypes: [...s.roomTypes, { ...rt, id: Date.now(), ...createMetadata(currentUser?.name || 'SYSTEM') } as RoomType] })),
        updateRoomType: (rt) => setState(s => ({ ...s, roomTypes: s.roomTypes.map(r => r.id === rt.id ? rt : r) })),
        deleteRoomType: (id) => setState(s => ({ ...s, roomTypes: s.roomTypes.filter(r => r.id !== id) })),
        addRoom: (r) => {
            const matchingType = state.roomTypes.find(rt => rt.name === r.type);
            const rate = matchingType ? matchingType.rates.NGN : 0;
            
            setState(s => ({ 
                ...s, 
                rooms: [...s.rooms, { 
                    ...r, 
                    id: Date.now(), 
                    rate, 
                    status: RoomStatusEnum.Vacant, 
                    housekeepingStatus: HousekeepingStatus.Clean, 
                    isActive: true, 
                    statusNotes: '',
                    ...createMetadata(currentUser?.name || 'SYSTEM') 
                } as Room] 
            }));
            logAudit('UNIT_DEPLOYED', 'Infrastructure', r.number, `Unit mapped to category ${r.type}`);
        },
        updateRoom: (r) => setState(s => ({ ...s, rooms: s.rooms.map(room => room.id === r.id ? r : room) })),
        deleteRoom: (id) => setState(s => ({ ...s, rooms: s.rooms.filter(r => r.id !== id) })),
        clearAllData: () => { localStorage.removeItem('smartwave_pms_prod_v5'); window.location.reload(); },
        addLoyaltyPoints: (id, pts, desc) => setState(s => ({ ...s, guests: s.guests.map(g => g.id === id ? { ...g, loyaltyPoints: g.loyaltyPoints + pts } : g), loyaltyTransactions: [...s.loyaltyTransactions, { id: Date.now(), guestId: id, points: pts, description: desc, date: new Date().toISOString().split('T')[0] }] })),
        redeemLoyaltyPoints: async (id, pts) => { 
            const g = state.guests.find(g => g.id === id);
            if (!g || g.loyaltyPoints < pts) return { success: false, message: 'Insufficient points' };
            setState(s => ({ ...s, guests: s.guests.map(guest => guest.id === id ? { ...guest, loyaltyPoints: guest.loyaltyPoints - pts } : guest) }));
            return { success: true, message: 'Points redeemed' };
        },
        addRatePlan: (p) => {
            const meta = createMetadata(currentUser?.name || 'SYSTEM');
            setState(s => ({ ...s, ratePlans: [...s.ratePlans, { ...p, id: Date.now(), ...meta } as RatePlan] }));
            logAudit('RATE_PLAN_CREATED', 'Infrastructure', p.name, 'New named Rack Rate manifest archived');
        },
        updateRatePlan: (p) => setState(s => ({ ...s, ratePlans: s.ratePlans.map(rp => rp.id === p.id ? p : rp) })),
        deleteRatePlan: (id) => {
            const plan = state.ratePlans.find(p => p.id === id);
            setState(s => ({ ...s, ratePlans: s.ratePlans.filter(p => p.id !== id) }));
            logAudit('RATE_PLAN_REVOKED', 'Infrastructure', plan?.name || id, 'Named pricing tier removed from registry');
        },
        addCityLedgerAccount: (a) => setState(s => ({ ...s, cityLedgerAccounts: [...s.cityLedgerAccounts, { ...a, id: Date.now(), currentBalance: 0, ...createMetadata(currentUser?.name || 'SYSTEM') } as CityLedgerAccount] })),
        postToCityLedger: (t) => {
            setState(s => ({ ...s, cityLedgerTransactions: [...s.cityLedgerTransactions, { ...t, id: Date.now(), ...createMetadata(currentUser?.name || 'SYSTEM') } as CityLedgerTransaction] }));
            logAudit('CORPORATE_LEDGER_POSTING', 'Finance', t.accountId, 'External account activity recorded');
        },
        addInventoryItem: (i) => {
            const meta = createMetadata(currentUser?.name || 'SYSTEM');
            setState(s => ({ ...s, inventory: [...s.inventory, { ...i, id: Date.now(), ...meta } as InventoryItem] }));
            logAudit('RESOURCE_INDUCTED', 'Logistics', i.name, 'New inventory item catalogued');
        },
        updateInventoryItem: (i, m) => {
            const meta = createMetadata(currentUser?.name || 'SYSTEM');
            if (m) setState(s => ({ ...s, inventory: s.inventory.map(it => it.id === i.id ? i : it), inventoryMovements: [{ ...m, itemId: i.id, id: Date.now(), ...meta } as InventoryMovement, ...s.inventoryMovements] }));
            else setState(s => ({ ...s, inventory: s.inventory.map(it => it.id === i.id ? i : it) }));
            if (m) logAudit('STOCK_LOG_ENTRY', 'Logistics', i.name, `Inventory adjustment: ${m.type} [${m.quantity}]`);
        },
        deleteInventoryItem: (id) => setState(s => ({ ...s, inventory: s.inventory.filter(i => i.id !== id) })),
        addSupplier: (sup) => setState(s => ({ ...s, suppliers: [...s.suppliers, { ...sup, id: Date.now(), ...createMetadata(currentUser?.name || 'SYSTEM') } as Supplier] })),
        updateSupplier: (sup) => setState(s => ({ ...s, suppliers: s.suppliers.map(s => s.id === sup.id ? sup : s) })),
        deleteSupplier: (id) => setState(s => ({ ...s, suppliers: s.suppliers.filter(s => s.id !== id) })),
        addCateringAsset: (a) => setState(s => ({ ...s, cateringAssets: [...s.cateringAssets, { ...a, id: Date.now(), ...createMetadata(currentUser?.name || 'SYSTEM') } as CateringAsset] })),
        updateCateringAsset: (a) => setState(s => ({ ...s, cateringAssets: s.cateringAssets.map(ast => ast.id === a.id ? a : ast) })),
        deleteCateringAsset: (id) => setState(s => ({ ...s, cateringAssets: s.cateringAssets.filter(a => a.id !== id) })),
        addEvent: (e) => {
            setState(s => ({ ...s, events: [...s.events, { ...e, id: Date.now(), ...createMetadata(currentUser?.name || 'SYSTEM') } as Event] }));
            logAudit('EVENT_AUTHORIZED', 'Catering', e.clientName, 'Manifest finalized and assets allocated');
        },
        updateEvent: (e) => setState(s => ({ ...s, events: s.events.map(ev => ev.id === e.id ? e : ev) })),
        setStopSell: (st) => setState(s => ({ ...s, stopSell: st })),
        setTaxSettings: (tx) => {
            setState(s => ({ ...s, taxSettings: tx }));
            logAudit('TAX_PROTOCOLS_UPDATED', 'Finance', 'System', 'Global tax component matrix modified');
        },
        addDiscountRule: (r) => setState(s => ({ ...s, discountRules: [...s.discountRules, { ...r, id: Date.now(), ...createMetadata(currentUser?.name || 'SYSTEM') } as DiscountRule] })),
        updateDiscountRule: (r) => setState(s => ({ ...s, discountRules: s.discountRules.map(dr => dr.id === r.id ? r : dr) })),
        deleteDiscountRule: (id) => setState(s => ({ ...s, discountRules: s.discountRules.filter(r => r.id !== id) })),
        addTaxCharge: (c) => {
            const meta = createMetadata(currentUser?.name || 'SYSTEM');
            const newComp = { ...c, id: Date.now(), ...meta } as TaxCharge;
            setState(s => ({ ...s, taxSettings: { ...s.taxSettings, components: [...s.taxSettings.components, newComp] } }));
        },
        updateTaxCharge: (c) => {
            setState(s => ({ ...s, taxSettings: { ...s.taxSettings, components: s.taxSettings.components.map(comp => comp.id === c.id ? c : comp) } }));
        },
        deleteTaxCharge: (id) => {
            setState(s => ({ ...s, taxSettings: { ...s.taxSettings, components: s.taxSettings.components.filter(c => c.id !== id) } }));
        },
        addExpense: (ex) => {
            const meta = createMetadata(currentUser?.name || 'SYSTEM');
            setState(s => ({ ...s, expenses: [...s.expenses, { ...ex, id: Date.now(), ...meta } as Expense] }));
            logAudit('FISCAL_EXPENDITURE', 'Accounting', ex.category, `Expenditure of ₦${ex.amount.toLocaleString()} logged`);
        },
        deleteExpense: (id) => setState(s => ({ ...s, expenses: s.expenses.filter(e => e.id !== id) })),
        addMenuItem: (mi) => setState(s => ({ ...s, menuItems: [...s.menuItems, { ...mi, id: Date.now(), ...createMetadata(currentUser?.name || 'SYSTEM') } as MenuItem] })),
        updateMenuItem: (mi) => setState(s => ({ ...s, menuItems: s.menuItems.map(item => item.id === mi.id ? mi : item) })),
        deleteMenuItem: (id) => setState(s => ({ ...s, menuItems: s.menuItems.filter(i => i.id !== id) })),
        addSecurityIncident: (inc) => {
            const meta = createMetadata(currentUser?.name || 'SYSTEM');
            setState(s => ({ ...s, securityIncidents: [...s.securityIncidents, { ...inc, id: Date.now(), timestamp: new Date().toISOString(), status: 'Open', ...meta } as SecurityIncident] }));
            logAudit('SECURITY_EVENT_ARCHIVED', 'Security', inc.type, `Threat Level ${inc.severity} logged at ${inc.location}`);
        },
        updateSecurityIncidentStatus: (id, st) => setState(s => ({ ...s, securityIncidents: s.securityIncidents.map(i => i.id === id ? { ...i, status: st } : i) })),
    }), [state, currentUser, clientIp]);

    return (
        <HotelDataContext.Provider value={value}>
            {children}
        </HotelDataContext.Provider>
    );
};

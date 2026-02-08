
import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getFirestore, collection, onSnapshot, query, orderBy, 
    doc, setDoc, updateDoc, deleteDoc, addDoc, serverTimestamp, 
    where, limit 
} from 'firebase/firestore';
import type { 
    HotelData, Room, Guest, Reservation, Transaction, LoyaltyTransaction, 
    WalkInTransaction, Order, Employee, SyncLogEntry, AuditLogEntry, 
    MaintenanceRequest, RoomType, TaxSettings, InventoryItem, Supplier, 
    RatePlan, DiscountRule, TaxCharge, CityLedgerAccount, CityLedgerTransaction, 
    InventoryMovement, BaseEntity, PropertyInfo, Staff, Branch, Role, 
    CateringAsset, Event, SystemSecuritySettings, SystemIntegrationSettings, 
    Expense, MenuItem, SecurityIncident 
} from '../types.ts';
import { 
    INITIAL_ROOMS, INITIAL_ROOM_TYPES, INITIAL_RESERVATIONS, 
    INITIAL_INVENTORY, INITIAL_SUPPLIERS, INITIAL_STAFF, 
    MENU_ITEMS as STATIC_MENU, INITIAL_TAX_SETTINGS
} from '../constants.tsx';
import { RoomStatus as RoomStatusEnum, HousekeepingStatus, UserRole, MaintenanceStatus, PaymentStatus, InventoryCategory, LoyaltyTier } from '../types.ts';
import { useAuth } from './AuthContext.tsx';

// FIREBASE STUB: Replace with real config if provided
const firebaseConfig = {
    apiKey: "AIzaSy_demo",
    authDomain: "smartwave-demo.firebaseapp.com",
    projectId: "smartwave-demo",
    storageBucket: "smartwave-demo.appspot.com",
    messagingSenderId: "12345",
    appId: "1:12345:web:67890"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const HotelDataContext = createContext<HotelData | undefined>(undefined);

export const HotelDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [clientIp, setClientIp] = useState<string>('N/A');

    // Authoritative Cloud State
    const [propertyInfo, setPropertyInfo] = useState<PropertyInfo>(() => {
        const saved = localStorage.getItem('sw_prop_v5');
        return saved ? JSON.parse(saved) : {
            name: 'Smartwave Enterprise HUB',
            address: 'Industrial District Node, Lagos',
            phone: '+234 800 SMARTWAVE',
            email: 'ops@smartwavehub.com',
            website: 'www.smartwavehub.com',
            bankAccounts: [
                { id: 'primary-node', bankName: 'Zenith Bank', accountName: 'Smartwave Hub Ops', accountNumber: '1012345678', isPrimary: true }
            ],
            currency: 'NGN',
            timezone: 'Africa/Lagos',
            language: 'English',
            checkInTime: '14:00',
            checkOutTime: '11:00',
            brandColor: 'indigo'
        };
    });

    const [rooms, setRooms] = useState<Room[]>([]);
    const [guests, setGuests] = useState<Guest[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
    const [syncLog, setSyncLog] = useState<SyncLogEntry[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [taxSettings, setTaxSettings] = useState<TaxSettings>(INITIAL_TAX_SETTINGS);
    
    // Feature Module States (Persistent via Local for demo, usually Firestore)
    const [systemModules, setSystemModules] = useState<Record<string, boolean>>({
        reception: true, finance: true, housekeeping: true, inventory: true, 
        catering: true, restaurant: true, maintenance: true, loyalty: true
    });

    // 1. ATTACH AUTHORITATIVE REAL-TIME LISTENERS
    useEffect(() => {
        // Listen to Reservations Queue
        const qRes = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'), limit(100));
        const unsubRes = onSnapshot(qRes, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id })) as Reservation[];
            // Fallback for demo if collection is empty
            setReservations(data.length > 0 ? data : INITIAL_RESERVATIONS.map(r => ({ ...r, status: 'Confirmed', createdAt: new Date().toISOString() } as any)));
        });

        // Listen to In-House Residents
        const qGuests = query(collection(db, 'guests'), orderBy('updatedAt', 'desc'));
        const unsubGuests = onSnapshot(qGuests, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id })) as Guest[];
            setGuests(data);
        });

        // Listen to Infrastructure Matrix (Units)
        const qRooms = query(collection(db, 'rooms'), orderBy('number', 'asc'));
        const unsubRooms = onSnapshot(qRooms, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id })) as Room[];
            setRooms(data.length > 0 ? data : INITIAL_ROOMS.map(r => ({ ...r, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any)));
        });

        // Listen to Fiscal Transactions
        const qTrans = query(collection(db, 'transactions'), orderBy('date', 'desc'), limit(500));
        const unsubTrans = onSnapshot(qTrans, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id })) as Transaction[];
            setTransactions(data);
        });

        // Listen to Authorized Room Categories
        const qTypes = query(collection(db, 'roomTypes'));
        const unsubTypes = onSnapshot(qTypes, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id })) as RoomType[];
            setRoomTypes(data.length > 0 ? data : INITIAL_ROOM_TYPES.map(rt => ({ ...rt, isActive: true } as any)));
        });

        return () => {
            unsubRes(); unsubGuests(); unsubRooms(); unsubTrans(); unsubTypes();
        };
    }, []);

    const addSyncLogEntry = (message: string, level: SyncLogEntry['level'] = 'info') => {
        setSyncLog(s => [{ timestamp: new Date().toLocaleTimeString(), message, level }, ...s].slice(0, 20));
    };

    const logAudit = async (action: string, entityType: string, entityId: any, details: string) => {
        const entry = {
            timestamp: new Date().toISOString(),
            userId: currentUser?.id || 0,
            userName: currentUser?.name || 'SYSTEM',
            userRole: currentUser?.role || 'Staff',
            action, entityType, entityId, details
        };
        // In a real env, we push to Firestore
        setAuditLog(prev => [ { id: Date.now(), ...entry } as AuditLogEntry, ...prev ].slice(0, 100));
    };

    // AUTHORITATIVE ACTIONS
    const value: HotelData = useMemo(() => ({
        propertyInfo, rooms, guests, reservations, transactions, auditLog, syncLog, 
        roomTypes, taxSettings, systemModules,
        
        updatePropertyInfo: (i) => {
            setPropertyInfo(i);
            localStorage.setItem('sw_prop_v5', JSON.stringify(i));
            addSyncLogEntry('Global Identity Manifest Updated', 'success');
        },

        checkInGuest: async (p) => {
            addSyncLogEntry(`Initiating induction for ${p.guest.name}...`, 'info');
            try {
                // 1. Create Guest Doc
                const guestRef = await addDoc(collection(db, 'guests'), {
                    ...p.guest,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                // 2. Post Initial Base Charge
                await addDoc(collection(db, 'transactions'), {
                    ...p.charge,
                    guestId: guestRef.id,
                    type: 'charge',
                    createdAt: new Date().toISOString()
                });

                // 3. Update Room Status
                const roomDoc = doc(db, 'rooms', p.roomId.toString());
                await setDoc(roomDoc, { status: RoomStatusEnum.Occupied, guestId: guestRef.id, updatedAt: new Date().toISOString() }, { merge: true });

                // 4. Finalize Reservation if exists
                if (p.reservationId) {
                    await updateDoc(doc(db, 'reservations', p.reservationId.toString()), { status: 'CheckedIn' });
                }

                logAudit('GUEST_CHECKIN', 'Guest', guestRef.id, `Inducted to Unit ${p.roomId}`);
                addSyncLogEntry(`Induction Complete: ${p.guest.name} active in Unit ${p.roomId}`, 'success');
            } catch (err) {
                addSyncLogEntry(`Induction Failed: ${err.message}`, 'error');
            }
        },

        addReservation: async (r) => {
            try {
                await addDoc(collection(db, 'reservations'), {
                    ...r,
                    status: 'Pending',
                    createdAt: new Date().toISOString()
                });
                addSyncLogEntry(`Reservation logged for ${r.guestName}`, 'success');
            } catch (err) {
                addSyncLogEntry('Manifest Entry Failed', 'error');
            }
        },

        updateReservation: async (r) => {
            await updateDoc(doc(db, 'reservations', r.id.toString()), { ...r, updatedAt: new Date().toISOString() });
        },

        updateRoomStatus: async (id, status, guestId, notes) => {
            const roomRef = doc(db, 'rooms', id.toString());
            await updateDoc(roomRef, { status, guestId, statusNotes: notes || '', updatedAt: new Date().toISOString() });
            addSyncLogEntry(`Unit ${id} status moved to ${status}`, 'info');
        },

        addTransaction: async (t) => {
            await addDoc(collection(db, 'transactions'), { ...t, createdAt: new Date().toISOString() });
            addSyncLogEntry(`Fiscal Posting: ${t.description}`, 'success');
        },

        setTaxSettings: (t) => setTaxSettings(t),
        toggleModule: (id) => setSystemModules(prev => ({ ...prev, [id]: !prev[id] })),
        updateRoomType: (rt) => setRoomTypes(prev => prev.map(r => r.id === rt.id ? rt : r)),
        addRoomType: (rt) => setRoomTypes(prev => [...prev, { ...rt, id: Date.now() } as any]),
        updateRoom: (r) => setRooms(prev => prev.map(rm => rm.id === r.id ? r : rm)),
        addRoom: (r) => setRooms(prev => [...prev, { ...r, id: Date.now(), status: RoomStatusEnum.Vacant } as any]),
        deleteRoom: (id) => setRooms(prev => prev.filter(r => r.id !== id)),
    } as any), [propertyInfo, rooms, guests, reservations, transactions, auditLog, syncLog, roomTypes, taxSettings, systemModules]);

    return (
        <HotelDataContext.Provider value={value}>
            {children}
        </HotelDataContext.Provider>
    );
};

import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import type { HotelData, Room, Guest, Reservation, Transaction, LoyaltyTransaction, WalkInTransaction, Order, Employee, SyncLogEntry, MaintenanceRequest, RoomType, TaxSettings, RoomStatus, MaintenanceStatus, HotelAction } from '../types.ts';

// @ts-ignore
const io = window.io;
const API_URL = 'http://localhost:5001'; // The address of the new Flask backend

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
};

const INITIAL_STATE: HotelState = {
    rooms: [],
    guests: [],
    reservations: [],
    transactions: [],
    loyaltyTransactions: [],
    walkInTransactions: [],
    orders: [],
    employees: [],
    syncLog: [],
    maintenanceRequests: [],
    roomTypes: [],
    taxSettings: { isEnabled: true, rate: 7.5 },
    stopSell: {},
};

export const HotelDataContext = createContext<HotelData | undefined>(undefined);

async function apiRequest(endpoint: string, method: string = 'GET', body?: any) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API request failed');
        }
        if (response.status === 204) { // No Content
            return null;
        }
        return response.json();
    } catch (error) {
        console.error(`API Error on ${method} ${endpoint}:`, error);
        // In a real app, you'd want a global error handling system here
        alert(`An error occurred: ${error.message}`);
        throw error;
    }
}


export const HotelDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<HotelState>(INITIAL_STATE);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Fetch initial data from the backend
        const fetchInitialData = async () => {
            try {
                const data = await apiRequest('/api/data');
                setState(data);
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            }
        };

        fetchInitialData();

        // Connect to WebSocket for real-time updates
        const socket = io(API_URL);

        socket.on('connect', () => {
            console.log('Connected to backend WebSocket.');
            setIsConnected(true);
        });
        
        // This is the core of the real-time functionality.
        // The server emits 'data_update' whenever any data changes.
        // We receive the complete, fresh state and update our local state.
        socket.on('data_update', (updatedData: HotelState) => {
            console.log('Received data update from server.');
            setState(updatedData);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from backend WebSocket.');
            setIsConnected(false);
        });
        
        socket.on('connect_error', (err) => {
          console.error("Connection Error", err);
        });


        // Cleanup on component unmount
        return () => {
            socket.disconnect();
        };
    }, []);

    // Create context value with user-friendly action functions that call the backend API
    const value: HotelData = useMemo(() => ({
        ...state,
        checkInGuest: (payload) => apiRequest('/api/guests/check-in', 'POST', payload),
        addOrder: (order) => apiRequest('/api/orders', 'POST', order),
        updateRoomStatus: (roomId, status, guestId) => apiRequest(`/api/rooms/${roomId}/status`, 'PUT', { status, guestId }),
        addTransaction: (transaction) => apiRequest('/api/transactions', 'POST', transaction),
        addWalkInTransaction: (transaction) => apiRequest('/api/walk-in-transactions', 'POST', transaction),
        addEmployee: (employee) => apiRequest('/api/employees', 'POST', employee),
        updateEmployee: (employee) => apiRequest(`/api/employees/${employee.id}`, 'PUT', employee),
        addReservation: (reservation) => apiRequest('/api/reservations', 'POST', reservation),
        addSyncLogEntry: (message, level) => apiRequest('/api/logs', 'POST', { message, level }),
        updateRate: (roomType, newRate, currency) => apiRequest('/api/rates', 'PUT', { roomType, newRate, currency }),
        updateGuestDetails: (guestId, updatedGuest) => apiRequest(`/api/guests/${guestId}`, 'PUT', updatedGuest),
        addMaintenanceRequest: (request) => apiRequest('/api/maintenance', 'POST', request),
        updateMaintenanceRequestStatus: (requestId, status) => apiRequest(`/api/maintenance/${requestId}/status`, 'PUT', { status }),
        addLoyaltyPoints: (guestId, points, description) => apiRequest('/api/loyalty/add', 'POST', { guestId, points, description }),
        redeemLoyaltyPoints: async (guestId, pointsToRedeem) => {
           try {
                return await apiRequest('/api/loyalty/redeem', 'POST', { guestId, pointsToRedeem });
           } catch (error) {
               return { success: false, message: error.message };
           }
        },
        addRoomType: (roomType) => apiRequest('/api/room-types', 'POST', roomType),
        updateRoomType: (roomType) => apiRequest(`/api/room-types/${roomType.id}`, 'PUT', roomType),
        deleteRoomType: (roomTypeId) => apiRequest(`/api/room-types/${roomTypeId}`, 'DELETE'),
        addRoom: (room) => apiRequest('/api/rooms', 'POST', room),
        deleteRoom: (roomId) => apiRequest(`/api/rooms/${roomId}`, 'DELETE'),
        clearAllData: () => apiRequest('/api/data/clear', 'POST'),
        updateOrderStatus: (orderId, status) => apiRequest(`/api/orders/${orderId}/status`, 'PUT', { status }),
        deleteTransaction: (transactionId) => apiRequest(`/api/transactions/${transactionId}`, 'DELETE'),
        deleteEmployee: (employeeId) => apiRequest(`/api/employees/${employeeId}`, 'DELETE'),
        moveGuest: (payload) => apiRequest('/api/guests/move', 'POST', payload),
        setStopSell: (newStopSellState) => apiRequest('/api/stop-sell', 'POST', {stopSell: newStopSellState}),
        setTaxSettings: (newTaxSettings) => apiRequest('/api/settings/tax', 'POST', newTaxSettings),
    }), [state]);


    return (
        <HotelDataContext.Provider value={value}>
            {!isConnected && (
                <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center p-2 z-50">
                    Connecting to backend... If this persists, please ensure the server is running.
                </div>
            )}
            {children}
        </HotelDataContext.Provider>
    );
};

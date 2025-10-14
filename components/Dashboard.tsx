import React from 'react';
// FIX: Added file extensions to imports to resolve module errors.
import { Card } from './common/Card.tsx';
import type { HotelData } from '../types.ts';
import { RoomStatus } from '../types.ts';

interface DashboardProps {
    hotelData: HotelData;
}

export const Dashboard: React.FC<DashboardProps> = ({ hotelData }) => {
    const { rooms, guests, orders, employees } = hotelData;

    const vacantRooms = rooms.filter(r => r.status === RoomStatus.Vacant).length;
    const occupiedRooms = rooms.filter(r => r.status === RoomStatus.Occupied).length;
    const dirtyRooms = rooms.filter(r => r.status === RoomStatus.Dirty).length;
    const outOfOrderRooms = rooms.filter(r => r.status === RoomStatus.OutOfOrder).length;

    const occupancyRate = rooms.length > 0 ? (occupiedRooms / rooms.length * 100).toFixed(1) : 0;
    
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card title="Room Status">
                <div className="space-y-2">
                    <p>Occupancy Rate: <span className="font-bold">{occupancyRate}%</span></p>
                    <p>Vacant: <span className="font-bold">{vacantRooms}</span></p>
                    <p>Occupied: <span className="font-bold">{occupiedRooms}</span></p>
                    <p>Dirty: <span className="font-bold">{dirtyRooms}</span></p>
                    <p>Out of Order: <span className="font-bold">{outOfOrderRooms}</span></p>
                </div>
            </Card>
            <Card title="Guest Information">
                <p className="text-4xl font-bold">{guests.length}</p>
                <p>Guests currently checked in.</p>
            </Card>
            <Card title="Room Service">
                <p className="text-4xl font-bold">{pendingOrders}</p>
                <p>Pending orders.</p>
            </Card>
            <Card title="Employees">
                <p className="text-4xl font-bold">{employees.length}</p>
                <p>Staff members on payroll.</p>
            </Card>
        </div>
    );
};

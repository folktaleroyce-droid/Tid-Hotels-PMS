import React from 'react';
import { Card } from './common/Card.tsx';
import type { HotelData } from '../types.ts';
import { RoomStatus } from '../types.ts';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ROOM_STATUS_THEME } from '../constants.tsx';

interface DashboardProps {
    hotelData: HotelData;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <Card className="flex items-center p-4">
        <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-800 mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    </Card>
);

export const Dashboard: React.FC<DashboardProps> = ({ hotelData }) => {
    const { rooms, guests, orders, transactions } = hotelData;
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    // KPI Calculations
    const occupiedRooms = rooms.filter(r => r.status === RoomStatus.Occupied).length;
    const totalRooms = rooms.length > 0 ? rooms.length : 1;
    const occupancyRate = ((occupiedRooms / totalRooms) * 100).toFixed(1) + '%';
    const guestsInHouse = guests.length;
    const availableRooms = rooms.filter(r => r.status === RoomStatus.Vacant).length;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysRevenue = transactions
        .filter(t => t.date === todayStr && t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0)
        .toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    
    // Chart Data Preparation
    const roomStatusData = Object.values(RoomStatus).map(status => ({
        name: status,
        count: rooms.filter(r => r.status === status).length,
        fill: ROOM_STATUS_THEME[status].fill,
    }));

    const revenueData = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const revenue = transactions
            .filter(t => t.date === dateStr && t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
        return { date: dateStr.slice(5), revenue };
    }).reverse();
    
    // Widget Data
    const recentCheckins = rooms
        .filter(r => r.status === RoomStatus.Occupied && r.guestId)
        .map(r => guests.find(g => g.id === r.guestId))
        .filter(g => g !== undefined)
        .slice(0, 3);
        
    const pendingOrders = orders.filter(o => o.status === 'Pending');

    return (
        <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Today's Revenue" value={todaysRevenue} icon={<CurrencyIcon />} />
                <StatCard title="Occupancy Rate" value={occupancyRate} icon={<OccupancyIcon />} />
                <StatCard title="Guests In-House" value={guestsInHouse} icon={<UsersIcon />} />
                <StatCard title="Available Rooms" value={availableRooms} icon={<KeyIcon />} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Room Occupancy Overview">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={roomStatusData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                            <XAxis dataKey="name" tick={{ fill: isDarkMode ? '#D1D5DB' : '#4B5563' }} fontSize={12} />
                            <YAxis tick={{ fill: isDarkMode ? '#D1D5DB' : '#4B5563' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                                    borderColor: isDarkMode ? '#374151' : '#E5E7EB'
                                }}
                            />
                            <Bar dataKey="count" fill="#8884d8" name="Rooms" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                <Card title="Revenue (Last 7 Days)">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                            <XAxis dataKey="date" tick={{ fill: isDarkMode ? '#D1D5DB' : '#4B5563' }} />
                            <YAxis tick={{ fill: isDarkMode ? '#D1D5DB' : '#4B5563' }} tickFormatter={(value) => `$${value}`} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                                    borderColor: isDarkMode ? '#374151' : '#E5E7EB'
                                }}
                                formatter={(value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} name="Revenue" />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
            </div>
            
            {/* Actionable Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Recent Activity">
                     <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Latest Check-ins</h4>
                     <ul className="space-y-2">
                        {recentCheckins.map(guest => (
                            <li key={guest!.id} className="text-sm">
                                <span className="font-medium text-indigo-600 dark:text-indigo-400">{guest!.name}</span> checked into Room {rooms.find(r => r.guestId === guest!.id)?.number}.
                            </li>
                        ))}
                     </ul>
                </Card>
                <Card title="Pending Orders">
                    <ul className="space-y-3">
                        {pendingOrders.map(order => (
                             <li key={order.id} className="text-sm flex justify-between">
                                <span>Order #{order.id} for Room {rooms.find(r => r.id === order.roomId)?.number}</span>
                                <span className="font-semibold">{order.items.reduce((acc, i) => acc + i.quantity, 0)} items</span>
                            </li>
                        ))}
                        {pendingOrders.length === 0 && <p className="text-slate-500 dark:text-slate-400">No pending orders.</p>}
                    </ul>
                </Card>
            </div>
        </div>
    );
};

// Icons
const CurrencyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
const OccupancyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>;
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 016-6h4a6 6 0 016 6z" /></svg>;

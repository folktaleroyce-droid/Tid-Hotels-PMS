import React, { useState } from 'react';
import { Card } from './common/Card.tsx';
import type { HotelData } from '../types.ts';
import { RoomStatus } from '../types.ts';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ROOM_STATUS_THEME, MOCK_OTA_RESERVATIONS } from '../constants.tsx';

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
    const { rooms, guests, orders, transactions, reservations, addReservation } = hotelData;
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';
    const [otaSyncIndex, setOtaSyncIndex] = useState(0);

    const handleOtaSync = () => {
        if (otaSyncIndex < MOCK_OTA_RESERVATIONS.length) {
            addReservation(MOCK_OTA_RESERVATIONS[otaSyncIndex]);
            setOtaSyncIndex(prev => prev + 1);
        } else {
            alert("No more mock OTA reservations to sync.");
        }
    };

    // KPI Calculations
    const occupiedRooms = rooms.filter(r => r.status === RoomStatus.Occupied).length;
    const totalRooms = rooms.length > 0 ? rooms.length : 1;
    const occupancyRate = ((occupiedRooms / totalRooms) * 100).toFixed(1) + '%';
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysArrivals = reservations.filter(r => r.checkInDate === todayStr);
    const guestsInHouse = guests.length + todaysArrivals.filter(a => !rooms.some(r => r.guestId && guests.find(g => g.id === r.guestId)?.name === a.guestName)).length;
    
    const availableRooms = rooms.filter(r => r.status === RoomStatus.Vacant).length;
    
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

    return (
        <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Today's Revenue" value={todaysRevenue} icon={<CurrencyIcon />} />
                <StatCard title="Occupancy Rate" value={occupancyRate} icon={<OccupancyIcon />} />
                <StatCard title="Guests In-House" value={guestsInHouse} icon={<UsersIcon />} />
                <StatCard title="Available Rooms" value={availableRooms} icon={<KeyIcon />} />
            </div>

            {/* OTA & Arrivals Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="OTA Synchronization" className="lg:col-span-1">
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            Pull the latest bookings from integrated Online Travel Agencies.
                        </p>
                        <button
                            onClick={handleOtaSync}
                            disabled={otaSyncIndex >= MOCK_OTA_RESERVATIONS.length}
                            className="w-full px-4 py-3 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center"
                        >
                            <SyncIcon />
                            <span className="ml-2">Sync with OTAs</span>
                        </button>
                    </div>
                </Card>
                <Card title="Upcoming Arrivals" className="lg:col-span-2">
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                        {todaysArrivals.length > 0 ? todaysArrivals.map(res => (
                            <div key={res.id} className="flex justify-between items-center p-2 rounded-md bg-slate-50 dark:bg-slate-800/50">
                                <div>
                                    <p className="font-semibold">{res.guestName}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{res.roomType}</p>
                                </div>
                                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{res.ota}</span>
                            </div>
                        )) : <p className="text-slate-500 dark:text-slate-400">No arrivals scheduled for today.</p>}
                    </div>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Room Status Overview">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={roomStatusData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                            <XAxis dataKey="name" tick={{ fill: isDarkMode ? '#D1D5DB' : '#4B5563' }} fontSize={12} angle={-25} textAnchor="end" height={50} />
                            <YAxis tick={{ fill: isDarkMode ? '#D1D5DB' : '#4B5563' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                                    borderColor: isDarkMode ? '#374151' : '#E5E7EB'
                                }}
                            />
                            <Bar dataKey="count" name="Rooms" />
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
        </div>
    );
};

// Icons
const CurrencyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
const OccupancyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>;
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 016-6h4a6 6 0 016 6z" /></svg>;
const SyncIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>;

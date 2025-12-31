
import React, { useMemo } from 'react';
import { Card } from './common/Card.tsx';
import type { HotelData, Transaction, Guest, AuditLogEntry } from '../types.ts';
import { RoomStatus, PaymentStatus } from '../types.ts';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ROOM_STATUS_THEME, LOYALTY_TIER_THEME } from '../constants.tsx';
import { PaymentStatusBadge } from './common/PaymentStatusBadge.tsx';

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

const calculateBalance = (guestId: number, transactions: Transaction[]): number => {
    return transactions
        .filter(t => t.guestId === guestId)
        .reduce((acc, t) => acc + t.amount, 0);
};

const getPaymentStatus = (balance: number, rate: number): PaymentStatus => {
    if (balance <= 0.01) return PaymentStatus.Paid;
    if (balance > rate) return PaymentStatus.Owing;
    return PaymentStatus.Pending;
};

const AuditActivityItem: React.FC<{ entry: AuditLogEntry }> = ({ entry }) => (
    <div className="flex items-start space-x-3 p-3 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 mb-2">
        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {entry.userName.slice(0, 2).toUpperCase()}
            </span>
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {entry.userName} <span className="text-xs font-normal text-slate-500">• {entry.userRole}</span>
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{entry.details}</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono">
                {new Date(entry.timestamp).toLocaleTimeString()}
            </p>
        </div>
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ hotelData }) => {
    const { rooms, guests, transactions, reservations, auditLog } = hotelData;
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    const guestsWithBalance = useMemo(() => {
        return rooms
            .filter(r => r.status === RoomStatus.Occupied && r.guestId)
            .map(room => {
                const guest = guests.find(g => g.id === room.guestId);
                if (!guest) return null;

                const balance = calculateBalance(guest.id, transactions);
                if (balance <= 0.01) return null;

                const status = getPaymentStatus(balance, room.rate);
                return { guest, room, balance, status };
            })
            .filter((item): item is { guest: Guest; room: typeof rooms[0]; balance: number; status: PaymentStatus } => item !== null)
            .sort((a, b) => b.balance - a.balance);
    }, [rooms, guests, transactions]);


    // KPI Calculations
    const occupiedRooms = rooms.filter(r => r.status === RoomStatus.Occupied).length;
    const totalRooms = rooms.length > 0 ? rooms.length : 1;
    const occupancyRate = ((occupiedRooms / totalRooms) * 100).toFixed(1) + '%';
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysArrivals = reservations.filter(r => r.checkInDate === todayStr);
    const todaysDepartures = guests.filter(g => g.departureDate === todayStr && rooms.some(r => r.guestId === g.id));
    
    const guestsInHouse = guests.length + todaysArrivals.filter(a => !rooms.some(r => r.guestId && guests.find(g => g.id === r.guestId)?.name === a.guestName)).length;
    
    const availableRooms = rooms.filter(r => r.status === RoomStatus.Vacant).length;
    
    const todaysRevenue = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(transactions
        .filter(t => t.date === todayStr && t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0));
    
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

    const recentAuditActivity = useMemo(() => auditLog.slice(0, 8), [auditLog]);

    return (
        <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Today's Revenue" value={todaysRevenue} icon={<CurrencyIcon />} />
                <StatCard title="Occupancy Rate" value={occupancyRate} icon={<OccupancyIcon />} />
                <StatCard title="Guests In-House" value={guestsInHouse} icon={<UsersIcon />} />
                <StatCard title="Available Rooms" value={availableRooms} icon={<KeyIcon />} />
            </div>

            {/* Main Grid: Charts & Audit */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                <YAxis tick={{ fill: isDarkMode ? '#D1D5DB' : '#4B5563' }} tickFormatter={(value) => `₦${Number(value) / 1000}k`} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                                        borderColor: isDarkMode ? '#374151' : '#E5E7EB'
                                    }}
                                    formatter={(value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value)}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} name="Revenue" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </div>

                <div className="xl:col-span-1">
                    <Card title="Recent Activity" className="h-full">
                        <div className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                            {recentAuditActivity.length > 0 ? recentAuditActivity.map(entry => (
                                <AuditActivityItem key={entry.id} entry={entry} />
                            )) : (
                                <p className="text-center py-8 text-slate-500 italic">No recent activity.</p>
                            )}
                        </div>
                        {auditLog.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-400 text-center uppercase font-bold tracking-widest">
                                    Full audit available in Admin
                                </p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
            
            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <Card title="Guest Accounts Overview" className="lg:col-span-2">
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {guestsWithBalance.length > 0 ? guestsWithBalance.map(({ guest, room, balance, status }) => (
                            <div key={guest.id} className="flex justify-between items-center p-2 rounded-md bg-slate-50 dark:bg-slate-800/50">
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <p className="font-semibold">{guest.name}</p>
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${LOYALTY_TIER_THEME[guest.loyaltyTier].bg} ${LOYALTY_TIER_THEME[guest.loyaltyTier].text}`}>
                                            {guest.loyaltyTier}
                                        </span>
                                        <span className="text-sm text-slate-500">(Room {room.number})</span>
                                    </div>
                                    <p className={`text-sm font-bold ${status === PaymentStatus.Owing ? 'text-red-500' : 'text-yellow-600'}`}>
                                      Balance: ₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <PaymentStatusBadge status={status} showLabel />
                            </div>
                        )) : (
                          <div className="flex items-center justify-center h-full text-center py-8">
                            <p className="text-slate-500 dark:text-slate-400">All guest accounts are settled.</p>
                          </div>
                        )}
                    </div>
                </Card>

                <div className="space-y-6 lg:col-span-1">
                    <Card title="Upcoming Arrivals">
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
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

                     <Card title="Today's Departures">
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {todaysDepartures.length > 0 ? todaysDepartures.map(guest => (
                                <div key={guest.id} className="flex justify-between items-center p-2 rounded-md bg-slate-50 dark:bg-slate-800/50">
                                    <div>
                                        <p className="font-semibold">{guest.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Room {guest.roomNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-medium text-slate-500 block">Check-out</span>
                                    </div>
                                </div>
                            )) : <p className="text-slate-500 dark:text-slate-400">No departures scheduled for today.</p>}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// Icons
const CurrencyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
const OccupancyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>;
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 016-6h4a6 6 0 016 6z" /></svg>;

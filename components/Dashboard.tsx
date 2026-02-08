
import React, { useMemo } from 'react';
import { Card } from './common/Card.tsx';
import type { HotelData, Transaction, Guest, AuditLogEntry } from '../types.ts';
import { RoomStatus, PaymentStatus } from '../types.ts';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { ROOM_STATUS_THEME } from '../constants.tsx';

interface DashboardProps {
    hotelData: HotelData;
}

const StatCard: React.FC<{ title: string; value: string | number; subText?: string; icon: React.ReactNode }> = ({ title, value, subText, icon }) => (
    <Card className="flex flex-col p-4 border-l-4 border-indigo-600">
        <div className="flex items-center mb-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 mr-3">
                {icon}
            </div>
            <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">{title}</p>
        </div>
        <div className="mt-auto">
            <p className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{value}</p>
            {subText && <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">{subText}</p>}
        </div>
    </Card>
);

export const Dashboard: React.FC<DashboardProps> = ({ hotelData }) => {
    const { rooms, guests, transactions, auditLog, propertyInfo } = hotelData;

    const stats = useMemo(() => {
        const occCount = rooms.filter(r => r.status === RoomStatus.Occupied).length;
        const occRate = ((occCount / (rooms.length || 1)) * 100).toFixed(1) + '%';
        const todayStr = new Date().toISOString().split('T')[0];
        const rev = transactions
            .filter(t => t.type === 'charge' && t.date === todayStr)
            .reduce((s,t) => s + t.amount, 0);
        
        return { occRate, occCount, rev };
    }, [rooms, transactions]);

    const segmentationData = useMemo(() => {
        const corporate = guests.filter(g => !!g.ledgerAccountId).length;
        const individual = guests.length - corporate;
        return [
            { name: 'Corporate', value: corporate, fill: '#6366f1' },
            { name: 'Individual', value: individual, fill: '#94a3b8' }
        ];
    }, [guests]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Occupancy Yield" value={stats.occRate} subText={`${stats.occCount} Operational Units`} icon={<OccupancyIcon />} />
                <StatCard title="Entity Registry" value={guests.length} subText="Registered Guests" icon={<UsersIcon />} />
                <StatCard title="Asset Liquidity" value={rooms.filter(r => r.status === RoomStatus.Vacant).length} subText="Market Ready" icon={<KeyIcon />} />
                <StatCard title="Live Revenue" value={`${propertyInfo.currency === 'NGN' ? '₦' : '$'}${stats.rev.toLocaleString()}`} subText="Daily Fiscal Cycle" icon={<CurrencyIcon />} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card title="Infrastructure Load" className="xl:col-span-2">
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={Object.values(RoomStatus).map(s => ({ name: s, count: rooms.filter(r => r.status === s).length }))}>
                                <XAxis dataKey="name" fontSize={8} axisLine={false} tickLine={false} tick={{fontWeight: 'black', fill: '#64748b'}} />
                                <YAxis hide />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {Object.values(RoomStatus).map((s, idx) => (
                                        <Cell key={`cell-${idx}`} fill={ROOM_STATUS_THEME[s as RoomStatus].fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card title="Market Segmentation">
                    <div className="h-[300px] flex flex-col justify-center">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={segmentationData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {segmentationData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                            {segmentationData.map(s => (
                                <div key={s.name}>
                                    <p className="text-[10px] font-black uppercase text-slate-400">{s.name}</p>
                                    <p className="text-xl font-black" style={{color: s.fill}}>{s.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            <Card title="Operational Audit Trail">
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {auditLog.slice(0, 15).map(e => (
                        <div key={e.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                            <div>
                                <p className="text-[9px] font-black text-indigo-600 uppercase mb-0.5 tracking-widest">{e.action}</p>
                                <p className="text-xs text-slate-700 dark:text-slate-200 font-bold">{e.details}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase">{e.userName}</p>
                                <p className="text-[8px] font-mono text-slate-500">{new Date(e.timestamp).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    ))}
                    {auditLog.length === 0 && <p className="p-10 text-center text-slate-400 uppercase text-xs font-black opacity-30">Audit manifest clear</p>}
                </div>
            </Card>
        </div>
    );
};

const CurrencyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
const OccupancyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>;
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 016-6h4a6 6 0 016 6z" /></svg>;

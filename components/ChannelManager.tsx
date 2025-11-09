import React, { useState, useMemo } from 'react';
import type { HotelData } from '../types.ts';
import { RoomStatus } from '../types.ts';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';

interface ChannelManagerProps {
    hotelData: HotelData;
}

const OTAs = ['Booking.com', 'Expedia', 'Agoda', 'Trivago'];


export const ChannelManager: React.FC<ChannelManagerProps> = ({ hotelData }) => {
    const { rooms, reservations, stopSell, setStopSell, syncLog, updateRate, roomTypes: hotelRoomTypes } = hotelData;

    const [isRateModalOpen, setRateModalOpen] = useState(false);
    
    const [rateForm, setRateForm] = useState({ roomType: '', rate: 0, currency: 'NGN' as 'NGN' | 'USD' });
    
    const sortedReservations = [...reservations].sort((a,b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());

    const roomTypes = useMemo(() => {
        return hotelRoomTypes.map(rt => {
            const allRoomsOfType = rooms.filter(r => r.type === rt.name);
            const availableRooms = allRoomsOfType.filter(r => r.status === RoomStatus.Vacant).length;
            return {
                type: rt.name,
                total: allRoomsOfType.length,
                available: availableRooms,
                rates: rt.rates,
            };
        });
    }, [rooms, hotelRoomTypes]);

    const triggerSyncAnimation = () => {
        // This can be repurposed for visual feedback if needed, but the core simulation is gone.
    };
    
    const handleToggleStopSell = (roomType: string) => {
        const newStopSellState = {
            ...stopSell,
            [roomType]: !stopSell[roomType],
        };
        setStopSell(newStopSellState);
        triggerSyncAnimation();
    };
    
    const openRateModal = (roomType: string, currentRate: number, currency: 'NGN' | 'USD') => {
        setRateForm({ roomType, rate: currentRate, currency });
        setRateModalOpen(true);
    };

    const handleUpdateRate = () => {
        if(rateForm.rate <= 0) {
            alert("Rate must be positive.");
            return;
        }
        updateRate(rateForm.roomType, rateForm.rate, rateForm.currency);
        triggerSyncAnimation();
        setRateModalOpen(false);
    };

    const LOG_LEVEL_THEME = {
        info: 'text-sky-600 dark:text-sky-400',
        success: 'text-green-600 dark:text-green-400',
        warn: 'text-amber-600 dark:text-amber-400',
        error: 'text-red-600 dark:text-red-400',
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                 <Card title="Rate & Availability Management">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Manage base rates and control room availability across all connected online travel agencies (OTAs) like Booking.com, Expedia, etc.
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-200 dark:bg-slate-700">
                                <tr>
                                    <th className="p-3 text-xs font-bold uppercase">Room Type</th>
                                    <th className="p-3 text-xs font-bold uppercase">Availability</th>
                                    <th className="p-3 text-xs font-bold uppercase">Base Rates (NGN / USD)</th>
                                    <th className="p-3 text-xs font-bold uppercase text-center">Stop Sell</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roomTypes.map(({ type, total, available, rates }) => (
                                    <tr key={type} className="border-b border-slate-200 dark:border-slate-700">
                                        <td className="p-3 font-semibold">{type}</td>
                                        <td className="p-3">{available} / {total}</td>
                                        <td className="p-3">
                                            <span>
                                                ₦{rates.NGN.toLocaleString()}{' '}
                                                <button onClick={() => openRateModal(type, rates.NGN, 'NGN')} className="text-indigo-500 hover:underline text-sm ml-1">(edit)</button>
                                            </span>
                                            <span className="mx-2">/</span>
                                             <span>
                                                ${rates.USD.toLocaleString()}{' '}
                                                <button onClick={() => openRateModal(type, rates.USD, 'USD')} className="text-indigo-500 hover:underline text-sm ml-1">(edit)</button>
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <label htmlFor={`stop-sell-${type}`} className="flex items-center justify-center cursor-pointer">
                                                <div className="relative">
                                                    <input id={`stop-sell-${type}`} type="checkbox" className="sr-only" checked={!!stopSell[type]} onChange={() => handleToggleStopSell(type)} />
                                                    <div className={`block ${stopSell[type] ? 'bg-red-600' : 'bg-slate-400 dark:bg-slate-600'} w-12 h-6 rounded-full`}></div>
                                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${stopSell[type] ? 'transform translate-x-6' : ''}`}></div>
                                                </div>
                                            </label>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <Card title="All Reservations">
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {sortedReservations.length > 0 ? sortedReservations.map(res => (
                            <div key={res.id} className="flex justify-between items-center p-2 rounded-md bg-slate-50 dark:bg-slate-800/50">
                                <div>
                                    <p className="font-semibold">{res.guestName} <span className="text-xs text-slate-500">({res.checkInDate})</span></p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{res.roomType}</p>
                                </div>
                                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{res.ota}</span>
                            </div>
                        )) : <p className="text-slate-500 dark:text-slate-400">No reservations found.</p>}
                    </div>
                </Card>
            </div>
            
            <div className="lg:col-span-1">
                <Card title="Synchronization Log">
                    <div className="space-y-2 max-h-[80vh] overflow-y-auto pr-2">
                        {syncLog.length > 0 ? syncLog.map((log, index) => (
                            <div key={index} className="text-sm p-2 rounded bg-slate-100 dark:bg-slate-900/50">
                                <span className="font-mono text-xs text-slate-500 mr-2">{log.timestamp}</span>
                                <span className={LOG_LEVEL_THEME[log.level]}>{log.message}</span>
                            </div>
                        )) : <p className="text-slate-500 dark:text-slate-400">No synchronization events yet.</p>}
                    </div>
                </Card>
            </div>
            
             <Modal isOpen={isRateModalOpen} onClose={() => setRateModalOpen(false)} title={`Update ${rateForm.currency} Rate for ${rateForm.roomType}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">New Base Rate ({rateForm.currency === 'NGN' ? '₦' : '$'})</label>
                        <input 
                            type="number" 
                            value={rateForm.rate} 
                            onChange={(e) => setRateForm({...rateForm, rate: parseFloat(e.target.value) || 0})}
                            className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" 
                        />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="secondary" onClick={() => setRateModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateRate}>Update Rate</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
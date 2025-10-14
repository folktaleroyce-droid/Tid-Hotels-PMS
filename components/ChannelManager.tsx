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
    const { rooms, stopSell, setStopSell, syncLog, addSyncLogEntry, updateRate } = hotelData;

    const [isConfigModalOpen, setConfigModalOpen] = useState(false);
    const [isRateModalOpen, setRateModalOpen] = useState(false);
    const [selectedOta, setSelectedOta] = useState('');
    const [otaConnections, setOtaConnections] = useState(Object.fromEntries(OTAs.map(ota => [ota, true])));
    
    const [rateForm, setRateForm] = useState({ roomType: '', rate: 0 });

    const roomTypes = useMemo(() => {
        const types = rooms.map(r => r.type);
        const uniqueTypes = [...new Set(types)];
        return uniqueTypes.map(type => {
            const allRooms = rooms.filter(r => r.type === type);
            const availableRooms = allRooms.filter(r => r.status === RoomStatus.Vacant).length;
            return {
                type,
                total: allRooms.length,
                available: availableRooms,
                rate: allRooms[0]?.rate || 0,
            };
        });
    }, [rooms]);

    const handleToggleConnection = (ota: string) => {
        setOtaConnections(prev => {
            const newState = !prev[ota];
            addSyncLogEntry(`${newState ? 'Connected' : 'Disconnected'} from ${ota} API.`, newState ? 'success' : 'warn');
            return { ...prev, [ota]: newState };
        });
    };
    
    const handleToggleStopSell = (roomType: string) => {
        const newStopSellState = !stopSell[roomType];
        setStopSell(prev => ({...prev, [roomType]: newStopSellState }));
        addSyncLogEntry(`Stop Sell for ${roomType} rooms has been ${newStopSellState ? 'ENABLED' : 'DISABLED'}. Pushing update.`, 'info');
    };
    
    const openRateModal = (roomType: string, currentRate: number) => {
        setRateForm({ roomType, rate: currentRate });
        setRateModalOpen(true);
    };

    const handleUpdateRate = () => {
        if(rateForm.rate <= 0) {
            alert("Rate must be positive.");
            return;
        }
        updateRate(rateForm.roomType, rateForm.rate);
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
                <Card title="OTA Connections Status">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {OTAs.map(ota => (
                            <div key={ota} className="p-4 rounded-lg border flex flex-col items-center justify-between bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                                <span className="font-semibold text-lg">{ota}</span>
                                <div className={`my-3 flex items-center ${otaConnections[ota] ? 'text-green-500' : 'text-red-500'}`}>
                                    <span className={`h-3 w-3 rounded-full mr-2 ${otaConnections[ota] ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    {otaConnections[ota] ? 'Connected' : 'Disconnected'}
                                </div>
                                <div className="w-full flex flex-col space-y-2">
                                    <Button variant="secondary" className="w-full text-sm py-1" onClick={() => { setSelectedOta(ota); setConfigModalOpen(true); }}>Configure</Button>
                                    <Button variant="secondary" className="w-full text-sm py-1" onClick={() => handleToggleConnection(ota)}>
                                        {otaConnections[ota] ? 'Disconnect' : 'Connect'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
                
                <Card title="Rate & Availability Management">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-200 dark:bg-slate-700">
                                <tr>
                                    <th className="p-3 text-xs font-bold uppercase">Room Type</th>
                                    <th className="p-3 text-xs font-bold uppercase">Availability</th>
                                    <th className="p-3 text-xs font-bold uppercase">Base Rate</th>
                                    <th className="p-3 text-xs font-bold uppercase text-center">Stop Sell</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roomTypes.map(({ type, total, available, rate }) => (
                                    <tr key={type} className="border-b border-slate-200 dark:border-slate-700">
                                        <td className="p-3 font-semibold">{type}</td>
                                        <td className="p-3">{available} / {total}</td>
                                        <td className="p-3">
                                            ${rate.toFixed(2)}{' '}
                                            <button onClick={() => openRateModal(type, rate)} className="text-indigo-500 hover:underline text-sm ml-2">(edit)</button>
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

            <Modal isOpen={isConfigModalOpen} onClose={() => setConfigModalOpen(false)} title={`Configure ${selectedOta}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">API Key</label>
                        <input type="password" value="••••••••••••••••" readOnly className="w-full px-3 py-2 rounded-md bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Hotel ID</label>
                        <input type="text" value="TIDE-12345" readOnly className="w-full px-3 py-2 rounded-md bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Configuration is for demonstration purposes only.</p>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="secondary" onClick={() => setConfigModalOpen(false)}>Close</Button>
                        <Button onClick={() => setConfigModalOpen(false)}>Save (Simulated)</Button>
                    </div>
                </div>
            </Modal>
            
             <Modal isOpen={isRateModalOpen} onClose={() => setRateModalOpen(false)} title={`Update Rate for ${rateForm.roomType}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">New Base Rate ($)</label>
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
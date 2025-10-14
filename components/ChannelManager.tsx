import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { HotelData } from '../types.ts';
import { RoomStatus } from '../types.ts';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';

interface ChannelManagerProps {
    hotelData: HotelData;
}

const OTAs = ['Booking.com', 'Expedia', 'Agoda', 'Trivago'];

type SyncStatus = 'connected' | 'disconnected' | 'syncing';

const SyncStatusIndicator: React.FC<{ status: SyncStatus }> = ({ status }) => {
    if (status === 'syncing') {
        return (
            <div className="my-3 flex items-center text-blue-500 dark:text-blue-400 font-medium text-sm">
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Syncing...
            </div>
        );
    }

    const isConnected = status === 'connected';
    const colorClass = isConnected ? 'text-green-500' : 'text-red-500';
    const bgColorClass = isConnected ? 'bg-green-500' : 'bg-red-500';

    return (
        <div className={`my-3 flex items-center ${colorClass} font-medium text-sm`}>
            <span className={`h-3 w-3 rounded-full mr-2 ${bgColorClass}`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
        </div>
    );
};

const today = new Date();
const tomorrow = new Date();
tomorrow.setDate(today.getDate() + 1);
const todayStr = today.toISOString().split('T')[0];
const tomorrowStr = tomorrow.toISOString().split('T')[0];

export const ChannelManager: React.FC<ChannelManagerProps> = ({ hotelData }) => {
    const { rooms, reservations, stopSell, setStopSell, syncLog, addSyncLogEntry, updateRate, addReservation } = hotelData;

    const [isConfigModalOpen, setConfigModalOpen] = useState(false);
    const [isRateModalOpen, setRateModalOpen] = useState(false);
    const [isSimulateModalOpen, setSimulateModalOpen] = useState(false);
    const [selectedOta, setSelectedOta] = useState('');
    const [isLiveSyncActive, setIsLiveSyncActive] = useState(false);
    const intervalRef = useRef<number | null>(null);
    
    const [otaStatuses, setOtaStatuses] = useState<{[key: string]: SyncStatus}>(
        Object.fromEntries(OTAs.map(ota => [ota, 'connected']))
    );
    
    const [rateForm, setRateForm] = useState({ roomType: '', rate: 0 });
    const [simulationForm, setSimulationForm] = useState({
        guestName: 'Simulated Guest',
        ota: 'Booking.com',
        roomType: '',
        checkInDate: todayStr,
        checkOutDate: tomorrowStr,
    });
    
    const sortedReservations = [...reservations].sort((a,b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());

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
    
    useEffect(() => {
        if (isLiveSyncActive) {
            addSyncLogEntry('Live OTA sync simulation ENABLED.', 'info');
            if (intervalRef.current) clearInterval(intervalRef.current);

            const createRandomBooking = () => {
                const availableRoomTypes = roomTypes.filter(rt => rt.available > 0).map(rt => rt.type);
                if (availableRoomTypes.length === 0) {
                    addSyncLogEntry('Auto-sync: No vacant rooms available for a new booking.', 'warn');
                    return;
                }

                const randomOta = OTAs[Math.floor(Math.random() * OTAs.length)];
                const randomRoomType = availableRoomTypes[Math.floor(Math.random() * availableRoomTypes.length)];
                const guestNames = ["Olivia Chen", "Benjamin Carter", "Sophia Rodriguez", "Liam Goldberg", "Ava Nguyen", "Noah Patel", "Emma Williams", "James Brown"];
                const randomGuestName = guestNames[Math.floor(Math.random() * guestNames.length)];
                
                const checkInOffset = Math.floor(Math.random() * 20) + 1;
                const stayDuration = Math.floor(Math.random() * 7) + 1;

                const checkInDate = new Date();
                checkInDate.setDate(checkInDate.getDate() + checkInOffset);

                const checkOutDate = new Date(checkInDate);
                checkOutDate.setDate(checkOutDate.getDate() + stayDuration);

                addReservation({
                    guestName: randomGuestName,
                    guestEmail: `${randomGuestName.toLowerCase().replace(/\s/g, '.')}@sim.com`,
                    guestPhone: '555-0199',
                    checkInDate: checkInDate.toISOString().split('T')[0],
                    checkOutDate: checkOutDate.toISOString().split('T')[0],
                    roomType: randomRoomType,
                    ota: randomOta,
                });
            };
            
            createRandomBooking(); 
            const randomInterval = Math.floor(Math.random() * 5000) + 10000; // 10-15 seconds
            intervalRef.current = window.setInterval(createRandomBooking, randomInterval);

        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                addSyncLogEntry('Live OTA sync simulation DISABLED.', 'info');
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isLiveSyncActive, addReservation, roomTypes, addSyncLogEntry]);


    const triggerSyncAnimation = () => {
        setOtaStatuses(prev => {
            const newStatuses = { ...prev };
            OTAs.forEach(ota => {
                if (newStatuses[ota] === 'connected') {
                    newStatuses[ota] = 'syncing';
                }
            });
            return newStatuses;
        });

        setTimeout(() => {
            setOtaStatuses(prev => {
                const newStatuses = { ...prev };
                OTAs.forEach(ota => {
                    if (newStatuses[ota] === 'syncing') {
                        newStatuses[ota] = 'connected';
                    }
                });
                return newStatuses;
            });
        }, 2500);
    };

    const handleOpenSimulateModal = () => {
        if (roomTypes.length > 0) {
            setSimulationForm({
                guestName: 'Simulated Guest',
                ota: 'Booking.com',
                checkInDate: todayStr,
                checkOutDate: tomorrowStr,
                roomType: roomTypes[0].type
            });
        }
        setSimulateModalOpen(true);
    };

    const handleCreateSimulatedBooking = () => {
        if (!simulationForm.guestName || !simulationForm.roomType || !simulationForm.ota) {
            alert("Please fill out all fields.");
            return;
        }
        if (new Date(simulationForm.checkOutDate) <= new Date(simulationForm.checkInDate)) {
            alert("Check-out date must be after the check-in date.");
            return;
        }

        addReservation({
            guestName: simulationForm.guestName,
            guestEmail: `${simulationForm.guestName.toLowerCase().replace(/\s/g, '.')}@sim.com`,
            guestPhone: '555-0199',
            checkInDate: simulationForm.checkInDate,
            checkOutDate: simulationForm.checkOutDate,
            roomType: simulationForm.roomType,
            ota: simulationForm.ota,
        });
        
        setSimulateModalOpen(false);
    };

    const handleToggleConnection = (ota: string) => {
        const isCurrentlyConnected = otaStatuses[ota] !== 'disconnected';
        if (isCurrentlyConnected) {
            setOtaStatuses(prev => ({ ...prev, [ota]: 'disconnected' }));
            addSyncLogEntry(`Disconnected from ${ota} API.`, 'warn');
        } else {
            setOtaStatuses(prev => ({ ...prev, [ota]: 'syncing' }));
            addSyncLogEntry(`Connecting to ${ota}...`, 'info');
            setTimeout(() => {
                setOtaStatuses(prev => {
                    if (prev[ota] === 'syncing') {
                        addSyncLogEntry(`Successfully connected to ${ota} API.`, 'success');
                        return { ...prev, [ota]: 'connected' };
                    }
                    return prev;
                });
            }, 2000);
        }
    };
    
    const handleToggleStopSell = (roomType: string) => {
        const newStopSellState = !stopSell[roomType];
        setStopSell(prev => ({...prev, [roomType]: newStopSellState }));
        addSyncLogEntry(`Stop Sell for ${roomType} rooms has been ${newStopSellState ? 'ENABLED' : 'DISABLED'}. Pushing update.`, 'info');
        triggerSyncAnimation();
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
                <Card title="OTA Connections Status">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {OTAs.map(ota => (
                            <div key={ota} className="p-4 rounded-lg border flex flex-col items-center justify-between bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                                <span className="font-semibold text-lg">{ota}</span>
                                <SyncStatusIndicator status={otaStatuses[ota]} />
                                <div className="w-full flex flex-col space-y-2">
                                    <Button variant="secondary" className="w-full text-sm py-1" onClick={() => { setSelectedOta(ota); setConfigModalOpen(true); }} disabled={otaStatuses[ota] === 'syncing'}>Configure</Button>
                                    <Button variant="secondary" className="w-full text-sm py-1" onClick={() => handleToggleConnection(ota)} disabled={otaStatuses[ota] === 'syncing'}>
                                        {otaStatuses[ota] === 'disconnected' ? 'Connect' : 'Disconnect'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card title="Live OTA Sync Simulation">
                    <div className="flex items-center justify-between p-4">
                        <div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200">Automatic Booking Sync</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Enable to simulate new bookings arriving automatically every 10-15 seconds.
                            </p>
                        </div>
                        <label htmlFor="live-sync-toggle" className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input
                                    id="live-sync-toggle"
                                    type="checkbox"
                                    className="sr-only"
                                    checked={isLiveSyncActive}
                                    onChange={() => setIsLiveSyncActive(prev => !prev)}
                                />
                                <div className={`block ${isLiveSyncActive ? 'bg-indigo-600' : 'bg-slate-400 dark:bg-slate-600'} w-12 h-6 rounded-full`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isLiveSyncActive ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </Card>
                
                <Card title="Manual OTA Simulator">
                    <div className="flex flex-col items-center text-center p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3 3m3-3l3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                        </svg>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            Manually create a booking with specific details to test how new reservations appear in the system.
                        </p>
                        <Button 
                            onClick={handleOpenSimulateModal}
                            className="flex items-center space-x-2"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                           </svg>
                           <span>Simulate New Booking</span>
                        </Button>
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
            
            <Modal isOpen={isSimulateModalOpen} onClose={() => setSimulateModalOpen(false)} title="Simulate OTA Booking">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Guest Name</label>
                        <input 
                            type="text" 
                            value={simulationForm.guestName}
                            onChange={(e) => setSimulationForm({...simulationForm, guestName: e.target.value})}
                            className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">OTA Source</label>
                        <select
                            value={simulationForm.ota}
                            onChange={(e) => setSimulationForm({...simulationForm, ota: e.target.value})}
                            className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                        >
                            {OTAs.map(ota => <option key={ota} value={ota}>{ota}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Room Type</label>
                        <select
                            value={simulationForm.roomType}
                            onChange={(e) => setSimulationForm({...simulationForm, roomType: e.target.value})}
                            className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                        >
                            {roomTypes.map(rt => <option key={rt.type} value={rt.type}>{rt.type}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Check-in Date</label>
                            <input
                                type="date"
                                value={simulationForm.checkInDate}
                                min={todayStr}
                                onChange={(e) => setSimulationForm({...simulationForm, checkInDate: e.target.value})}
                                className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Check-out Date</label>
                            <input
                                type="date"
                                value={simulationForm.checkOutDate}
                                min={
                                    (() => {
                                        const checkIn = new Date(simulationForm.checkInDate);
                                        checkIn.setDate(checkIn.getDate() + 2);
                                        return checkIn.toISOString().split('T')[0];
                                    })()
                                }
                                onChange={(e) => setSimulationForm({...simulationForm, checkOutDate: e.target.value})}
                                className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-700 mt-2">
                        <Button variant="secondary" onClick={() => setSimulateModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateSimulatedBooking}>Create Booking</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
import React, { useState, useMemo, useEffect } from 'react';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import { useHotelData } from '../hooks/useHotelData.ts';
import type { RoomType } from '../types.ts';

const INITIAL_TYPE_FORM_STATE: Omit<RoomType, 'id'> = {
    name: '',
    rates: {
        NGN: 0,
        USD: 0,
    },
    capacity: 2,
};

const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

export const Admin: React.FC = () => {
    const { 
        roomTypes, 
        rooms, 
        addRoomType, 
        updateRoomType, 
        deleteRoomType, 
        addRoom, 
        deleteRoom, 
        taxSettings, 
        setTaxSettings, 
        clearAllData 
    } = useHotelData();
    
    // State for Room Type Modal
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentRoomType, setCurrentRoomType] = useState<RoomType | Omit<RoomType, 'id'>>(INITIAL_TYPE_FORM_STATE);
    const [typeErrors, setTypeErrors] = useState({ name: '', rateNGN: '', rateUSD: '', capacity: '' });
    
    // State for Room Modal
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [newRoomForm, setNewRoomForm] = useState({ number: '', type: '' });
    const [roomErrors, setRoomErrors] = useState({ number: '', type: '' });
    const [searchTerm, setSearchTerm] = useState('');
    
    // State from Settings
    const [localSettings, setLocalSettings] = useState(taxSettings);
    const [isSaved, setIsSaved] = useState(false);

    // State from Financials
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

    useEffect(() => {
        setLocalSettings(taxSettings);
    }, [taxSettings]);


    const filteredRoomTypes = useMemo(() => {
        return roomTypes.filter(rt => 
            rt.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [roomTypes, searchTerm]);
    
    const roomsByType = useMemo(() => {
        return roomTypes.map(rt => ({
            ...rt,
            rooms: rooms.filter(r => r.type === rt.name).sort((a,b) => a.number.localeCompare(b.number, undefined, { numeric: true }))
        }));
    }, [rooms, roomTypes]);

    // --- Room Type Modal Logic ---
    const openAddTypeModal = () => {
        setCurrentRoomType(INITIAL_TYPE_FORM_STATE);
        setTypeErrors({ name: '', rateNGN: '', rateUSD: '', capacity: '' });
        setModalMode('add');
        setIsTypeModalOpen(true);
    };
    
    const openEditTypeModal = (roomType: RoomType) => {
        setCurrentRoomType(roomType);
        setTypeErrors({ name: '', rateNGN: '', rateUSD: '', capacity: '' });
        setModalMode('edit');
        setIsTypeModalOpen(true);
    };

    const handleCloseTypeModal = () => setIsTypeModalOpen(false);

    const handleTypeFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numericValue = parseInt(value, 10) || 0;

        if (name === 'rateNGN') {
            setCurrentRoomType(prev => ({ ...prev, rates: { ...(prev as RoomType).rates, NGN: numericValue } }));
        } else if (name === 'rateUSD') {
            setCurrentRoomType(prev => ({ ...prev, rates: { ...(prev as RoomType).rates, USD: numericValue } }));
        } else {
            setCurrentRoomType(prev => ({ ...prev, [name]: name === 'capacity' ? numericValue : value }));
        }
    };
    
    const validateTypeForm = () => {
        const newErrors = { name: '', rateNGN: '', rateUSD: '', capacity: '' };
        const trimmedName = currentRoomType.name.trim();

        if (!trimmedName) {
            newErrors.name = 'Room type name is required.';
        } else if (
            roomTypes.some(rt => 
                rt.name.toLowerCase() === trimmedName.toLowerCase() && 
                (!('id' in currentRoomType) || rt.id !== (currentRoomType as RoomType).id)
            )
        ) {
            newErrors.name = 'A room type with this name already exists.';
        }
        
        const rates = (currentRoomType as RoomType).rates;
        if (!rates.NGN || rates.NGN <= 0) {
            newErrors.rateNGN = 'Rate (NGN) must be a positive number.';
        }
        if (!rates.USD || rates.USD <= 0) {
            newErrors.rateUSD = 'Rate (USD) must be a positive number.';
        }
        if (!currentRoomType.capacity || currentRoomType.capacity <= 0) {
            newErrors.capacity = 'Capacity must be a positive number.';
        }
        setTypeErrors(newErrors);
        return Object.values(newErrors).every(error => !error);
    };

    const handleTypeSubmit = () => {
        if (!validateTypeForm()) return;
        
        const processedRoomType = {
            ...currentRoomType,
            name: currentRoomType.name.trim(),
        };

        if (modalMode === 'add') {
            addRoomType(processedRoomType as Omit<RoomType, 'id'>);
        } else {
            updateRoomType(processedRoomType as RoomType);
        }
        handleCloseTypeModal();
    };
    
    const handleDeleteType = (roomTypeId: number) => {
        const roomType = roomTypes.find(rt => rt.id === roomTypeId);
        const roomsInTypeCount = rooms.filter(r => r.type === roomType?.name).length;
        let confirmMessage = `Are you sure you want to delete the '${roomType?.name}' room type? This cannot be undone.`;
        if (roomsInTypeCount > 0) {
            confirmMessage = `Are you sure you want to delete the '${roomType?.name}' room type? This will also delete all ${roomsInTypeCount} room(s) assigned to this type. This action cannot be undone.`;
        }
        if (window.confirm(confirmMessage)) deleteRoomType(roomTypeId);
    };
    
    // --- Room Modal Logic ---
    const openAddRoomModal = () => {
        setNewRoomForm({ number: '', type: roomTypes[0]?.name || '' });
        setRoomErrors({ number: '', type: '' });
        setIsRoomModalOpen(true);
    };
    const handleCloseRoomModal = () => setIsRoomModalOpen(false);

    const handleRoomFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewRoomForm(prev => ({ ...prev, [name]: value }));
    };

    const validateRoomForm = () => {
        const newErrors = { number: '', type: '' };
        const trimmedNumber = newRoomForm.number.trim();

        if (!trimmedNumber) {
            newErrors.number = 'Room number is required.';
        } else if (rooms.some(r => r.number.toLowerCase() === trimmedNumber.toLowerCase())) {
            newErrors.number = 'This room number already exists.';
        }
        
        if (!newRoomForm.type) {
            newErrors.type = 'Please select a room type.';
        }

        setRoomErrors(newErrors);
        return Object.values(newErrors).every(error => !error);
    };

    const handleAddRoomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateRoomForm()) return;
        
        const trimmedNumber = newRoomForm.number.trim();
        addRoom({ number: trimmedNumber, type: newRoomForm.type });
        handleCloseRoomModal();
    };

    const handleDeleteRoom = (roomId: number) => {
        if (window.confirm("Are you sure you want to delete this room?")) deleteRoom(roomId);
    };

    // --- Settings Logic ---
    const handleSettingsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setLocalSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : parseFloat(value) || 0 }));
    };
    const handleSaveSettings = () => {
        setTaxSettings(localSettings);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>

            <Card>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Room Type Management</h2>
                    <Button onClick={openAddTypeModal}>Add New Room Type</Button>
                </div>
                <div className="mb-4">
                    <input type="text" placeholder="Search by room type name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full max-w-md p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-200 dark:bg-slate-700">
                            <tr>
                                <th className="p-3 text-xs font-bold uppercase">Name</th>
                                <th className="p-3 text-xs font-bold uppercase">Rates (NGN / USD)</th>
                                <th className="p-3 text-xs font-bold uppercase">Capacity</th>
                                <th className="p-3 text-xs font-bold uppercase text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRoomTypes.map((rt, index) => (
                                <tr key={rt.id} className={`border-b border-slate-200 dark:border-slate-700 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                                    <td className="p-3 font-medium">{rt.name}</td>
                                    <td className="p-3">₦{rt.rates.NGN.toLocaleString()} / ${rt.rates.USD.toLocaleString()}</td>
                                    <td className="p-3">{rt.capacity} Guest(s)</td>
                                    <td className="p-3 text-center">
                                        <div className="flex justify-center space-x-2">
                                            <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => openEditTypeModal(rt)}>Edit</Button>
                                            <Button variant="secondary" className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 text-red-700 dark:text-red-300" onClick={() => handleDeleteType(rt.id)}>Delete</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredRoomTypes.length === 0 && <p className="text-center py-8 text-slate-500 dark:text-slate-400">{searchTerm ? 'No room types match your search.' : 'No room types defined yet.'}</p>}
                </div>
            </Card>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Rooms</h3>
                    <Button onClick={openAddRoomModal} disabled={roomTypes.length === 0} title={roomTypes.length === 0 ? "You must create a Room Type first." : "Add a new physical room"}>Add New Room</Button>
                </div>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {roomsByType.length > 0 ? roomsByType.map(rt => (
                        <div key={`type-group-${rt.id}`}>
                            <h4 className="font-bold text-indigo-600 dark:text-indigo-400 border-b border-slate-200 dark:border-slate-700 pb-1 mb-2">{rt.name}</h4>
                            {rt.rooms.length > 0 ? (
                                <ul className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                    {rt.rooms.map(room => (
                                        <li key={room.id} className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                                            <span className="font-mono font-semibold">{room.number}</span>
                                            <button onClick={() => handleDeleteRoom(room.id)} title="Delete Room" className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-sm text-slate-500 dark:text-slate-400 italic">No rooms of this type have been added yet.</p>}
                        </div>
                    )) : <p className="text-center py-8 text-slate-500 dark:text-slate-400">No rooms have been added to the hotel inventory yet.</p>}
                </div>
            </Card>

             <Card title="Application Settings">
                <div className="space-y-6">
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Tax Configuration</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label htmlFor="tax-enabled" className="font-medium">Enable Automatic Tax Calculation</label>
                                <label htmlFor="tax-enabled" className="cursor-pointer relative">
                                    <input type="checkbox" id="tax-enabled" name="isEnabled" className="sr-only" checked={localSettings.isEnabled} onChange={handleSettingsInputChange}/>
                                    <div className={`block ${localSettings.isEnabled ? 'bg-indigo-600' : 'bg-slate-400 dark:bg-slate-600'} w-12 h-6 rounded-full`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${localSettings.isEnabled ? 'transform translate-x-6' : ''}`}></div>
                                </label>
                            </div>
                            {localSettings.isEnabled && (
                                <div>
                                    <label htmlFor="tax-rate" className="block text-sm font-medium mb-1">Tax Rate (%)</label>
                                    <input type="number" id="tax-rate" name="rate" value={localSettings.rate} onChange={handleSettingsInputChange} step="0.1" min="0" className="w-full max-w-xs p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end items-center space-x-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                         {isSaved && <span className="text-green-600 dark:text-green-400 font-medium">Settings saved successfully!</span>}
                        <Button onClick={handleSaveSettings}>Save Settings</Button>
                    </div>
                </div>
            </Card>

            <Card title="Danger Zone" className="border-red-500/50">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h4 className="font-semibold text-red-800 dark:text-red-300">Clear All Hotel Data</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Permanently delete all guests, rooms, reservations, and financial records. This action cannot be undone.</p>
                    </div>
                    <Button onClick={() => setIsClearModalOpen(true)} className="bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white flex-shrink-0">
                        Clear All Data
                    </Button>
                </div>
            </Card>
            
            <Modal isOpen={isTypeModalOpen} onClose={handleCloseTypeModal} title={modalMode === 'add' ? 'Add New Room Type' : 'Edit Room Type'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input type="text" name="name" value={currentRoomType.name} onChange={handleTypeFormChange} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                         {typeErrors.name && <p className="text-red-500 text-xs mt-1">{typeErrors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Rate (NGN)</label>
                            <input type="number" name="rateNGN" value={(currentRoomType as RoomType).rates.NGN} onChange={handleTypeFormChange} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                             {typeErrors.rateNGN && <p className="text-red-500 text-xs mt-1">{typeErrors.rateNGN}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Rate (USD)</label>
                            <input type="number" name="rateUSD" value={(currentRoomType as RoomType).rates.USD} onChange={handleTypeFormChange} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                            {typeErrors.rateUSD && <p className="text-red-500 text-xs mt-1">{typeErrors.rateUSD}</p>}
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Capacity (Max Guests)</label>
                        <input type="number" name="capacity" value={currentRoomType.capacity} onChange={handleTypeFormChange} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                        {typeErrors.capacity && <p className="text-red-500 text-xs mt-1">{typeErrors.capacity}</p>}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                        <Button variant="secondary" onClick={handleCloseTypeModal}>Cancel</Button>
                        <Button onClick={handleTypeSubmit}>Save Changes</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isRoomModalOpen} onClose={handleCloseRoomModal} title="Add New Room">
                <form onSubmit={handleAddRoomSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="room-number" className="block text-sm font-medium mb-1">Room Number</label>
                        <input type="text" id="room-number" name="number" value={newRoomForm.number} onChange={handleRoomFormChange} placeholder="e.g., 101, 205B, PH1" className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                        {roomErrors.number && <p className="text-red-500 text-xs mt-1">{roomErrors.number}</p>}
                    </div>
                    <div>
                        <label htmlFor="room-type" className="block text-sm font-medium mb-1">Room Type</label>
                        <select id="room-type" name="type" value={newRoomForm.type} onChange={handleRoomFormChange} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                            {roomTypes.map(rt => <option key={rt.id} value={rt.name}>{rt.name}</option>)}
                        </select>
                        {roomErrors.type && <p className="text-red-500 text-xs mt-1">{roomErrors.type}</p>}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                        <Button variant="secondary" type="button" onClick={handleCloseRoomModal}>Cancel</Button>
                        <Button type="submit">Add Room</Button>
                    </div>
                </form>
            </Modal>

             <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} title="Confirm Clear All Data">
                <div className="space-y-4">
                    <div className="p-3 rounded-md bg-red-100 dark:bg-red-900/50 border border-red-500/50 flex items-start space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <div className="text-sm">
                            <p className="font-semibold text-red-800 dark:text-red-200">Warning: This is a destructive action and cannot be undone.</p>
                        </div>
                    </div>
                    <p>This will permanently delete all hotel data, including rooms, guests, reservations, and all financial records.</p>
                </div>
                <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button variant="secondary" onClick={() => setIsClearModalOpen(false)}>Cancel</Button>
                    <Button onClick={() => { clearAllData(); setIsClearModalOpen(false); }} className="bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white">Yes, Clear All Data</Button>
                </div>
            </Modal>
        </div>
    );
};
import React, { useState } from 'react';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import { useHotelData } from '../hooks/useHotelData.ts';
import type { RoomType } from '../types.ts';
import { CURRENCIES } from '../constants.tsx';

const INITIAL_FORM_STATE: Omit<RoomType, 'id'> = {
    name: '',
    baseRate: 0,
    currency: 'NGN',
    capacity: 2,
};

export const RoomTypes: React.FC = () => {
    const { roomTypes, rooms, addRoomType, updateRoomType, deleteRoomType } = useHotelData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentRoomType, setCurrentRoomType] = useState<RoomType | Omit<RoomType, 'id'>>(INITIAL_FORM_STATE);
    const [errors, setErrors] = useState({ name: '', baseRate: '', capacity: '' });

    const openAddModal = () => {
        setCurrentRoomType(INITIAL_FORM_STATE);
        setErrors({ name: '', baseRate: '', capacity: '' });
        setModalMode('add');
        setIsModalOpen(true);
    };
    
    const openEditModal = (roomType: RoomType) => {
        setCurrentRoomType(roomType);
        setErrors({ name: '', baseRate: '', capacity: '' });
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentRoomType(prev => ({
            ...prev,
            [name]: (name === 'baseRate' || name === 'capacity') ? parseInt(value, 10) || 0 : value,
        }));
    };
    
    const validateForm = () => {
        const newErrors = { name: '', baseRate: '', capacity: '' };
        if (!currentRoomType.name.trim()) {
            newErrors.name = 'Room type name is required.';
        }
        if (!currentRoomType.baseRate || currentRoomType.baseRate <= 0) {
            newErrors.baseRate = 'Base rate must be a positive number.';
        }
        if (!currentRoomType.capacity || currentRoomType.capacity <= 0) {
            newErrors.capacity = 'Capacity must be a positive number.';
        }
        setErrors(newErrors);
        return !newErrors.name && !newErrors.baseRate && !newErrors.capacity;
    };

    const handleSubmit = () => {
        if (!validateForm()) return;

        if (modalMode === 'add') {
            addRoomType(currentRoomType as Omit<RoomType, 'id'>);
        } else {
            updateRoomType(currentRoomType as RoomType);
        }
        handleCloseModal();
    };
    
    const handleDelete = (roomTypeId: number) => {
        if (window.confirm("Are you sure you want to delete this room type? This cannot be undone.")) {
            deleteRoomType(roomTypeId);
        }
    };
    
    const isTypeInUse = (roomTypeName: string) => {
        return rooms.some(room => room.type === roomTypeName);
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Room Type Management</h2>
                <Button onClick={openAddModal}>Add New Room Type</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-200 dark:bg-slate-700">
                        <tr>
                            <th className="p-3 text-xs font-bold uppercase">Name</th>
                            <th className="p-3 text-xs font-bold uppercase">Base Rate</th>
                            <th className="p-3 text-xs font-bold uppercase">Capacity</th>
                            <th className="p-3 text-xs font-bold uppercase text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roomTypes.map((rt, index) => (
                            <tr key={rt.id} className={`border-b border-slate-200 dark:border-slate-700 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                                <td className="p-3 font-medium">{rt.name}</td>
                                <td className="p-3">{rt.currency === 'NGN' ? '₦' : '$'}{rt.baseRate.toLocaleString()}</td>
                                <td className="p-3">{rt.capacity} Guest(s)</td>
                                <td className="p-3 text-center">
                                    <div className="flex justify-center space-x-2">
                                        <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => openEditModal(rt)}>Edit</Button>
                                        <Button 
                                            variant="secondary" 
                                            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 text-red-700 dark:text-red-300" 
                                            onClick={() => handleDelete(rt.id)}
                                            disabled={isTypeInUse(rt.name)}
                                            title={isTypeInUse(rt.name) ? "Cannot delete: type is in use by a room." : "Delete room type"}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {roomTypes.length === 0 && <p className="text-center py-8 text-slate-500 dark:text-slate-400">No room types defined yet.</p>}
            </div>
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalMode === 'add' ? 'Add New Room Type' : 'Edit Room Type'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={currentRoomType.name}
                            onChange={handleFormChange}
                            className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                        />
                         {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Base Rate</label>
                            <input
                                type="number"
                                name="baseRate"
                                value={currentRoomType.baseRate}
                                onChange={handleFormChange}
                                className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                            />
                            {errors.baseRate && <p className="text-red-500 text-xs mt-1">{errors.baseRate}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Currency</label>
                            <select
                                name="currency"
                                value={currentRoomType.currency}
                                onChange={handleFormChange}
                                className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                            >
                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Capacity (Max Guests)</label>
                        <input
                            type="number"
                            name="capacity"
                            value={currentRoomType.capacity}
                            onChange={handleFormChange}
                            className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                        />
                        {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                        <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                        <Button onClick={handleSubmit}>Save Changes</Button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
};
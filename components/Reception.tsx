import React, { useState } from 'react';
// FIX: Added file extensions to imports to resolve module errors.
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import type { HotelData, Room, Guest } from '../types.ts';
import { RoomStatus } from '../types.ts';

interface ReceptionProps {
    hotelData: HotelData;
}

export const Reception: React.FC<ReceptionProps> = ({ hotelData }) => {
    const { rooms, guests, updateRoomStatus, addTransaction, setGuests } = hotelData;
    const [isCheckInModalOpen, setCheckInModalOpen] = useState(false);
    const [isCheckOutModalOpen, setCheckOutModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [newGuest, setNewGuest] = useState({ name: '', email: '', phone: '' });

    const handleOpenCheckIn = (room: Room) => {
        setSelectedRoom(room);
        setCheckInModalOpen(true);
    };

    const handleOpenCheckOut = (room: Room) => {
        setSelectedRoom(room);
        setCheckOutModalOpen(true);
    };
    
    const handleCloseModals = () => {
        setCheckInModalOpen(false);
        setCheckOutModalOpen(false);
        setSelectedRoom(null);
        setNewGuest({ name: '', email: '', phone: '' });
    };

    const handleCheckIn = () => {
        if (!selectedRoom || !newGuest.name) {
            alert('Guest name is required.');
            return;
        }
        const guestId = guests.length + 1;
        const guest: Guest = { id: guestId, ...newGuest };
        setGuests(prev => [...prev, guest]);
        updateRoomStatus(selectedRoom.id, RoomStatus.Occupied, guestId);
        addTransaction({ guestId, description: `Room Charge - ${selectedRoom.type}`, amount: selectedRoom.rate, date: new Date().toISOString().split('T')[0] });
        handleCloseModals();
    };

    const handleCheckOut = () => {
        if (selectedRoom) {
            updateRoomStatus(selectedRoom.id, RoomStatus.Dirty);
        }
        handleCloseModals();
    };

    const findGuestByRoom = (room: Room) => guests.find(g => g.id === room.guestId);
    
    return (
        <div>
            <Card title="Room Management">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {rooms.map(room => (
                        <div key={room.id} className="p-4 rounded-lg shadow-md border-2 border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold text-lg">Room {room.number}</h4>
                            <p className="text-sm">{room.type}</p>
                            <p className="text-sm font-semibold">{room.status}</p>
                            {room.status === RoomStatus.Occupied && <p className="text-xs mt-1">Guest: {findGuestByRoom(room)?.name}</p>}
                            <div className="mt-4 flex flex-col space-y-2">
                                {room.status === RoomStatus.Vacant && <Button onClick={() => handleOpenCheckIn(room)}>Check-In</Button>}
                                {room.status === RoomStatus.Occupied && <Button variant="secondary" onClick={() => handleOpenCheckOut(room)}>Check-Out</Button>}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Modal isOpen={isCheckInModalOpen} onClose={handleCloseModals} title={`Check-In to Room ${selectedRoom?.number}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Guest Name</label>
                        <input type="text" value={newGuest.name} onChange={e => setNewGuest({...newGuest, name: e.target.value})} className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Email</label>
                        <input type="email" value={newGuest.email} onChange={e => setNewGuest({...newGuest, email: e.target.value})} className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Phone</label>
                        <input type="tel" value={newGuest.phone} onChange={e => setNewGuest({...newGuest, phone: e.target.value})} className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="secondary" onClick={handleCloseModals}>Cancel</Button>
                        <Button onClick={handleCheckIn}>Confirm Check-In</Button>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={isCheckOutModalOpen} onClose={handleCloseModals} title={`Check-Out from Room ${selectedRoom?.number}`}>
                <p>Are you sure you want to check out the guest from Room {selectedRoom?.number}?</p>
                <div className="flex justify-end space-x-2 pt-6">
                    <Button variant="secondary" onClick={handleCloseModals}>Cancel</Button>
                    <Button onClick={handleCheckOut}>Confirm Check-Out</Button>
                </div>
            </Modal>
        </div>
    );
};
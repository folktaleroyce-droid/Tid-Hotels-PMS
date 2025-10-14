import React, { useState } from 'react';
// FIX: Added file extensions to imports to resolve module errors.
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import type { HotelData, Room, Guest, Reservation } from '../types.ts';
import { RoomStatus } from '../types.ts';
import { ROOM_STATUS_THEME } from '../constants.tsx';

interface ReceptionProps {
    hotelData: HotelData;
}

const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date();
tomorrow.setDate(new Date().getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

const INITIAL_FORM_STATE = {
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    nationality: '',
    idNumber: '',
    address: '',
    departureDate: tomorrowStr,
    adults: 1,
    children: 0,
    specialRequests: '',
    roomId: 0,
};

export const Reception: React.FC<ReceptionProps> = ({ hotelData }) => {
    const { rooms, guests, reservations, updateRoomStatus, addTransaction, setGuests, setReservations, addSyncLogEntry } = hotelData;
    const [isCheckInModalOpen, setCheckInModalOpen] = useState(false);
    const [isCheckOutModalOpen, setCheckOutModalOpen] = useState(false);
    
    const [selectedRoomForAction, setSelectedRoomForAction] = useState<Room | null>(null);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    
    const [checkInForm, setCheckInForm] = useState(INITIAL_FORM_STATE);

    const handleOpenCheckIn = (room: Room) => {
        setSelectedReservation(null);
        setCheckInForm({ ...INITIAL_FORM_STATE, roomId: room.id });
        setCheckInModalOpen(true);
    };

    const handleOpenReservationCheckIn = (reservation: Reservation) => {
        const availableRoom = rooms.find(r => r.status === RoomStatus.Vacant && r.type === reservation.roomType);
        if (!availableRoom) {
            alert(`No vacant ${reservation.roomType} rooms available for check-in.`);
            return;
        }
        setSelectedReservation(reservation);
        setCheckInForm({
            ...INITIAL_FORM_STATE,
            guestName: reservation.guestName,
            guestEmail: reservation.guestEmail,
            guestPhone: reservation.guestPhone,
            departureDate: reservation.checkOutDate,
            roomId: availableRoom.id,
        });
        setCheckInModalOpen(true);
    };

    const handleOpenCheckOut = (room: Room) => {
        setSelectedRoomForAction(room);
        setCheckOutModalOpen(true);
    };
    
    const handleCloseModals = () => {
        setCheckInModalOpen(false);
        setCheckOutModalOpen(false);
        setSelectedRoomForAction(null);
        setSelectedReservation(null);
        setCheckInForm(INITIAL_FORM_STATE);
    };

    const handleCheckIn = () => {
        const roomToCheckIn = rooms.find(r => r.id === checkInForm.roomId);

        if (!roomToCheckIn || !checkInForm.guestName) {
            alert('Guest name and a valid room are required.');
            return;
        }
        if (roomToCheckIn.status !== RoomStatus.Vacant) {
            alert('This room is not vacant and cannot be assigned.');
            return;
        }

        const guestId = guests.length + 1;
        const newGuest: Guest = { 
            id: guestId, 
            name: checkInForm.guestName, 
            email: checkInForm.guestEmail, 
            phone: checkInForm.guestPhone, 
            nationality: checkInForm.nationality,
            idNumber: checkInForm.idNumber,
            address: checkInForm.address,
            arrivalDate: today,
            departureDate: checkInForm.departureDate,
            adults: checkInForm.adults,
            children: checkInForm.children,
            roomNumber: roomToCheckIn.number,
            roomType: roomToCheckIn.type,
            bookingSource: selectedReservation?.ota || 'Direct',
            specialRequests: checkInForm.specialRequests,
        };
        
        setGuests(prev => [...prev, newGuest]);
        updateRoomStatus(roomToCheckIn.id, RoomStatus.Occupied, guestId);
        addTransaction({ guestId, description: `Room Charge - ${roomToCheckIn.type}`, amount: roomToCheckIn.rate, date: today });
        addSyncLogEntry(`New guest ${newGuest.name} checked into Room ${newGuest.roomNumber}. Pushing update to ${newGuest.bookingSource}.`, 'success');

        if (selectedReservation) {
            setReservations(prev => prev.filter(r => r.id !== selectedReservation.id));
        }
        handleCloseModals();
    };

    const handleCheckOut = () => {
        if (selectedRoomForAction) {
            updateRoomStatus(selectedRoomForAction.id, RoomStatus.Dirty);
        }
        handleCloseModals();
    };

    const handleNoShow = (reservationId: number, guestName: string) => {
        if (window.confirm(`Are you sure you want to mark ${guestName}'s reservation as a No-Show?`)) {
            setReservations(prev => prev.filter(r => r.id !== reservationId));
            addSyncLogEntry(`Reservation for ${guestName} marked as No-Show. Room inventory updated on all channels.`, 'warn');
        }
    };

    const todaysArrivals = reservations.filter(r => r.checkInDate === new Date().toISOString().split('T')[0]);
    const availableRoomsForCheckIn = rooms.filter(r => r.status === RoomStatus.Vacant && (!selectedReservation || r.type === selectedReservation.roomType));

    const RoomCardComponent: React.FC<{ room: Room }> = ({ room }) => {
        const guest = findGuestByRoom(room);
        return (
            <div className={`p-4 rounded-lg shadow-md border-l-4 ${ROOM_STATUS_THEME[room.status].light} ${ROOM_STATUS_THEME[room.status].dark}`} style={{ borderLeftColor: ROOM_STATUS_THEME[room.status].fill }}>
                <div className="flex justify-between items-center">
                    <h4 className={`font-bold text-lg ${ROOM_STATUS_THEME[room.status].text}`}>Room {room.number}</h4>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${ROOM_STATUS_THEME[room.status].badge}`}>
                        {room.status}
                    </span>
                </div>
                <p className={`text-sm ${ROOM_STATUS_THEME[room.status].text}`}>{room.type}</p>
                {room.status === RoomStatus.Occupied && guest && <p className="text-xs mt-1">Guest: {guest.name}</p>}
                <div className="mt-4 flex flex-col space-y-2">
                    {room.status === RoomStatus.Vacant && <Button onClick={() => handleOpenCheckIn(room)}>Walk-in</Button>}
                    {room.status === RoomStatus.Occupied && <Button variant="secondary" onClick={() => handleOpenCheckOut(room)}>Check-Out</Button>}
                </div>
            </div>
        );
    };

    const findGuestByRoom = (room: Room) => guests.find(g => g.id === room.guestId);
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card title="Room Management">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rooms.map(room => <RoomCardComponent key={room.id} room={room} />)}
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-1">
                <Card title="Today's Arrivals">
                    <div className="space-y-3 max-h-[80vh] overflow-y-auto">
                        {todaysArrivals.length > 0 ? todaysArrivals.map(res => (
                             <div key={res.id} className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                 <div>
                                     <p className="font-semibold">{res.guestName}</p>
                                     <p className="text-sm text-slate-500 dark:text-slate-400">{res.roomType} via {res.ota}</p>
                                 </div>
                                 <div className="flex justify-end space-x-2 mt-2">
                                     <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => handleNoShow(res.id, res.guestName)}>No-Show</Button>
                                     <Button onClick={() => handleOpenReservationCheckIn(res)} className="px-3 py-1 text-sm">Check-In</Button>
                                 </div>
                             </div>
                        )) : <p className="text-slate-500 dark:text-slate-400">No more arrivals for today.</p>}
                    </div>
                </Card>
            </div>

            <Modal isOpen={isCheckInModalOpen} onClose={handleCloseModals} title={selectedReservation ? `Reservation Check-In` : `Walk-in Guest`}>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Assign Room*</label>
                            <select value={checkInForm.roomId} onChange={e => setCheckInForm({...checkInForm, roomId: parseInt(e.target.value)})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                                {availableRoomsForCheckIn.map(room => (
                                    <option key={room.id} value={room.id}>Room {room.number} ({room.type})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                           <label className="block text-sm font-medium mb-1">Departure Date*</label>
                           <input type="date" value={checkInForm.departureDate} min={tomorrowStr} onChange={e => setCheckInForm({...checkInForm, departureDate: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Guest Name*</label>
                            <input type="text" value={checkInForm.guestName} onChange={e => setCheckInForm({...checkInForm, guestName: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input type="email" value={checkInForm.guestEmail} onChange={e => setCheckInForm({...checkInForm, guestEmail: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <input type="tel" value={checkInForm.guestPhone} onChange={e => setCheckInForm({...checkInForm, guestPhone: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Nationality</label>
                            <input type="text" value={checkInForm.nationality} onChange={e => setCheckInForm({...checkInForm, nationality: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                        <div className="md:col-span-2">
                           <label className="block text-sm font-medium mb-1">Address</label>
                           <input type="text" value={checkInForm.address} onChange={e => setCheckInForm({...checkInForm, address: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">ID / Passport Number</label>
                            <input type="text" value={checkInForm.idNumber} onChange={e => setCheckInForm({...checkInForm, idNumber: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                        <div className="flex space-x-2">
                             <div>
                                <label className="block text-sm font-medium mb-1">Adults</label>
                                <input type="number" value={checkInForm.adults} min="1" onChange={e => setCheckInForm({...checkInForm, adults: parseInt(e.target.value) || 1})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Children</label>
                                <input type="number" value={checkInForm.children} min="0" onChange={e => setCheckInForm({...checkInForm, children: parseInt(e.target.value) || 0})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Special Requests</label>
                            <textarea value={checkInForm.specialRequests} onChange={e => setCheckInForm({...checkInForm, specialRequests: e.target.value})} rows={2} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="secondary" onClick={handleCloseModals}>Cancel</Button>
                        <Button onClick={handleCheckIn}>Confirm Check-In</Button>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={isCheckOutModalOpen} onClose={handleCloseModals} title={`Check-Out from Room ${selectedRoomForAction?.number}`}>
                <p>Are you sure you want to check out the guest from Room {selectedRoomForAction?.number}?</p>
                <div className="flex justify-end space-x-2 pt-6">
                    <Button variant="secondary" onClick={handleCloseModals}>Cancel</Button>
                    <Button onClick={handleCheckOut}>Confirm Check-Out</Button>
                </div>
            </Modal>
        </div>
    );
};

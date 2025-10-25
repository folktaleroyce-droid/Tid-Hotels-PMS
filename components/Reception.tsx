import React, { useState } from 'react';
// FIX: Added file extensions to imports to resolve module errors.
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import type { HotelData, Room, Guest, Reservation } from '../types.ts';
import { RoomStatus, LoyaltyTier } from '../types.ts';
import { ROOM_STATUS_THEME, ID_TYPES, LOYALTY_TIER_THEME } from '../constants.tsx';

interface ReceptionProps {
    hotelData: HotelData;
}

// Moved INITIAL_FORM_STATE inside the component to use fresh dates.
const BASE_INITIAL_FORM_STATE = {
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    birthdate: '',
    nationality: '',
    idType: '',
    idNumber: '',
    idOtherType: '',
    address: '',
    adults: 1,
    children: 0,
    specialRequests: '',
    roomId: 0,
    roomRate: 0,
};

// FIX: Moved createInitialFormState before its use in FormState to prevent a ReferenceError.
const createInitialFormState = (tomorrowStr: string) => ({
    ...BASE_INITIAL_FORM_STATE,
    departureDate: tomorrowStr,
});

type FormState = ReturnType<typeof createInitialFormState>;
type FormErrors = Partial<{[K in keyof FormState]: string}>;


export const Reception: React.FC<ReceptionProps> = ({ hotelData }) => {
    const { rooms, guests, reservations, updateRoomStatus, addTransaction, setGuests, setReservations, addSyncLogEntry, taxSettings } = hotelData;
    const [isCheckInModalOpen, setCheckInModalOpen] = useState(false);
    const [isCheckOutModalOpen, setCheckOutModalOpen] = useState(false);
    
    // Moved date calculations inside the component to ensure they are always current.
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(new Date().getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const INITIAL_FORM_STATE = createInitialFormState(tomorrowStr);

    const [selectedRoomForAction, setSelectedRoomForAction] = useState<Room | null>(null);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    
    const [checkInForm, setCheckInForm] = useState<FormState>(INITIAL_FORM_STATE);
    const [errors, setErrors] = useState<FormErrors>({});

    const handleOpenCheckIn = (room: Room) => {
        setSelectedReservation(null);
        setCheckInForm({ ...INITIAL_FORM_STATE, roomId: room.id, roomRate: room.rate });
        setErrors({});
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
            roomRate: availableRoom.rate,
        });
        setErrors({});
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
        setErrors({});
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im;

        if (!checkInForm.guestName.trim()) newErrors.guestName = "Guest name is required.";
        
        if (!checkInForm.guestEmail.trim()) {
            newErrors.guestEmail = "Email is required.";
        } else if (!emailRegex.test(checkInForm.guestEmail)) {
            newErrors.guestEmail = "Please enter a valid email format.";
        }

        if (!checkInForm.guestPhone.trim()) {
            newErrors.guestPhone = "Phone number is required.";
        } else if (!phoneRegex.test(checkInForm.guestPhone)) {
            newErrors.guestPhone = "Please enter a valid phone number format.";
        }
        
        if (!checkInForm.birthdate) newErrors.birthdate = "Birthdate is required.";
        if (!checkInForm.idType) newErrors.idType = "ID Type is required.";
        if (checkInForm.idType === 'Other' && !checkInForm.idOtherType.trim()) newErrors.idOtherType = "Please specify ID type.";
        if (!checkInForm.idNumber.trim()) newErrors.idNumber = "ID number is required.";
        if (!checkInForm.roomRate || checkInForm.roomRate <= 0) newErrors.roomRate = "A valid room rate is required.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCheckIn = () => {
        if (!validateForm()) return;

        const roomToCheckIn = rooms.find(r => r.id === checkInForm.roomId);
        if (!roomToCheckIn) {
            alert('A valid room is required.');
            return;
        }
        if (roomToCheckIn.status !== RoomStatus.Vacant) {
            alert('This room is not vacant and cannot be assigned.');
            return;
        }

        const newGuest: Guest = {
            id: guests.length > 0 ? Math.max(...guests.map(g => g.id)) + 1 : 1,
            name: checkInForm.guestName,
            email: checkInForm.guestEmail,
            phone: checkInForm.guestPhone,
            birthdate: checkInForm.birthdate,
            nationality: checkInForm.nationality,
            idType: checkInForm.idType,
            idOtherType: checkInForm.idOtherType,
            idNumber: checkInForm.idNumber,
            address: checkInForm.address,
            arrivalDate: today,
            departureDate: checkInForm.departureDate,
            adults: checkInForm.adults,
            children: checkInForm.children,
            roomNumber: roomToCheckIn.number,
            roomType: roomToCheckIn.type,
            bookingSource: selectedReservation ? selectedReservation.ota : 'Direct',
            specialRequests: checkInForm.specialRequests,
            loyaltyPoints: 0,
            loyaltyTier: LoyaltyTier.Bronze,
        };

        setGuests(prev => [...prev, newGuest]);
        updateRoomStatus(roomToCheckIn.id, RoomStatus.Occupied, newGuest.id);
        
        // Post room charge
        addTransaction({
            guestId: newGuest.id,
            description: 'Room Charge',
            amount: checkInForm.roomRate,
            date: today
        });

        // Post tax if enabled
        if (taxSettings.isEnabled && taxSettings.rate > 0) {
            const taxAmount = checkInForm.roomRate * (taxSettings.rate / 100);
            addTransaction({
                guestId: newGuest.id,
                description: `Tax (${taxSettings.rate}%)`,
                amount: taxAmount,
                date: today
            });
        }
        
        // If this was a reservation, remove it from the list
        if (selectedReservation) {
            setReservations(reservations.filter(res => res.id !== selectedReservation.id));
        }

        handleCloseModals();
    };
    
    const handleCheckOut = () => {
        if (selectedRoomForAction) {
            updateRoomStatus(selectedRoomForAction.id, RoomStatus.Dirty);
        }
        handleCloseModals();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Upcoming Reservations" className="lg:col-span-1">
                <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-2">
                    {reservations.length > 0 ? reservations.map(res => (
                        <div key={res.id} className="p-3 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <p className="font-bold">{res.guestName}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{res.roomType}</p>
                            <p className="text-xs text-slate-500">{res.checkInDate} to {res.checkOutDate}</p>
                            <Button className="w-full mt-2 text-sm py-1" onClick={() => handleOpenReservationCheckIn(res)}>Check In</Button>
                        </div>
                    )) : <p className="text-slate-500 dark:text-slate-400">No upcoming reservations.</p>}
                </div>
            </Card>

            <div className="lg:col-span-2">
                <Card title="Room Status Grid">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {rooms.map(room => {
                            const guest = room.guestId ? guests.find(g => g.id === room.guestId) : null;
                            const theme = ROOM_STATUS_THEME[room.status];
                            return (
                                <div key={room.id} className={`p-4 rounded-lg shadow-md border-l-4 ${theme.light} ${theme.dark}`} style={{borderLeftColor: theme.fill}}>
                                    <h4 className={`font-bold text-lg ${theme.text}`}>Room {room.number}</h4>
                                    <p className={`text-sm ${theme.text}`}>{room.type}</p>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${theme.badge} my-2 inline-block`}>{room.status}</span>
                                    {guest && (
                                        <div className="mt-2 text-xs">
                                            <p className={`font-semibold ${theme.text}`}>{guest.name}</p>
                                             <span className={`px-2 py-0.5 mt-1 inline-block text-xs font-semibold rounded-full ${LOYALTY_TIER_THEME[guest.loyaltyTier].bg} ${LOYALTY_TIER_THEME[guest.loyaltyTier].text}`}>
                                                {guest.loyaltyTier}
                                            </span>
                                        </div>
                                    )}
                                    <div className="mt-3 flex flex-col space-y-2">
                                        {room.status === RoomStatus.Vacant && <Button className="w-full text-xs py-1" onClick={() => handleOpenCheckIn(room)}>Walk-in</Button>}
                                        {room.status === RoomStatus.Occupied && <Button variant="secondary" className="w-full text-xs py-1" onClick={() => handleOpenCheckOut(room)}>Check-out</Button>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
            
            <Modal isOpen={isCheckInModalOpen} onClose={handleCloseModals} title="Guest Check-in">
                <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Full Name*</label>
                            <input type="text" value={checkInForm.guestName} onChange={(e) => setCheckInForm({...checkInForm, guestName: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                            {errors.guestName && <p className="text-red-500 text-xs mt-1">{errors.guestName}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email*</label>
                            <input type="email" value={checkInForm.guestEmail} onChange={(e) => setCheckInForm({...checkInForm, guestEmail: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                            {errors.guestEmail && <p className="text-red-500 text-xs mt-1">{errors.guestEmail}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone*</label>
                            <input type="tel" value={checkInForm.guestPhone} onChange={(e) => setCheckInForm({...checkInForm, guestPhone: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                             {errors.guestPhone && <p className="text-red-500 text-xs mt-1">{errors.guestPhone}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Birthdate*</label>
                            <input type="date" value={checkInForm.birthdate} onChange={(e) => setCheckInForm({...checkInForm, birthdate: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                            {errors.birthdate && <p className="text-red-500 text-xs mt-1">{errors.birthdate}</p>}
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1">ID Type*</label>
                            <select value={checkInForm.idType} onChange={(e) => setCheckInForm({...checkInForm, idType: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                                <option value="" disabled>Select ID type</option>
                                {ID_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                            {errors.idType && <p className="text-red-500 text-xs mt-1">{errors.idType}</p>}
                        </div>
                        {checkInForm.idType === 'Other' && (
                             <div>
                                <label className="block text-sm font-medium mb-1">Please Specify*</label>
                                <input type="text" value={checkInForm.idOtherType} onChange={(e) => setCheckInForm({...checkInForm, idOtherType: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                                {errors.idOtherType && <p className="text-red-500 text-xs mt-1">{errors.idOtherType}</p>}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium mb-1">ID Number*</label>
                            <input type="text" value={checkInForm.idNumber} onChange={(e) => setCheckInForm({...checkInForm, idNumber: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                            {errors.idNumber && <p className="text-red-500 text-xs mt-1">{errors.idNumber}</p>}
                        </div>
                         <div className="col-span-full">
                            <label className="block text-sm font-medium mb-1">Address</label>
                            <input type="text" value={checkInForm.address} onChange={(e) => setCheckInForm({...checkInForm, address: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Departure Date</label>
                            <input type="date" value={checkInForm.departureDate} onChange={(e) => setCheckInForm({...checkInForm, departureDate: e.target.value})} min={tomorrowStr} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Room Rate* (per night)</label>
                             <input type="number" value={checkInForm.roomRate} onChange={(e) => setCheckInForm({...checkInForm, roomRate: parseInt(e.target.value, 10)})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                            {errors.roomRate && <p className="text-red-500 text-xs mt-1">{errors.roomRate}</p>}
                        </div>
                    </div>
                    <p className="font-bold text-center p-2 rounded-md bg-slate-200 dark:bg-slate-700">Room Rate: ₦{checkInForm.roomRate.toLocaleString()}</p>
                    <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button variant="secondary" onClick={handleCloseModals}>Cancel</Button>
                        <Button onClick={handleCheckIn}>Complete Check-in</Button>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={isCheckOutModalOpen} onClose={handleCloseModals} title={`Confirm Check-out for Room ${selectedRoomForAction?.number}`}>
                <p>Are you sure you want to check out the guest from Room {selectedRoomForAction?.number}? The room status will be set to 'Dirty'.</p>
                <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button variant="secondary" onClick={handleCloseModals}>Cancel</Button>
                    <Button onClick={handleCheckOut}>Confirm Check-out</Button>
                </div>
            </Modal>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import type { HotelData, Room, Guest, Reservation, Transaction, RoomType } from '../types.ts';
import { RoomStatus, LoyaltyTier } from '../types.ts';
import { ROOM_STATUS_THEME, ID_TYPES, LOYALTY_TIER_THEME } from '../constants.tsx';

const BASE_INITIAL_FORM_STATE = {
    guestName: '',
    guestEmail: '',
    guestPhone: '',
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
    discount: '',
    currency: 'NGN' as 'NGN' | 'USD',
    company: '',
    preferences: '',
    vip: false,
};

const createInitialFormState = (todayStr: string, tomorrowStr: string) => ({
    ...BASE_INITIAL_FORM_STATE,
    arrivalDate: todayStr,
    departureDate: tomorrowStr,
});

type FormState = ReturnType<typeof createInitialFormState> & { discount: string };
type FormErrors = Partial<{[K in keyof FormState]: string}>;

interface ReceptionProps {
    hotelData: HotelData;
}

export const Reception: React.FC<ReceptionProps> = ({ hotelData }) => {
    const { rooms, guests, reservations, updateRoomStatus, addTransaction, checkInGuest, addSyncLogEntry, taxSettings, roomTypes, moveGuest } = hotelData;
    
    // Admin filtering: Only show rooms and types that are ACTIVE/PUBLISHED
    const activeRooms = rooms.filter(r => r.isActive);
    const activeRoomTypes = roomTypes.filter(rt => rt.isActive);

    const [isCheckInModalOpen, setCheckInModalOpen] = useState(false);
    const [isCheckOutModalOpen, setCheckOutModalOpen] = useState(false);
    const [isMoveModalOpen, setMoveModalOpen] = useState(false);
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(new Date().getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const INITIAL_FORM_STATE = createInitialFormState(today, tomorrowStr);

    const [selectedRoomForAction, setSelectedRoomForAction] = useState<Room | null>(null);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    
    const [checkInForm, setCheckInForm] = useState<FormState>(INITIAL_FORM_STATE);
    const [errors, setErrors] = useState<FormErrors>({});

    const [guestForCheckOut, setGuestForCheckOut] = useState<Guest | null>(null);
    const [checkOutBalance, setCheckOutBalance] = useState(0);

    const [guestToMove, setGuestToMove] = useState<{ guest: Guest, room: Room } | null>(null);
    const [compatibleRooms, setCompatibleRooms] = useState<Room[]>([]);
    const [selectedNewRoomId, setSelectedNewRoomId] = useState<string>('');

    useEffect(() => {
        if (!isCheckInModalOpen) return;
        let roomTypeDetails: RoomType | undefined;
        if (selectedRoomForAction) {
            roomTypeDetails = roomTypes.find(rt => rt.name === selectedRoomForAction.type);
        } else if (selectedReservation) {
            roomTypeDetails = roomTypes.find(rt => rt.name === selectedReservation.roomType);
        }
        if (roomTypeDetails) {
            const newRate = roomTypeDetails.rates[checkInForm.currency];
            setCheckInForm(prev => ({...prev, roomRate: newRate}));
        }
    }, [checkInForm.currency, selectedRoomForAction, selectedReservation, roomTypes, isCheckInModalOpen]);

    const calculateBalance = (guestId: number, transactions: Transaction[]): number => {
      return transactions
        .filter(t => t.guestId === guestId)
        .reduce((acc, t) => acc + t.amount, 0);
    };

    const handleOpenCheckIn = (room: Room) => {
        const roomTypeDetails = roomTypes.find(rt => rt.name === room.type);
        setSelectedReservation(null);
        setSelectedRoomForAction(room);
        setCheckInForm({
            ...INITIAL_FORM_STATE,
            roomId: room.id,
            roomRate: roomTypeDetails?.rates['NGN'] || 0,
            currency: 'NGN',
        });
        setErrors({});
        setCheckInModalOpen(true);
    };

    const handleOpenReservationCheckIn = (reservation: Reservation) => {
        const availableRoom = activeRooms.find(r => r.status === RoomStatus.Vacant && r.type === reservation.roomType);
        if (!availableRoom) {
            alert(`No vacant ${reservation.roomType} rooms available for check-in.`);
            return;
        }
        const roomTypeDetails = roomTypes.find(rt => rt.name === reservation.roomType);
        setSelectedReservation(reservation);
        setSelectedRoomForAction(availableRoom);
        setCheckInForm({
            ...INITIAL_FORM_STATE,
            guestName: reservation.guestName,
            guestEmail: reservation.guestEmail,
            guestPhone: reservation.guestPhone,
            arrivalDate: reservation.checkInDate,
            departureDate: reservation.checkOutDate,
            roomId: availableRoom.id,
            roomRate: roomTypeDetails?.rates['NGN'] || 0,
            currency: 'NGN',
        });
        setErrors({});
        setCheckInModalOpen(true);
    };

    const handleOpenCheckOut = (room: Room) => {
        if (!room.guestId) return;
        const guest = guests.find(g => g.id === room.guestId);
        if (!guest) return;
        const balance = calculateBalance(guest.id, hotelData.transactions);
        setSelectedRoomForAction(room);
        setGuestForCheckOut(guest);
        setCheckOutBalance(balance);
        setCheckOutModalOpen(true);
    };
    
    const handleOpenMoveModal = (room: Room) => {
        if (!room.guestId) return;
        const guest = guests.find(g => g.id === room.guestId);
        if (!guest) return;
        const compatible = activeRooms.filter(r => r.type === room.type && r.status === RoomStatus.Vacant);
        setGuestToMove({ guest, room });
        setCompatibleRooms(compatible);
        setSelectedNewRoomId('');
        setMoveModalOpen(true);
    };

    const handleCloseModals = () => {
        setCheckInModalOpen(false);
        setCheckOutModalOpen(false);
        setMoveModalOpen(false);
        setSelectedRoomForAction(null);
        setSelectedReservation(null);
        setCheckInForm(INITIAL_FORM_STATE);
        setErrors({});
        setGuestForCheckOut(null);
        setCheckOutBalance(0);
        setGuestToMove(null);
        setCompatibleRooms([]);
        setSelectedNewRoomId('');
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
        if (!checkInForm.arrivalDate) newErrors.arrivalDate = "Arrival date is required.";
        if (!checkInForm.idType) newErrors.idType = "ID Type is required.";
        if (checkInForm.idType === 'Other' && !checkInForm.idOtherType.trim()) newErrors.idOtherType = "Please specify ID type.";
        if (!checkInForm.idNumber.trim()) newErrors.idNumber = "ID number is required.";
        if (!checkInForm.roomRate || checkInForm.roomRate <= 0) newErrors.roomRate = "A valid room rate is required.";
        const discount = parseFloat(checkInForm.discount);
        if (checkInForm.discount && (isNaN(discount) || discount < 0)) {
            newErrors.discount = "Discount must be a positive number.";
        }
        if (discount > checkInForm.roomRate) {
             newErrors.discount = "Discount cannot be greater than the room rate.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCheckIn = () => {
        if (!validateForm()) return;
        const roomToCheckIn = rooms.find(r => r.id === checkInForm.roomId);
        if (!roomToCheckIn) return;
        const discountAmount = parseFloat(checkInForm.discount) || 0;
        const newGuest: Omit<Guest, 'id'> = {
            name: checkInForm.guestName,
            email: checkInForm.guestEmail,
            phone: checkInForm.guestPhone,
            nationality: checkInForm.nationality,
            idType: checkInForm.idType,
            idOtherType: checkInForm.idOtherType,
            idNumber: checkInForm.idNumber,
            address: checkInForm.address,
            arrivalDate: checkInForm.arrivalDate,
            departureDate: checkInForm.departureDate,
            adults: checkInForm.adults,
            children: checkInForm.children,
            roomNumber: roomToCheckIn.number,
            roomType: roomToCheckIn.type,
            bookingSource: selectedReservation ? selectedReservation.ota : 'Direct',
            currency: checkInForm.currency,
            discount: discountAmount,
            specialRequests: checkInForm.specialRequests,
            loyaltyPoints: 0,
            loyaltyTier: LoyaltyTier.Bronze,
            company: checkInForm.company,
            preferences: checkInForm.preferences,
            vip: checkInForm.vip,
        };
        const finalCharge = checkInForm.roomRate - discountAmount;
        let chargeDescription = 'Room Charge';
        if (discountAmount > 0) {
            const currencySymbol = checkInForm.currency === 'NGN' ? '₦' : '$';
            chargeDescription += ` (with ${currencySymbol}${discountAmount.toLocaleString()} discount)`;
        }
        checkInGuest({
            guest: newGuest,
            roomId: roomToCheckIn.id,
            charge: { description: chargeDescription, amount: finalCharge, date: checkInForm.arrivalDate },
            tax: (taxSettings.isEnabled && taxSettings.rate > 0) ? { description: `Tax (${taxSettings.rate}%)`, amount: finalCharge * (taxSettings.rate / 100), date: checkInForm.arrivalDate } : undefined,
            reservationId: selectedReservation ? selectedReservation.id : undefined
        });
        handleCloseModals();
    };
    
    const handleCheckOut = () => {
        if (selectedRoomForAction) {
            updateRoomStatus(selectedRoomForAction.id, RoomStatus.Dirty);
        }
        handleCloseModals();
    };

    const handleConfirmMove = () => {
        if (!guestToMove || !selectedNewRoomId) return;
        const newRoomId = parseInt(selectedNewRoomId, 10);
        moveGuest({ guestId: guestToMove.guest.id, oldRoomId: guestToMove.room.id, newRoomId: newRoomId });
        handleCloseModals();
    };
    
    const finalNightlyCharge = (checkInForm.roomRate || 0) - (parseFloat(checkInForm.discount) || 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Reservations Queue" className="lg:col-span-1">
                <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-2">
                    {reservations.map(res => (
                        <div key={res.id} className="p-3 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <p className="font-bold">{res.guestName}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{res.roomType}</p>
                            <p className="text-xs text-slate-500">{res.checkInDate} to {res.checkOutDate}</p>
                            <Button className="w-full mt-2 text-sm py-1" onClick={() => handleOpenReservationCheckIn(res)}>Check In</Button>
                        </div>
                    ))}
                    {reservations.length === 0 && <p className="text-slate-500 text-center py-10">Queue empty.</p>}
                </div>
            </Card>

            <div className="lg:col-span-2">
                <Card title="Operations Status Board">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {activeRooms.map(room => {
                            const guest = room.guestId ? guests.find(g => g.id === room.guestId) : null;
                            const theme = ROOM_STATUS_THEME[room.status];
                            return (
                                <div key={room.id} className={`p-4 rounded-lg shadow-md border-l-4 ${theme.light} ${theme.dark}`} style={{borderLeftColor: theme.fill}}>
                                    <h4 className={`font-bold text-lg ${theme.text}`}>Room {room.number}</h4>
                                    <p className={`text-xs ${theme.text} opacity-80`}>{room.type}</p>
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full text-white ${theme.badge} my-2 inline-block`}>{room.status.toUpperCase()}</span>
                                    {guest && (
                                        <div className="mt-2 text-xs">
                                            <div className="flex items-center space-x-1">
                                                <p className={`font-bold truncate ${theme.text}`}>{guest.name}</p>
                                                {guest.vip && <span className="bg-yellow-400 text-yellow-900 text-[8px] font-black px-1 rounded">VIP</span>}
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-3 flex flex-col space-y-2">
                                        {room.status === RoomStatus.Vacant && <Button className="w-full text-[10px] py-1 uppercase font-bold" onClick={() => handleOpenCheckIn(room)}>Walk-in</Button>}
                                        {room.status === RoomStatus.Occupied && (
                                            <>
                                                <Button variant="secondary" className="w-full text-[10px] py-1 uppercase font-bold" onClick={() => handleOpenCheckOut(room)}>Check-out</Button>
                                                <Button variant="secondary" className="w-full text-[10px] py-1 uppercase font-bold" onClick={() => handleOpenMoveModal(room)}>Move</Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
            
            <Modal isOpen={isCheckInModalOpen} onClose={handleCloseModals} title="Enterprise Guest Check-in">
                <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold uppercase mb-1">Guest Full Name*</label>
                            <input type="text" value={checkInForm.guestName} onChange={(e) => setCheckInForm({...checkInForm, guestName: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Email*</label>
                            <input type="email" value={checkInForm.guestEmail} onChange={(e) => setCheckInForm({...checkInForm, guestEmail: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Phone*</label>
                            <input type="tel" value={checkInForm.guestPhone} onChange={(e) => setCheckInForm({...checkInForm, guestPhone: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                        </div>
                         <div>
                            <label className="block text-xs font-bold uppercase mb-1">ID Type*</label>
                            <select value={checkInForm.idType} onChange={(e) => setCheckInForm({...checkInForm, idType: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                                <option value="" disabled>Select ID type</option>
                                {ID_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">ID Number*</label>
                            <input type="text" value={checkInForm.idNumber} onChange={(e) => setCheckInForm({...checkInForm, idNumber: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                        </div>
                         <div>
                            <label className="block text-xs font-bold uppercase mb-1">Departure Date</label>
                            <input type="date" value={checkInForm.departureDate} onChange={(e) => setCheckInForm({...checkInForm, departureDate: e.target.value})} min={tomorrowStr} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                        </div>
                        <div>
                             <label className="block text-xs font-bold uppercase mb-1">Currency</label>
                             <select value={checkInForm.currency} onChange={(e) => setCheckInForm({...checkInForm, currency: e.target.value as 'NGN' | 'USD'})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                                <option value="NGN">NGN</option>
                                <option value="USD">USD</option>
                             </select>
                        </div>
                    </div>
                    <div className="font-bold text-center p-3 rounded-md bg-indigo-600 text-white text-lg">
                        Final Nightly Charge: {checkInForm.currency === 'NGN' ? '₦' : '$'}{finalNightlyCharge.toLocaleString()}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button variant="secondary" onClick={handleCloseModals}>Cancel</Button>
                        <Button onClick={handleCheckIn}>Complete Check-in</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

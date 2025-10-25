import React, { useState, useEffect } from 'react';
// FIX: Added file extensions to imports to resolve module errors.
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import type { HotelData, Room, Guest, Reservation, Transaction, RoomType } from '../types.ts';
import { RoomStatus, LoyaltyTier } from '../types.ts';
import { ROOM_STATUS_THEME, ID_TYPES, LOYALTY_TIER_THEME } from '../constants.tsx';

// Moved INITIAL_FORM_STATE inside the component to use fresh dates.
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
};

// FIX: Moved createInitialFormState before its use in FormState to prevent a ReferenceError.
const createInitialFormState = (todayStr: string, tomorrowStr: string) => ({
    ...BASE_INITIAL_FORM_STATE,
    arrivalDate: todayStr,
    departureDate: tomorrowStr,
});

type FormState = ReturnType<typeof createInitialFormState> & { discount: string };
type FormErrors = Partial<{[K in keyof FormState]: string}>;

// FIX: Added ReceptionProps interface to resolve 'Cannot find name' error.
interface ReceptionProps {
    hotelData: HotelData;
}

export const Reception: React.FC<ReceptionProps> = ({ hotelData }) => {
    const { rooms, guests, reservations, updateRoomStatus, addTransaction, checkInGuest, addSyncLogEntry, taxSettings, roomTypes } = hotelData;
    const [isCheckInModalOpen, setCheckInModalOpen] = useState(false);
    const [isCheckOutModalOpen, setCheckOutModalOpen] = useState(false);
    
    // Moved date calculations inside the component to ensure they are always current.
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

    // Effect to update room rate when currency or selected room changes
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
        setSelectedRoomForAction(room); // Keep track of the room itself
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
        const availableRoom = rooms.find(r => r.status === RoomStatus.Vacant && r.type === reservation.roomType);
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
        if (!room.guestId) return; // Should not happen, but a good guard
        const guest = hotelData.guests.find(g => g.id === room.guestId);
        if (!guest) return;
    
        const balance = calculateBalance(guest.id, hotelData.transactions);
        
        setSelectedRoomForAction(room);
        setGuestForCheckOut(guest);
        setCheckOutBalance(balance);
        setCheckOutModalOpen(true);
    };
    
    const handleCloseModals = () => {
        setCheckInModalOpen(false);
        setCheckOutModalOpen(false);
        setSelectedRoomForAction(null);
        setSelectedReservation(null);
        setCheckInForm(INITIAL_FORM_STATE);
        setErrors({});
        setGuestForCheckOut(null);
        setCheckOutBalance(0);
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
        if (!roomToCheckIn) {
            alert('A valid room is required.');
            return;
        }
        if (roomToCheckIn.status !== RoomStatus.Vacant) {
            alert('This room is not vacant and cannot be assigned.');
            return;
        }
    
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
        };
    
        const finalCharge = checkInForm.roomRate - discountAmount;
        let chargeDescription = 'Room Charge';
        if (discountAmount > 0) {
            const currencySymbol = checkInForm.currency === 'NGN' ? '₦' : '$';
            chargeDescription += ` (with ${currencySymbol}${discountAmount.toLocaleString()} discount)`;
        }
    
        // Use the new atomic action
        checkInGuest({
            guest: newGuest,
            roomId: roomToCheckIn.id,
            charge: {
                description: chargeDescription,
                amount: finalCharge,
                date: checkInForm.arrivalDate
            },
            tax: (taxSettings.isEnabled && taxSettings.rate > 0) ? {
                description: `Tax (${taxSettings.rate}%)`,
                amount: finalCharge * (taxSettings.rate / 100),
                date: checkInForm.arrivalDate
            } : undefined,
            reservationId: selectedReservation ? selectedReservation.id : undefined
        });
    
        handleCloseModals();
    };
    
    const handleCheckOut = () => {
        if (selectedRoomForAction) {
            // Confirmation is handled by the modal UI, so we proceed directly.
            updateRoomStatus(selectedRoomForAction.id, RoomStatus.Dirty);
        }
        handleCloseModals(); // Close modal and clean up state
    };
    
    const finalNightlyCharge = (checkInForm.roomRate || 0) - (parseFloat(checkInForm.discount) || 0);

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
                            <label className="block text-sm font-medium mb-1">Arrival Date*</label>
                            <input type="date" value={checkInForm.arrivalDate} onChange={(e) => setCheckInForm({...checkInForm, arrivalDate: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                            {errors.arrivalDate && <p className="text-red-500 text-xs mt-1">{errors.arrivalDate}</p>}
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
                        <div className="grid grid-cols-2 gap-x-4">
                             <div>
                                <label className="block text-sm font-medium mb-1">Currency</label>
                                <select 
                                  value={checkInForm.currency} 
                                  onChange={(e) => setCheckInForm({...checkInForm, currency: e.target.value as 'NGN' | 'USD'})} 
                                  className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                                >
                                    <option value="NGN">NGN</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Room Rate (per night)</label>
                                 <input type="number" readOnly value={checkInForm.roomRate} className="w-full p-2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600"/>
                                {errors.roomRate && <p className="text-red-500 text-xs mt-1">{errors.roomRate}</p>}
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1">Discount</label>
                             <input 
                                type="number" 
                                value={checkInForm.discount} 
                                onChange={(e) => setCheckInForm({...checkInForm, discount: e.target.value})} 
                                placeholder="e.g., 5000"
                                className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                             />
                            {errors.discount && <p className="text-red-500 text-xs mt-1">{errors.discount}</p>}
                        </div>
                    </div>
                    <div className="font-bold text-center p-3 rounded-md bg-slate-200 dark:bg-slate-700 text-lg">
                        Final Nightly Charge: {checkInForm.currency === 'NGN' ? '₦' : '$'}{finalNightlyCharge.toLocaleString()}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button variant="secondary" onClick={handleCloseModals}>Cancel</Button>
                        <Button onClick={handleCheckIn}>Complete Check-in</Button>
                    </div>
                </div>
            </Modal>
            
            <Modal 
                isOpen={isCheckOutModalOpen} 
                onClose={handleCloseModals} 
                title={`Confirm Check-out for ${guestForCheckOut?.name || 'Guest'} (Room ${selectedRoomForAction?.number})`}
            >
                <div className="space-y-4">
                    <p>Please confirm the guest's final account balance before proceeding.</p>
                    <div className="p-4 rounded-lg bg-slate-200 dark:bg-slate-700 text-center">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Final Balance</p>
                        <p className={`text-3xl font-bold ${checkOutBalance > 0.01 ? 'text-red-500' : 'text-green-500'}`}>
                            ₦{checkOutBalance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {checkOutBalance <= 0.01 && <p className="text-green-600 font-semibold mt-1">Account Settled</p>}
                        {checkOutBalance > 0.01 && <p className="text-red-600 font-semibold mt-1">Outstanding Amount</p>}
                    </div>
                    
                    {checkOutBalance > 0.01 && (
                        <div className="p-3 rounded-md bg-red-100 dark:bg-red-900/50 border border-red-500/50 flex items-start space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="text-sm">
                                <p className="font-semibold text-red-800 dark:text-red-200">Warning: Outstanding Balance</p>
                                <p className="text-red-700 dark:text-red-300 mt-1">
                                    Proceeding will check the guest out without settling the account.
                                </p>
                            </div>
                        </div>
                    )}

                    <p>
                        Checking out will set the room status to 'Dirty' for housekeeping and finalize the guest's stay. This action cannot be undone.
                    </p>
                </div>
                <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button variant="secondary" onClick={handleCloseModals}>Cancel</Button>
                    <Button onClick={handleCheckOut} className={checkOutBalance > 0.01 ? "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white" : ""}>
                        {checkOutBalance > 0.01 ? 'Check-out with Balance' : 'Confirm Check-out'}
                    </Button>
                </div>
            </Modal>
        </div>
    );
};
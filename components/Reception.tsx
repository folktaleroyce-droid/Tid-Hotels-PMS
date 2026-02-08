
import React, { useState, useMemo } from 'react';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import type { HotelData, Room, Guest, Reservation, BaseEntity, Transaction } from '../types.ts';
import { RoomStatus, LoyaltyTier, UserRole, PaymentStatus } from '../types.ts';
import { ROOM_STATUS_THEME, ID_TYPES, LOYALTY_TIER_THEME } from '../constants.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';

const INITIAL_CHECKIN_STATE = {
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    nationality: 'Nigerian',
    idType: 'International Passport',
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
    birthdate: ''
};

const INITIAL_RESERVATION_STATE = {
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    roomType: 'Standard Room',
    ota: 'Direct'
};

interface ReceptionProps {
    hotelData: HotelData;
}

export const Reception: React.FC<ReceptionProps> = ({ hotelData }) => {
    const { 
        rooms, guests, reservations, updateReservation, addReservation,
        checkInGuest, checkOutGuest, transactions, taxSettings,
        moveGuest, addTransaction, deleteTransaction, addSyncLogEntry,
        roomTypes
    } = hotelData;
    
    const { currentUser } = useAuth();

    // Modals
    const [isCheckInModalOpen, setCheckInModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [isPostChargeModalOpen, setIsPostChargeModalOpen] = useState(false);
    const [isGuestLookupModalOpen, setIsGuestLookupModalOpen] = useState(false);
    const [isNewReservationModalOpen, setIsNewReservationModalOpen] = useState(false);
    const [isEditDatesModalOpen, setIsEditDatesModalOpen] = useState(false);

    // Selections
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    
    // Forms
    const [checkInForm, setCheckInForm] = useState(INITIAL_CHECKIN_STATE);
    const [resForm, setResForm] = useState(INITIAL_RESERVATION_STATE);
    const [editDatesForm, setEditDatesForm] = useState({ checkInDate: '', checkOutDate: '' });
    const [checkoutForm, setCheckoutForm] = useState({ amountPaid: '', method: 'Cash' });
    const [chargeForm, setChargeForm] = useState({ description: '', amount: '' });
    const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Confirmed' | 'CheckedIn'>('All');
    const [lookupSearch, setLookupSearch] = useState('');

    const reservationQueue = useMemo(() => {
        return reservations
            .filter(r => r.status !== 'Cancelled' && r.status !== 'NoShow' && r.status !== 'CheckedOut')
            .filter(r => filterStatus === 'All' || r.status === filterStatus)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [reservations, filterStatus]);

    const filteredLookup = useMemo(() => {
        if (!lookupSearch) return [];
        const low = lookupSearch.toLowerCase();
        return guests.filter(g => 
            g.name.toLowerCase().includes(low) || 
            g.email.toLowerCase().includes(low) || 
            g.phone.includes(lookupSearch)
        );
    }, [guests, lookupSearch]);

    const calculateBalance = (guestId: number): number => {
        return transactions
            .filter(t => t.guestId === guestId)
            .reduce((acc, t) => acc + t.amount, 0);
    };

    const handleNewReservation = () => {
        if (!resForm.guestName || !resForm.guestPhone) {
            alert("Entry Failed: Critical manifest parameters missing.");
            return;
        }
        addReservation(resForm as any);
        setIsNewReservationModalOpen(false);
        setResForm(INITIAL_RESERVATION_STATE);
        addSyncLogEntry(`New Reservation Manifest Logged: ${resForm.guestName}`, 'success');
    };

    const handleCheckIn = () => {
        if (!checkInForm.guestName || !checkInForm.roomId) {
            alert("Induction Aborted: Identify guest and target unit.");
            return;
        }
        const room = rooms.find(r => r.id === checkInForm.roomId);
        if (!room) return;

        const newGuest: Omit<Guest, keyof BaseEntity | 'id'> = {
            ...checkInForm,
            arrivalDate: new Date().toISOString().split('T')[0],
            departureDate: selectedReservation?.checkOutDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
            roomNumber: room.number,
            roomType: room.type,
            bookingSource: selectedReservation?.ota || 'Walk-In',
            loyaltyPoints: 0,
            loyaltyTier: LoyaltyTier.Bronze,
        } as any;

        checkInGuest({
            guest: newGuest,
            roomId: room.id,
            charge: { description: `Standard Induction: Unit ${room.number}`, amount: room.rate, date: new Date().toISOString().split('T')[0], type: 'charge' },
            reservationId: selectedReservation?.id
        });
        setCheckInModalOpen(false);
        setCheckInForm(INITIAL_CHECKIN_STATE);
        setSelectedReservation(null);
    };

    const handleUpdateDates = () => {
        if (!selectedReservation) return;
        
        const cin = new Date(editDatesForm.checkInDate);
        const cout = new Date(editDatesForm.checkOutDate);

        if (isNaN(cin.getTime()) || isNaN(cout.getTime())) {
            alert("Protocol Violation: Invalid date format.");
            return;
        }

        if (cout <= cin) {
            alert("Logical Conflict: Departure must follow arrival.");
            return;
        }

        updateReservation({
            ...selectedReservation,
            checkInDate: editDatesForm.checkInDate,
            checkOutDate: editDatesForm.checkOutDate
        });

        addSyncLogEntry(`Timeline Modified: Reservation #${selectedReservation.id.toString().slice(-4)} updated`, 'info');
        setIsEditDatesModalOpen(false);
    };

    const handleSelectExistingGuest = (guest: Guest) => {
        if (selectedReservation) {
            updateReservation({ ...selectedReservation, guestId: guest.id, guestName: guest.name, guestEmail: guest.email, guestPhone: guest.phone });
            addSyncLogEntry(`Identity Associated: Reservation #${selectedReservation.id} linked to ${guest.name}`, 'success');
        }
        
        setCheckInForm({
            ...checkInForm,
            guestName: guest.name,
            guestEmail: guest.email,
            guestPhone: guest.phone,
            address: guest.address || '',
            nationality: guest.nationality || 'Nigerian',
            idType: guest.idType || '',
            idNumber: guest.idNumber || '',
            birthdate: guest.birthdate || ''
        });

        setIsGuestLookupModalOpen(false);
        setLookupSearch('');
    };

    const handleMoveGuest = (newRoom: Room) => {
        if (!selectedGuest || !selectedRoom) return;
        
        moveGuest({
            guestId: selectedGuest.id,
            oldRoomId: selectedRoom.id,
            newRoomId: newRoom.id
        });

        addTransaction({
            guestId: selectedGuest.id,
            description: `Unit Relocation: From ${selectedRoom.number} to ${newRoom.number}`,
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            type: 'charge'
        });

        addSyncLogEntry(`Relocation Protocol Finalized: ${selectedGuest.name} moved to Unit ${newRoom.number}`, 'success');
        setIsMoveModalOpen(false);
        setIsPortfolioModalOpen(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT COLUMN: RESERVATION QUEUE */}
            <div className="lg:col-span-1">
                <Card className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Pending Induction</h3>
                        <Button size="sm" onClick={() => setIsNewReservationModalOpen(true)} className="text-[9px] px-2 py-1">+ Manifest</Button>
                    </div>
                    
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-4">
                        <button 
                            onClick={() => setFilterStatus('All')} 
                            className={`flex-1 py-1 text-[8px] font-black uppercase rounded ${filterStatus === 'All' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600' : 'text-slate-500'}`}
                        >
                            Global
                        </button>
                        <button 
                            onClick={() => setFilterStatus('Pending')} 
                            className={`flex-1 py-1 text-[8px] font-black uppercase rounded ${filterStatus === 'Pending' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600' : 'text-slate-500'}`}
                        >
                            Waitlist
                        </button>
                        <button 
                            onClick={() => setFilterStatus('Confirmed')} 
                            className={`flex-1 py-1 text-[8px] font-black uppercase rounded ${filterStatus === 'Confirmed' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600' : 'text-slate-500'}`}
                        >
                            Locked
                        </button>
                    </div>
                    
                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[60vh] custom-scrollbar pr-1">
                        {reservationQueue.map(res => (
                            <div key={res.id} className="p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 group hover:border-indigo-500 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${res.status === 'Confirmed' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{res.status}</span>
                                    <span className="text-[9px] font-mono text-slate-400">REF:{res.id.toString().slice(-4)}</span>
                                </div>
                                <p className="font-black text-sm uppercase tracking-tight truncate">{res.guestName}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{res.roomType} — {res.ota}</p>
                                <p className="text-[8px] text-slate-400 font-mono mt-1 uppercase tracking-tighter">{res.checkInDate} TO {res.checkOutDate}</p>
                                
                                {res.guestId && <p className="text-[7px] font-black uppercase text-indigo-500 mt-2 tracking-widest flex items-center gap-1">
                                    <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> Identity Verified
                                </p>}
                                
                                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        {res.status === 'Confirmed' ? (
                                            <button 
                                                onClick={() => {
                                                    setSelectedReservation(res);
                                                    const room = rooms.find(r => r.number === res.roomAssigned);
                                                    setCheckInForm({ 
                                                        ...INITIAL_CHECKIN_STATE, 
                                                        guestName: res.guestName, 
                                                        guestEmail: res.guestEmail, 
                                                        guestPhone: res.guestPhone, 
                                                        roomId: room?.id || 0 
                                                    });
                                                    setCheckInModalOpen(true);
                                                }}
                                                className="flex-1 py-2 text-[8px] font-black uppercase bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform"
                                            >
                                                Induction
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    setSelectedReservation(res);
                                                    setIsAssignModalOpen(true);
                                                }}
                                                className="flex-1 py-2 text-[8px] font-black uppercase bg-slate-900 text-white rounded-lg active:scale-95 transition-transform"
                                            >
                                                Assign Node
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => {
                                                setSelectedReservation(res);
                                                setEditDatesForm({ checkInDate: res.checkInDate, checkOutDate: res.checkOutDate });
                                                setIsEditDatesModalOpen(true);
                                            }}
                                            className="px-3 py-2 text-[8px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg active:scale-95 transition-transform border border-slate-200 dark:border-slate-700"
                                        >
                                            Dates
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {reservationQueue.length === 0 && (
                            <div className="py-20 text-center opacity-30">
                                <p className="text-[10px] font-black uppercase">Manifest Clear</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* RIGHT COLUMN: ROOM GRID */}
            <div className="lg:col-span-3">
                <Card title="Live Infrastructure Matrix">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
                        {rooms.map(room => {
                            const guest = room.guestId ? guests.find(g => g.id === room.guestId) : null;
                            const balance = guest ? calculateBalance(guest.id) : 0;
                            
                            return (
                                <div 
                                    key={room.id} 
                                    onClick={() => {
                                        if (guest) {
                                            setSelectedGuest(guest);
                                            setSelectedRoom(room);
                                            setIsPortfolioModalOpen(true);
                                        } else {
                                            setCheckInForm({ ...INITIAL_CHECKIN_STATE, roomId: room.id });
                                            setCheckInModalOpen(true);
                                        }
                                    }}
                                    className={`relative p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white dark:bg-slate-900 ${room.status === RoomStatus.Occupied ? 'border-indigo-600 shadow-indigo-100 dark:shadow-none' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-black text-2xl uppercase tracking-tighter leading-none">{room.number}</h4>
                                        <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 ${room.status === RoomStatus.Occupied ? 'bg-indigo-600 animate-pulse' : 'bg-green-500'}`}></div>
                                    </div>
                                    <p className="text-[9px] font-black uppercase text-slate-400 mt-2">{room.type}</p>
                                    
                                    {guest ? (
                                        <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800">
                                            <p className="text-[10px] font-black uppercase truncate leading-tight mb-1">{guest.name}</p>
                                            <p className={`text-[12px] font-black font-mono ${balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                ₦{balance.toLocaleString()}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="mt-12">
                                            <p className="text-[9px] font-bold uppercase text-slate-300">Vacant Node</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

            {/* MODAL: ADJUST RESERVATION TIMELINE */}
            <Modal isOpen={isEditDatesModalOpen} onClose={() => setIsEditDatesModalOpen(false)} title="Operational Timeline Modification">
                <div className="space-y-6">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                         <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Target Identity</p>
                         <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white leading-none">{selectedReservation?.guestName}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Proposed Arrival</label>
                            <input 
                                type="date" 
                                value={editDatesForm.checkInDate} 
                                onChange={e => setEditDatesForm({...editDatesForm, checkInDate: e.target.value})} 
                                className="w-full p-2.5 rounded-lg border dark:bg-slate-800 dark:border-slate-700 font-bold text-xs" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Proposed Departure</label>
                            <input 
                                type="date" 
                                value={editDatesForm.checkOutDate} 
                                onChange={e => setEditDatesForm({...editDatesForm, checkOutDate: e.target.value})} 
                                className="w-full p-2.5 rounded-lg border dark:bg-slate-800 dark:border-slate-700 font-bold text-xs" 
                            />
                        </div>
                    </div>
                    <div className="pt-6 border-t flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsEditDatesModalOpen(false)} className="uppercase font-black text-[10px]">Abort Modification</Button>
                        <Button onClick={handleUpdateDates} className="uppercase font-black text-[10px] px-8">Authorize Timeline</Button>
                    </div>
                </div>
            </Modal>

            {/* MODAL: MANUAL RESERVATION MANIFEST */}
            <Modal isOpen={isNewReservationModalOpen} onClose={() => setIsNewReservationModalOpen(false)} title="New Reservation Manifest">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Legal Nomenclature</label>
                            <input type="text" value={resForm.guestName} onChange={e => setResForm({...resForm, guestName: e.target.value})} className="w-full p-2.5 rounded-lg border dark:bg-slate-800 dark:border-slate-700 font-bold uppercase text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Email Endpoint</label>
                            <input type="email" value={resForm.guestEmail} onChange={e => setResForm({...resForm, guestEmail: e.target.value})} className="w-full p-2.5 rounded-lg border dark:bg-slate-800 dark:border-slate-700 font-mono text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Terminal Contact</label>
                            <input type="tel" value={resForm.guestPhone} onChange={e => setResForm({...resForm, guestPhone: e.target.value})} className="w-full p-2.5 rounded-lg border dark:bg-slate-800 dark:border-slate-700 font-mono text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Arrival Logic</label>
                            <input type="date" value={resForm.checkInDate} onChange={e => setResForm({...resForm, checkInDate: e.target.value})} className="w-full p-2.5 rounded-lg border dark:bg-slate-800 dark:border-slate-700 font-bold text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Release Logic</label>
                            <input type="date" value={resForm.checkOutDate} onChange={e => setResForm({...resForm, checkOutDate: e.target.value})} className="w-full p-2.5 rounded-lg border dark:bg-slate-800 dark:border-slate-700 font-bold text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Infrastructure Targeted</label>
                            <select value={resForm.roomType} onChange={e => setResForm({...resForm, roomType: e.target.value})} className="w-full p-2.5 rounded-lg border dark:bg-slate-800 dark:border-slate-700 font-black uppercase text-xs">
                                {roomTypes.map(rt => <option key={rt.id} value={rt.name}>{rt.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Booking Protocol (Source)</label>
                            <select value={resForm.ota} onChange={e => setResForm({...resForm, ota: e.target.value})} className="w-full p-2.5 rounded-lg border dark:bg-slate-800 dark:border-slate-700 font-black uppercase text-xs">
                                <option value="Direct">Direct Internal</option>
                                <option value="Booking.com">Booking.com</option>
                                <option value="Expedia">Expedia</option>
                                <option value="Corporate">Corporate Contract</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-6 border-t flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsNewReservationModalOpen(false)} className="uppercase font-black text-[10px]">Abort</Button>
                        <Button onClick={handleNewReservation} className="uppercase font-black text-[10px] px-8">Commit Manifest</Button>
                    </div>
                </div>
            </Modal>

            {/* MODAL: PORTFOLIO / LEDGER TERMINAL */}
            <Modal isOpen={isPortfolioModalOpen} onClose={() => setIsPortfolioModalOpen(false)} title={`Terminal Folio: ${selectedGuest?.name}`}>
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl">
                            <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">Active unit</p>
                            <p className="text-xl font-black text-indigo-600 uppercase">UNIT {selectedRoom?.number}</p>
                            <button 
                                onClick={() => setIsMoveModalOpen(true)}
                                className="mt-3 text-[8px] font-black uppercase text-indigo-600 hover:underline flex items-center gap-1"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                Relocate Resident
                            </button>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl text-center">
                            <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">Arrival logic</p>
                            <p className="text-xl font-black uppercase">{selectedGuest?.arrivalDate}</p>
                        </div>
                        <div className="p-6 bg-slate-950 dark:bg-black border-2 border-slate-800 rounded-3xl text-right">
                            <p className="text-[9px] font-black uppercase text-slate-500 mb-1 tracking-widest">Net Outstandings</p>
                            <p className="text-2xl font-black text-green-500 font-mono tracking-tighter">₦{selectedGuest ? calculateBalance(selectedGuest.id).toLocaleString() : 0}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end border-b-2 border-slate-100 dark:border-slate-900 pb-3">
                            <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em]">Fiscal Chronology</h4>
                            <Button size="sm" onClick={() => setIsPostChargeModalOpen(true)} className="text-[9px] uppercase font-black">+ Post Charge</Button>
                        </div>
                        <div className="overflow-x-auto max-h-60 custom-scrollbar border border-slate-100 dark:border-slate-800 rounded-2xl">
                            <table className="w-full text-left text-[11px]">
                                <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 border-b">
                                    <tr>
                                        <th className="p-4 font-black uppercase text-slate-400">Timeline</th>
                                        <th className="p-4 font-black uppercase text-slate-400">Designation</th>
                                        <th className="p-4 font-black uppercase text-slate-400 text-right">Value (₦)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedGuest && transactions.filter(t => t.guestId === selectedGuest.id).map(t => (
                                        <tr key={t.id} className="border-b border-slate-50 dark:border-slate-900 hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-mono text-slate-400">{t.date}</td>
                                            <td className="p-4 font-black uppercase text-slate-900 dark:text-slate-200">{t.description}</td>
                                            <td className={`p-4 text-right font-black font-mono ${t.amount < 0 ? 'text-green-500' : 'text-slate-900 dark:text-white'}`}>
                                                {t.amount.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t-2 border-slate-100 dark:border-slate-900">
                         <Button variant="secondary" onClick={() => setIsPortfolioModalOpen(false)} className="uppercase font-black text-[10px] px-8">Dismiss</Button>
                         <Button 
                            variant="danger" 
                            onClick={() => { 
                                setIsPortfolioModalOpen(false); 
                                setIsCheckoutModalOpen(true); 
                                setCheckoutForm({ amountPaid: selectedGuest ? calculateBalance(selectedGuest.id).toString() : '0', method: 'Cash' });
                            }} 
                            className="uppercase font-black text-[10px] px-8"
                         >
                            Initialize Release (Checkout)
                         </Button>
                    </div>
                </div>
            </Modal>

            {/* MODAL: INFRASTRUCTURE ALLOCATION MATRIX (RESERVATION CONFIRMATION) */}
            <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Operational Manifest Finalization">
                <div className="space-y-8">
                    <div className="p-6 bg-slate-950 text-white rounded-[2rem] border-2 border-slate-800 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-indigo-400">Guest Association Protocol</h4>
                                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Select verified profile or create new entry</p>
                            </div>
                            <Button size="sm" variant="secondary" onClick={() => setIsGuestLookupModalOpen(true)} className="text-[9px] uppercase font-black px-4">Registry Lookup</Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                                <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Manifest Name</p>
                                <p className="text-xs font-black uppercase truncate">{selectedReservation?.guestName}</p>
                            </div>
                            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                                <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Registry Link</p>
                                <p className={`text-xs font-black uppercase ${selectedReservation?.guestId ? 'text-green-500' : 'text-amber-500'}`}>
                                    {selectedReservation?.guestId ? `ID: ${selectedReservation.guestId}` : 'NO PROFILE LINKED'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Target Infrastructure Nodes ({selectedReservation?.roomType})</h4>
                        <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto p-1 custom-scrollbar">
                            {rooms.filter(r => r.type === selectedReservation?.roomType && r.status === RoomStatus.Vacant).map(r => (
                                <button 
                                    key={r.id} 
                                    onClick={() => {
                                        if (selectedReservation) {
                                            updateReservation({ ...selectedReservation, roomAssigned: r.number, status: 'Confirmed' });
                                            setIsAssignModalOpen(false);
                                            addSyncLogEntry(`Reservation #${selectedReservation.id} Finalized: Unit ${r.number} Locked`, 'success');
                                        }
                                    }}
                                    className="p-6 border-2 border-slate-100 dark:border-slate-800 rounded-3xl hover:border-indigo-600 hover:shadow-xl transition-all text-left bg-white dark:bg-slate-950 group"
                                >
                                    <p className="font-black text-3xl uppercase tracking-tighter group-hover:text-indigo-600 leading-none">UNIT {r.number}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase mt-2">Level {r.floor} • Rate: ₦{r.rate.toLocaleString()}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 border-t flex justify-end">
                        <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)} className="uppercase font-black text-[10px] px-8">Abort Protocol</Button>
                    </div>
                </div>
            </Modal>

            {/* MODAL: GUEST REGISTRY LOOKUP */}
            <Modal isOpen={isGuestLookupModalOpen} onClose={() => setIsGuestLookupModalOpen(false)} title="Authoritative Guest Registry Lookup">
                <div className="space-y-6">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Identify profile by legal nomenclature, email, or terminal phone..."
                            value={lookupSearch}
                            onChange={e => setLookupSearch(e.target.value)}
                            className="w-full p-4 bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold uppercase text-xs focus:border-indigo-600 outline-none"
                        />
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {filteredLookup.length > 0 ? filteredLookup.map(guest => (
                            <button 
                                key={guest.id}
                                onClick={() => handleSelectExistingGuest(guest)}
                                className="w-full p-4 flex justify-between items-center bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-600 transition-all group"
                            >
                                <div className="text-left">
                                    <p className="font-black text-sm uppercase group-hover:text-indigo-600 transition-colors">{guest.name}</p>
                                    <p className="text-[10px] font-mono text-slate-400 mt-1">{guest.email} • {guest.phone}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${LOYALTY_TIER_THEME[guest.loyaltyTier].bg} ${LOYALTY_TIER_THEME[guest.loyaltyTier].text}`}>
                                        {guest.loyaltyTier}
                                    </span>
                                    <span className="text-[9px] font-black text-indigo-600 uppercase underline">Select Profile</span>
                                </div>
                            </button>
                        )) : (
                            <div className="py-20 text-center opacity-30">
                                <p className="text-[10px] font-black uppercase tracking-widest">No matching identities found</p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* MODAL: INDUCTION FORM (CHECK-IN) */}
            <Modal isOpen={isCheckInModalOpen} onClose={() => setCheckInModalOpen(false)} title="Operational Identity Induction">
                 <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Profile verification protocol</p>
                        <Button size="sm" variant="secondary" onClick={() => setIsGuestLookupModalOpen(true)} className="text-[9px] font-black uppercase">Lookup Profile</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Legal Nomenclature</label>
                            <input type="text" value={checkInForm.guestName} onChange={e => setCheckInForm({...checkInForm, guestName: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold uppercase text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Terminal Contact (Phone)</label>
                            <input type="tel" value={checkInForm.guestPhone} onChange={e => setCheckInForm({...checkInForm, guestPhone: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-mono text-xs" />
                        </div>
                         <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Identity Protocol (Type)</label>
                            <select value={checkInForm.idType} onChange={e => setCheckInForm({...checkInForm, idType: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-black uppercase text-xs">
                                {ID_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Protocol Serial (ID Number)</label>
                            <input type="text" value={checkInForm.idNumber} onChange={e => setCheckInForm({...checkInForm, idNumber: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Nationality</label>
                            <input type="text" value={checkInForm.nationality} onChange={e => setCheckInForm({...checkInForm, nationality: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold uppercase text-xs" />
                        </div>
                        <div className="col-span-2">
                             <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Physical Residence Registry (Address)</label>
                             <textarea value={checkInForm.address} onChange={e => setCheckInForm({...checkInForm, address: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-medium text-xs h-20" />
                        </div>
                        <div className="col-span-2">
                             <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Residency Node Assigned</label>
                             <div className="p-4 bg-slate-950 text-white rounded-2xl border border-slate-800">
                                <p className="text-[8px] font-black uppercase opacity-60">Confirmed Inventory Reference</p>
                                <p className="text-xl font-black uppercase tracking-tighter">UNIT {rooms.find(r => r.id === checkInForm.roomId)?.number} — {rooms.find(r => r.id === checkInForm.roomId)?.type}</p>
                             </div>
                        </div>
                    </div>
                    <div className="pt-6 border-t flex justify-end gap-3">
                         <Button variant="secondary" onClick={() => setCheckInModalOpen(false)} className="uppercase font-black text-[10px] px-8">Abort</Button>
                         <Button onClick={handleCheckIn} className="uppercase font-black text-[10px] px-12 py-4 shadow-xl">Commit Induction</Button>
                    </div>
                 </div>
            </Modal>

            {/* MODAL: POST CHARGE */}
            <Modal isOpen={isPostChargeModalOpen} onClose={() => setIsPostChargeModalOpen(false)} title="Post Service Outlay">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Service Designation</label>
                        <input type="text" value={chargeForm.description} onChange={e => setChargeForm({...chargeForm, description: e.target.value})} className="w-full p-3 border rounded-xl font-black uppercase text-xs bg-slate-50" placeholder="e.g. MINI BAR REPLENISHMENT" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Valuation (₦)</label>
                        <input type="number" value={chargeForm.amount} onChange={e => setChargeForm({...chargeForm, amount: e.target.value})} className="w-full p-3 border rounded-xl font-mono font-black text-xl bg-slate-50" />
                    </div>
                    <div className="pt-4 border-t flex justify-end gap-2">
                         <Button variant="secondary" onClick={() => setIsPostChargeModalOpen(false)} className="uppercase font-black text-[10px]">Abort</Button>
                         <Button 
                            onClick={() => {
                                if (selectedGuest) {
                                    addTransaction({
                                        guestId: selectedGuest.id,
                                        description: chargeForm.description,
                                        amount: parseFloat(chargeForm.amount) || 0,
                                        date: new Date().toISOString().split('T')[0],
                                        type: 'charge'
                                    });
                                    setChargeForm({ description: '', amount: '' });
                                    setIsPostChargeModalOpen(false);
                                }
                            }} 
                            className="uppercase font-black text-[10px] px-8"
                         >
                            Commit Posting
                         </Button>
                    </div>
                </div>
            </Modal>

            {/* MODAL: CHECKOUT */}
            <Modal isOpen={isCheckoutModalOpen} onClose={() => setIsCheckoutModalOpen(false)} title="Operational Release Cycle">
                <div className="space-y-6">
                    <div className="p-6 bg-red-600 text-white rounded-3xl shadow-xl">
                        <p className="text-[10px] font-black uppercase opacity-60 mb-1">Final Settlement Manifest</p>
                        <h4 className="text-3xl font-black font-mono tracking-tighter">₦{selectedGuest ? calculateBalance(selectedGuest.id).toLocaleString() : 0}</h4>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Settlement Received</label>
                            <input 
                                type="number" 
                                value={checkoutForm.amountPaid} 
                                onChange={e => setCheckoutForm({...checkoutForm, amountPaid: e.target.value})} 
                                className="w-full p-4 border rounded-2xl font-mono font-black text-2xl text-center bg-slate-50 outline-none focus:border-indigo-600" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Payment Protocol</label>
                            <select value={checkoutForm.method} onChange={e => setCheckoutForm({...checkoutForm, method: e.target.value})} className="w-full p-3 border rounded-xl font-black uppercase text-xs bg-slate-50">
                                <option value="Cash">Cash Ledger</option>
                                <option value="Card">Bank Terminal</option>
                                <option value="Transfer">Direct Bank Flow</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 border-t flex justify-end gap-3">
                         <Button variant="secondary" onClick={() => setIsCheckoutModalOpen(false)} className="uppercase font-black text-[10px] px-8">Abort Release</Button>
                         <Button 
                            onClick={() => {
                                if (selectedRoom && selectedGuest) {
                                    const paid = parseFloat(checkoutForm.amountPaid) || 0;
                                    checkOutGuest({
                                        roomId: selectedRoom.id,
                                        guestId: selectedGuest.id,
                                        payment: paid > 0 ? {
                                            description: 'Folio Settlement',
                                            amount: -paid,
                                            date: new Date().toISOString().split('T')[0],
                                            type: 'payment',
                                            paymentMethod: checkoutForm.method,
                                            receiptNumber: `REC-${Date.now().toString().slice(-6)}`
                                        } : undefined
                                    });
                                    setIsCheckoutModalOpen(false);
                                }
                            }} 
                            className="uppercase font-black text-[10px] px-12 py-4 shadow-xl"
                         >
                            Authorize Release
                         </Button>
                    </div>
                </div>
            </Modal>

            {/* RELOCATE MODAL */}
            <Modal isOpen={isMoveModalOpen} onClose={() => setIsMoveModalOpen(false)} title="Unit Relocation Protocol">
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-4">Relocating resident {selectedGuest?.name} from Unit {selectedRoom?.number}</p>
                    <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                        {rooms.filter(r => r.status === RoomStatus.Vacant).map(r => (
                            <button 
                                key={r.id} 
                                onClick={() => handleMoveGuest(r)}
                                className="p-4 border-2 border-slate-100 rounded-2xl hover:border-indigo-600 text-left group transition-all"
                            >
                                <p className="font-black text-xl group-hover:text-indigo-600 uppercase leading-none">Unit {r.number}</p>
                                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{r.type}</p>
                            </button>
                        ))}
                    </div>
                    <div className="pt-4 border-t flex justify-end">
                         <Button variant="secondary" onClick={() => setIsMoveModalOpen(false)} className="uppercase font-black text-[10px]">Cancel Relocation</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

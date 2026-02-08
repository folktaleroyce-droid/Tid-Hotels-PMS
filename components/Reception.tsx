import React, { useState, useMemo } from 'react';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import type { HotelData, Room, Guest, Reservation, BaseEntity, Transaction } from '../types.ts';
import { RoomStatus, LoyaltyTier, PaymentStatus, UserRole } from '../types.ts';
import { ROOM_STATUS_THEME, ID_TYPES, LOYALTY_TIER_THEME } from '../constants.tsx';
import { Invoice } from './invoice/Invoice.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';

const INITIAL_FORM_STATE = {
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    nationality: 'Nigerian',
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

const INITIAL_RES_FORM = {
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    roomType: '',
    ota: 'Direct'
};

interface ReceptionProps {
    hotelData: HotelData;
}

export const Reception: React.FC<ReceptionProps> = ({ hotelData }) => {
    const { 
        rooms, guests, reservations, updateReservation, addReservation, 
        approveReservation, updateRoomStatus, checkInGuest, checkOutGuest, 
        transactions, taxSettings, addSyncLogEntry, roomTypes, moveGuest,
        addTransaction, updateGuestDetails, deleteTransaction
    } = hotelData;
    
    const { currentUser } = useAuth();
    const isManager = currentUser?.role === UserRole.Manager || currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;

    // Modals
    const [isCheckInModalOpen, setCheckInModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isEditDatesModalOpen, setIsEditDatesModalOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isFinalInvoiceModalOpen, setIsFinalInvoiceModalOpen] = useState(false);
    const [isAddResModalOpen, setIsAddResModalOpen] = useState(false);
    const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
    const [isPostChargeModalOpen, setIsPostChargeModalOpen] = useState(false);

    // Selections
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [viewingResId, setViewingResId] = useState<number | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    
    // Forms
    const [checkInForm, setCheckInForm] = useState(INITIAL_FORM_STATE);
    const [resForm, setResForm] = useState(INITIAL_RES_FORM);
    const [checkoutForm, setCheckoutForm] = useState({ amountPaid: '', method: 'Cash' });
    const [chargeForm, setChargeForm] = useState({ description: '', amount: '' });
    const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Confirmed' | 'CheckedIn' | 'CheckedOut'>('All');

    const reservationQueue = useMemo(() => {
        return reservations
            .filter(r => r.status !== 'Cancelled' && r.status !== 'NoShow')
            .filter(r => filterStatus === 'All' || r.status === filterStatus)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [reservations, filterStatus]);

    const calculateBalance = (guestId: number): number => {
        return transactions
            .filter(t => t.guestId === guestId)
            .reduce((acc, t) => acc + t.amount, 0);
    };

    // --- Actions ---

    const handleCheckIn = () => {
        if (!checkInForm.guestName || !checkInForm.roomId) return;
        const room = rooms.find(r => r.id === checkInForm.roomId);
        if (!room) return;

        const newGuest: Omit<Guest, keyof BaseEntity | 'id'> = {
            ...INITIAL_FORM_STATE,
            ...checkInForm,
            arrivalDate: new Date().toISOString().split('T')[0],
            departureDate: selectedReservation?.checkOutDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
            roomNumber: room.number,
            roomType: room.type,
            bookingSource: selectedReservation?.ota || 'Walk-In',
            loyaltyPoints: 0,
            loyaltyTier: LoyaltyTier.Bronze,
        };

        checkInGuest({
            guest: newGuest,
            roomId: room.id,
            charge: { description: `Standard Residency Rate (${room.type})`, amount: room.rate, date: newGuest.arrivalDate, type: 'charge' },
            tax: taxSettings.isEnabled ? { description: `VAT (${taxSettings.rate}%)`, amount: room.rate * (taxSettings.rate / 100), date: newGuest.arrivalDate, type: 'charge' } : undefined,
            reservationId: selectedReservation?.id
        });
        setCheckInModalOpen(false);
        setSelectedReservation(null);
    };

    const handleCheckout = () => {
        if (!selectedRoom || !selectedGuest) return;
        const paid = parseFloat(checkoutForm.amountPaid) || 0;
        const res = reservations.find(r => r.roomAssigned === selectedRoom.number && r.status === 'CheckedIn');

        checkOutGuest({
            roomId: selectedRoom.id,
            guestId: selectedGuest.id,
            reservationId: res?.id,
            payment: paid > 0 ? {
                description: 'Final Folio Settlement',
                amount: -paid,
                date: new Date().toISOString().split('T')[0],
                type: 'payment',
                paymentMethod: checkoutForm.method,
                receiptNumber: `REC-${Date.now().toString().slice(-6)}`
            } : undefined
        });

        setIsCheckoutModalOpen(false);
        setIsPortfolioModalOpen(false);
        setIsFinalInvoiceModalOpen(true);
    };

    const handlePostCharge = () => {
        if (!selectedGuest || !chargeForm.amount) return;
        addTransaction({
            guestId: selectedGuest.id,
            description: chargeForm.description || 'Sundry Charge',
            amount: parseFloat(chargeForm.amount),
            date: new Date().toISOString().split('T')[0],
            type: 'charge'
        });
        addSyncLogEntry(`Folio Updated: ${chargeForm.description} for ${selectedGuest.name}`, 'success');
        setIsPostChargeModalOpen(false);
        setChargeForm({ description: '', amount: '' });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Global Manifest Sidebar */}
            <div className="lg:col-span-1 space-y-4">
                <Card className="h-full flex flex-col">
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600">Unified Manifest</h3>
                            <Button size="sm" className="text-[10px] uppercase font-black px-3" onClick={() => setIsAddResModalOpen(true)}>+ New</Button>
                        </div>
                        <select 
                            value={filterStatus} 
                            onChange={e => setFilterStatus(e.target.value as any)}
                            className="w-full text-[10px] font-black uppercase border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-lg p-2.5 outline-none focus:border-indigo-500 transition-colors"
                        >
                            <option value="All">All Entries</option>
                            <option value="Pending">Pending Approvals</option>
                            <option value="Confirmed">Confirmed Bookings</option>
                            <option value="CheckedIn">In-House Guests</option>
                            <option value="CheckedOut">Past Residents</option>
                        </select>
                    </div>
                    
                    <div className="space-y-2 flex-1 overflow-y-auto pr-1 max-h-[60vh]">
                        {reservationQueue.length > 0 ? reservationQueue.map(res => (
                            <div 
                                key={res.id} 
                                onClick={() => setViewingResId(res.id)}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${viewingResId === res.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${res.status === 'CheckedIn' ? 'bg-blue-100 text-blue-700' : (res.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}`}>
                                        {res.status}
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-400">#{res.id.toString().slice(-4)}</span>
                                </div>
                                <p className="font-black text-xs uppercase text-slate-900 dark:text-white truncate">{res.guestName}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">{res.roomType} | {res.ota}</p>
                                
                                {res.status === 'Confirmed' && (
                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedReservation(res); setIsAssignModalOpen(true); }} className="py-1 text-[8px] font-black uppercase bg-slate-900 text-white rounded">Assign Unit</button>
                                        {res.roomAssigned && (
                                            <button onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setSelectedReservation(res);
                                                const room = rooms.find(rm => rm.number === res.roomAssigned);
                                                setCheckInForm({ ...INITIAL_FORM_STATE, guestName: res.guestName, guestEmail: res.guestEmail, guestPhone: res.guestPhone, roomId: room?.id || 0 });
                                                setCheckInModalOpen(true);
                                            }} className="py-1 text-[8px] font-black uppercase bg-indigo-600 text-white rounded">Check-In</button>
                                        )}
                                    </div>
                                )}

                                {res.status === 'CheckedIn' && (
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        const guest = guests.find(g => g.name === res.guestName);
                                        if (guest) { setSelectedGuest(guest); setIsPortfolioModalOpen(true); }
                                    }} className="w-full mt-3 py-1 text-[8px] font-black uppercase bg-blue-600 text-white rounded">View Portfolio</button>
                                )}
                            </div>
                        )) : (
                            <div className="py-20 text-center opacity-30 border-2 border-dashed rounded-xl">
                                <p className="text-[9px] font-black uppercase">Registry Vacant</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Right: Live Room Matrix with Financial Indicators */}
            <div className="lg:col-span-3">
                <Card title="Operational Command Matrix">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                        {rooms.map(room => {
                            const theme = ROOM_STATUS_THEME[room.status];
                            const guest = room.guestId ? guests.find(g => g.id === room.guestId) : null;
                            const balance = guest ? calculateBalance(guest.id) : 0;
                            
                            return (
                                <div 
                                    key={room.id} 
                                    className={`relative p-4 rounded-2xl border-l-4 shadow-sm group hover:shadow-xl transition-all cursor-pointer ${theme.light} ${theme.dark}`}
                                    style={{ borderLeftColor: theme.fill }}
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-black text-xl uppercase tracking-tighter">{room.number}</h4>
                                        <div className={`w-2 h-2 rounded-full ${room.status === RoomStatus.Occupied ? 'bg-blue-500 shadow-[0_0_8px_blue]' : 'bg-green-500'}`}></div>
                                    </div>
                                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mt-1">{room.type}</p>
                                    
                                    {guest && (
                                        <div className="mt-4 pt-3 border-t border-slate-200/50">
                                            <p className="text-[10px] font-black uppercase truncate text-slate-900 dark:text-white">{guest.name}</p>
                                            <p className={`text-[11px] font-black font-mono mt-1 ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                ₦{balance.toLocaleString()}
                                            </p>
                                            
                                            <div className="grid grid-cols-2 gap-1.5 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedGuest(guest); setSelectedRoom(room); setIsPortfolioModalOpen(true); }} className="text-[7px] font-black uppercase bg-white/80 py-1.5 rounded-lg border hover:bg-white shadow-sm">Portfolio</button>
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedRoom(room); setSelectedGuest(guest); setIsCheckoutModalOpen(true); setCheckoutForm({ amountPaid: balance.toString(), method: 'Cash' }); }} className="text-[7px] font-black uppercase bg-indigo-600 text-white py-1.5 rounded-lg shadow-md">Check-Out</button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {!guest && (
                                        <div className="mt-8">
                                            <p className="text-[8px] font-black uppercase text-slate-400">Inventory Status</p>
                                            <p className="text-[10px] font-bold uppercase">{room.housekeepingStatus} / Vacant</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

            {/* --- Modals --- */}

            {/* Guest Portfolio / account Modal */}
            <Modal isOpen={isPortfolioModalOpen} onClose={() => setIsPortfolioModalOpen(false)} title={`Guest Portfolio: ${selectedGuest?.name}`}>
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[8px] font-black uppercase text-slate-400">Resident Unit</p>
                            <p className="text-sm font-black text-indigo-600">Unit {selectedGuest?.roomNumber}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-[8px] font-black uppercase text-slate-400">Induction Date</p>
                            <p className="text-sm font-black">{selectedGuest?.arrivalDate}</p>
                        </div>
                        <div className="p-3 bg-slate-900 text-white rounded-xl border border-slate-700 text-right">
                            <p className="text-[8px] font-black uppercase opacity-60">Gross Portfolio Due</p>
                            <p className="text-sm font-black text-green-400 font-mono">₦{selectedGuest ? calculateBalance(selectedGuest.id).toLocaleString() : 0}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-end border-b border-indigo-100 dark:border-indigo-900 pb-2">
                            <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Transaction Chronicle</h4>
                            <Button size="sm" className="text-[8px] uppercase font-black py-1 px-3" onClick={() => setIsPostChargeModalOpen(true)}>+ Post Charge</Button>
                        </div>
                        <div className="max-h-60 overflow-y-auto pr-2">
                            <table className="w-full text-left text-[10px]">
                                <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 border-b">
                                    <tr>
                                        <th className="p-2 font-black uppercase text-slate-500">Timeline</th>
                                        <th className="p-2 font-black uppercase text-slate-500">Designation</th>
                                        <th className="p-2 font-black uppercase text-slate-500 text-right">Value (₦)</th>
                                        {isManager && <th className="p-2 font-black uppercase text-slate-500 text-right">Revoke</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedGuest && transactions.filter(t => t.guestId === selectedGuest.id).map(t => (
                                        <tr key={t.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="p-2 font-mono text-slate-400">{t.date}</td>
                                            <td className="p-2 font-bold uppercase">{t.description}</td>
                                            <td className={`p-2 text-right font-black font-mono ${t.amount < 0 ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
                                                {t.amount.toLocaleString()}
                                            </td>
                                            {isManager && <td className="p-2 text-right"><button onClick={() => deleteTransaction(t.id)} className="text-red-500 hover:underline">Revoke</button></td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsPortfolioModalOpen(false)}>Dismiss</Button>
                        <Button onClick={() => { setIsFinalInvoiceModalOpen(true); }}>Generate Consolidated Statement</Button>
                    </div>
                </div>
            </Modal>

            {/* Manual Charge posting Modal */}
            <Modal isOpen={isPostChargeModalOpen} onClose={() => setIsPostChargeModalOpen(false)} title="Folio Entry Authority">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Commodity / Service Designation</label>
                        <input type="text" value={chargeForm.description} onChange={e => setChargeForm({...chargeForm, description: e.target.value})} className="w-full p-2 border rounded font-black uppercase text-xs" placeholder="e.g. Extra Bed, Laundry, Mini Bar" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Operational Valuation (₦)</label>
                        <input type="number" value={chargeForm.amount} onChange={e => setChargeForm({...chargeForm, amount: e.target.value})} className="w-full p-3 border rounded font-mono font-black text-xl" />
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsPostChargeModalOpen(false)}>Abort</Button>
                        <Button onClick={handlePostCharge}>Commit Charge</Button>
                    </div>
                </div>
            </Modal>

            {/* Check-Out Settlement Modal */}
            <Modal isOpen={isCheckoutModalOpen} onClose={() => setIsCheckoutModalOpen(false)} title={`Final Settlement: Unit ${selectedRoom?.number}`}>
                <div className="space-y-4">
                    <div className="p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border-2 border-indigo-100 dark:border-indigo-800">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase text-slate-500">Gross Portfolio Balance</span>
                            <span className="text-3xl font-black text-indigo-600 font-mono tracking-tighter">₦{selectedGuest ? calculateBalance(selectedGuest.id).toLocaleString() : 0}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Settlement Received</label>
                            <input type="number" value={checkoutForm.amountPaid} onChange={e => setCheckoutForm({...checkoutForm, amountPaid: e.target.value})} className="w-full p-3 border rounded-xl font-mono font-black text-xl" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Payment protocol</label>
                            <select value={checkoutForm.method} onChange={e => setCheckoutForm({...checkoutForm, method: e.target.value})} className="w-full p-3 border rounded-xl font-black text-xs uppercase bg-white">
                                <option value="Cash">Cash</option>
                                <option value="Card">Electronic Card</option>
                                <option value="Bank Transfer">Wire Transfer</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-6 border-t flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsCheckoutModalOpen(false)}>Abort</Button>
                        <Button onClick={handleCheckout} className="py-3 px-8 font-black uppercase">Commit Settlement & Release Unit</Button>
                    </div>
                </div>
            </Modal>

            {/* Final Invoice (Statement) */}
            {selectedGuest && (
                <Modal isOpen={isFinalInvoiceModalOpen} onClose={() => setIsFinalInvoiceModalOpen(false)} title="Operational Revenue Statement">
                    <Invoice 
                        guest={selectedGuest} 
                        transactions={transactions.filter(t => t.guestId === selectedGuest.id)}
                        taxSettings={taxSettings}
                    />
                </Modal>
            )}

            {/* Manual Manifest Entry Modal */}
            <Modal isOpen={isAddResModalOpen} onClose={() => setIsAddResModalOpen(false)} title="Manual Manifest Entry">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Guest Nomenclature</label>
                            <input type="text" value={resForm.guestName} onChange={e => setResForm({...resForm, guestName: e.target.value})} className="w-full p-2 border rounded font-bold uppercase text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Inbound Date</label>
                            <input type="date" value={resForm.checkInDate} onChange={e => setResForm({...resForm, checkInDate: e.target.value})} className="w-full p-2 border rounded text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Outbound Date</label>
                            <input type="date" value={resForm.checkOutDate} onChange={e => setResForm({...resForm, checkOutDate: e.target.value})} className="w-full p-2 border rounded text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Category Registry</label>
                            <select value={resForm.roomType} onChange={e => setResForm({...resForm, roomType: e.target.value})} className="w-full p-2 border rounded text-xs font-black uppercase">
                                <option value="">Select category</option>
                                {roomTypes.map(rt => <option key={rt.id} value={rt.name}>{rt.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Revenue Source</label>
                            <select value={resForm.ota} onChange={e => setResForm({...resForm, ota: e.target.value})} className="w-full p-2 border rounded text-xs font-black uppercase">
                                <option value="Direct">Direct/Walk-In</option>
                                <option value="Booking.com">Booking.com</option>
                                <option value="Expedia">Expedia</option>
                                <option value="Corporate">Corporate Hub</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-2 border-t">
                        <Button variant="secondary" onClick={() => setIsAddResModalOpen(false)}>Abort</Button>
                        <Button onClick={() => { addReservation(resForm as any); setIsAddResModalOpen(false); setResForm(INITIAL_RES_FORM); }}>Authorize Entry</Button>
                    </div>
                </div>
            </Modal>

            {/* Check-In identity verification Modal */}
            <Modal isOpen={isCheckInModalOpen} onClose={() => setCheckInModalOpen(false)} title="Identity Induction">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black uppercase mb-1 ml-1 text-slate-400">Legal Name Confirmation</label>
                            <input type="text" value={checkInForm.guestName} onChange={e => setCheckInForm({...checkInForm, guestName: e.target.value})} className="w-full p-2 border rounded font-bold uppercase text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase mb-1 ml-1 text-slate-400">ID protocol</label>
                            <select value={checkInForm.idType} onChange={e => setCheckInForm({...checkInForm, idType: e.target.value})} className="w-full p-2 border rounded text-xs font-black uppercase">
                                <option value="">Select ID Type</option>
                                {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase mb-1 ml-1 text-slate-400">Serial Reference #</label>
                            <input type="text" value={checkInForm.idNumber} onChange={e => setCheckInForm({...checkInForm, idNumber: e.target.value})} className="w-full p-2 border rounded font-mono text-xs font-black" />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-2 border-t">
                        <Button variant="secondary" onClick={() => setCheckInModalOpen(false)}>Abort</Button>
                        <Button onClick={handleCheckIn}>Finalize Induction</Button>
                    </div>
                </div>
            </Modal>

            {/* Room Assignment Modal */}
            <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Infrastructure Allocation">
                <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
                    {rooms.filter(r => r.type === selectedReservation?.roomType && r.status === RoomStatus.Vacant).map(r => (
                        <button 
                            key={r.id} 
                            onClick={() => {
                                if (selectedReservation) {
                                    updateReservation({ ...selectedReservation, roomAssigned: r.number, status: 'Confirmed' });
                                    setIsAssignModalOpen(false);
                                }
                            }}
                            className="p-4 border-2 rounded-xl hover:border-indigo-600 transition-all text-left bg-white dark:bg-slate-800 group"
                        >
                            <p className="font-black text-lg uppercase leading-none group-hover:text-indigo-600">Unit {r.number}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest">Floor {r.floor}</p>
                        </button>
                    ))}
                    {rooms.filter(r => r.type === selectedReservation?.roomType && r.status === RoomStatus.Vacant).length === 0 && (
                        <p className="col-span-2 text-center py-10 text-[10px] font-black uppercase text-slate-400 italic">Inventory Depleted: No vacant units in this category</p>
                    )}
                </div>
            </Modal>
        </div>
    );
};
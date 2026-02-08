
import React, { useState, useMemo } from 'react';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import type { HotelData, Room, Guest, Reservation, BaseEntity, Transaction } from '../types.ts';
import { RoomStatus, LoyaltyTier, UserRole, PaymentStatus } from '../types.ts';
import { ROOM_STATUS_THEME, ID_TYPES, LOYALTY_TIER_THEME } from '../constants.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useHotelData } from '../hooks/useHotelData.ts';
import { Invoice } from './invoice/Invoice.tsx';
import { PrintableGuestDetails } from './common/PrintableGuestDetails.tsx';

const INITIAL_CHECKIN_STATE = {
    guestName: '', guestEmail: '', guestPhone: '', nationality: 'Nigerian',
    idType: 'International Passport', idNumber: '', address: '', adults: 1,
    roomId: '', roomRate: 0, discount: '', currency: 'NGN' as 'NGN' | 'USD'
};

export const Reception: React.FC = () => {
    const { 
        rooms, guests, reservations, updateReservation, addReservation,
        checkInGuest, checkOutGuest, transactions, taxSettings,
        addSyncLogEntry, logAudit, roomTypes, propertyInfo
    } = useHotelData();
    
    const { currentUser } = useAuth();
    const brandColor = propertyInfo.brandColor || 'indigo';
    const colorMap: Record<string, string> = {
        indigo: '#4f46e5', emerald: '#10b981', rose: '#e11d48', amber: '#f59e0b', sky: '#0ea5e9', slate: '#334155'
    };
    const accent = colorMap[brandColor];

    // Modals
    const [isCheckInModalOpen, setCheckInModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isRegFormModalOpen, setIsRegFormModalOpen] = useState(false);

    // Selections
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    
    // Forms
    const [checkInForm, setCheckInForm] = useState(INITIAL_CHECKIN_STATE);
    const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Confirmed'>('All');

    // 1. Authoritative Queue filtered from live Firestore stream
    const liveQueue = useMemo(() => {
        return reservations
            .filter(r => r.status !== 'CheckedIn' && r.status !== 'CheckedOut' && r.status !== 'Cancelled')
            .filter(r => filterStatus === 'All' || r.status === filterStatus);
    }, [reservations, filterStatus]);

    const calculateBalance = (guestId: any): number => {
        return transactions
            .filter(t => t.guestId === guestId)
            .reduce((acc, t) => acc + t.amount, 0);
    };

    const handleOpenPortfolio = (room: Room) => {
        const guest = guests.find(g => g.id === room.guestId);
        if (guest) {
            setSelectedGuest(guest);
            setSelectedRoom(room);
            setIsPortfolioModalOpen(true);
        }
    };

    const handleStartInduction = (res?: Reservation, room?: Room) => {
        if (res) {
            setSelectedReservation(res);
            setCheckInForm({
                ...INITIAL_CHECKIN_STATE,
                guestName: res.guestName,
                guestEmail: res.guestEmail,
                guestPhone: res.guestPhone,
                roomId: room?.id?.toString() || ''
            });
        } else if (room) {
            setCheckInForm({ ...INITIAL_CHECKIN_STATE, roomId: room.id.toString() });
        }
        setCheckInModalOpen(true);
    };

    const commitCheckIn = () => {
        if (!checkInForm.guestName || !checkInForm.roomId) {
            alert("Logical Error: Guest Nomenclature and Unit ID required.");
            return;
        }
        const room = rooms.find(r => r.id.toString() === checkInForm.roomId);
        if (!room) return;

        checkInGuest({
            guest: { 
                ...checkInForm, 
                arrivalDate: new Date().toISOString().split('T')[0],
                departureDate: selectedReservation?.checkOutDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
                roomNumber: room.number,
                roomType: room.type,
                bookingSource: selectedReservation?.ota || 'Walk-In',
                loyaltyPoints: 0,
                loyaltyTier: LoyaltyTier.Bronze,
                currency: checkInForm.currency
            } as any,
            roomId: room.id,
            charge: { 
                description: `Standard Induction: Unit ${room.number}`, 
                amount: room.rate, 
                date: new Date().toISOString().split('T')[0], 
                type: 'charge' 
            },
            reservationId: selectedReservation?.id as any
        });

        setCheckInModalOpen(false);
        setCheckInForm(INITIAL_CHECKIN_STATE);
        setSelectedReservation(null);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in-right">
            {/* RESERVATION QUEUE: LIVE FROM CLOUD */}
            <div className="lg:col-span-1 space-y-4">
                <Card className="h-[calc(100vh-10rem)] flex flex-col border-t-4" style={{ borderTopColor: accent }}>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: accent }}>Cloud Manifest</h3>
                            <p className="text-[14px] font-black uppercase text-slate-900 dark:text-white">Induction Queue</p>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button onClick={() => setFilterStatus('All')} className={`px-2 py-1 text-[8px] font-black uppercase rounded ${filterStatus === 'All' ? 'bg-white dark:bg-slate-700 shadow text-slate-900' : 'text-slate-400'}`}>All</button>
                            <button onClick={() => setFilterStatus('Pending')} className={`px-2 py-1 text-[8px] font-black uppercase rounded ${filterStatus === 'Pending' ? 'bg-white dark:bg-slate-700 shadow text-slate-900' : 'text-slate-400'}`}>WL</button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                        {liveQueue.map(res => (
                            <div key={res.id} className="p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-all bg-white dark:bg-slate-900 group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${res.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {res.status}
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-400">ID: {res.id.toString().slice(-4)}</span>
                                </div>
                                <h4 className="font-black text-sm uppercase truncate leading-none mb-1">{res.guestName}</h4>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">{res.roomType} • {res.ota}</p>
                                <div className="mt-4 flex gap-2">
                                    <button 
                                        onClick={() => handleStartInduction(res, rooms.find(r => r.number === res.roomAssigned))}
                                        className="flex-1 py-2 text-[8px] font-black uppercase text-white rounded-lg transition-transform active:scale-95" 
                                        style={{ backgroundColor: accent }}
                                    > Induction </button>
                                    <button className="px-3 py-2 text-[8px] font-black uppercase bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">Dates</button>
                                </div>
                            </div>
                        ))}
                        {liveQueue.length === 0 && (
                            <div className="py-20 text-center opacity-20 italic text-xs uppercase font-black">Syncing Manifest...</div>
                        )}
                    </div>
                </Card>
            </div>

            {/* LIVE INFRASTRUCTURE GRID */}
            <div className="lg:col-span-3">
                <Card title="Ecosystem Asset Matrix" className="h-[calc(100vh-10rem)] flex flex-col">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                        {rooms.map(room => {
                            const guest = room.guestId ? guests.find(g => g.id === room.guestId) : null;
                            const balance = guest ? calculateBalance(guest.id) : 0;
                            const isOccupied = room.status === RoomStatus.Occupied;

                            return (
                                <div 
                                    key={room.id} 
                                    onClick={() => isOccupied ? handleOpenPortfolio(room) : handleStartInduction(undefined, room)}
                                    className={`relative p-5 rounded-3xl border-2 transition-all cursor-pointer group active:scale-95 ${isOccupied ? 'bg-slate-900 text-white border-transparent' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-500'}`}
                                    style={isOccupied ? { boxShadow: `0 20px 25px -5px ${accent}20` } : {}}
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-black text-2xl uppercase tracking-tighter leading-none">{room.number}</h4>
                                        <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 ${isOccupied ? 'animate-pulse' : 'bg-green-500'}`} style={isOccupied ? { backgroundColor: accent } : {}}></div>
                                    </div>
                                    <p className={`text-[9px] font-black uppercase mt-2 ${isOccupied ? 'text-slate-400' : 'text-slate-400'}`}>{room.type}</p>
                                    
                                    {guest && (
                                        <div className="mt-8 pt-4 border-t border-white/10">
                                            <p className="text-[11px] font-black uppercase truncate mb-1">{guest.name}</p>
                                            <p className={`text-xs font-black font-mono ${balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                ₦{balance.toLocaleString()}
                                            </p>
                                        </div>
                                    )}

                                    {!guest && (
                                        <div className="mt-8 pt-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                             <span className="text-[8px] font-black uppercase py-1 px-2 bg-indigo-600 text-white rounded">Induct Guest</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

            {/* MODAL: RESIDENT PORTFOLIO COMMAND CENTER */}
            <Modal isOpen={isPortfolioModalOpen} onClose={() => setIsPortfolioModalOpen(false)} title={`Resident Portfolio: ${selectedGuest?.name}`}>
                <div className="space-y-8 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="p-4 border-l-4" style={{ borderColor: accent }}>
                            <p className="text-[9px] font-black uppercase text-slate-400">Operational Node</p>
                            <p className="text-xl font-black uppercase">UNIT {selectedRoom?.number}</p>
                        </Card>
                        <Card className="p-4 text-center">
                            <p className="text-[9px] font-black uppercase text-slate-400">Timeline</p>
                            <p className="text-sm font-black uppercase">{selectedGuest?.arrivalDate} TO {selectedGuest?.departureDate}</p>
                        </Card>
                        <Card className="p-4 bg-slate-900 text-white border-0 text-right md:col-span-2">
                            <p className="text-[9px] font-black uppercase text-slate-500">Gross Outstanding</p>
                            <p className="text-3xl font-black font-mono text-green-500 tracking-tighter">₦{selectedGuest ? calculateBalance(selectedGuest.id).toLocaleString() : 0}</p>
                        </Card>
                    </div>

                    {/* Authoritative Document Vault */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-[0.2em]">Authoritative Document Vault</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button onClick={() => setIsInvoiceModalOpen(true)} className="flex flex-col items-center p-4 bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-600 transition-all">
                                <svg className="w-6 h-6 mb-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                <span className="text-[9px] font-black uppercase">Tax Invoice</span>
                            </button>
                            <button onClick={() => setIsRegFormModalOpen(true)} className="flex flex-col items-center p-4 bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-600 transition-all">
                                <svg className="w-6 h-6 mb-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                <span className="text-[9px] font-black uppercase">Reg Form</span>
                            </button>
                            <button className="flex flex-col items-center p-4 bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-600 transition-all opacity-40">
                                <svg className="w-6 h-6 mb-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 016-6h4a6 6 0 016 6z"/></svg>
                                <span className="text-[9px] font-black uppercase">Access Card</span>
                            </button>
                        </div>
                    </div>

                    {/* Fiscal Log */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Fiscal Ledger</h4>
                             <Button size="sm" variant="secondary" className="text-[9px] uppercase font-black">+ Post Charge</Button>
                        </div>
                        <div className="overflow-x-auto border-2 border-slate-100 dark:border-slate-800 rounded-3xl">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-950 border-b">
                                    <tr>
                                        <th className="p-4 text-[10px] font-black uppercase">Timeline</th>
                                        <th className="p-4 text-[10px] font-black uppercase">Service Designation</th>
                                        <th className="p-4 text-[10px] font-black uppercase text-right">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedGuest && transactions.filter(t => t.guestId === selectedGuest.id).map(t => (
                                        <tr key={t.id} className="border-b border-slate-50 dark:border-slate-900 text-xs">
                                            <td className="p-4 font-mono text-slate-400">{t.date}</td>
                                            <td className="p-4 font-black uppercase">{t.description}</td>
                                            <td className={`p-4 text-right font-black font-mono ${t.amount < 0 ? 'text-green-500' : ''}`}>₦{t.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="pt-8 flex justify-end gap-3 border-t">
                        <Button variant="secondary" onClick={() => setIsPortfolioModalOpen(false)} className="uppercase font-black text-[10px] px-8">Dismiss</Button>
                        <Button variant="danger" className="uppercase font-black text-[10px] px-12 py-3 shadow-xl shadow-red-600/20">Initialize Release Cycle</Button>
                    </div>
                </div>
            </Modal>

            {/* SUB-MODALS FOR DOCUMENTS */}
            {selectedGuest && (
                <>
                    <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Operational Invoice Preview">
                         <Invoice guest={selectedGuest} transactions={transactions.filter(t => t.guestId === selectedGuest.id)} taxSettings={taxSettings} />
                    </Modal>
                    <Modal isOpen={isRegFormModalOpen} onClose={() => setIsRegFormModalOpen(false)} title="Residency Protocol Registry">
                         <PrintableGuestDetails guest={selectedGuest} />
                    </Modal>
                </>
            )}

            {/* MODAL: INDUCTION FORM */}
            <Modal isOpen={isCheckInModalOpen} onClose={() => setCheckInModalOpen(false)} title="Identity Induction Manifest">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Legal Nomenclature</label>
                            <input type="text" value={checkInForm.guestName} onChange={e => setCheckInForm({...checkInForm, guestName: e.target.value})} className="w-full p-4 border-2 rounded-2xl font-black uppercase text-sm" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Terminal Contact</label>
                            <input type="tel" value={checkInForm.guestPhone} onChange={e => setCheckInForm({...checkInForm, guestPhone: e.target.value})} className="w-full p-4 border-2 rounded-2xl font-mono text-sm" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Residency Node Selection</label>
                            <select value={checkInForm.roomId} onChange={e => setCheckInForm({...checkInForm, roomId: e.target.value})} className="w-full p-4 border-2 rounded-2xl font-black uppercase text-xs">
                                <option value="">Select Unit</option>
                                {rooms.filter(r => r.status === RoomStatus.Vacant).map(r => <option key={r.id} value={r.id}>Unit {r.number} ({r.type})</option>)}
                            </select>
                        </div>
                        <div className="col-span-2 p-6 bg-slate-950 text-white rounded-[2rem] border-2 border-slate-800 text-center">
                            <p className="text-[10px] font-black uppercase text-indigo-400 mb-2 tracking-widest">Calculated Induction Fee</p>
                            <h4 className="text-4xl font-black font-mono tracking-tighter">
                                ₦{(rooms.find(r => r.id.toString() === checkInForm.roomId)?.rate || 0).toLocaleString()}
                            </h4>
                        </div>
                    </div>
                    <div className="pt-6 flex justify-end gap-3 border-t">
                        <Button variant="secondary" onClick={() => setCheckInModalOpen(false)} className="uppercase font-black text-[10px] px-8">Abort</Button>
                        <Button onClick={commitCheckIn} className="uppercase font-black text-[10px] px-12 py-4 shadow-2xl" style={{ backgroundColor: accent }}>Authorize Induction</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

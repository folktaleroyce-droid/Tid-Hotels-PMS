import React, { useState, useMemo } from 'react';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import { useHotelData } from '../hooks/useHotelData.ts';
import { WALK_IN_SERVICES, PAYMENT_METHODS } from '../constants.tsx';
import type { WalkInTransaction, Room, Guest } from '../types.ts';
import { RoomStatus } from '../types.ts';
import { PrintableWalkInReceipt } from './common/PrintableWalkInReceipt.tsx';

declare const XLSX: any;

const INITIAL_FORM_STATE = {
    guestType: 'Walk-In' as 'Walk-In' | 'In-House',
    selectedRoomId: 0,
    service: WALK_IN_SERVICES[0],
    serviceDetails: '',
    amount: '',
    discount: '',
    amountPaid: '',
    paymentMethod: PAYMENT_METHODS[0] as WalkInTransaction['paymentMethod'],
    currency: 'NGN' as 'NGN' | 'USD'
};

export const WalkIn: React.FC = () => {
    const { walkInTransactions, addWalkInTransaction, taxSettings, rooms, guests, addTransaction, addSyncLogEntry } = useHotelData();
    const [formState, setFormState] = useState(INITIAL_FORM_STATE);
    const [errors, setErrors] = useState({ amount: '', discount: '', serviceDetails: '', amountPaid: '', room: '' });
    const [isReceiptModalOpen, setReceiptModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<WalkInTransaction | null>(null);
    
    const occupiedRooms = useMemo(() => rooms.filter(r => r.status === RoomStatus.Occupied && r.guestId), [rooms]);

    const { taxAmount, amountDue, balance } = useMemo(() => {
        const subtotal = parseFloat(formState.amount) || 0;
        const discount = parseFloat(formState.discount) || 0;
        const paid = formState.guestType === 'In-House' ? 0 : (parseFloat(formState.amountPaid) || 0);
        
        const taxableAmount = subtotal - discount;
        const tax = (taxSettings.isEnabled && taxSettings.rate > 0 && taxableAmount > 0) 
            ? taxableAmount * (taxSettings.rate / 100) 
            : 0;

        const due = Math.max(0, taxableAmount + tax);
        const bal = due - paid;
        return { taxAmount: tax, amountDue: due, balance: bal };
    }, [formState.amount, formState.discount, formState.amountPaid, formState.guestType, taxSettings]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const newErrors = { amount: '', discount: '', serviceDetails: '', amountPaid: '', room: '' };
        const amount = parseFloat(formState.amount);
        const discount = parseFloat(formState.discount) || 0;
        const amountPaid = parseFloat(formState.amountPaid);

        if (isNaN(amount) || amount <= 0) {
            newErrors.amount = 'Invalid Amount';
        }
        if (isNaN(discount) || discount < 0) {
            newErrors.discount = 'Invalid Discount';
        }
        if (discount > amount) {
            newErrors.discount = 'Exceeds Subtotal';
        }
        if (formState.service === 'Other' && !formState.serviceDetails.trim()) {
            newErrors.serviceDetails = 'Required';
        }
        
        if (formState.guestType === 'Walk-In') {
            if (isNaN(amountPaid) || amountPaid < 0) {
                newErrors.amountPaid = 'Invalid Amount';
            }
        } else {
            if (!formState.selectedRoomId) {
                newErrors.room = 'Select Room';
            }
        }

        setErrors(newErrors);
        return !newErrors.amount && !newErrors.discount && !newErrors.serviceDetails && !newErrors.amountPaid && !newErrors.room;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            if (formState.guestType === 'In-House') {
                const room = rooms.find(r => r.id === parseInt(formState.selectedRoomId as any));
                if (room?.guestId) {
                    addTransaction({
                        guestId: room.guestId,
                        description: `${formState.service}: ${formState.serviceDetails || 'Consumables'}`,
                        amount: amountDue,
                        date: new Date().toISOString().split('T')[0],
                        type: 'charge'
                    });
                    addSyncLogEntry(`Service charged to Folio: Unit ${room.number}`, 'success');
                }
            } else {
                addWalkInTransaction({
                    ...formState,
                    amount: parseFloat(formState.amount),
                    discount: parseFloat(formState.discount) || 0,
                    tax: taxAmount,
                    amountPaid: parseFloat(formState.amountPaid) || 0,
                } as any);
                addSyncLogEntry(`Walk-in settlement recorded`, 'success');
            }
            setFormState(INITIAL_FORM_STATE);
        }
    };
    
    const handlePrintReceipt = (transaction: WalkInTransaction) => {
        setSelectedTransaction(transaction);
        setReceiptModalOpen(true);
    };
    
    const handleExportExcel = () => {
        const wsData = [
            ["Date", "Service", "Service Details", "Subtotal", "Discount", "Tax", "Amount Paid", "Balance", "Currency", "Payment Method"],
            ...walkInTransactions.map(t => {
                const amountDue = t.amount - t.discount + t.tax;
                const balance = amountDue - t.amountPaid;
                return [
                    t.date, 
                    t.service,
                    t.serviceDetails || '',
                    t.amount,
                    t.discount,
                    t.tax,
                    t.amountPaid,
                    balance,
                    t.currency,
                    t.paymentMethod
                ]
            })
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [ { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Walk-in History");
        XLSX.writeFile(wb, "Tide_Walk_In_Log.xlsx");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <Card title="Revenue Point of Sale">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mb-4 border border-slate-200 dark:border-slate-800">
                            <button 
                                type="button"
                                onClick={() => setFormState({...formState, guestType: 'Walk-In'})} 
                                className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${formState.guestType === 'Walk-In' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}
                            >
                                External Walk-In
                            </button>
                            <button 
                                type="button"
                                onClick={() => setFormState({...formState, guestType: 'In-House'})} 
                                className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${formState.guestType === 'In-House' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500'}`}
                            >
                                In-House Resident
                            </button>
                        </div>

                        {formState.guestType === 'In-House' && (
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Resident Unit Selection</label>
                                <select
                                    name="selectedRoomId"
                                    value={formState.selectedRoomId}
                                    onChange={handleFormChange}
                                    className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-bold uppercase text-xs"
                                >
                                    <option value="0">Select Active Unit</option>
                                    {occupiedRooms.map(room => (
                                        <option key={room.id} value={room.id}>Unit {room.number} — {guests.find(g => g.id === room.guestId)?.name}</option>
                                    ))}
                                </select>
                                {errors.room && <p className="text-red-500 text-[9px] font-black mt-1 uppercase">{errors.room}</p>}
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Service category</label>
                            <select
                                name="service"
                                value={formState.service}
                                onChange={handleFormChange}
                                className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-bold uppercase text-xs"
                            >
                                {WALK_IN_SERVICES.map(service => <option key={service} value={service}>{service}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Specific Item/Notes</label>
                            <input
                                type="text"
                                name="serviceDetails"
                                value={formState.serviceDetails}
                                onChange={handleFormChange}
                                className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-bold uppercase text-xs"
                                placeholder="Details..."
                            />
                            {errors.serviceDetails && <p className="text-red-500 text-[9px] font-black mt-1 uppercase">{errors.serviceDetails}</p>}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Gross Base Value</label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formState.amount}
                                    onChange={handleFormChange}
                                    className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-mono font-bold text-xs"
                                />
                                {errors.amount && <p className="text-red-500 text-[9px] font-black mt-1 uppercase">{errors.amount}</p>}
                             </div>
                             <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Rebate/Discount</label>
                                <input
                                    type="number"
                                    name="discount"
                                    value={formState.discount}
                                    onChange={handleFormChange}
                                    className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-mono font-bold text-xs"
                                />
                                {errors.discount && <p className="text-red-500 text-[9px] font-black mt-1 uppercase">{errors.discount}</p>}
                             </div>
                        </div>

                        {formState.guestType === 'Walk-In' && (
                            <>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Settlement Received</label>
                                    <input
                                        type="number"
                                        name="amountPaid"
                                        value={formState.amountPaid}
                                        onChange={handleFormChange}
                                        className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-mono font-bold text-xs"
                                    />
                                    {errors.amountPaid && <p className="text-red-500 text-[9px] font-black mt-1 uppercase">{errors.amountPaid}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Payment Protocol</label>
                                    <select
                                        name="paymentMethod"
                                        value={formState.paymentMethod}
                                        onChange={handleFormChange}
                                        className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-bold uppercase text-xs"
                                    >
                                        {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                                    </select>
                                </div>
                            </>
                        )}
                        
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Operating Currency</label>
                             <select
                                name="currency"
                                value={formState.currency}
                                onChange={handleFormChange}
                                className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-black uppercase text-xs"
                             >
                                <option value="NGN">NGN (₦)</option>
                                <option value="USD">USD ($)</option>
                             </select>
                        </div>

                        <div className="p-3 space-y-2 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                <span className="text-slate-500">Statutory Levy ({taxSettings.rate}%):</span>
                                <span className="text-slate-800 dark:text-slate-200">
                                    {formState.currency === 'NGN' ? '₦' : '$'}{taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                <span className="text-slate-500">Net Valuation: </span>
                                <span className="text-slate-900 dark:text-white">
                                    {formState.currency === 'NGN' ? '₦' : '$'}{amountDue.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </span>
                            </div>
                            {formState.guestType === 'Walk-In' && (
                                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <span className="text-[10px] font-black uppercase text-indigo-500">Residual Balance: </span>
                                    <span className={`text-xl font-black font-mono ${balance < 0 ? 'text-green-500' : (balance > 0 ? 'text-red-500' : 'text-slate-800 dark:text-slate-200')}`}>
                                        {formState.currency === 'NGN' ? '₦' : '$'}{balance.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </span>
                                </div>
                            )}
                            {formState.guestType === 'In-House' && (
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-center">
                                    <span className="text-[9px] font-black uppercase text-indigo-500 animate-pulse">Bill to Resident Folio</span>
                                </div>
                            )}
                        </div>
                        
                        <Button type="submit" className="w-full uppercase font-black text-xs py-3">
                            {formState.guestType === 'In-House' ? 'Post to Resident Folio' : 'Commit Walk-In Sale'}
                        </Button>
                    </form>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Card>
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-black uppercase tracking-tighter">Sale Chronology (External)</h3>
                        <Button variant="secondary" onClick={handleExportExcel} disabled={walkInTransactions.length === 0} className="text-[10px] font-black uppercase">Export Manifest</Button>
                    </div>
                    <div className="overflow-x-auto max-h-[calc(100vh-16rem)]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-200 dark:bg-slate-700 sticky top-0 border-b">
                                <tr>
                                    <th className="p-3 text-xs font-black uppercase">Timeline</th>
                                    <th className="p-3 text-xs font-black uppercase">Commodity</th>
                                    <th className="p-3 text-xs font-black uppercase text-right">Base</th>
                                    <th className="p-3 text-xs font-black uppercase text-right">Settled</th>
                                    <th className="p-3 text-xs font-black uppercase text-right">Balance</th>
                                    <th className="p-3 text-xs font-black uppercase text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {walkInTransactions.length > 0 ? walkInTransactions.map((t, index) => {
                                    const amountDue = t.amount - t.discount + t.tax;
                                    const balance = amountDue - t.amountPaid;
                                    const currencySymbol = t.currency === 'NGN' ? '₦' : '$';
                                    return (
                                        <tr key={t.id} className={`border-b border-slate-200 dark:border-slate-700 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                                            <td className="p-3 text-xs font-mono text-slate-500">{t.date}</td>
                                            <td className="p-3 text-xs font-bold uppercase">{t.service === 'Other' ? t.serviceDetails : t.service}</td>
                                            <td className="p-3 text-right font-mono text-xs">₦{t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className="p-3 text-right text-green-600 font-black font-mono text-xs">₦{t.amountPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className={`p-3 text-right font-black font-mono text-xs ${balance <= 0 ? 'text-slate-400' : 'text-red-500'}`}>₦{balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className="p-3 text-center">
                                                <button className="text-[10px] font-black uppercase text-indigo-600 hover:underline" onClick={() => handlePrintReceipt(t)}>Receipt</button>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20 text-slate-400 uppercase text-xs font-black opacity-30">External sale registry inactive</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <Modal isOpen={isReceiptModalOpen} onClose={() => setReceiptModalOpen(false)} title="Operational Receipt">
                {selectedTransaction && <PrintableWalkInReceipt transaction={selectedTransaction} />}
            </Modal>
        </div>
    );
};
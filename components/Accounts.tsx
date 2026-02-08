
import React, { useState, useMemo, useEffect } from 'react';
import type { HotelData, Guest, Transaction, CityLedgerAccount } from '../types.ts';
import { Card } from './common/Card.tsx';
import { Modal } from './common/Modal.tsx';
import { Button } from './common/Button.tsx';
import { RoomStatus, PaymentStatus } from '../types.ts';
import { ID_TYPES } from '../constants.tsx';
import { PaymentStatusBadge } from './common/PaymentStatusBadge.tsx';
import { PrintableGuestDetails } from './common/PrintableGuestDetails.tsx';
import { Invoice } from './invoice/Invoice.tsx';

interface AccountsProps {
  hotelData: HotelData;
}

const calculateBalance = (guestId: number, transactions: Transaction[]): number => {
    return transactions
        .filter(t => t.guestId === guestId)
        .reduce((acc, t) => acc + t.amount, 0);
};

export const Accounts: React.FC<AccountsProps> = ({ hotelData }) => {
  const { rooms, guests, transactions, updateGuestDetails, addTransaction, deleteTransaction, cityLedgerAccounts, postToCityLedger, taxSettings } = hotelData;
  const [activeTab, setActiveTab] = useState<'guest' | 'city'>('guest');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  
  const [postingForm, setPostingForm] = useState({ description: '', amount: '', type: 'charge' as 'charge' | 'payment', target: 'folio' as 'folio' | 'ledger' });

  const activeLedgers = useMemo(() => {
    return rooms
      .filter(room => room.status === RoomStatus.Occupied && room.guestId)
      .map(room => {
        const guest = guests.find(g => g.id === room.guestId);
        if (!guest) return null;
        const balance = calculateBalance(guest.id, transactions);
        return { room, guest, balance };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [rooms, guests, transactions]);

  const handleOpenPosting = (guest: Guest) => {
      setSelectedGuest(guest);
      setPostingForm({ description: '', amount: '', type: 'charge', target: guest.ledgerAccountId ? 'ledger' : 'folio' });
      setIsPostingModalOpen(true);
  };

  const handleSavePosting = () => {
      if (!selectedGuest) return;
      const amt = parseFloat(postingForm.amount);
      if (isNaN(amt) || amt <= 0) return alert('Invalid amount');

      const finalAmount = postingForm.type === 'payment' ? -amt : amt;

      if (postingForm.target === 'ledger' && selectedGuest.ledgerAccountId) {
          postToCityLedger({
              accountId: selectedGuest.ledgerAccountId,
              guestId: selectedGuest.id,
              description: postingForm.description,
              amount: finalAmount,
              date: new Date().toISOString().split('T')[0],
              type: postingForm.type,
              reference: `Guest Move: ${selectedGuest.name}`
          });
          // Zero out guest ledger by posting counter-balance
          addTransaction({
              guestId: selectedGuest.id,
              description: `Routed to City Ledger (${postingForm.description})`,
              amount: -finalAmount,
              date: new Date().toISOString().split('T')[0],
              type: postingForm.type === 'charge' ? 'payment' : 'charge'
          });
      } else {
          addTransaction({
              guestId: selectedGuest.id,
              description: postingForm.description,
              amount: finalAmount,
              date: new Date().toISOString().split('T')[0],
              type: postingForm.type,
              receiptNumber: postingForm.type === 'payment' ? `REC-${Date.now().toString().slice(-6)}` : undefined,
              invoiceNumber: postingForm.type === 'charge' ? `INV-${Date.now().toString().slice(-6)}` : undefined
          });
      }
      setIsPostingModalOpen(false);
  };

  return (
    <div className="space-y-6">
        <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700">
            <button 
                onClick={() => setActiveTab('guest')} 
                className={`px-4 py-2 text-sm font-bold uppercase transition-all ${activeTab === 'guest' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}
            >
                Guest Ledger (In-House)
            </button>
            <button 
                onClick={() => setActiveTab('city')} 
                className={`px-4 py-2 text-sm font-bold uppercase transition-all ${activeTab === 'city' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}
            >
                City Ledger (Corporate)
            </button>
        </div>

        {activeTab === 'guest' && (
            <Card title="Active Operational Ledgers">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                            <tr>
                                <th className="p-3 text-xs uppercase font-bold">Room</th>
                                <th className="p-3 text-xs uppercase font-bold">Guest Profile</th>
                                <th className="p-3 text-xs uppercase font-bold">Balance Due</th>
                                <th className="p-3 text-xs uppercase font-bold">Billing Entity</th>
                                <th className="p-3 text-xs uppercase font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeLedgers.map(({ room, guest, balance }) => (
                                <tr key={guest.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                    <td className="p-3 font-mono font-bold">{room.number}</td>
                                    <td className="p-3">
                                        <div className="font-semibold">{guest.name}</div>
                                        <div className="text-[10px] text-slate-500">{guest.email}</div>
                                    </td>
                                    <td className="p-3">
                                        <div className={`font-bold ${balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                            ₦{balance.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        {guest.ledgerAccountId ? (
                                            <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                                                City Ledger: {cityLedgerAccounts.find(a => a.id === guest.ledgerAccountId)?.companyName}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 uppercase font-bold italic">Private Guest</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-right flex justify-end gap-2">
                                        <Button size="sm" variant="secondary" onClick={() => { setSelectedGuest(guest); setIsLedgerModalOpen(true); }}>View Statement</Button>
                                        <Button size="sm" variant="secondary" onClick={() => handleOpenPosting(guest)}>+ Post</Button>
                                        <Button size="sm" onClick={() => { setSelectedGuest(guest); setIsInvoiceModalOpen(true); }}>Invoice</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        )}

        {activeTab === 'city' && (
            <Card title="Corporate Accounts Receivable">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                            <tr>
                                <th className="p-3 text-xs uppercase font-bold">Company</th>
                                <th className="p-3 text-xs uppercase font-bold">Limit</th>
                                <th className="p-3 text-xs uppercase font-bold">Outstanding</th>
                                <th className="p-3 text-xs uppercase font-bold">Status</th>
                                <th className="p-3 text-xs uppercase font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cityLedgerAccounts.map(acc => (
                                <tr key={acc.id} className="border-b border-slate-100 dark:border-slate-800">
                                    <td className="p-3 font-bold">{acc.companyName}</td>
                                    <td className="p-3 text-sm">₦{acc.creditLimit.toLocaleString()}</td>
                                    <td className="p-3">
                                        <div className={`font-bold ${acc.currentBalance > acc.creditLimit ? 'text-red-600 font-black' : 'text-slate-900 dark:text-white'}`}>
                                            ₦{acc.currentBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${acc.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {acc.isActive ? 'Credit Allowed' : 'Stop Credit'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <Button size="sm" variant="secondary">History</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        )}

        {/* Posting Modal */}
        <Modal isOpen={isPostingModalOpen} onClose={() => setIsPostingModalOpen(false)} title={`Post Transaction: ${selectedGuest?.name}`}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-black uppercase mb-1">Type</label>
                        <select 
                            value={postingForm.type} 
                            onChange={e => setPostingForm({...postingForm, type: e.target.value as any})}
                            className="w-full p-2 border rounded text-sm bg-slate-50"
                        >
                            <option value="charge">Charge (+)</option>
                            <option value="payment">Payment (-)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase mb-1">Target</label>
                        <select 
                            value={postingForm.target} 
                            onChange={e => setPostingForm({...postingForm, target: e.target.value as any})}
                            className="w-full p-2 border rounded text-sm bg-slate-50"
                        >
                            <option value="folio">Guest Ledger</option>
                            {selectedGuest?.ledgerAccountId && <option value="ledger">City Ledger</option>}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-black uppercase mb-1">Description</label>
                    <input type="text" value={postingForm.description} onChange={e => setPostingForm({...postingForm, description: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. Mini Bar, Spa Service"/>
                </div>
                <div>
                    <label className="block text-xs font-black uppercase mb-1">Amount (₦)</label>
                    <input type="number" value={postingForm.amount} onChange={e => setPostingForm({...postingForm, amount: e.target.value})} className="w-full p-2 border rounded font-mono font-black text-lg"/>
                </div>
                <div className="pt-4 flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setIsPostingModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleSavePosting}>Apply Transaction</Button>
                </div>
            </div>
        </Modal>

        {/* Statement View */}
        {selectedGuest && (
            <Modal isOpen={isLedgerModalOpen} onClose={() => setIsLedgerModalOpen(false)} title={`Statement of Account: ${selectedGuest.name}`}>
                <div className="space-y-4">
                    <div className="max-h-[50vh] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 bg-white dark:bg-slate-800 border-b">
                                <tr>
                                    <th className="p-2 uppercase font-bold">Date</th>
                                    <th className="p-2 uppercase font-bold">Doc #</th>
                                    <th className="p-2 uppercase font-bold">Description</th>
                                    <th className="p-2 uppercase font-bold text-right">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.filter(t => t.guestId === selectedGuest.id).map(t => (
                                    <tr key={t.id} className="border-b border-slate-50">
                                        <td className="p-2 font-mono">{t.date}</td>
                                        <td className="p-2 text-[10px] text-slate-500 font-mono">{t.invoiceNumber || t.receiptNumber || 'REF-N/A'}</td>
                                        <td className="p-2">{t.description}</td>
                                        <td className={`p-2 text-right font-bold ${t.amount < 0 ? 'text-green-600' : ''}`}>₦{t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-900 text-white rounded border">
                        <div className="text-xs uppercase font-bold opacity-60">Closing Balance</div>
                        <div className="text-xl font-black">₦{calculateBalance(selectedGuest.id, transactions).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    </div>
                    <div className="flex justify-end gap-2 no-print">
                         <Button onClick={() => window.print()}>Print Statement</Button>
                    </div>
                </div>
            </Modal>
        )}

        {selectedGuest && (
          <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title={`Invoice Generation: ${selectedGuest.name}`}>
              <Invoice 
                  guest={selectedGuest} 
                  transactions={transactions.filter(t => t.guestId === selectedGuest.id)}
                  taxSettings={taxSettings}
              />
          </Modal>
      )}
    </div>
  );
};

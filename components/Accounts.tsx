import React, { useState, useMemo, useEffect } from 'react';
import type { HotelData, Guest, Transaction } from '../types.ts';
import { Card } from './common/Card.tsx';
import { Modal } from './common/Modal.tsx';
import { Button } from './common/Button.tsx';
import { RoomStatus, PaymentStatus } from '../types.ts';
import { ID_TYPES } from '../constants.tsx';
import { PaymentStatusBadge } from './common/PaymentStatusBadge.tsx';
import { PrintableGuestDetails } from './common/PrintableGuestDetails.tsx';
// NEW EXTENSION - DO NOT MODIFY ORIGINAL
import { Invoice } from './invoice/Invoice.tsx';

interface AccountsProps {
  hotelData: HotelData;
}

type FormErrors = Partial<{[K in keyof Guest]: string}>;
type PaymentOption = 'specific' | 'full_balance';

const calculateBalance = (guestId: number, transactions: Transaction[]): number => {
    return transactions
        .filter(t => t.guestId === guestId)
        .reduce((acc, t) => acc + t.amount, 0);
};

const getPaymentStatus = (balance: number, rate: number): PaymentStatus => {
    if (balance <= 0.01) return PaymentStatus.Paid;
    if (balance > rate) return PaymentStatus.Owing;
    return PaymentStatus.Pending;
};

export const Accounts: React.FC<AccountsProps> = ({ hotelData }) => {
  const { rooms, guests, transactions, updateGuestDetails, addTransaction, redeemLoyaltyPoints, addSyncLogEntry, taxSettings, deleteTransaction } = hotelData;
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isFolioModalOpen, setIsFolioModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  // NEW EXTENSION - DO NOT MODIFY ORIGINAL
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [guestProfileForm, setGuestProfileForm] = useState<Partial<Guest>>({});
  const [errors, setErrors] = useState<FormErrors>({});

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'charge' | 'payment' | null>(null);
  const [transactionForm, setTransactionForm] = useState({ description: '', amount: '' });
  const [transactionErrors, setTransactionErrors] = useState({ description: '', amount: '' });
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('specific');
  const [currentBalance, setCurrentBalance] = useState(0);

  const [redeemForm, setRedeemForm] = useState({ points: '' });
  const [redeemError, setRedeemError] = useState('');


  useEffect(() => {
    if (selectedGuest) {
        setGuestProfileForm(selectedGuest);
        setErrors({});
    } else {
        setGuestProfileForm({});
    }
  }, [selectedGuest]);

  const occupiedRoomsWithDetails = useMemo(() => {
    return rooms
      .filter(room => room.status === RoomStatus.Occupied && room.guestId)
      .map(room => {
        const guest = guests.find(g => g.id === room.guestId);
        if (!guest) return null;
        const balance = calculateBalance(guest.id, transactions);
        const status = getPaymentStatus(balance, room.rate);
        return { room, guest, balance, status };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [rooms, guests, transactions]);

  const handleViewFolio = (guest: Guest) => {
    setSelectedGuest(guest);
    setIsFolioModalOpen(true);
  };
  
  const handleViewProfile = (guest: Guest) => {
    setSelectedGuest(guest);
    setIsProfileModalOpen(true);
  };

  const handleOpenPrintModal = (guest: Guest) => {
    setSelectedGuest(guest);
    setIsPrintModalOpen(true);
  }
  
  const handleCloseModals = () => {
    setIsFolioModalOpen(false);
    setIsProfileModalOpen(false);
    setIsPrintModalOpen(false);
    setIsRedeemModalOpen(false);
    // NEW EXTENSION - DO NOT MODIFY ORIGINAL
    setIsInvoiceModalOpen(false);
    setSelectedGuest(null);
    setErrors({});
    setRedeemForm({ points: '' });
    setRedeemError('');
  };

  const handleOpenTransactionModal = (type: 'charge' | 'payment') => {
      setTransactionType(type);
      if (type === 'payment' && selectedGuest) {
        const balance = calculateBalance(selectedGuest.id, transactions);
        setCurrentBalance(balance);
        if (balance > 0) {
            setPaymentOption('full_balance');
            setTransactionForm({ description: 'Full Balance Payment', amount: balance.toFixed(2) });
        } else {
            setPaymentOption('specific');
            setTransactionForm({ description: '', amount: '' });
        }
      } else {
        setCurrentBalance(0);
        setPaymentOption('specific');
        setTransactionForm({ description: '', amount: '' });
      }
      setIsTransactionModalOpen(true);
  };

  const handleCloseTransactionModal = () => {
      setIsTransactionModalOpen(false);
      setTransactionType(null);
      setTransactionForm({ description: '', amount: '' });
      setTransactionErrors({ description: '', amount: '' });
      setPaymentOption('specific');
  };

  const handleAddTransaction = () => {
      let isValid = true;
      const errors = { description: '', amount: '' };
      if (!transactionForm.description.trim()) {
          errors.description = 'Description is required.';
          isValid = false;
      }
      const amount = parseFloat(transactionForm.amount);
      if (isNaN(amount) || amount <= 0) {
          errors.amount = 'A valid positive amount is required.';
          isValid = false;
      }
      setTransactionErrors(errors);

      if (isValid && selectedGuest) {
          if (transactionType === 'charge') {
              // Post the main charge
              addTransaction({
                  guestId: selectedGuest.id,
                  description: transactionForm.description,
                  amount: amount,
                  date: new Date().toISOString().split('T')[0]
              });
              // Post tax if applicable
              if (taxSettings.isEnabled && taxSettings.rate > 0) {
                  const taxAmount = amount * (taxSettings.rate / 100);
                  addTransaction({
                      guestId: selectedGuest.id,
                      description: `Tax (${taxSettings.rate}%) on ${transactionForm.description}`,
                      amount: taxAmount,
                      date: new Date().toISOString().split('T')[0]
                  });
              }
          } else { // Payment
              addTransaction({
                  guestId: selectedGuest.id,
                  description: transactionForm.description,
                  amount: -amount,
                  date: new Date().toISOString().split('T')[0]
              });
          }
          handleCloseTransactionModal();
      }
  };
  
  const handleDeleteTransaction = (transactionId: number) => {
    if (window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
        deleteTransaction(transactionId);
    }
  };

  const validateProfileForm = (): boolean => {
      const newErrors: FormErrors = {};
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
      const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im;
      
      if (!guestProfileForm.name?.trim()) newErrors.name = "Guest name is required.";
      
      if (!guestProfileForm.email?.trim()) {
          newErrors.email = "Email is required.";
      } else if (!emailRegex.test(guestProfileForm.email)) {
          newErrors.email = "Please enter a valid email format.";
      }

      if (!guestProfileForm.phone?.trim()) {
          newErrors.phone = "Phone number is required.";
      } else if (!phoneRegex.test(guestProfileForm.phone)) {
          newErrors.phone = "Please enter a valid phone number format.";
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

    const handleUpdateProfile = () => {
        if (validateProfileForm() && selectedGuest) {
            updateGuestDetails(selectedGuest.id, guestProfileForm);
            handleCloseModals();
        }
    };

    const handleRedeemPoints = () => {
        if (!selectedGuest) return;
        const points = parseInt(redeemForm.points, 10);
        if (isNaN(points) || points <= 0) {
            setRedeemError('Please enter a valid number of points.');
            return;
        }
        if (points > selectedGuest.loyaltyPoints) {
            setRedeemError('Cannot redeem more points than the guest has.');
            return;
        }

        const result = redeemLoyaltyPoints(selectedGuest.id, points);
        if (result.success) {
            addSyncLogEntry(result.message, 'success');
            setIsRedeemModalOpen(false);
            setRedeemForm({ points: '' });
            setRedeemError('');
        } else {
            setRedeemError(result.message);
        }
    };

  return (
    <Card title="Guest Accounts">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-200 dark:bg-slate-700">
            <tr>
              <th className="p-3">Room</th>
              <th className="p-3">Guest</th>
              <th className="p-3">Balance</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {occupiedRoomsWithDetails.map(({ room, guest, balance, status }, index) => (
              <tr key={guest.id} className={`border-b border-slate-200 dark:border-slate-700 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                <td className="p-3">{room.number}</td>
                <td className="p-3 font-medium">{guest.name}</td>
                <td className="p-3 font-semibold">₦{balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-3"><PaymentStatusBadge status={status} /></td>
                <td className="p-3">
                  <div className="flex space-x-2">
                    <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => handleViewFolio(guest)}>View Folio</Button>
                    <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => handleViewProfile(guest)}>Edit Profile</Button>
                    <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => handleOpenPrintModal(guest)}>Print Reg Card</Button>
                  </div>
                </td>
              </tr>
            ))}
             {occupiedRoomsWithDetails.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center py-4 text-slate-500 dark:text-slate-400">No in-house guests found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Guest Folio Modal */}
      {selectedGuest && (
        <Modal isOpen={isFolioModalOpen} onClose={handleCloseModals} title={`Folio for ${selectedGuest.name} (Room ${selectedGuest.roomNumber})`}>
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <table className="w-full text-left">
                <thead className="bg-slate-200 dark:bg-slate-700 sticky top-0">
                    <tr>
                        <th className="p-2 text-xs font-bold uppercase">Date</th>
                        <th className="p-2 text-xs font-bold uppercase">Description</th>
                        <th className="p-2 text-xs font-bold uppercase text-right">Amount</th>
                        <th className="p-2 text-xs font-bold uppercase text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.filter(t => t.guestId === selectedGuest.id).map(t => (
                        <tr key={t.id} className="border-b border-slate-200 dark:border-slate-700">
                            <td className="p-2">{t.date}</td>
                            <td className="p-2">{t.description}</td>
                            <td className={`p-2 font-semibold text-right ${t.amount > 0 ? 'text-slate-800 dark:text-slate-200' : 'text-green-600'}`}>{t.amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="p-2 text-right">
                                <button onClick={() => handleDeleteTransaction(t.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-600">
             <div className="flex justify-between items-center mb-4">
                <p className="font-bold text-lg">Balance: ₦{calculateBalance(selectedGuest.id, transactions).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <div className="text-right">
                    <p className="font-semibold text-indigo-600 dark:text-indigo-400">{selectedGuest.loyaltyPoints.toLocaleString()} Loyalty Points</p>
                    <Button variant="secondary" className="text-xs py-1 px-2 mt-1" onClick={() => { setIsFolioModalOpen(false); setIsRedeemModalOpen(true); }}>Redeem Points</Button>
                </div>
            </div>
            {/* NEW EXTENSION - DO NOT MODIFY ORIGINAL */}
            <div className="flex justify-between space-x-2">
                <Button variant="primary" className="flex-1" onClick={() => { setIsFolioModalOpen(false); setIsInvoiceModalOpen(true); }}>Generate Invoice</Button>
                <div className="flex justify-end space-x-2 flex-1">
                    <Button variant="secondary" onClick={() => handleOpenTransactionModal('charge')}>Post Charge</Button>
                    <Button onClick={() => handleOpenTransactionModal('payment')}>Post Payment</Button>
                </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Profile Edit Modal */}
      {selectedGuest && (
        <Modal isOpen={isProfileModalOpen} onClose={handleCloseModals} title={`Edit Profile for ${selectedGuest.name}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Full Name*</label>
                    <input type="text" value={guestProfileForm.name || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, name: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Email*</label>
                    <input type="email" value={guestProfileForm.email || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, email: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Phone*</label>
                    <input type="tel" value={guestProfileForm.phone || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, phone: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Booking Source</label>
                    <input type="text" value={guestProfileForm.bookingSource || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, bookingSource: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="secondary" onClick={handleCloseModals}>Cancel</Button>
                <Button onClick={handleUpdateProfile}>Save Changes</Button>
            </div>
        </Modal>
      )}

      {/* Print Reg Card Modal */}
      {selectedGuest && (
        <Modal isOpen={isPrintModalOpen} onClose={handleCloseModals} title="Print Registration Card">
            <PrintableGuestDetails guest={selectedGuest} />
        </Modal>
      )}

      {/* Redeem Points Modal */}
      {selectedGuest && (
        <Modal isOpen={isRedeemModalOpen} onClose={handleCloseModals} title={`Redeem Points for ${selectedGuest.name}`}>
            <div className="space-y-4">
                <p>Available Points: <strong className="text-indigo-600 dark:text-indigo-400">{selectedGuest.loyaltyPoints.toLocaleString()}</strong></p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Redemption Rate: 100 points = ₦1,000.00</p>
                <div>
                    <label className="block text-sm font-medium mb-1">Points to Redeem</label>
                    <input
                        type="number"
                        value={redeemForm.points}
                        onChange={(e) => { setRedeemForm({ points: e.target.value }); setRedeemError(''); }}
                        placeholder="e.g., 500"
                        className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                    />
                    {redeemError && <p className="text-red-500 text-xs mt-1">{redeemError}</p>}
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button variant="secondary" onClick={handleCloseModals}>Cancel</Button>
                    <Button onClick={handleRedeemPoints}>Redeem</Button>
                </div>
            </div>
        </Modal>
      )}
      
      {/* Add Transaction Modal */}
      <Modal isOpen={isTransactionModalOpen} onClose={handleCloseTransactionModal} title={transactionType === 'charge' ? 'Post New Charge' : 'Post New Payment'}>
          <div className="space-y-4">
              {transactionType === 'payment' && currentBalance > 0 && (
                  <div className="flex space-x-4">
                      <label><input type="radio" name="paymentOption" value="full_balance" checked={paymentOption === 'full_balance'} onChange={() => { setPaymentOption('full_balance'); setTransactionForm({description: 'Full Balance Payment', amount: currentBalance.toFixed(2)}) }}/> Settle Full Balance</label>
                      <label><input type="radio" name="paymentOption" value="specific" checked={paymentOption === 'specific'} onChange={() => { setPaymentOption('specific'); setTransactionForm({description: '', amount: ''}) }}/> Specific Amount</label>
                  </div>
              )}
              <div>
                  <label className="block text-sm font-medium mb-1">Description*</label>
                  <input type="text" value={transactionForm.description} onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                  {transactionErrors.description && <p className="text-red-500 text-xs mt-1">{transactionErrors.description}</p>}
              </div>
              <div>
                  <label className="block text-sm font-medium mb-1">Amount (₦)*</label>
                  <input type="number" value={transactionForm.amount} disabled={transactionType === 'payment' && paymentOption === 'full_balance'} onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                  {transactionErrors.amount && <p className="text-red-500 text-xs mt-1">{transactionErrors.amount}</p>}
              </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="secondary" onClick={handleCloseTransactionModal}>Cancel</Button>
              <Button onClick={handleAddTransaction}>Post Transaction</Button>
          </div>
      </Modal>

      {/* NEW EXTENSION - DO NOT MODIFY ORIGINAL */}
      {selectedGuest && (
          <Modal isOpen={isInvoiceModalOpen} onClose={handleCloseModals} title={`Invoice for ${selectedGuest.name}`}>
              <Invoice 
                  guest={selectedGuest} 
                  transactions={transactions.filter(t => t.guestId === selectedGuest.id)}
                  taxSettings={taxSettings}
              />
          </Modal>
      )}

    </Card>
  );
};
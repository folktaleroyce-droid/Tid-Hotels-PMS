import React, { useState, useMemo, useEffect } from 'react';
// FIX: Added file extensions to imports to resolve module errors.
import type { HotelData, Guest, Transaction } from '../types.ts';
// FIX: Added file extensions to component imports.
import { Card } from './common/Card.tsx';
import { Modal } from './common/Modal.tsx';
import { Button } from './common/Button.tsx';
import { RoomStatus, PaymentStatus } from '../types.ts';
import { ID_TYPES } from '../constants.tsx';
import { PaymentStatusBadge } from './common/PaymentStatusBadge.tsx';
import { PrintableGuestDetails } from './common/PrintableGuestDetails.tsx';

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
  const { rooms, guests, transactions, setTransactions, updateGuestDetails, addTransaction } = hotelData;
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isFolioModalOpen, setIsFolioModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [guestProfileForm, setGuestProfileForm] = useState<Partial<Guest>>({});
  const [errors, setErrors] = useState<FormErrors>({});

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'charge' | 'payment' | null>(null);
  const [transactionForm, setTransactionForm] = useState({ description: '', amount: '' });
  const [transactionErrors, setTransactionErrors] = useState({ description: '', amount: '' });
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('specific');
  const [currentBalance, setCurrentBalance] = useState(0);


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
      .filter(item => item !== null);
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
    setSelectedGuest(null);
    setErrors({});
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
          const finalAmount = transactionType === 'payment' ? -amount : amount;
          addTransaction({
              guestId: selectedGuest.id,
              description: transactionForm.description,
              amount: finalAmount,
              date: new Date().toISOString().split('T')[0]
          });
          handleCloseTransactionModal();
      }
  };
  
  const handleDeleteTransaction = (transactionId: number) => {
    if (window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
        setTransactions(transactions.filter(t => t.id !== transactionId));
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
      
      if (!guestProfileForm.birthdate) newErrors.birthdate = "Birthdate is required.";
      if (!guestProfileForm.idType) newErrors.idType = "ID Type is required.";
      if (guestProfileForm.idType === 'Other' && !guestProfileForm.idOtherType?.trim()) newErrors.idOtherType = "Please specify ID type.";
      if (!guestProfileForm.idNumber?.trim()) newErrors.idNumber = "ID number is required.";

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleProfileUpdate = () => {
      if (!validateProfileForm()) return;
      
      if (selectedGuest) {
          updateGuestDetails(selectedGuest.id, guestProfileForm);
          handleCloseModals();
      }
  }

  const getGuestTransactions = () => {
      if (!selectedGuest) return [];
      return transactions.filter(t => t.guestId === selectedGuest.id);
  }

  const renderFolioModalContent = () => {
    if (!selectedGuest) return null;
    const guestTransactions = getGuestTransactions();
    const balance = guestTransactions.reduce((acc, t) => acc + t.amount, 0);

    return (
      <div>
        <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Transaction History</h3>
        <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-200 dark:bg-slate-700">
                    <tr className="border-b border-slate-300 dark:border-slate-600">
                        <th className="p-2 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Date</th>
                        <th className="p-2 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Description</th>
                        <th className="p-2 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Amount</th>
                        <th className="p-2 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {guestTransactions.map(t => (
                        <tr key={t.id} className="border-b border-slate-200 dark:border-slate-700">
                            <td className="p-2 text-slate-800 dark:text-slate-300">{t.date}</td>
                            <td className="p-2 text-slate-800 dark:text-slate-300">{t.description}</td>
                            <td className={`p-2 font-semibold ${t.amount < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                ${Math.abs(t.amount).toFixed(2)}
                            </td>
                            <td className="p-2">
                                <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => handleDeleteTransaction(t.id)}>Delete</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="flex justify-between items-center mt-4">
            <div className="flex space-x-2">
                <Button onClick={() => handleOpenTransactionModal('charge')}>Add Charge</Button>
                <Button variant="secondary" onClick={() => handleOpenTransactionModal('payment')}>Add Payment</Button>
            </div>
            <div className="text-right text-xl font-bold text-slate-900 dark:text-white">
                Outstanding Balance: <span className={balance > 0 ? 'text-red-500' : 'text-green-500'}>${balance.toFixed(2)}</span>
            </div>
        </div>
      </div>
    );
  };

  const renderProfileModalContent = () => {
      if (!guestProfileForm) return null;
      return (
          <>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name*</label>
                        <input type="text" value={guestProfileForm.name || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, name: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Email*</label>
                        <input type="email" value={guestProfileForm.email || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, email: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone*</label>
                        <input type="tel" value={guestProfileForm.phone || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, phone: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Birthdate*</label>
                        <input type="date" value={guestProfileForm.birthdate || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, birthdate: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        {errors.birthdate && <p className="text-red-500 text-xs mt-1">{errors.birthdate}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">ID Type*</label>
                        <select value={guestProfileForm.idType || ''} onChange={e => setGuestProfileForm({...guestProfileForm, idType: e.target.value, idOtherType: ''})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                                <option value="" disabled>Select ID Type</option>
                                {ID_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                        {errors.idType && <p className="text-red-500 text-xs mt-1">{errors.idType}</p>}
                    </div>
                     {guestProfileForm.idType === 'Other' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Specify ID Type*</label>
                            <input type="text" value={guestProfileForm.idOtherType || ''} onChange={e => setGuestProfileForm({...guestProfileForm, idOtherType: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                            {errors.idOtherType && <p className="text-red-500 text-xs mt-1">{errors.idOtherType}</p>}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium mb-1">ID Number*</label>
                        <input type="text" value={guestProfileForm.idNumber || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, idNumber: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        {errors.idNumber && <p className="text-red-500 text-xs mt-1">{errors.idNumber}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Nationality</label>
                        <input type="text" value={guestProfileForm.nationality || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, nationality: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-sm font-medium mb-1">Address</label>
                       <input type="text" value={guestProfileForm.address || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, address: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Special Requests</label>
                        <textarea value={guestProfileForm.specialRequests || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, specialRequests: e.target.value})} rows={2} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"></textarea>
                    </div>
                </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="secondary" onClick={() => handleOpenPrintModal(selectedGuest as Guest)}>Print Details</Button>
                <Button variant="secondary" onClick={handleCloseModals}>Cancel</Button>
                <Button onClick={handleProfileUpdate}>Save Changes</Button>
            </div>
          </>
      );
  };


  return (
    <div>
      <Card title="Guest Accounts & Folios">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-200 dark:bg-slate-700">
              <tr className="border-b border-slate-200 dark:border-slate-600">
                <th className="p-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Room</th>
                <th className="p-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Guest</th>
                <th className="p-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Balance</th>
                <th className="p-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Status</th>
                <th className="p-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {occupiedRoomsWithDetails.map(({ room, guest, balance, status }, index) => (
                <tr key={room.id} className={`border-b border-slate-200 dark:border-slate-700 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'} `}>
                  <td className="p-3 text-slate-800 dark:text-slate-300">{room.number}</td>
                  <td className="p-3 text-slate-800 dark:text-slate-300">{guest?.name || 'N/A'}</td>
                  <td className={`p-3 font-semibold ${balance > 0.01 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    ${balance.toFixed(2)}
                  </td>
                  <td className="p-3">
                    <PaymentStatusBadge status={status} />
                  </td>
                  <td className="p-3">
                    {guest && (
                        <div className="flex space-x-2">
                            <Button className="px-3 py-1 text-sm" onClick={() => handleViewFolio(guest)}>View Folio</Button>
                            <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => handleViewProfile(guest)}>View/Edit Profile</Button>
                        </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal isOpen={isFolioModalOpen} onClose={handleCloseModals} title={`Folio for ${selectedGuest?.name}`}>
          {renderFolioModalContent()}
      </Modal>
      <Modal isOpen={isProfileModalOpen} onClose={handleCloseModals} title={`Profile for ${selectedGuest?.name}`}>
          {renderProfileModalContent()}
      </Modal>
       <Modal isOpen={isPrintModalOpen} onClose={handleCloseModals} title={`Registration Card for ${selectedGuest?.name}`}>
          {selectedGuest && <PrintableGuestDetails guest={selectedGuest} />}
      </Modal>
      <Modal 
          isOpen={isTransactionModalOpen} 
          onClose={handleCloseTransactionModal} 
          title={`Add ${transactionType === 'charge' ? 'Charge' : 'Payment'} for ${selectedGuest?.name}`}
      >
          <div className="space-y-4">
              {transactionType === 'payment' && (
                <div className="p-3 rounded-md bg-slate-100 dark:bg-slate-900/50">
                    <label className="block text-sm font-medium mb-2 text-slate-800 dark:text-slate-200">Payment Option</label>
                    <div className="flex space-x-6">
                        <div className="flex items-center">
                            <input
                                id="full_balance"
                                name="payment_option"
                                type="radio"
                                checked={paymentOption === 'full_balance'}
                                onChange={() => {
                                    setPaymentOption('full_balance');
                                    setTransactionForm({ description: 'Full Balance Payment', amount: currentBalance > 0 ? currentBalance.toFixed(2) : '0.00' });
                                }}
                                className="h-4 w-4 text-indigo-600 border-slate-300 dark:border-slate-600 focus:ring-indigo-500"
                                disabled={currentBalance <= 0}
                            />
                            <label htmlFor="full_balance" className={`ml-2 block text-sm ${currentBalance <= 0 ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                Pay Full Balance {currentBalance > 0 && `($${currentBalance.toFixed(2)})`}
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                id="specific_amount"
                                name="payment_option"
                                type="radio"
                                checked={paymentOption === 'specific'}
                                onChange={() => {
                                    setPaymentOption('specific');
                                    setTransactionForm({ description: '', amount: '' });
                                }}
                                className="h-4 w-4 text-indigo-600 border-slate-300 dark:border-slate-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="specific_amount" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
                                Specific Amount
                            </label>
                        </div>
                    </div>
                </div>
              )}
              <div>
                  <label className="block text-sm font-medium mb-1">Description*</label>
                  <input 
                      type="text" 
                      value={transactionForm.description} 
                      onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                      className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                  />
                  {transactionErrors.description && <p className="text-red-500 text-xs mt-1">{transactionErrors.description}</p>}
              </div>
              <div>
                  <label className="block text-sm font-medium mb-1">Amount ($)*</label>
                  <input 
                      type="number"
                      value={transactionForm.amount} 
                      onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                      className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 disabled:bg-slate-200 dark:disabled:bg-slate-800"
                      placeholder="Enter a positive amount"
                      readOnly={paymentOption === 'full_balance'}
                      disabled={paymentOption === 'full_balance'}
                  />
                  {transactionErrors.amount && <p className="text-red-500 text-xs mt-1">{transactionErrors.amount}</p>}
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="secondary" onClick={handleCloseTransactionModal}>Cancel</Button>
                  <Button onClick={handleAddTransaction}>Save Transaction</Button>
              </div>
          </div>
      </Modal>
    </div>
  );
};
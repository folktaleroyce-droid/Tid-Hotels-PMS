import React, { useState, useMemo, useEffect } from 'react';
// FIX: Added file extensions to fix module resolution errors.
import type { HotelData, Guest, Transaction } from '../types.ts';
// FIX: Added file extensions to component imports.
import { Card } from './common/Card.tsx';
import { Modal } from './common/Modal.tsx';
import { Button } from './common/Button.tsx';
import { RoomStatus } from '../types.ts';

interface AccountsProps {
  hotelData: HotelData;
}

export const Accounts: React.FC<AccountsProps> = ({ hotelData }) => {
  const { rooms, guests, transactions, setTransactions, updateGuestDetails } = hotelData;
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isFolioModalOpen, setIsFolioModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [guestProfileForm, setGuestProfileForm] = useState<Partial<Guest>>({});

  useEffect(() => {
    if (selectedGuest) {
        setGuestProfileForm(selectedGuest);
    } else {
        setGuestProfileForm({});
    }
  }, [selectedGuest]);

  const occupiedRoomsWithDetails = useMemo(() => {
    return rooms
      .filter(room => room.status === RoomStatus.Occupied && room.guestId)
      .map(room => {
        const guest = guests.find(g => g.id === room.guestId);
        const guestTransactions = transactions.filter(t => t.guestId === room.guestId);
        const balance = guestTransactions.reduce((acc, t) => acc + t.amount, 0);
        return { room, guest, balance };
      });
  }, [rooms, guests, transactions]);

  const handleViewFolio = (guest: Guest) => {
    setSelectedGuest(guest);
    setIsFolioModalOpen(true);
  };
  
  const handleViewProfile = (guest: Guest) => {
    setSelectedGuest(guest);
    setIsProfileModalOpen(true);
  };
  
  const handleCloseModals = () => {
    setIsFolioModalOpen(false);
    setIsProfileModalOpen(false);
    setSelectedGuest(null);
  };
  
  const handleDeleteTransaction = (transactionId: number) => {
    // In a real app, this would need admin approval and logging.
    setTransactions(transactions.filter(t => t.id !== transactionId));
  };

  const handleProfileUpdate = () => {
      if (selectedGuest && guestProfileForm.name) {
          updateGuestDetails(selectedGuest.id, guestProfileForm);
          handleCloseModals();
      } else {
          alert("Guest name cannot be empty.");
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
        <div className="text-right mt-4 text-xl font-bold text-slate-900 dark:text-white">
            Outstanding Balance: <span className={balance > 0 ? 'text-red-500' : 'text-green-500'}>${balance.toFixed(2)}</span>
        </div>
      </div>
    );
  };

  const renderProfileModalContent = () => {
      if (!guestProfileForm) return null;
      return (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium mb-1">Full Name*</label>
                      <input type="text" value={guestProfileForm.name || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, name: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                  </div>
                   <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input type="email" value={guestProfileForm.email || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, email: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <input type="tel" value={guestProfileForm.phone || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, phone: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium mb-1">Nationality</label>
                      <input type="text" value={guestProfileForm.nationality || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, nationality: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                  </div>
                  <div className="md:col-span-2">
                     <label className="block text-sm font-medium mb-1">Address</label>
                     <input type="text" value={guestProfileForm.address || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, address: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium mb-1">ID / Passport</label>
                      <input type="text" value={guestProfileForm.idNumber || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, idNumber: e.target.value})} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                  </div>
                  <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Special Requests</label>
                      <textarea value={guestProfileForm.specialRequests || ''} onChange={(e) => setGuestProfileForm({...guestProfileForm, specialRequests: e.target.value})} rows={2} className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"></textarea>
                  </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="secondary" onClick={handleCloseModals}>Cancel</Button>
                  <Button onClick={handleProfileUpdate}>Save Changes</Button>
              </div>
          </div>
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
                <th className="p-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {occupiedRoomsWithDetails.map(({ room, guest, balance }, index) => (
                <tr key={room.id} className={`border-b border-slate-200 dark:border-slate-700 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'} `}>
                  <td className="p-3 text-slate-800 dark:text-slate-300">{room.number}</td>
                  <td className="p-3 text-slate-800 dark:text-slate-300">{guest?.name || 'N/A'}</td>
                  <td className={`p-3 font-semibold ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    ${balance.toFixed(2)}
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
    </div>
  );
};

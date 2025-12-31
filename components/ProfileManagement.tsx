
import React, { useState, useMemo } from 'react';
import type { HotelData, Guest } from '../types.ts';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import { LOYALTY_TIER_THEME } from '../constants.tsx';

interface ProfileManagementProps {
    hotelData: HotelData;
}

const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>;
const VipStarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
const CorporateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h6v4H7V5zm13 1.5a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 012 6.5v-3A1.5 1.5 0 013.5 2h13A1.5 1.5 0 0118 3.5v3z" clipRule="evenodd" /></svg>;

export const ProfileManagement: React.FC<ProfileManagementProps> = ({ hotelData }) => {
    const { guests, updateGuestDetails, reservations, transactions } = hotelData;
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'guests' | 'corporate'>('guests');
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Guest>>({});

    const filteredGuests = useMemo(() => {
        return guests.filter(guest => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = guest.name.toLowerCase().includes(searchLower) || 
                                  guest.email.toLowerCase().includes(searchLower) ||
                                  guest.phone.includes(searchTerm);
            
            if (activeTab === 'guests') return matchesSearch;
            if (activeTab === 'corporate') return matchesSearch && !!guest.company;
            return matchesSearch;
        });
    }, [guests, searchTerm, activeTab]);

    const handleEditProfile = (guest: Guest) => {
        setSelectedGuest(guest);
        setEditForm(guest);
        setIsEditModalOpen(true);
    };

    const handleSaveProfile = () => {
        if (selectedGuest && editForm) {
            updateGuestDetails(selectedGuest.id, editForm);
            setIsEditModalOpen(false);
            setSelectedGuest(null);
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
             const checked = (e.target as HTMLInputElement).checked;
             setEditForm(prev => ({ ...prev, [name]: checked }));
        } else {
             setEditForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const calculateStats = (guestId: number) => {
        const guestTransactions = transactions.filter(t => t.guestId === guestId);
        const totalSpend = guestTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const stayCount = reservations.filter(r => r.guestName === guests.find(g => g.id === guestId)?.name).length + 1; // +1 for current stay if applicable
        return { totalSpend, stayCount };
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Management</h1>

            {/* Tabs */}
             <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 pb-1">
                <button 
                    onClick={() => setActiveTab('guests')} 
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'guests' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                    All Guests
                </button>
                <button 
                    onClick={() => setActiveTab('corporate')} 
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'corporate' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                    Corporate Profiles
                </button>
            </div>

            <Card>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search profiles by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-md p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGuests.map(guest => {
                        const { totalSpend, stayCount } = calculateStats(guest.id);
                        const tier = LOYALTY_TIER_THEME[guest.loyaltyTier];
                        
                        return (
                            <div key={guest.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50 hover:shadow-md transition-shadow relative">
                                {guest.vip && (
                                    <div className="absolute top-2 right-2 flex items-center bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full text-xs font-bold text-yellow-700 dark:text-yellow-400 border border-yellow-400/50">
                                        <VipStarIcon /> <span className="ml-1">VIP</span>
                                    </div>
                                )}
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                        <UserIcon />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{guest.name}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{guest.email}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{guest.phone}</p>
                                        
                                        {guest.company && (
                                            <div className="mt-2 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400">
                                                <CorporateIcon /> <span className="ml-1 truncate">{guest.company}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-slate-500">Total Spend</span>
                                        <p className="font-semibold text-slate-900 dark:text-white">₦{totalSpend.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Stays</span>
                                        <p className="font-semibold text-slate-900 dark:text-white">{stayCount}</p>
                                    </div>
                                    <div className="col-span-2 mt-2">
                                         <span className={`px-2 py-1 text-xs font-semibold rounded-full ${tier.bg} ${tier.text}`}>
                                            {guest.loyaltyTier} Member
                                        </span>
                                    </div>
                                </div>

                                {guest.preferences && (
                                    <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded text-xs border border-yellow-100 dark:border-yellow-900/30">
                                        <span className="font-bold text-yellow-800 dark:text-yellow-200">Preferences: </span>
                                        <span className="text-slate-700 dark:text-slate-300">{guest.preferences}</span>
                                    </div>
                                )}

                                <div className="mt-4">
                                    <Button variant="secondary" className="w-full text-sm" onClick={() => handleEditProfile(guest)}>View & Edit Profile</Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {filteredGuests.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                        No profiles found matching your criteria.
                    </div>
                )}
            </Card>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Guest Profile">
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Full Name</label>
                            <input type="text" name="name" value={editForm.name || ''} onChange={handleFormChange} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input type="email" name="email" value={editForm.email || ''} onChange={handleFormChange} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <input type="tel" name="phone" value={editForm.phone || ''} onChange={handleFormChange} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1">Date of Birth</label>
                            <input type="date" name="birthdate" value={editForm.birthdate || ''} onChange={handleFormChange} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1">Nationality</label>
                            <input type="text" name="nationality" value={editForm.nationality || ''} onChange={handleFormChange} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                        <div className="col-span-2">
                            <hr className="my-2 border-slate-200 dark:border-slate-700"/>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-2">Corporate & VIP Details</h4>
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1">Company / Organization</label>
                            <input type="text" name="company" value={editForm.company || ''} onChange={handleFormChange} placeholder="e.g. Acme Corp" className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                         <div className="flex items-center mt-6">
                            <input 
                                id="vip-toggle" 
                                type="checkbox" 
                                name="vip" 
                                checked={editForm.vip || false} 
                                onChange={handleFormChange} 
                                className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <label htmlFor="vip-toggle" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Mark as VIP Guest</label>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Guest Preferences / Notes</label>
                            <textarea 
                                name="preferences" 
                                value={editForm.preferences || ''} 
                                onChange={handleFormChange} 
                                rows={3}
                                placeholder="e.g. High floor, Extra pillows, Allergic to peanuts..."
                                className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" 
                            />
                        </div>
                         <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Address</label>
                            <textarea name="address" value={editForm.address || ''} onChange={handleFormChange} rows={2} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                        <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveProfile}>Save Changes</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

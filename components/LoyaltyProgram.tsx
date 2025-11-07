import React, { useState, useMemo } from 'react';
import type { HotelData, Guest, LoyaltyTransaction } from '../types.ts';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import { LOYALTY_TIER_THEME } from '../constants.tsx';
import { LoyaltyTier } from '../types.ts';

interface LoyaltyProgramProps {
    hotelData: HotelData;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <Card className="flex items-center p-4">
        <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-800 mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    </Card>
);


export const LoyaltyProgram: React.FC<LoyaltyProgramProps> = ({ hotelData }) => {
    const { guests, loyaltyTransactions, addLoyaltyPoints, redeemLoyaltyPoints, addSyncLogEntry } = hotelData;
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
    const [isAdjustModalOpen, setAdjustModalOpen] = useState(false);

    const [adjustmentForm, setAdjustmentForm] = useState({
        type: 'earn' as 'earn' | 'redeem',
        points: '',
        description: ''
    });
    const [adjustmentErrors, setAdjustmentErrors] = useState({ points: '', description: '' });

    const filteredGuests = useMemo(() => {
        return guests
            .filter(guest => guest.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => b.loyaltyPoints - a.loyaltyPoints);
    }, [guests, searchTerm]);

    const loyaltyStats = useMemo(() => {
        const totalMembers = guests.length;
        const totalPoints = guests.reduce((sum, g) => sum + g.loyaltyPoints, 0);
        const avgPoints = totalMembers > 0 ? (totalPoints / totalMembers).toFixed(0) : '0';
        return { totalMembers, totalPoints, avgPoints };
    }, [guests]);
    
    const handleOpenHistoryModal = (guest: Guest) => {
        setSelectedGuest(guest);
        setHistoryModalOpen(true);
    };

    const handleOpenAdjustModal = (guest: Guest) => {
        setSelectedGuest(guest);
        setAdjustmentForm({ type: 'earn', points: '', description: '' });
        setAdjustmentErrors({ points: '', description: '' });
        setAdjustModalOpen(true);
    };

    const handleCloseModals = () => {
        setSelectedGuest(null);
        setHistoryModalOpen(false);
        setAdjustModalOpen(false);
    };

    const handleAdjustPoints = async () => {
        if (!selectedGuest) return;

        const points = parseInt(adjustmentForm.points, 10);
        let isValid = true;
        const errors = { points: '', description: '' };

        if (isNaN(points) || points <= 0) {
            errors.points = 'Please enter a valid positive number of points.';
            isValid = false;
        }
        if (adjustmentForm.type === 'redeem' && points > selectedGuest.loyaltyPoints) {
            errors.points = 'Cannot redeem more points than the guest has.';
            isValid = false;
        }
        if (!adjustmentForm.description.trim()) {
            errors.description = 'A description/reason is required for the adjustment.';
            isValid = false;
        }

        setAdjustmentErrors(errors);

        if (isValid) {
            if (adjustmentForm.type === 'earn') {
                addLoyaltyPoints(selectedGuest.id, points, `Manual Adjustment: ${adjustmentForm.description}`);
                addSyncLogEntry(`Manually added ${points} points to ${selectedGuest.name}.`, 'info');
            } else { // redeem
                const result = await redeemLoyaltyPoints(selectedGuest.id, points);
                if (result.success) {
                   addSyncLogEntry(`Redeemed ${points} points from ${selectedGuest.name}'s account.`, 'info');
                }
            }
            handleCloseModals();
        }
    };
    
    const getGuestLoyaltyHistory = () => {
        if (!selectedGuest) return [];
        return loyaltyTransactions.filter(lt => lt.guestId === selectedGuest.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Loyalty Program Dashboard</h2>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Members" value={loyaltyStats.totalMembers} icon={<UsersIcon />} />
                <StatCard title="Total Points in Circulation" value={loyaltyStats.totalPoints.toLocaleString()} icon={<PointsIcon />} />
                <StatCard title="Average Points per Member" value={loyaltyStats.avgPoints} icon={<AvgIcon />} />
            </div>

            {/* Member List */}
            <Card title="Loyalty Members">
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search for a guest..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-sm p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-200 dark:bg-slate-700">
                            <tr>
                                <th className="p-3 text-xs font-bold uppercase">Guest Name</th>
                                <th className="p-3 text-xs font-bold uppercase">Loyalty Tier</th>
                                <th className="p-3 text-xs font-bold uppercase">Points Balance</th>
                                <th className="p-3 text-xs font-bold uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGuests.map((guest, index) => {
                                const theme = LOYALTY_TIER_THEME[guest.loyaltyTier];
                                return (
                                    <tr key={guest.id} className={`border-b border-slate-200 dark:border-slate-700 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                                        <td className="p-3 font-medium">{guest.name}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${theme.bg} ${theme.text}`}>
                                                {guest.loyaltyTier}
                                            </span>
                                        </td>
                                        <td className="p-3 font-semibold text-indigo-600 dark:text-indigo-400">{guest.loyaltyPoints.toLocaleString()} pts</td>
                                        <td className="p-3">
                                            <div className="flex space-x-2">
                                                <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => handleOpenHistoryModal(guest)}>History</Button>
                                                <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => handleOpenAdjustModal(guest)}>Adjust</Button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                     {filteredGuests.length === 0 && <p className="text-center py-8 text-slate-500 dark:text-slate-400">No members found.</p>}
                </div>
            </Card>

            {/* History Modal */}
            <Modal isOpen={isHistoryModalOpen} onClose={handleCloseModals} title={`Loyalty History for ${selectedGuest?.name}`}>
                <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-slate-200 dark:bg-slate-700">
                             <tr>
                                <th className="p-2 text-xs font-bold uppercase">Date</th>
                                <th className="p-2 text-xs font-bold uppercase">Description</th>
                                <th className="p-2 text-xs font-bold uppercase text-right">Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getGuestLoyaltyHistory().map(lt => (
                                <tr key={lt.id} className="border-b border-slate-200 dark:border-slate-700">
                                    <td className="p-2 text-sm">{lt.date}</td>
                                    <td className="p-2 text-sm">{lt.description}</td>
                                    <td className={`p-2 text-sm font-semibold text-right ${lt.points > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {lt.points > 0 ? '+' : ''}{lt.points.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Modal>
            
            {/* Adjustment Modal */}
            <Modal isOpen={isAdjustModalOpen} onClose={handleCloseModals} title={`Adjust Points for ${selectedGuest?.name}`}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Adjustment Type</label>
                        <select
                            value={adjustmentForm.type}
                            onChange={(e) => setAdjustmentForm({...adjustmentForm, type: e.target.value as 'earn' | 'redeem'})}
                            className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                        >
                            <option value="earn">Earn Points</option>
                            <option value="redeem">Redeem Points</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Points*</label>
                        <input
                            type="number"
                            placeholder="Enter number of points"
                            value={adjustmentForm.points}
                            onChange={(e) => setAdjustmentForm({...adjustmentForm, points: e.target.value})}
                            className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                        />
                         {adjustmentErrors.points && <p className="text-red-500 text-xs mt-1">{adjustmentErrors.points}</p>}
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Reason / Description*</label>
                        <input
                            type="text"
                            placeholder="e.g., Service recovery, special promotion"
                            value={adjustmentForm.description}
                            onChange={(e) => setAdjustmentForm({...adjustmentForm, description: e.target.value})}
                            className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                        />
                         {adjustmentErrors.description && <p className="text-red-500 text-xs mt-1">{adjustmentErrors.description}</p>}
                    </div>
                     <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button variant="secondary" onClick={handleCloseModals}>Cancel</Button>
                        <Button onClick={handleAdjustPoints}>Apply Adjustment</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// Icons
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>;
const PointsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const AvgIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import { useHotelData } from '../hooks/useHotelData.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { UserRole, RoomStatus, TaxCharge, Room, RatePlan, RoomType } from '../types.ts';

export const Settings: React.FC = () => {
    const { 
        taxSettings, setTaxSettings, propertyInfo, updatePropertyInfo, 
        rooms, addRoom, roomTypes, addRoomType, deleteRoom, updateRoom, updateRoomType, deleteRoomType,
        addTaxCharge, updateTaxCharge, deleteTaxCharge,
        ratePlans, addRatePlan, deleteRatePlan, updateRatePlan
    } = useHotelData();
    
    const { currentUser } = useAuth();
    const isAuthorized = currentUser?.role === UserRole.Manager || currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;

    const [activeTab, setActiveTab] = useState<'profile' | 'infrastructure' | 'financials'>('profile');
    const [infraSubTab, setInfraSubTab] = useState<'units' | 'rates' | 'categories'>('categories');
    
    const [localProp, setLocalProp] = useState(propertyInfo);
    const [roomFilter, setRoomFilter] = useState('');
    
    // Modals
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [isRatePlanModalOpen, setIsRatePlanModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
    
    // Selection for Editing
    const [editingCategory, setEditingCategory] = useState<RoomType | null>(null);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [editingTax, setEditingTax] = useState<TaxCharge | null>(null);

    // Forms
    const [newRoomForm, setNewRoomForm] = useState({ number: '', type: roomTypes[0]?.name || '', floor: 1, rate: 0 });
    const [newRatePlanForm, setNewRatePlanForm] = useState({ name: '', description: '', prices: {} as Record<number, { NGN: number, USD: number }> });
    const [newCategoryForm, setNewCategoryForm] = useState({ name: '', capacity: 2, rates: { NGN: 0, USD: 0 } });
    const [taxForm, setTaxForm] = useState({ name: '', rate: 0, isInclusive: true, showOnReceipt: true });

    useEffect(() => {
        setLocalProp(propertyInfo);
    }, [propertyInfo]);

    const filteredRooms = useMemo(() => {
        return rooms.filter(r => r.number.toLowerCase().includes(roomFilter.toLowerCase()));
    }, [rooms, roomFilter]);

    const handleSaveProfile = () => { if (isAuthorized) updatePropertyInfo(localProp); };

    // CATEGORY LOGIC
    const openAddCategory = () => {
        setEditingCategory(null);
        setNewCategoryForm({ name: '', capacity: 2, rates: { NGN: 0, USD: 0 } });
        setIsCategoryModalOpen(true);
    };

    const handleEditCategory = (rt: RoomType) => {
        setEditingCategory(rt);
        setNewCategoryForm({
            name: rt.name,
            capacity: rt.capacity,
            rates: { ...rt.rates }
        });
        setIsCategoryModalOpen(true);
    };

    const handleCommitCategory = () => {
        if (!newCategoryForm.name) return;
        if (editingCategory) {
            updateRoomType({
                ...editingCategory,
                name: newCategoryForm.name,
                capacity: newCategoryForm.capacity,
                rates: newCategoryForm.rates
            });
        } else {
            addRoomType({
                name: newCategoryForm.name,
                capacity: newCategoryForm.capacity,
                rates: newCategoryForm.rates,
                isActive: true
            } as any);
        }
        setIsCategoryModalOpen(false);
    };

    // ROOM LOGIC
    const openAddRoom = () => {
        setEditingRoom(null);
        setNewRoomForm({ number: '', type: roomTypes[0]?.name || '', floor: 1, rate: roomTypes[0]?.rates.NGN || 0 });
        setIsRoomModalOpen(true);
    };

    const handleEditRoom = (room: Room) => {
        setEditingRoom(room);
        setNewRoomForm({ number: room.number, type: room.type, floor: room.floor, rate: room.rate });
        setIsRoomModalOpen(true);
    };

    const handleCommitRoom = () => {
        if (!newRoomForm.number) return;
        if (editingRoom) {
            updateRoom({ ...editingRoom, ...newRoomForm });
        } else {
            addRoom(newRoomForm);
        }
        setIsRoomModalOpen(false);
    };

    // TAX LOGIC
    const handleCommitTax = () => {
        if (!taxForm.name) return;
        if (editingTax) {
            updateTaxCharge({ ...editingTax, ...taxForm });
        } else {
            addTaxCharge({ ...taxForm, isActive: true } as any);
        }
        setIsTaxModalOpen(false);
    };

    const handleSaveRatePlan = () => {
        if (!newRatePlanForm.name) return;
        addRatePlan({
            name: newRatePlanForm.name,
            description: newRatePlanForm.description,
            roomTypeId: roomTypes[0].id,
            rates: { NGN: 0, USD: 0 },
            isActive: true
        } as any);
        setIsRatePlanModalOpen(false);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">System Architecture</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-2">Operational Logic & Infrastructure Matrix</p>
              </div>
              <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700">
                <button onClick={() => setActiveTab('profile')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>General Profile</button>
                <button onClick={() => setActiveTab('infrastructure')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'infrastructure' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Infrastructure Matrix</button>
                <button onClick={() => setActiveTab('financials')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'financials' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Statutory Rules</button>
              </div>
            </div>

            {activeTab === 'profile' && (
                <div className="animate-fade-in-right space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card title="Corporate Identity Manifest">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1 tracking-[0.15em]">Entity nomenclature (Hotel Name)</label>
                                        <input type="text" value={localProp.name} onChange={e => setLocalProp({...localProp, name: e.target.value})} disabled={!isAuthorized} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase text-sm focus:border-indigo-500 outline-none transition-all shadow-inner" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1 tracking-[0.15em]">Manifest Tagline (Appears on Receipts)</label>
                                        <input type="text" value={localProp.tagline || ''} onChange={e => setLocalProp({...localProp, tagline: e.target.value})} disabled={!isAuthorized} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-bold italic text-xs focus:border-indigo-500 outline-none transition-all shadow-inner" placeholder="Excellence in Enterprise Logic..." />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1 tracking-[0.15em]">Communication Endpoint (Phone)</label>
                                        <input type="tel" value={localProp.phone} onChange={e => setLocalProp({...localProp, phone: e.target.value})} disabled={!isAuthorized} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-mono font-bold text-sm focus:border-indigo-500 outline-none transition-all shadow-inner" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1 tracking-[0.15em]">Digital Correspondence (Email)</label>
                                        <input type="email" value={localProp.email} onChange={e => setLocalProp({...localProp, email: e.target.value})} disabled={!isAuthorized} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-mono font-bold text-sm focus:border-indigo-500 outline-none transition-all shadow-inner" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1 tracking-[0.15em]">Physical Node Registry (Full Address)</label>
                                        <textarea value={localProp.address} onChange={e => setLocalProp({...localProp, address: e.target.value})} disabled={!isAuthorized} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold uppercase focus:border-indigo-500 outline-none transition-all h-24 shadow-inner" />
                                    </div>
                                </div>
                            </Card>

                            <Card title="Fiscal Settlement Protocol (Bank Details)">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1 tracking-[0.15em]">Bank Designation</label>
                                        <input type="text" value={localProp.bankName || ''} onChange={e => setLocalProp({...localProp, bankName: e.target.value})} disabled={!isAuthorized} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase text-sm focus:border-indigo-500 outline-none transition-all shadow-inner" placeholder="e.g. Zenith Bank" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1 tracking-[0.15em]">Protocol Serial (Account Number)</label>
                                        <input type="text" value={localProp.accountNumber || ''} onChange={e => setLocalProp({...localProp, accountNumber: e.target.value})} disabled={!isAuthorized} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-mono font-black text-sm focus:border-indigo-500 outline-none shadow-inner" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1 tracking-[0.15em]">Account Beneficiary nomenclature</label>
                                        <input type="text" value={localProp.accountName || ''} onChange={e => setLocalProp({...localProp, accountName: e.target.value})} disabled={!isAuthorized} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase text-sm focus:border-indigo-500 outline-none transition-all shadow-inner" />
                                    </div>
                                </div>
                            </Card>
                        </div>
                        
                        <div className="space-y-6">
                            <Card title="Interface Protocol">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Operating Currency</label>
                                        <select value={localProp.currency} onChange={e => setLocalProp({...localProp, currency: e.target.value as any})} disabled={!isAuthorized} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-black uppercase text-xs focus:border-indigo-500 outline-none transition-all">
                                            <option value="NGN">NGN (₦)</option>
                                            <option value="USD">USD ($)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Standard Induction (Check-In)</label>
                                        <input type="time" value={localProp.checkInTime} onChange={e => setLocalProp({...localProp, checkInTime: e.target.value})} disabled={!isAuthorized} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold text-xs" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Standard Release (Check-Out)</label>
                                        <input type="time" value={localProp.checkOutTime} onChange={e => setLocalProp({...localProp, checkOutTime: e.target.value})} disabled={!isAuthorized} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold text-xs" />
                                    </div>
                                </div>
                            </Card>
                            {isAuthorized && <Button onClick={handleSaveProfile} className="w-full py-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95">Commit Global Modifications</Button>}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'infrastructure' && (
                <div className="space-y-6 animate-fade-in-right">
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit border-2 border-slate-200 dark:border-slate-800">
                        <button onClick={() => setInfraSubTab('categories')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${infraSubTab === 'categories' ? 'bg-white dark:bg-slate-800 shadow text-indigo-600' : 'text-slate-500'}`}>Category Hierarchy</button>
                        <button onClick={() => setInfraSubTab('units')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${infraSubTab === 'units' ? 'bg-white dark:bg-slate-800 shadow text-indigo-600' : 'text-slate-500'}`}>Unit Deployment</button>
                        <button onClick={() => setInfraSubTab('rates')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${infraSubTab === 'rates' ? 'bg-white dark:bg-slate-800 shadow text-indigo-600' : 'text-slate-500'}`}>Rate Architecture</button>
                    </div>

                    {infraSubTab === 'categories' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Hierarchy Registry</h2>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">Autonomous Category Definition & Capacity Logic</p>
                                </div>
                                <Button onClick={openAddCategory} className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                                    Define Category
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {roomTypes.map(rt => (
                                    <Card key={rt.id} className="border-t-4 border-indigo-600 group relative">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-black text-lg uppercase tracking-tight text-slate-900 dark:text-white">{rt.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Capacity: {rt.capacity} Persons</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-indigo-600 font-mono">₦{rt.rates.NGN.toLocaleString()}</span>
                                                <span className="text-[8px] font-bold text-slate-400">${rt.rates.USD.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="secondary" size="sm" onClick={() => handleEditCategory(rt)} className="flex-1 text-[9px] uppercase font-black">Edit logic</Button>
                                            <button onClick={() => deleteRoomType(rt.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {infraSubTab === 'units' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <input 
                                        type="text" 
                                        placeholder="Identify specific node (Room #)..." 
                                        value={roomFilter} 
                                        onChange={e => setRoomFilter(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase text-[10px] focus:border-indigo-500 outline-none shadow-sm transition-all"
                                    />
                                    <svg className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                                </div>
                                <Button onClick={openAddRoom} className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                                    Deploy Unit Node
                                </Button>
                            </div>

                            <Card>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                                            <tr>
                                                <th className="p-4 text-[10px] font-black uppercase text-slate-400">Node Identifier</th>
                                                <th className="p-4 text-[10px] font-black uppercase text-slate-400">Category Hierarchy</th>
                                                <th className="p-4 text-[10px] font-black uppercase text-slate-400">Rate override (₦)</th>
                                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRooms.map(r => (
                                                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-4"><span className="font-black text-sm uppercase text-slate-900 dark:text-white">Room {r.number}</span></td>
                                                    <td className="p-4"><span className="text-[10px] font-black uppercase text-indigo-600">{r.type}</span></td>
                                                    <td className="p-4 font-mono text-xs font-black text-slate-600">₦{r.rate.toLocaleString()}</td>
                                                    <td className="p-4 text-right">
                                                        <button onClick={() => handleEditRoom(r)} className="text-indigo-600 hover:text-indigo-800 text-[10px] font-black uppercase mr-4">Edit Node</button>
                                                        <button onClick={() => deleteRoom(r.id)} className="text-red-500 hover:text-red-700 text-[10px] font-black uppercase">Decommission</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}

                    {infraSubTab === 'rates' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                 <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Rack Rate Architecture</h2>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">Named Pricing Manifests & Global Tiers</p>
                                 </div>
                                 <Button onClick={() => setIsRatePlanModalOpen(true)} className="flex items-center gap-2">
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                                     Define Rack Rate
                                 </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Card title="Authoritative Base Rates" className="border-t-4 border-slate-900 bg-slate-50 dark:bg-slate-950">
                                    <div className="space-y-4">
                                        {roomTypes.map(rt => (
                                            <div key={rt.id} className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                                                <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">{rt.name}</span>
                                                <div className="text-right flex items-center gap-4">
                                                    <div className="flex flex-col items-end">
                                                        <p className="font-black font-mono text-xs text-indigo-600">₦{rt.rates.NGN.toLocaleString()}</p>
                                                        <p className="text-[9px] font-bold text-slate-400">${rt.rates.USD.toLocaleString()}</p>
                                                    </div>
                                                    <button onClick={() => handleEditCategory(rt)} className="text-indigo-600 p-1 hover:bg-indigo-50 rounded transition-colors">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                {ratePlans.map(plan => (
                                    <Card key={plan.id} title={plan.name} className="border-t-4 border-indigo-600 group">
                                        <div className="space-y-4 mb-6">
                                            <p className="text-[10px] italic text-slate-500">{plan.description || 'No descriptive logic attached.'}</p>
                                            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {plan.isActive ? 'Active Manifest' : 'Archived'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="secondary" size="sm" className="flex-1 text-[9px] uppercase font-black">Configure</Button>
                                            <button onClick={() => deleteRatePlan(plan.id)} className="px-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'financials' && (
                <div className="animate-fade-in-right space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Fiscal Component Matrix</h2>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">Manage Statutory Levies & Tax Profiles</p>
                        </div>
                        <Button onClick={() => { setEditingTax(null); setTaxForm({ name: '', rate: 0, isInclusive: true, showOnReceipt: true }); setIsTaxModalOpen(true); }} className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                            Add Tax Component
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {taxSettings.components.map(comp => (
                            <Card key={comp.id} className={`border-t-4 ${comp.isActive ? 'border-indigo-600' : 'border-slate-300'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-black text-lg uppercase tracking-tight text-slate-900 dark:text-white">{comp.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{comp.isInclusive ? 'Inclusive of Rate' : 'Exclusive (Add-on)'}</p>
                                    </div>
                                    <span className="text-xl font-black text-indigo-600 font-mono">{comp.rate}%</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm" onClick={() => { setEditingTax(comp); setTaxForm({ name: comp.name, rate: comp.rate, isInclusive: comp.isInclusive, showOnReceipt: comp.showOnReceipt }); setIsTaxModalOpen(true); }} className="flex-1 text-[9px] uppercase font-black">Modify Rule</Button>
                                    <button onClick={() => deleteTaxCharge(comp.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* MODAL: DEFINE CATEGORY HIERARCHY */}
            <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title={editingCategory ? "Modify Category Profile" : "Category Hierarchy Definition"}>
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Category Nomenclature</label>
                        <input type="text" value={newCategoryForm.name} onChange={e => setNewCategoryForm({...newCategoryForm, name: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase text-sm focus:border-indigo-500 outline-none transition-all shadow-inner" placeholder="e.g. EXECUTIVE SUITE" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Legal Occupancy Capacity</label>
                            <input type="number" value={newCategoryForm.capacity} onChange={e => setNewCategoryForm({...newCategoryForm, capacity: parseInt(e.target.value) || 1})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-mono font-black text-sm shadow-inner" />
                        </div>
                    </div>
                    <div className="space-y-4">
                         <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest border-b border-indigo-50 dark:border-indigo-900/20 pb-2">Master Base Rates</h4>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Base Rate (₦)</label>
                                <input type="number" value={newCategoryForm.rates.NGN} onChange={e => setNewCategoryForm({...newCategoryForm, rates: { ...newCategoryForm.rates, NGN: parseFloat(e.target.value) || 0 }})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-mono font-black text-sm shadow-inner" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Base Rate ($)</label>
                                <input type="number" value={newCategoryForm.rates.USD} onChange={e => setNewCategoryForm({...newCategoryForm, rates: { ...newCategoryForm.rates, USD: parseFloat(e.target.value) || 0 }})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-mono font-black text-sm shadow-inner" />
                            </div>
                         </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-900 flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setIsCategoryModalOpen(false)} className="uppercase font-black text-[10px] px-8 py-3">Abort</Button>
                        <Button onClick={handleCommitCategory} className="uppercase font-black text-[10px] px-12 py-3 shadow-lg shadow-indigo-600/20">Authorize Logic</Button>
                    </div>
                </div>
            </Modal>

            {/* MODAL: DEPLOY UNIT */}
            <Modal isOpen={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} title={editingRoom ? "Modify Infrastructure Node" : "Infrastructure Node Deployment"}>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Unit Nomenclature</label>
                            <input type="text" value={newRoomForm.number} onChange={e => setNewRoomForm({...newRoomForm, number: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase text-sm focus:border-indigo-500 outline-none transition-all shadow-inner" placeholder="e.g. 101" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Level (Floor)</label>
                            <input type="number" value={newRoomForm.floor} onChange={e => setNewRoomForm({...newRoomForm, floor: parseInt(e.target.value) || 1})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-mono font-black text-sm shadow-inner" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Category Hierarchy</label>
                        <select value={newRoomForm.type} onChange={e => {
                            const rt = roomTypes.find(t => t.name === e.target.value);
                            setNewRoomForm({...newRoomForm, type: e.target.value, rate: rt?.rates.NGN || 0});
                        }} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase text-xs focus:border-indigo-500 outline-none transition-all shadow-inner">
                            {roomTypes.map(rt => <option key={rt.id} value={rt.name}>{rt.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Unit Rack Rate Override (₦)</label>
                        <input type="number" value={newRoomForm.rate} onChange={e => setNewRoomForm({...newRoomForm, rate: parseFloat(e.target.value) || 0})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-mono font-black text-xl shadow-inner text-indigo-600" />
                        <p className="mt-1 text-[8px] font-bold text-slate-400 uppercase">Leaving this as-is will use the default Category Rate</p>
                    </div>
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-900 flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setIsRoomModalOpen(false)} className="uppercase font-black text-[10px] px-8 py-3">Abort</Button>
                        <Button onClick={handleCommitRoom} className="uppercase font-black text-[10px] px-12 py-3 shadow-lg shadow-indigo-600/20">Authorize Deployment</Button>
                    </div>
                </div>
            </Modal>

            {/* MODAL: TAX COMPONENT */}
            <Modal isOpen={isTaxModalOpen} onClose={() => setIsTaxModalOpen(false)} title={editingTax ? "Modify Tax Protocol" : "Statutory Component Entry"}>
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Component Designation</label>
                        <input type="text" value={taxForm.name} onChange={e => setTaxForm({...taxForm, name: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase text-sm focus:border-indigo-500 outline-none transition-all shadow-inner" placeholder="e.g. VAT" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Statutory Rate (%)</label>
                            <input type="number" value={taxForm.rate} onChange={e => setTaxForm({...taxForm, rate: parseFloat(e.target.value) || 0})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-mono font-black text-sm shadow-inner" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Computation Protocol</label>
                            <select value={taxForm.isInclusive ? 'inc' : 'exc'} onChange={e => setTaxForm({...taxForm, isInclusive: e.target.value === 'inc'})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase text-xs">
                                <option value="inc">Inclusive (Hidden)</option>
                                <option value="exc">Exclusive (Add-on)</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-900 flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setIsTaxModalOpen(false)} className="uppercase font-black text-[10px] px-8 py-3">Abort</Button>
                        <Button onClick={handleCommitTax} className="uppercase font-black text-[10px] px-12 py-3 shadow-lg shadow-indigo-600/20">Commit Statutory Rule</Button>
                    </div>
                </div>
            </Modal>

            {/* MODAL: DEFINE RACK RATE */}
            <Modal isOpen={isRatePlanModalOpen} onClose={() => setIsRatePlanModalOpen(false)} title="Rack Rate Definition">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Plan Nomenclature</label>
                            <input type="text" value={newRatePlanForm.name} onChange={e => setNewRatePlanForm({...newRatePlanForm, name: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase text-sm focus:border-indigo-500 outline-none transition-all shadow-inner" placeholder="e.g. CHRISTMAS RACK 2024" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Operational Logic (Description)</label>
                            <textarea value={newRatePlanForm.description} onChange={e => setNewRatePlanForm({...newRatePlanForm, description: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-xs italic font-bold focus:border-indigo-500 outline-none transition-all h-24 shadow-inner" placeholder="Describe the purpose or triggers for this rate plan..." />
                        </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-900 flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setIsRatePlanModalOpen(false)} className="uppercase font-black text-[10px] px-8 py-3">Abort</Button>
                        <Button onClick={handleSaveRatePlan} className="uppercase font-black text-[10px] px-12 py-3 shadow-lg shadow-indigo-600/20 transition-all active:scale-95">Commit Rate Plan Manifest</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

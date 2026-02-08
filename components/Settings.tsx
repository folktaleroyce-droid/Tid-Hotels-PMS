
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
    const [infraSubTab, setInfraSubTab] = useState<'categories' | 'units' | 'rates'>('categories');
    
    const [localProp, setLocalProp] = useState(propertyInfo);
    const [roomFilter, setRoomFilter] = useState('');
    
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [isRatePlanModalOpen, setIsRatePlanModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
    
    const [editingCategory, setEditingCategory] = useState<RoomType | null>(null);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [editingTax, setEditingTax] = useState<TaxCharge | null>(null);

    const [newRoomForm, setNewRoomForm] = useState({ number: '', type: roomTypes[0]?.name || '', floor: 1, rate: 0 });
    const [newRatePlanForm, setNewRatePlanForm] = useState({ name: '', description: '', prices: {} as Record<number, { NGN: number, USD: number }> });
    const [newCategoryForm, setNewCategoryForm] = useState({ name: '', capacity: 2, rates: { NGN: 0, USD: 0 } });
    const [taxForm, setTaxForm] = useState({ name: '', rate: 0, isInclusive: true, showOnReceipt: true });

    useEffect(() => { setLocalProp(propertyInfo); }, [propertyInfo]);

    const filteredRooms = useMemo(() => rooms.filter(r => r.number.toLowerCase().includes(roomFilter.toLowerCase())), [rooms, roomFilter]);

    const handleSaveProfile = () => { if (isAuthorized) updatePropertyInfo(localProp); };

    const openAddCategory = () => {
        setEditingCategory(null);
        setNewCategoryForm({ name: '', capacity: 2, rates: { NGN: 0, USD: 0 } });
        setIsCategoryModalOpen(true);
    };

    const handleEditCategory = (rt: RoomType) => {
        setEditingCategory(rt);
        setNewCategoryForm({ name: rt.name, capacity: rt.capacity, rates: { ...rt.rates } });
        setIsCategoryModalOpen(true);
    };

    const handleCommitCategory = () => {
        if (!newCategoryForm.name) return;
        if (editingCategory) {
            updateRoomType({ ...editingCategory, name: newCategoryForm.name, capacity: newCategoryForm.capacity, rates: newCategoryForm.rates });
        } else {
            addRoomType({ name: newCategoryForm.name, capacity: newCategoryForm.capacity, rates: newCategoryForm.rates, isActive: true } as any);
        }
        setIsCategoryModalOpen(false);
    };

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
        if (editingRoom) updateRoom({ ...editingRoom, ...newRoomForm });
        else addRoom(newRoomForm);
        setIsRoomModalOpen(false);
    };

    const handleCommitTax = () => {
        if (!taxForm.name) return;
        if (editingTax) updateTaxCharge({ ...editingTax, ...taxForm });
        else addTaxCharge({ ...taxForm, isActive: true } as any);
        setIsTaxModalOpen(false);
    };

    const BRAND_COLORS = [
        { id: 'indigo', hex: '#4f46e5', label: 'Inductive Indigo' },
        { id: 'emerald', hex: '#10b981', label: 'Ecosystem Emerald' },
        { id: 'rose', hex: '#e11d48', label: 'Authority Rose' },
        { id: 'amber', hex: '#f59e0b', label: 'Logic Amber' },
        { id: 'sky', hex: '#0ea5e9', label: 'Horizon Sky' },
        { id: 'slate', hex: '#334155', label: 'Industrial Slate' }
    ];

    const currentBrandHex = BRAND_COLORS.find(c => c.id === localProp.brandColor)?.hex || '#4f46e5';

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">System Architecture</h1>
                <p className="text-[10px] font-black uppercase tracking-widest mt-2" style={{ color: currentBrandHex }}>Operational Logic & Infrastructure Matrix</p>
              </div>
              <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700">
                <button onClick={() => setActiveTab('profile')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'profile' ? 'text-white shadow-lg' : 'text-slate-500'}`} style={{ backgroundColor: activeTab === 'profile' ? currentBrandHex : 'transparent' }}>General Profile</button>
                <button onClick={() => setActiveTab('infrastructure')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'infrastructure' ? 'text-white shadow-lg' : 'text-slate-500'}`} style={{ backgroundColor: activeTab === 'infrastructure' ? currentBrandHex : 'transparent' }}>Infrastructure</button>
                <button onClick={() => setActiveTab('financials')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'financials' ? 'text-white shadow-lg' : 'text-slate-500'}`} style={{ backgroundColor: activeTab === 'financials' ? currentBrandHex : 'transparent' }}>Statutory Rules</button>
              </div>
            </div>

            {activeTab === 'profile' && (
                <div className="animate-fade-in-right space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card title="Corporate Identity Manifest">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1">Entity nomenclature</label>
                                        <input type="text" value={localProp.name} onChange={e => setLocalProp({...localProp, name: e.target.value})} disabled={!isAuthorized} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase text-sm focus:border-indigo-500 outline-none transition-all shadow-inner" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1">Manifest Tagline</label>
                                        <input type="text" value={localProp.tagline || ''} onChange={e => setLocalProp({...localProp, tagline: e.target.value})} disabled={!isAuthorized} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-bold italic text-xs focus:border-indigo-500 outline-none transition-all shadow-inner" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1">Physical Node Registry</label>
                                        <textarea value={localProp.address} onChange={e => setLocalProp({...localProp, address: e.target.value})} disabled={!isAuthorized} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold uppercase focus:border-indigo-500 outline-none h-24 shadow-inner" />
                                    </div>
                                </div>
                            </Card>

                            <Card title="Fiscal Settlement Protocol (Bank Accounts)">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1">Account Beneficiary</label>
                                        <input type="text" value={localProp.accountName || ''} onChange={e => setLocalProp({...localProp, accountName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1">Bank Designation</label>
                                        <input type="text" value={localProp.bankName || ''} onChange={e => setLocalProp({...localProp, bankName: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1">Protocol Serial (Account #)</label>
                                        <input type="text" value={localProp.accountNumber || ''} onChange={e => setLocalProp({...localProp, accountNumber: e.target.value})} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-mono font-black text-sm" />
                                    </div>
                                </div>
                            </Card>
                        </div>
                        
                        <div className="space-y-6">
                            <Card title="Visual Identity Protocol">
                                <p className="text-[9px] font-black uppercase text-slate-400 mb-4 tracking-widest">Interface Authority Color</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {BRAND_COLORS.map(color => (
                                        <button
                                            key={color.id}
                                            onClick={() => setLocalProp({...localProp, brandColor: color.id})}
                                            className={`group relative h-12 rounded-xl border-2 transition-all ${localProp.brandColor === color.id ? 'border-slate-900 dark:border-white ring-2 ring-offset-2 dark:ring-offset-slate-950 scale-105' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                                            style={{ backgroundColor: color.hex }}
                                        >
                                            {localProp.brandColor === color.id && <div className="absolute inset-0 flex items-center justify-center bg-black/10"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg></div>}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[8px] font-black uppercase text-slate-500 mt-6 text-center tracking-widest italic opacity-60">Dictates Sidebar accents and Global UI nodes</p>
                            </Card>

                            <Card title="Operational Interface">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Operating Currency</label>
                                        <select value={localProp.currency} onChange={e => setLocalProp({...localProp, currency: e.target.value as any})} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-black uppercase text-xs">
                                            <option value="NGN">NGN (₦)</option>
                                            <option value="USD">USD ($)</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Induction (CI)</label>
                                            <input type="time" value={localProp.checkInTime} onChange={e => setLocalProp({...localProp, checkInTime: e.target.value})} className="w-full p-2 border rounded font-mono text-xs" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Release (CO)</label>
                                            <input type="time" value={localProp.checkOutTime} onChange={e => setLocalProp({...localProp, checkOutTime: e.target.value})} className="w-full p-2 border rounded font-mono text-xs" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                            {isAuthorized && <Button onClick={handleSaveProfile} className="w-full py-4 text-xs font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95" style={{ backgroundColor: currentBrandHex }}>Commit Modifications</Button>}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'infrastructure' && (
                <div className="space-y-6 animate-fade-in-right">
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit border-2 border-slate-200 dark:border-slate-800">
                        {(['categories', 'units', 'rates'] as const).map(sub => (
                            <button key={sub} onClick={() => setInfraSubTab(sub)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${infraSubTab === sub ? 'bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`} style={{ color: infraSubTab === sub ? currentBrandHex : '' }}>{sub}</button>
                        ))}
                    </div>

                    {infraSubTab === 'categories' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Hierarchy Registry</h2>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">Global Unit Category & Capacity Rules</p>
                                </div>
                                <button onClick={openAddCategory} className="text-white p-3 rounded-2xl shadow-xl transition-all flex items-center gap-2 group active:scale-95" style={{ backgroundColor: currentBrandHex }}>
                                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                                    <span className="text-[10px] font-black uppercase pr-2">Define Category</span>
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {roomTypes.map(rt => (
                                    <Card key={rt.id} className="border-t-4 group relative" style={{ borderTopColor: currentBrandHex }}>
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h4 className="font-black text-lg uppercase tracking-tight text-slate-900 dark:text-white">{rt.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Capacity: {rt.capacity} Persons</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-black font-mono" style={{ color: currentBrandHex }}>₦{rt.rates.NGN.toLocaleString()}</span>
                                                <span className="text-[8px] font-bold text-slate-400">${rt.rates.USD.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="secondary" size="sm" onClick={() => handleEditCategory(rt)} className="flex-1 text-[9px] uppercase font-black border-2 hover:border-slate-300">Edit logic</Button>
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
                                    <input type="text" placeholder="Identify specific node..." value={roomFilter} onChange={e => setRoomFilter(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase text-[10px] focus:border-indigo-500 outline-none shadow-sm" />
                                    <svg className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                                </div>
                                <button onClick={openAddRoom} className="text-white p-3 rounded-2xl shadow-xl transition-all flex items-center gap-2 group active:scale-95" style={{ backgroundColor: currentBrandHex }}>
                                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                                    <span className="text-[10px] font-black uppercase pr-2">Deploy Unit Node</span>
                                </button>
                            </div>
                            <Card>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                                            <tr>
                                                <th className="p-4 text-[10px] font-black uppercase text-slate-400">Node Identifier</th>
                                                <th className="p-4 text-[10px] font-black uppercase text-slate-400">Category</th>
                                                <th className="p-4 text-[10px] font-black uppercase text-slate-400">Custom Rate (₦)</th>
                                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRooms.map(r => (
                                                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-4 font-black text-sm uppercase">Room {r.number}</td>
                                                    <td className="p-4 text-[10px] font-black uppercase text-indigo-600">{r.type}</td>
                                                    <td className="p-4 font-mono text-xs font-black text-slate-600">₦{r.rate.toLocaleString()}</td>
                                                    <td className="p-4 text-right">
                                                        <button onClick={() => handleEditRoom(r)} className="text-indigo-600 font-black text-[10px] uppercase mr-4 hover:underline">Edit Node</button>
                                                        <button onClick={() => deleteRoom(r.id)} className="text-red-500 font-black text-[10px] uppercase hover:underline">Revoke</button>
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
                                    <p className="text-[9px] font-black uppercase text-slate-400 mt-1">Named Pricing Tiers & Authoritative Multipliers</p>
                                 </div>
                                 <button onClick={() => setIsRatePlanModalOpen(true)} className="text-white p-3 rounded-2xl shadow-xl flex items-center gap-2 group active:scale-95" style={{ backgroundColor: currentBrandHex }}>
                                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                                    <span className="text-[10px] font-black uppercase pr-2">Define Rate Plan</span>
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Card title="Primary Base Protocol" className="border-t-4 border-slate-900">
                                    <div className="space-y-4">
                                        {roomTypes.map(rt => (
                                            <div key={rt.id} className="flex justify-between items-center pb-2 border-b border-slate-100 last:border-0">
                                                <span className="text-[10px] font-black uppercase text-slate-600">{rt.name}</span>
                                                <div className="text-right flex items-center gap-3">
                                                    <div className="flex flex-col items-end">
                                                        <p className="font-black font-mono text-xs text-indigo-600">₦{rt.rates.NGN.toLocaleString()}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">${rt.rates.USD.toLocaleString()}</p>
                                                    </div>
                                                    <button onClick={() => handleEditCategory(rt)} className="p-1.5 hover:bg-slate-100 rounded-lg text-indigo-600 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'financials' && (
                <div className="animate-fade-in-right space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Fiscal Rules Engine</h2>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">Automated Taxation & Statutory Components</p>
                        </div>
                        <button onClick={() => { setEditingTax(null); setTaxForm({ name: '', rate: 0, isInclusive: true, showOnReceipt: true }); setIsTaxModalOpen(true); }} className="text-white p-3 rounded-2xl shadow-xl flex items-center gap-2 group active:scale-95" style={{ backgroundColor: currentBrandHex }}>
                            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                            <span className="text-[10px] font-black uppercase pr-2">Add Component</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {taxSettings.components.map(comp => (
                            <Card key={comp.id} className="border-t-4 group" style={{ borderTopColor: comp.isActive ? currentBrandHex : '#cbd5e1' }}>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h4 className="font-black text-lg uppercase tracking-tight">{comp.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{comp.isInclusive ? 'Inclusive' : 'Exclusive Add-on'}</p>
                                    </div>
                                    <span className="text-2xl font-black font-mono" style={{ color: currentBrandHex }}>{comp.rate}%</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm" onClick={() => { setEditingTax(comp); setTaxForm({ name: comp.name, rate: comp.rate, isInclusive: comp.isInclusive, showOnReceipt: comp.showOnReceipt }); setIsTaxModalOpen(true); }} className="flex-1 text-[9px] uppercase font-black">Configure Rule</Button>
                                    <button onClick={() => deleteTaxCharge(comp.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title={editingCategory ? "Protocol: Category Modification" : "Protocol: Category Definition"}>
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Category Nomenclature</label>
                        <input type="text" value={newCategoryForm.name} onChange={e => setNewCategoryForm({...newCategoryForm, name: e.target.value})} className="w-full p-4 border-2 rounded-2xl font-black uppercase text-sm" placeholder="e.g. EXECUTIVE SUITE" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Max Capacity</label>
                        <input type="number" value={newCategoryForm.capacity} onChange={e => setNewCategoryForm({...newCategoryForm, capacity: parseInt(e.target.value) || 1})} className="w-full p-4 border-2 rounded-2xl font-mono font-black text-sm" />
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border-2 border-dashed border-slate-200">
                         <h4 className="text-[10px] font-black uppercase text-indigo-600 mb-4 tracking-widest text-center">Authoritative Rack Rates</h4>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Base (₦)</label>
                                <input type="number" value={newCategoryForm.rates.NGN} onChange={e => setNewCategoryForm({...newCategoryForm, rates: { ...newCategoryForm.rates, NGN: parseFloat(e.target.value) || 0 }})} className="w-full p-4 border-2 rounded-2xl font-mono font-black text-center" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Base ($)</label>
                                <input type="number" value={newCategoryForm.rates.USD} onChange={e => setNewCategoryForm({...newCategoryForm, rates: { ...newCategoryForm.rates, USD: parseFloat(e.target.value) || 0 }})} className="w-full p-4 border-2 rounded-2xl font-mono font-black text-center" />
                            </div>
                         </div>
                    </div>
                    <div className="pt-6 flex justify-end gap-3 border-t">
                        <Button variant="secondary" onClick={() => setIsCategoryModalOpen(false)} className="uppercase font-black text-[10px] px-8 py-3">Abort</Button>
                        <Button onClick={handleCommitCategory} className="uppercase font-black text-[10px] px-12 py-3 shadow-2xl" style={{ backgroundColor: currentBrandHex }}>Authorise Logic</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

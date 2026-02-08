
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import { useHotelData } from '../hooks/useHotelData.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { UserRole, RoomStatus, TaxCharge } from '../types.ts';

const BRAND_COLORS = [
    { name: 'Indigo', value: 'indigo', class: 'bg-indigo-600' },
    { name: 'Emerald', value: 'emerald', class: 'bg-emerald-600' },
    { name: 'Rose', value: 'rose', class: 'bg-rose-600' },
    { name: 'Amber', value: 'amber', class: 'bg-amber-600' },
    { name: 'Sky', value: 'sky', class: 'bg-sky-600' },
    { name: 'Slate', value: 'slate', class: 'bg-slate-700' },
];

export const Settings: React.FC = () => {
    const { 
        taxSettings, setTaxSettings, propertyInfo, updatePropertyInfo, 
        rooms, addRoom, roomTypes, addRoomType,
        addTaxCharge, updateTaxCharge, deleteTaxCharge
    } = useHotelData();
    
    const { currentUser } = useAuth();
    const isAuthorized = currentUser?.role === UserRole.Manager || currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;

    const [activeTab, setActiveTab] = useState<'profile' | 'infrastructure' | 'financials'>('profile');
    const [localProp, setLocalProp] = useState(propertyInfo);
    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
    const [newTax, setNewTax] = useState<Partial<TaxCharge>>({ name: '', rate: 0, isInclusive: false, showOnReceipt: true, isActive: true });

    useEffect(() => {
        setLocalProp(propertyInfo);
    }, [propertyInfo]);

    const handlePropChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocalProp(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = () => {
        if (!isAuthorized) return;
        updatePropertyInfo(localProp);
    };

    const handleAddTax = () => {
        if (!newTax.name || newTax.rate === undefined) return;
        addTaxCharge(newTax as any);
        setIsTaxModalOpen(false);
        setNewTax({ name: '', rate: 0, isInclusive: false, showOnReceipt: true, isActive: true });
    };

    const toggleTaxActive = (tax: TaxCharge) => {
        updateTaxCharge({ ...tax, isActive: !tax.isActive });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">System Architecture</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-2">Operational Logic & Infrastructure Matrix</p>
              </div>
              <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-300 dark:border-slate-700">
                <button onClick={() => setActiveTab('profile')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>General Profile</button>
                <button onClick={() => setActiveTab('infrastructure')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'infrastructure' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Inventory Matrix</button>
                <button onClick={() => setActiveTab('financials')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'financials' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Statutory Rules</button>
              </div>
            </div>

            {activeTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card title="Corporate Identity Manifest">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Entity nomenclature</label>
                                    <input type="text" name="name" value={localProp.name} onChange={handlePropChange} disabled={!isAuthorized} className="w-full p-2.5 rounded-lg border dark:bg-slate-800 dark:border-slate-700 font-bold uppercase text-xs focus:ring-2 focus:ring-indigo-600 outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Address registry</label>
                                    <input type="text" name="address" value={localProp.address} onChange={handlePropChange} disabled={!isAuthorized} className="w-full p-2.5 rounded-lg border dark:bg-slate-800 dark:border-slate-700 text-xs uppercase focus:ring-2 focus:ring-indigo-600 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Operational Phone</label>
                                    <input type="text" name="phone" value={localProp.phone} onChange={handlePropChange} disabled={!isAuthorized} className="w-full p-2.5 rounded-lg border dark:bg-slate-800 dark:border-slate-700 font-mono text-xs" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Corporate Email</label>
                                    <input type="email" name="email" value={localProp.email} onChange={handlePropChange} disabled={!isAuthorized} className="w-full p-2.5 rounded-lg border dark:bg-slate-800 dark:border-slate-700 font-mono text-xs" />
                                </div>
                            </div>
                        </Card>
                        
                        <Card title="Brand Identity System">
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Selected Brand Color (Interface Propagation)</p>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                {BRAND_COLORS.map(color => (
                                    <button 
                                        key={color.value} 
                                        onClick={() => setLocalProp({...localProp, brandColor: color.value})}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${localProp.brandColor === color.value ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent bg-slate-50 dark:bg-slate-900'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full shadow-lg ${color.class}`}></div>
                                        <span className="text-[8px] font-black uppercase tracking-tighter">{color.name}</span>
                                    </button>
                                ))}
                            </div>
                        </Card>

                        {isAuthorized && <Button onClick={handleSaveProfile} className="w-full py-4 text-xs font-black uppercase tracking-widest">Commit modifications</Button>}
                    </div>
                    <Card title="Operational Timelines">
                         <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Induction Protocol (Check-in)</label>
                                <input type="time" name="checkInTime" value={localProp.checkInTime} onChange={handlePropChange} disabled={!isAuthorized} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 font-black text-2xl text-indigo-600 tracking-tighter" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Release Protocol (Check-out)</label>
                                <input type="time" name="checkOutTime" value={localProp.checkOutTime} onChange={handlePropChange} disabled={!isAuthorized} className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 font-black text-2xl text-indigo-600 tracking-tighter" />
                            </div>
                         </div>
                    </Card>
                </div>
            )}

            {activeTab === 'financials' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Taxation Engine</h2>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Multi-Component Statutory Node Configuration</p>
                        </div>
                        <Button onClick={() => setIsTaxModalOpen(true)} size="sm">+ New Tax Node</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {taxSettings.components.map(tax => (
                            <Card key={tax.id} className={`border-t-4 ${tax.isActive ? 'border-indigo-600' : 'border-slate-300 dark:border-slate-700 opacity-60'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white leading-none">{tax.name}</h3>
                                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1 inline-block">Component ID: {tax.id}</span>
                                    </div>
                                    <p className="text-2xl font-black text-indigo-600 font-mono">{tax.rate}%</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-6">
                                    <div className={`p-2 rounded-lg text-[9px] font-black uppercase border flex justify-between items-center ${tax.isInclusive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                        Inclusive
                                        <span>{tax.isInclusive ? 'YES' : 'NO'}</span>
                                    </div>
                                    <div className={`p-2 rounded-lg text-[9px] font-black uppercase border flex justify-between items-center ${tax.showOnReceipt ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                        Visible on Receipt
                                        <span>{tax.showOnReceipt ? 'YES' : 'NO'}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => toggleTaxActive(tax)} className="flex-1 py-2 text-[9px] font-black uppercase rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                                        {tax.isActive ? 'Suspend node' : 'Activate node'}
                                    </button>
                                    <button onClick={() => deleteTaxCharge(tax.id)} className="px-4 py-2 text-[9px] font-black uppercase text-red-600 hover:bg-red-50 rounded transition-colors">Revoke</button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <Modal isOpen={isTaxModalOpen} onClose={() => setIsTaxModalOpen(false)} title="Configure Statutory Tax Node">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nomenclature (Name)</label>
                            <input type="text" value={newTax.name} onChange={e => setNewTax({...newTax, name: e.target.value})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded font-black uppercase text-xs" placeholder="e.g. VAT, SERVICE CHARGE..." />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Statutory Rate (%)</label>
                            <input type="number" step="0.1" value={newTax.rate} onChange={e => setNewTax({...newTax, rate: parseFloat(e.target.value) || 0})} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded font-mono font-black text-lg" />
                        </div>
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="inclusive" checked={newTax.isInclusive} onChange={e => setNewTax({...newTax, isInclusive: e.target.checked})} className="w-4 h-4 accent-indigo-600" />
                                <label htmlFor="inclusive" className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">Inclusive in base price</label>
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="receipt" checked={newTax.showOnReceipt} onChange={e => setNewTax({...newTax, showOnReceipt: e.target.checked})} className="w-4 h-4 accent-indigo-600" />
                                <label htmlFor="receipt" className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">Show on resident receipt</label>
                            </div>
                        </div>
                    </div>
                    <div className="pt-6 border-t flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsTaxModalOpen(false)} className="uppercase font-black text-[10px]">Abort</Button>
                        <Button onClick={handleAddTax} className="uppercase font-black text-[10px] px-8">Authorize node</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

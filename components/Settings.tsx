import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import { useHotelData } from '../hooks/useHotelData.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { UserRole, RoomStatus } from '../types.ts';

export const Settings: React.FC = () => {
    const { 
        taxSettings, setTaxSettings, propertyInfo, updatePropertyInfo, 
        rooms, addRoom, updateRoom, deleteRoom, 
        roomTypes, addRoomType, updateRoomType, deleteRoomType,
        updateRate 
    } = useHotelData();
    
    const { currentUser } = useAuth();
    const isAuthorized = currentUser?.role === UserRole.Manager || currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;

    const [activeTab, setActiveTab] = useState<'profile' | 'infrastructure' | 'financials'>('profile');
    const [localTax, setLocalTax] = useState(taxSettings);
    const [localProp, setLocalProp] = useState(propertyInfo);
    
    // Infrastructure state
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [isRoomTypeModalOpen, setIsRoomTypeModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState({ number: '', floor: 1, type: '' });
    const [editingRoomType, setEditingRoomType] = useState({ name: '', rates: { NGN: 0, USD: 0 }, capacity: 2 });

    useEffect(() => {
        setLocalTax(taxSettings);
        setLocalProp(propertyInfo);
    }, [taxSettings, propertyInfo]);

    const handlePropChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocalProp(prev => ({ ...prev, [name]: value }));
    };

    const handleTaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setLocalTax(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : parseFloat(value) || 0,
        }));
    };
    
    const handleSaveProfile = () => {
        if (!isAuthorized) return;
        setTaxSettings(localTax);
        updatePropertyInfo(localProp);
    };

    const handleAddRoom = () => {
        if (!isAuthorized || !editingRoom.number || !editingRoom.type) return;
        // Logic: When adding a room, we map it to the selected Type
        addRoom(editingRoom);
        setIsRoomModalOpen(false);
        setEditingRoom({ number: '', floor: 1, type: '' });
    };

    const handleAddRoomType = () => {
        if (!isAuthorized || !editingRoomType.name) return;
        addRoomType(editingRoomType as any);
        setIsRoomTypeModalOpen(false);
        setEditingRoomType({ name: '', rates: { NGN: 0, USD: 0 }, capacity: 2 });
    };

    const groupedRooms = useMemo(() => {
        return roomTypes.map(rt => ({
            ...rt,
            units: rooms.filter(r => r.type === rt.name)
        }));
    }, [rooms, roomTypes]);

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

            {!isAuthorized && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-black uppercase text-amber-700 italic">Security Warning: You are operating under limited authority. Identity-linked restrictions apply to Infrastructure and Financial nodes.</p>
                </div>
            )}
            
            {activeTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card title="Corporate Identity Manifest">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Entity nomenclature</label>
                                    <input type="text" name="name" value={localProp.name} onChange={handlePropChange} disabled={!isAuthorized} className="w-full p-2.5 rounded-lg border dark:bg-slate-700 font-bold uppercase text-xs" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Address registry</label>
                                    <input type="text" name="address" value={localProp.address} onChange={handlePropChange} disabled={!isAuthorized} className="w-full p-2.5 rounded-lg border dark:bg-slate-700 text-xs uppercase" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Operational Phone</label>
                                    <input type="text" name="phone" value={localProp.phone} onChange={handlePropChange} disabled={!isAuthorized} className="w-full p-2.5 rounded-lg border dark:bg-slate-700 font-mono text-xs" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Corporate Email</label>
                                    <input type="email" name="email" value={localProp.email} onChange={handlePropChange} disabled={!isAuthorized} className="w-full p-2.5 rounded-lg border dark:bg-slate-700 font-mono text-xs" />
                                </div>
                            </div>
                        </Card>
                        {isAuthorized && <Button onClick={handleSaveProfile} className="w-full py-4 text-xs font-black uppercase tracking-widest">Commit Identity Modifications</Button>}
                    </div>
                    <Card title="Induction Timelines">
                         <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Standard Induction (Check-in)</label>
                                <input type="time" name="checkInTime" value={localProp.checkInTime} onChange={handlePropChange} disabled={!isAuthorized} className="w-full p-3 rounded-lg border dark:bg-slate-700 font-black text-2xl text-indigo-600 tracking-tighter" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Standard Release (Check-out)</label>
                                <input type="time" name="checkOutTime" value={localProp.checkOutTime} onChange={handlePropChange} disabled={!isAuthorized} className="w-full p-3 rounded-lg border dark:bg-slate-700 font-black text-2xl text-indigo-600 tracking-tighter" />
                            </div>
                         </div>
                    </Card>
                </div>
            )}

            {activeTab === 'infrastructure' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Inventory Mapping</h2>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Relationship between Units and Revenue Categories</p>
                        </div>
                        {isAuthorized && (
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={() => setIsRoomTypeModalOpen(true)}>+ New Category</Button>
                                <Button size="sm" onClick={() => setIsRoomModalOpen(true)}>+ Deploy Unit</Button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {groupedRooms.map(group => (
                            <Card key={group.id} className="overflow-hidden border-t-4 border-indigo-600">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-slate-50 dark:bg-slate-900 -m-6 p-6 border-b">
                                    <div>
                                        <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white tracking-tight">{group.name}</h3>
                                        <div className="flex gap-4 mt-1">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">Rate: <span className="text-indigo-600 font-mono">₦{group.rates.NGN.toLocaleString()}</span> / <span className="text-indigo-600 font-mono">${group.rates.USD.toLocaleString()}</span></p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">Capacity: <span className="text-slate-900 dark:text-slate-100">{group.capacity} Actors</span></p>
                                        </div>
                                    </div>
                                    <div className="mt-4 md:mt-0 text-right">
                                        <p className="text-[9px] font-black uppercase text-slate-400">Inventory Status</p>
                                        <p className="text-xs font-black text-slate-900 dark:text-white">{group.units.length} Unit(s) Assigned</p>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                    {group.units.map(unit => (
                                        <div key={unit.id} className="p-3 bg-white dark:bg-slate-700/50 border-2 border-slate-100 dark:border-slate-800 rounded-xl hover:border-indigo-500 transition-all text-center">
                                            <p className="text-[10px] font-black text-slate-400 mb-0.5">Unit</p>
                                            <h4 className="text-lg font-black uppercase tracking-tighter leading-none">{unit.number}</h4>
                                            <div className="mt-2 flex justify-center">
                                                <span className={`px-1.5 py-0.5 rounded-[4px] text-[7px] font-black uppercase ${unit.status === RoomStatus.Vacant ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {unit.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {group.units.length === 0 && (
                                        <div className="col-span-full py-6 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                            <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">Category Unpopulated</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'financials' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Statutory Billing Protocols">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border">
                                <div>
                                    <h5 className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">Automated Taxation Engine</h5>
                                    <p className="text-[8px] text-slate-400 uppercase font-bold italic mt-0.5">Global VAT/Levy calculation for all postings</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="isEnabled" className="sr-only peer" checked={localTax.isEnabled} onChange={handleTaxChange} disabled={!isAuthorized} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                            {localTax.isEnabled && (
                                <div className="p-5 border-2 border-dashed rounded-xl border-indigo-100 bg-indigo-50/20">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Standard Statutory Rate (%)</label>
                                    <input type="number" name="rate" value={localTax.rate} onChange={handleTaxChange} step="0.1" disabled={!isAuthorized} className="w-full p-4 rounded-lg border dark:bg-slate-700 font-black text-4xl text-indigo-600 tracking-tighter" />
                                </div>
                            )}
                        </div>
                        {isAuthorized && <Button onClick={handleSaveProfile} className="w-full mt-6 py-4 text-xs font-black uppercase tracking-[0.2em]">Apply Global Financial Protocol</Button>}
                    </Card>
                </div>
            )}

            {/* Infrastructure Modals */}
            <Modal isOpen={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} title="Operational Unit Deployment">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Unit Nomenclature (#)</label>
                            <input type="text" value={editingRoom.number} onChange={e => setEditingRoom({...editingRoom, number: e.target.value})} className="w-full p-3 border rounded-xl font-black text-2xl text-slate-900 dark:text-white" placeholder="e.g. 101" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Floor Designation</label>
                            <input type="number" value={editingRoom.floor} onChange={e => setEditingRoom({...editingRoom, floor: parseInt(e.target.value) || 1})} className="w-full p-3 border rounded-xl font-black text-2xl" />
                        </div>
                        <div className="col-span-2">
                             <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Parent Category Selection (Group)</label>
                             <select value={editingRoom.type} onChange={e => setEditingRoom({...editingRoom, type: e.target.value})} className="w-full p-3 border rounded-xl font-black uppercase text-sm bg-slate-50 dark:bg-slate-900">
                                <option value="">Select Category Matrix</option>
                                {roomTypes.map(rt => <option key={rt.id} value={rt.name}>{rt.name}</option>)}
                             </select>
                             <p className="text-[8px] text-slate-400 mt-2 italic px-1 uppercase font-bold">Note: This unit will automatically inherit the pricing and capacity constraints of the selected category.</p>
                        </div>
                    </div>
                    <div className="pt-6 flex justify-end gap-2 border-t mt-4">
                        <Button variant="secondary" onClick={() => setIsRoomModalOpen(false)} className="uppercase font-black text-[10px]">Abort Deployment</Button>
                        <Button onClick={handleAddRoom} className="uppercase font-black text-[10px]">Enroll Unit to Registry</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isRoomTypeModalOpen} onClose={() => setIsRoomTypeModalOpen(false)} title="Define Revenue Category Matrix">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Category Nomenclature</label>
                        <input type="text" value={editingRoomType.name} onChange={e => setEditingRoomType({...editingRoomType, name: e.target.value})} className="w-full p-3 border rounded-xl font-black uppercase text-sm" placeholder="e.g. Standard, Executive..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Base Rate (Local Currency)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</span>
                                <input type="number" value={editingRoomType.rates.NGN} onChange={e => setEditingRoomType({...editingRoomType, rates: {...editingRoomType.rates, NGN: parseFloat(e.target.value) || 0}})} className="w-full p-3 pl-8 border rounded-xl font-mono font-black text-lg" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Base Rate (FX Reserve)</label>
                             <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input type="number" value={editingRoomType.rates.USD} onChange={e => setEditingRoomType({...editingRoomType, rates: {...editingRoomType.rates, USD: parseFloat(e.target.value) || 0}})} className="w-full p-3 pl-8 border rounded-xl font-mono font-black text-lg" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Maximum Actor Capacity</label>
                        <input type="number" value={editingRoomType.capacity} onChange={e => setEditingRoomType({...editingRoomType, capacity: parseInt(e.target.value) || 2})} className="w-full p-3 border rounded-xl font-black text-lg" />
                    </div>
                    <div className="pt-6 flex justify-end gap-2 border-t mt-4">
                        <Button variant="secondary" onClick={() => setIsRoomTypeModalOpen(false)} className="uppercase font-black text-[10px]">Abort Authorization</Button>
                        <Button onClick={handleAddRoomType} className="uppercase font-black text-[10px]">Authorize New Category</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
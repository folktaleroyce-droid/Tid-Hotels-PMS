
import React, { useState, useMemo } from 'react';
import type { HotelData, InventoryItem, InventoryMovement, BaseEntity } from '../types.ts';
import { InventoryCategory } from '../types.ts';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';

const INITIAL_ITEM_FORM: Omit<InventoryItem, keyof BaseEntity | 'id'> = {
    name: '',
    category: InventoryCategory.Housekeeping,
    quantity: 0,
    unit: 'pcs',
    reorderLevel: 5,
    costPerUnit: 0,
    supplierId: undefined
};

export const Inventory: React.FC<{ hotelData: HotelData }> = ({ hotelData }) => {
    const { inventory, inventoryMovements, updateInventoryItem, addInventoryItem, suppliers, addSyncLogEntry } = hotelData;
    const [activeTab, setActiveTab] = useState<'registry' | 'ledger'>('registry');
    const [filterCategory, setFilterCategory] = useState<InventoryCategory | 'All'>('All');
    
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    
    const [adjustForm, setAdjustForm] = useState({ itemId: 0, type: 'Stock In' as InventoryMovement['type'], qty: 0, reason: '' });
    const [registerForm, setRegisterForm] = useState(INITIAL_ITEM_FORM);

    const filteredInventory = useMemo(() => {
        return inventory.filter(i => filterCategory === 'All' || i.category === filterCategory);
    }, [inventory, filterCategory]);

    const handleAdjustStock = () => {
        const item = inventory.find(i => i.id === adjustForm.itemId);
        if (!item || adjustForm.qty <= 0) {
            addSyncLogEntry('Adjustment failed: Quantity must be positive', 'error');
            return;
        }

        const delta = (adjustForm.type === 'Stock In' || adjustForm.type === 'Transfer In') ? adjustForm.qty : -adjustForm.qty;
        const newQty = item.quantity + delta;

        updateInventoryItem(
            { ...item, quantity: newQty },
            { 
              type: adjustForm.type, 
              quantity: adjustForm.qty, 
              reason: adjustForm.reason, 
              date: new Date().toISOString().split('T')[0] 
            }
        );
        setIsAdjustModalOpen(false);
        addSyncLogEntry(`Volume for ${item.name} adjusted successfully`, 'success');
    };

    const handleRegisterItem = () => {
        if (!registerForm.name || !registerForm.unit) {
            addSyncLogEntry('Registration failed: Parameters missing', 'error');
            return;
        }
        addInventoryItem(registerForm);
        setIsRegisterModalOpen(false);
        setRegisterForm(INITIAL_ITEM_FORM);
        addSyncLogEntry(`New resource ${registerForm.name} added to repository`, 'success');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Logistics & Supply</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-2">Enterprise Asset Registry</p>
              </div>
              <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700">
                <button onClick={() => setActiveTab('registry')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'registry' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Stock registry</button>
                <button onClick={() => setActiveTab('ledger')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'ledger' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Movement ledger</button>
              </div>
            </div>

            {activeTab === 'registry' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                            {['All', ...Object.values(InventoryCategory)].map(cat => (
                            <button 
                                key={cat} 
                                onClick={() => setFilterCategory(cat as any)}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filterCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
                            >
                                {cat}
                            </button>
                            ))}
                        </div>
                        <Button onClick={() => setIsRegisterModalOpen(true)} className="text-[10px] font-black uppercase">Register resource</Button>
                    </div>
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                                    <tr>
                                        <th className="p-3 text-[10px] font-black uppercase text-slate-400">Resource Designation</th>
                                        <th className="p-3 text-[10px] font-black uppercase text-slate-400">Availability</th>
                                        <th className="p-3 text-[10px] font-black uppercase text-slate-400">Critical Status</th>
                                        <th className="p-3 text-[10px] font-black uppercase text-slate-400 text-right">Operational Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInventory.map(item => (
                                        <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50">
                                            <td className="p-3">
                                                <div className="font-black text-xs uppercase text-slate-900 dark:text-white">{item.name}</div>
                                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{item.category}</div>
                                            </td>
                                            <td className="p-3">
                                                <span className={`font-mono font-black text-lg ${item.quantity <= item.reorderLevel ? 'text-red-500' : 'text-indigo-600'}`}>
                                                    {item.quantity}
                                                </span>
                                                <span className="ml-1 text-[9px] uppercase font-black text-slate-400 tracking-tighter">{item.unit}</span>
                                            </td>
                                            <td className="p-3">
                                                {item.quantity <= item.reorderLevel ? (
                                                    <div className="flex items-center gap-1.5 bg-red-100 text-red-700 px-2 py-1 rounded text-[9px] font-black uppercase border border-red-200 animate-pulse">
                                                        Critical Threshold
                                                    </div>
                                                ) : (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[9px] font-black uppercase border border-green-200">Sustainable</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-right">
                                                <Button size="sm" variant="secondary" className="text-[9px] font-black uppercase py-1" onClick={() => { setAdjustForm({ itemId: item.id, type: 'Stock In', qty: 0, reason: '' }); setIsAdjustModalOpen(true); }}>Log Flow</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'ledger' && (
                <Card title="Flow Chronology">
                    <div className="overflow-x-auto max-h-[60vh]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900 border-b sticky top-0">
                                <tr>
                                    <th className="p-3 text-[10px] font-black uppercase text-slate-400">Timeline</th>
                                    <th className="p-3 text-[10px] font-black uppercase text-slate-400">Resource</th>
                                    <th className="p-3 text-[10px] font-black uppercase text-slate-400">Flow Type</th>
                                    <th className="p-3 text-[10px] font-black uppercase text-slate-400 text-right">Volume</th>
                                    <th className="p-3 text-[10px] font-black uppercase text-slate-400">Reference</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventoryMovements.map(m => {
                                    const item = inventory.find(i => i.id === m.itemId);
                                    return (
                                        <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800">
                                            <td className="p-3 text-[10px] font-mono text-slate-500">{m.date}</td>
                                            <td className="p-3 font-black text-xs uppercase">{item?.name || 'Deleted resource'}</td>
                                            <td className="p-3">
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${['Stock In', 'Transfer In'].includes(m.type) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                    {m.type}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right font-mono font-black text-xs">{m.quantity} {item?.unit}</td>
                                            <td className="p-3 text-[10px] text-slate-400 italic">{m.reason}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Flow Registry">
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Flow protocol</label>
                        <select 
                            value={adjustForm.type} 
                            onChange={e => setAdjustForm({...adjustForm, type: e.target.value as any})}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-black uppercase text-xs focus:border-indigo-500 outline-none transition-all"
                        >
                            <option value="Stock In">Restock / Purchase (+)</option>
                            <option value="Usage">Daily Utilization (-)</option>
                            <option value="Adjustment">Audit Correction (+/-)</option>
                            <option value="Transfer Out">Site Transfer Out (-)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Unit Volume</label>
                        <input 
                            type="number" 
                            value={adjustForm.qty} 
                            onChange={e => setAdjustForm({...adjustForm, qty: parseInt(e.target.value) || 0})} 
                            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-mono font-black text-2xl text-center focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Reference designation</label>
                        <input 
                            type="text" 
                            value={adjustForm.reason} 
                            onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})} 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs uppercase font-black focus:border-indigo-500 outline-none transition-all" 
                            placeholder="e.g. SHIPMENT #002-L"
                        />
                    </div>
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-900 flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setIsAdjustModalOpen(false)} className="uppercase font-black text-[10px] px-8 py-3">Abort</Button>
                        <Button onClick={handleAdjustStock} className="uppercase font-black text-[10px] px-12 py-3 shadow-lg shadow-indigo-600/20">Commit Flow</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="Operational Enrollment">
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Resource Nomenclature</label>
                        <input 
                            type="text" 
                            value={registerForm.name} 
                            onChange={e => setRegisterForm({...registerForm, name: e.target.value})} 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-black uppercase text-xs focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Category Registry</label>
                            <select 
                                value={registerForm.category} 
                                onChange={e => setRegisterForm({...registerForm, category: e.target.value as any})} 
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase focus:border-indigo-500 outline-none transition-all"
                            >
                                {Object.values(InventoryCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Metric Unit</label>
                            <input 
                                type="text" 
                                value={registerForm.unit} 
                                onChange={e => setRegisterForm({...registerForm, unit: e.target.value})} 
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase focus:border-indigo-500 outline-none transition-all" 
                                placeholder="e.g. PCS, KG, BOTTLES"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Cost @ Unit (₦)</label>
                            <input 
                                type="number" 
                                value={registerForm.costPerUnit} 
                                onChange={e => setRegisterForm({...registerForm, costPerUnit: parseFloat(e.target.value) || 0})} 
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-mono font-black text-xs focus:border-indigo-500 outline-none transition-all"
                            />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-2 ml-1">Warning threshold</label>
                            <input 
                                type="number" 
                                value={registerForm.reorderLevel} 
                                onChange={e => setRegisterForm({...registerForm, reorderLevel: parseInt(e.target.value) || 0})} 
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-mono font-black text-xs focus:border-indigo-500 outline-none transition-all"
                            />
                         </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-900 flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setIsRegisterModalOpen(false)} className="uppercase font-black text-[10px] px-8 py-3">Abort Enrollment</Button>
                        <Button onClick={handleRegisterItem} className="uppercase font-black text-[10px] px-12 py-3 shadow-lg shadow-indigo-600/20">Enroll Resource</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

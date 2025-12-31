
import React, { useState, useMemo, useEffect } from 'react';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import { useHotelData } from '../hooks/useHotelData.ts';
import type { RoomType, Room, RatePlan, DiscountRule, TaxCharge, AuditLogEntry } from '../types.ts';
import { UserRole } from '../types.ts';

declare const XLSX: any;

type AdminTab = 'inventory' | 'rates' | 'discounts' | 'tax' | 'audit';

export const Admin: React.FC = () => {
    const hotelData = useHotelData();
    const { 
        roomTypes, rooms, ratePlans, discountRules, taxCharges, auditLog,
        addRoomType, updateRoomType, deleteRoomType, addRoom, updateRoom, deleteRoom,
        addRatePlan, updateRatePlan, deleteRatePlan, addDiscountRule, updateDiscountRule, deleteDiscountRule,
        addTaxCharge, updateTaxCharge, deleteTaxCharge, clearAllData
    } = hotelData;
    
    const [activeTab, setActiveTab] = useState<AdminTab>('inventory');

    // --- State for Modals ---
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [currentRoomType, setCurrentRoomType] = useState<Partial<RoomType>>({});
    
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [currentRoom, setCurrentRoom] = useState<Partial<Room>>({});

    const [isRateModalOpen, setIsRateModalOpen] = useState(false);
    const [currentRatePlan, setCurrentRatePlan] = useState<Partial<RatePlan>>({});

    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [currentDiscount, setCurrentDiscount] = useState<Partial<DiscountRule>>({});

    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
    const [currentTax, setCurrentTax] = useState<Partial<TaxCharge>>({});

    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

    // Search and Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [auditSearch, setAuditSearch] = useState('');

    // --- Helpers ---
    const getRoomTypeName = (id: number) => roomTypes.find(rt => rt.id === id)?.name || 'N/A';

    const handleToggleTypePublish = (type: RoomType) => {
        updateRoomType({ ...type, isActive: !type.isActive });
    };

    const handleToggleRoomPublish = (room: Room) => {
        updateRoom({ ...room, isActive: !room.isActive });
    };

    const handleSaveType = () => {
        if (!currentRoomType.name) return;
        if (currentRoomType.id) {
            updateRoomType(currentRoomType as RoomType);
        } else {
            addRoomType(currentRoomType as Omit<RoomType, 'id'>);
        }
        setIsTypeModalOpen(false);
    };

    const handleSaveRoom = () => {
        if (!currentRoom.number || !currentRoom.type) return;
        if (currentRoom.id) {
            updateRoom(currentRoom as Room);
        } else {
            addRoom({ number: currentRoom.number, type: currentRoom.type });
        }
        setIsRoomModalOpen(false);
    };

    const handleSaveRatePlan = () => {
        if (!currentRatePlan.name) return;
        if (currentRatePlan.id) {
            updateRatePlan(currentRatePlan as RatePlan);
        } else {
            addRatePlan(currentRatePlan as Omit<RatePlan, 'id'>);
        }
        setIsRateModalOpen(false);
    };

    const handleSaveDiscount = () => {
        if (!currentDiscount.name) return;
        if (currentDiscount.id) {
            updateDiscountRule(currentDiscount as DiscountRule);
        } else {
            addDiscountRule(currentDiscount as Omit<DiscountRule, 'id'>);
        }
        setIsDiscountModalOpen(false);
    };

    const handleSaveTax = () => {
        if (!currentTax.name) return;
        if (currentTax.id) {
            updateTaxCharge(currentTax as TaxCharge);
        } else {
            addTaxCharge(currentTax as Omit<TaxCharge, 'id'>);
        }
        setIsTaxModalOpen(false);
    };

    const handleExportAudit = () => {
        const data = auditLog.map(e => [e.timestamp, e.userName, e.userRole, e.action, e.entityType, e.details]);
        const ws = XLSX.utils.aoa_to_sheet([["Timestamp", "User", "Role", "Action", "Entity", "Details"], ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Audit Logs");
        XLSX.writeFile(wb, `Tide_Audit_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // --- Renderers ---
    const renderInventory = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Room Types & Physical Rooms</h3>
                <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => { setCurrentRoomType({ isActive: true, rates: { NGN: 0, USD: 0 }, capacity: 2 }); setIsTypeModalOpen(true); }}>Add Room Type</Button>
                    <Button size="sm" onClick={() => { setCurrentRoom({ number: '', type: roomTypes[0]?.name }); setIsRoomModalOpen(true); }}>Add physical Room</Button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Room Categories (Types)">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="p-2 text-xs font-bold uppercase">Type Name</th>
                                    <th className="p-2 text-xs font-bold uppercase">Status</th>
                                    <th className="p-2 text-xs font-bold uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roomTypes.map(rt => (
                                    <tr key={rt.id} className="border-b border-slate-100 dark:border-slate-800">
                                        <td className="p-2">
                                            <span className="font-semibold">{rt.name}</span>
                                            <div className="text-[10px] text-slate-500">Cap: {rt.capacity}</div>
                                        </td>
                                        <td className="p-2">
                                            <button onClick={() => handleToggleTypePublish(rt)} className={`px-2 py-0.5 rounded text-[10px] font-bold ${rt.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {rt.isActive ? 'PUBLISHED' : 'HIDDEN'}
                                            </button>
                                        </td>
                                        <td className="p-2 text-right">
                                            <button onClick={() => { setCurrentRoomType(rt); setIsTypeModalOpen(true); }} className="text-indigo-600 text-xs mr-2">Edit</button>
                                            <button onClick={() => deleteRoomType(rt.id)} className="text-red-600 text-xs">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
                <Card title="Physical Room Units">
                    <div className="overflow-x-auto max-h-[400px]">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="p-2 text-xs font-bold uppercase">Number</th>
                                    <th className="p-2 text-xs font-bold uppercase">Type</th>
                                    <th className="p-2 text-xs font-bold uppercase">Status</th>
                                    <th className="p-2 text-xs font-bold uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rooms.sort((a,b) => a.number.localeCompare(b.number, undefined, {numeric: true})).map(r => (
                                    <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800">
                                        <td className="p-2 font-mono font-bold">{r.number}</td>
                                        <td className="p-2 text-xs">{r.type}</td>
                                        <td className="p-2">
                                            <button onClick={() => handleToggleRoomPublish(r)} className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {r.isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </button>
                                        </td>
                                        <td className="p-2 text-right">
                                            <button onClick={() => { setCurrentRoom(r); setIsRoomModalOpen(true); }} className="text-indigo-600 text-xs mr-2">Edit</button>
                                            <button onClick={() => deleteRoom(r.id)} className="text-red-600 text-xs">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );

    const renderRates = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Rack Rates & Pricing Plans</h3>
                <Button size="sm" onClick={() => { setCurrentRatePlan({ isActive: true, rates: { NGN: 0, USD: 0 }, roomTypeId: roomTypes[0]?.id }); setIsRateModalOpen(true); }}>Add Rate Plan</Button>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="p-3 text-xs font-bold uppercase">Plan Name</th>
                                <th className="p-3 text-xs font-bold uppercase">Room Type</th>
                                <th className="p-3 text-xs font-bold uppercase">Rate (NGN/USD)</th>
                                <th className="p-3 text-xs font-bold uppercase">Visibility</th>
                                <th className="p-3 text-xs font-bold uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ratePlans.map(rp => (
                                <tr key={rp.id} className="border-b border-slate-100 dark:border-slate-800">
                                    <td className="p-3">
                                        <div className="font-bold">{rp.name}</div>
                                        <div className="text-[10px] text-slate-500">{rp.description}</div>
                                    </td>
                                    <td className="p-3 text-sm">{getRoomTypeName(rp.roomTypeId)}</td>
                                    <td className="p-3 text-sm font-semibold">₦{rp.rates.NGN.toLocaleString()} / ${rp.rates.USD.toLocaleString()}</td>
                                    <td className="p-3">
                                        <button onClick={() => updateRatePlan({...rp, isActive: !rp.isActive})} className={`px-2 py-0.5 rounded text-[10px] font-bold ${rp.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {rp.isActive ? 'VISIBLE' : 'HIDDEN'}
                                        </button>
                                    </td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => { setCurrentRatePlan(rp); setIsRateModalOpen(true); }} className="text-indigo-600 text-xs mr-2">Edit</button>
                                        <button onClick={() => deleteRatePlan(rp.id)} className="text-red-600 text-xs">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );

    const renderDiscounts = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Discounts & Promotional Rules</h3>
                <Button size="sm" onClick={() => { setCurrentDiscount({ isActive: true, applicableRoles: [UserRole.Manager] }); setIsDiscountModalOpen(true); }}>Create Discount</Button>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="p-3 text-xs font-bold uppercase">Label</th>
                                <th className="p-3 text-xs font-bold uppercase">Value</th>
                                <th className="p-3 text-xs font-bold uppercase">Authorized Roles</th>
                                <th className="p-3 text-xs font-bold uppercase">Publish</th>
                                <th className="p-3 text-xs font-bold uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {discountRules.map(dr => (
                                <tr key={dr.id} className="border-b border-slate-100 dark:border-slate-800">
                                    <td className="p-3 font-bold">{dr.name}</td>
                                    <td className="p-3 text-sm">{dr.type === 'percentage' ? `${dr.value}%` : `₦${dr.value.toLocaleString()}`}</td>
                                    <td className="p-3">
                                        <div className="flex flex-wrap gap-1">
                                            {dr.applicableRoles.map(role => <span key={role} className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[8px] uppercase">{role}</span>)}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <button onClick={() => updateDiscountRule({...dr, isActive: !dr.isActive})} className={`px-2 py-0.5 rounded text-[10px] font-bold ${dr.isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {dr.isActive ? 'ACTIVE' : 'DRAFT'}
                                        </button>
                                    </td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => { setCurrentDiscount(dr); setIsDiscountModalOpen(true); }} className="text-indigo-600 text-xs mr-2">Edit</button>
                                        <button onClick={() => deleteDiscountRule(dr.id)} className="text-red-600 text-xs">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );

    const renderTax = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Tax & Statutory Charges</h3>
                <Button size="sm" onClick={() => { setCurrentTax({ isActive: true, rate: 0, isInclusive: false }); setIsTaxModalOpen(true); }}>Add Tax/Charge</Button>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="p-3 text-xs font-bold uppercase">Charge Name</th>
                                <th className="p-3 text-xs font-bold uppercase">Rate (%)</th>
                                <th className="p-3 text-xs font-bold uppercase">Calculation</th>
                                <th className="p-3 text-xs font-bold uppercase">Status</th>
                                <th className="p-3 text-xs font-bold uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {taxCharges.map(tc => (
                                <tr key={tc.id} className="border-b border-slate-100 dark:border-slate-800">
                                    <td className="p-3 font-bold">{tc.name}</td>
                                    <td className="p-3 text-sm font-semibold">{tc.rate}%</td>
                                    <td className="p-3 text-xs">{tc.isInclusive ? 'Inclusive (VAT Included)' : 'Exclusive (Add-on)'}</td>
                                    <td className="p-3">
                                        <button onClick={() => updateTaxCharge({...tc, isActive: !tc.isActive})} className={`px-2 py-0.5 rounded text-[10px] font-bold ${tc.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {tc.isActive ? 'ENABLED' : 'DISABLED'}
                                        </button>
                                    </td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => { setCurrentTax(tc); setIsTaxModalOpen(true); }} className="text-indigo-600 text-xs mr-2">Edit</button>
                                        <button onClick={() => deleteTaxCharge(tc.id)} className="text-red-600 text-xs">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );

    const renderAudit = () => (
        <Card title="System-Wide Operational Audit Logs">
            <div className="flex justify-between items-center mb-4">
                <input type="text" placeholder="Search logs..." value={auditSearch} onChange={e => setAuditSearch(e.target.value)} className="w-full max-w-md p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                <Button size="sm" variant="secondary" onClick={handleExportAudit}>Export Excel</Button>
            </div>
            <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900">
                        <tr>
                            <th className="p-2 uppercase">Time</th>
                            <th className="p-2 uppercase">User</th>
                            <th className="p-2 uppercase">Action</th>
                            <th className="p-2 uppercase">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditLog.filter(e => e.details.toLowerCase().includes(auditSearch.toLowerCase())).map(e => (
                            <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="p-2 font-mono text-slate-500">{new Date(e.timestamp).toLocaleString()}</td>
                                <td className="p-2">
                                    <div className="font-bold">{e.userName}</div>
                                    <div className="text-[10px] opacity-60">{e.userRole}</div>
                                </td>
                                <td className="p-2"><span className="bg-indigo-50 dark:bg-indigo-900/30 px-1 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">{e.action}</span></td>
                                <td className="p-2 text-slate-700 dark:text-slate-300">{e.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Super Admin Control Center</h1>
                <nav className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
                    {(['inventory', 'rates', 'discounts', 'tax', 'audit'] as AdminTab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {activeTab === 'inventory' && renderInventory()}
                {activeTab === 'rates' && renderRates()}
                {activeTab === 'discounts' && renderDiscounts()}
                {activeTab === 'tax' && renderTax()}
                {activeTab === 'audit' && renderAudit()}
            </div>

            {/* Modals for CRUD operations */}
            <Modal isOpen={isTypeModalOpen} onClose={() => setIsTypeModalOpen(false)} title="Manage Room Category">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Type Name</label>
                        <input type="text" value={currentRoomType.name || ''} onChange={e => setCurrentRoomType({...currentRoomType, name: e.target.value})} className="w-full p-2 border rounded"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Base NGN</label>
                            <input type="number" value={currentRoomType.rates?.NGN || 0} onChange={e => setCurrentRoomType({...currentRoomType, rates: { ...currentRoomType.rates!, NGN: Number(e.target.value) }})} className="w-full p-2 border rounded"/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Base USD</label>
                            <input type="number" value={currentRoomType.rates?.USD || 0} onChange={e => setCurrentRoomType({...currentRoomType, rates: { ...currentRoomType.rates!, USD: Number(e.target.value) }})} className="w-full p-2 border rounded"/>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsTypeModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveType}>Save Changes</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} title="Manage Physical Room Unit">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Room Number</label>
                        <input type="text" value={currentRoom.number || ''} onChange={e => setCurrentRoom({...currentRoom, number: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. 101"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Category Type</label>
                        <select value={currentRoom.type || ''} onChange={e => setCurrentRoom({...currentRoom, type: e.target.value})} className="w-full p-2 border rounded">
                            {roomTypes.map(rt => <option key={rt.id} value={rt.name}>{rt.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsRoomModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveRoom}>Save Room</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isRateModalOpen} onClose={() => setIsRateModalOpen(false)} title="Manage Pricing Plan">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Plan Name</label>
                        <input type="text" value={currentRatePlan.name || ''} onChange={e => setCurrentRatePlan({...currentRatePlan, name: e.target.value})} className="w-full p-2 border rounded"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Applies to Type</label>
                        <select value={currentRatePlan.roomTypeId || ''} onChange={e => setCurrentRatePlan({...currentRatePlan, roomTypeId: Number(e.target.value)})} className="w-full p-2 border rounded">
                            {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Plan NGN</label>
                            <input type="number" value={currentRatePlan.rates?.NGN || 0} onChange={e => setCurrentRatePlan({...currentRatePlan, rates: { ...currentRatePlan.rates!, NGN: Number(e.target.value) }})} className="w-full p-2 border rounded"/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Plan USD</label>
                            <input type="number" value={currentRatePlan.rates?.USD || 0} onChange={e => setCurrentRatePlan({...currentRatePlan, rates: { ...currentRatePlan.rates!, USD: Number(e.target.value) }})} className="w-full p-2 border rounded"/>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsRateModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveRatePlan}>Publish Plan</Button>
                    </div>
                </div>
            </Modal>

             <Modal isOpen={isDiscountModalOpen} onClose={() => setIsDiscountModalOpen(false)} title="Discount Rule Configuration">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Label</label>
                        <input type="text" value={currentDiscount.name || ''} onChange={e => setCurrentDiscount({...currentDiscount, name: e.target.value})} className="w-full p-2 border rounded" placeholder="e.g. Staff Discount"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Type</label>
                            <select value={currentDiscount.type || 'percentage'} onChange={e => setCurrentDiscount({...currentDiscount, type: e.target.value as any})} className="w-full p-2 border rounded">
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (₦)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Value</label>
                            <input type="number" value={currentDiscount.value || 0} onChange={e => setCurrentDiscount({...currentDiscount, value: Number(e.target.value)})} className="w-full p-2 border rounded"/>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsDiscountModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveDiscount}>Activate Rule</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isTaxModalOpen} onClose={() => setIsTaxModalOpen(false)} title="Tax/Charge Settings">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Charge Name</label>
                        <input type="text" value={currentTax.name || ''} onChange={e => setCurrentTax({...currentTax, name: e.target.value})} className="w-full p-2 border rounded"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Rate (%)</label>
                        <input type="number" value={currentTax.rate || 0} onChange={e => setCurrentTax({...currentTax, rate: Number(e.target.value)})} className="w-full p-2 border rounded"/>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="tax-inc" checked={currentTax.isInclusive || false} onChange={e => setCurrentTax({...currentTax, isInclusive: e.target.checked})}/>
                        <label htmlFor="tax-inc" className="text-sm">Is this tax inclusive in the rack rate?</label>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsTaxModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveTax}>Apply Tax</Button>
                    </div>
                </div>
            </Modal>

            {/* Clear Data Confirmation */}
            <Card title="Danger Zone" className="border-red-500/50 mt-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-red-600">Full System Reset</h4>
                        <p className="text-xs text-slate-500">Irreversibly delete all guest files, financial ledgers, and configurations.</p>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => setIsClearModalOpen(true)}>Factory Reset</Button>
                </div>
            </Card>

            <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} title="WARNING: DESTRUCTIVE ACTION">
                <div className="space-y-4">
                    <p className="text-red-600 font-bold">This will wipe the entire PMS database. This cannot be undone.</p>
                    <p>Are you absolutely sure you want to proceed?</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsClearModalOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={() => { clearAllData(); setIsClearModalOpen(false); }}>Yes, Reset Database</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

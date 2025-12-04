
import React, { useState, useMemo } from 'react';
import type { HotelData, InventoryItem, Supplier } from '../types.ts';
import { InventoryCategory } from '../types.ts';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';

interface InventoryProps {
    hotelData: HotelData;
}

const INITIAL_ITEM_STATE: Omit<InventoryItem, 'id'> = {
    name: '',
    category: InventoryCategory.Housekeeping,
    quantity: 0,
    unit: 'pcs',
    reorderLevel: 0,
    costPerUnit: 0,
    supplierId: 0,
    location: '',
};

const INITIAL_SUPPLIER_STATE: Omit<Supplier, 'id'> = {
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    category: 'General',
};

// --- Sub-component: Purchase Order View (for printing) ---
const PurchaseOrderPrintView: React.FC<{ supplier: Supplier, items: { item: InventoryItem, orderQty: number }[] }> = ({ supplier, items }) => {
    const totalCost = items.reduce((acc, { item, orderQty }) => acc + (item.costPerUnit * orderQty), 0);

    return (
        <div className="p-4 bg-white text-black print:block">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">Purchase Order</h2>
                <p className="text-sm">Tidé Hotels and Resorts</p>
                <p className="text-sm text-slate-500">Date: {new Date().toLocaleDateString()}</p>
            </div>
            
            <div className="mb-6 grid grid-cols-2 gap-8">
                <div>
                    <h3 className="font-bold text-lg mb-2">Vendor:</h3>
                    <p className="font-bold">{supplier.name}</p>
                    <p>{supplier.contactPerson}</p>
                    <p>{supplier.email}</p>
                    <p>{supplier.phone}</p>
                    <p>{supplier.address}</p>
                </div>
                <div className="text-right">
                    <h3 className="font-bold text-lg mb-2">Ship To:</h3>
                    <p className="font-bold">Tidé Hotels Procurement</p>
                    <p>123 Hotel Avenue</p>
                    <p>Lagos, Nigeria</p>
                </div>
            </div>

            <table className="w-full text-left border-collapse border border-slate-300">
                <thead>
                    <tr className="bg-slate-100">
                        <th className="border border-slate-300 p-2">Item Name</th>
                        <th className="border border-slate-300 p-2">Unit</th>
                        <th className="border border-slate-300 p-2 text-right">Quantity</th>
                        <th className="border border-slate-300 p-2 text-right">Unit Cost</th>
                        <th className="border border-slate-300 p-2 text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(({ item, orderQty }) => (
                        <tr key={item.id}>
                            <td className="border border-slate-300 p-2">{item.name}</td>
                            <td className="border border-slate-300 p-2">{item.unit}</td>
                            <td className="border border-slate-300 p-2 text-right">{orderQty}</td>
                            <td className="border border-slate-300 p-2 text-right">₦{item.costPerUnit.toLocaleString()}</td>
                            <td className="border border-slate-300 p-2 text-right">₦{(item.costPerUnit * orderQty).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                     <tr>
                        <td colSpan={4} className="border border-slate-300 p-2 text-right font-bold">Grand Total</td>
                        <td className="border border-slate-300 p-2 text-right font-bold">₦{totalCost.toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>
            
            <div className="mt-12 pt-8 border-t border-slate-400 grid grid-cols-2 gap-8">
                <div>
                     <p>Authorized Signature: _______________________</p>
                </div>
                <div>
                     <p>Date: _______________________</p>
                </div>
            </div>
        </div>
    );
};


export const Inventory: React.FC<InventoryProps> = ({ hotelData }) => {
    const { inventory, suppliers, addInventoryItem, updateInventoryItem, deleteInventoryItem, addSupplier, updateSupplier, deleteSupplier } = hotelData;
    const [activeTab, setActiveTab] = useState<'housekeeping' | 'fnb' | 'suppliers' | 'po'>('housekeeping');
    
    // --- State for Item Modal ---
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [itemModalMode, setItemModalMode] = useState<'add' | 'edit'>('add');
    const [currentItem, setCurrentItem] = useState<Omit<InventoryItem, 'id'> | InventoryItem>(INITIAL_ITEM_STATE);

    // --- State for Supplier Modal ---
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [supplierModalMode, setSupplierModalMode] = useState<'add' | 'edit'>('add');
    const [currentSupplier, setCurrentSupplier] = useState<Omit<Supplier, 'id'> | Supplier>(INITIAL_SUPPLIER_STATE);
    
    // --- State for PO Generator ---
    const [poSupplierId, setPoSupplierId] = useState<string>('');
    const [poItems, setPoItems] = useState<{ [itemId: number]: number }>({});
    const [isPOPrintModalOpen, setIsPOPrintModalOpen] = useState(false);


    // --- Filtering ---
    const filteredInventory = useMemo(() => {
        if (activeTab === 'housekeeping') {
            return inventory.filter(i => i.category === InventoryCategory.Housekeeping);
        } else if (activeTab === 'fnb') {
            return inventory.filter(i => i.category === InventoryCategory.FoodAndBeverage);
        }
        return [];
    }, [inventory, activeTab]);
    
    // --- Item Handlers ---
    const openAddItemModal = () => {
        setCurrentItem({
            ...INITIAL_ITEM_STATE,
            category: activeTab === 'housekeeping' ? InventoryCategory.Housekeeping : InventoryCategory.FoodAndBeverage
        });
        setItemModalMode('add');
        setIsItemModalOpen(true);
    };

    const openEditItemModal = (item: InventoryItem) => {
        setCurrentItem(item);
        setItemModalMode('edit');
        setIsItemModalOpen(true);
    };

    const handleSaveItem = () => {
        if (!currentItem.name || !currentItem.quantity) return alert('Name and Quantity are required');
        
        if (itemModalMode === 'add') {
            addInventoryItem(currentItem as Omit<InventoryItem, 'id'>);
        } else {
            updateInventoryItem(currentItem as InventoryItem);
        }
        setIsItemModalOpen(false);
    };
    
    const handleDeleteItem = (id: number) => {
        if (confirm('Delete this inventory item?')) deleteInventoryItem(id);
    };

    // --- Supplier Handlers ---
    const openAddSupplierModal = () => {
        setCurrentSupplier(INITIAL_SUPPLIER_STATE);
        setSupplierModalMode('add');
        setIsSupplierModalOpen(true);
    };

    const openEditSupplierModal = (supplier: Supplier) => {
        setCurrentSupplier(supplier);
        setSupplierModalMode('edit');
        setIsSupplierModalOpen(true);
    };

    const handleSaveSupplier = () => {
        if (!currentSupplier.name) return alert('Supplier name is required');
        if (supplierModalMode === 'add') {
            addSupplier(currentSupplier as Omit<Supplier, 'id'>);
        } else {
            updateSupplier(currentSupplier as Supplier);
        }
        setIsSupplierModalOpen(false);
    };
    
    const handleDeleteSupplier = (id: number) => {
        if (confirm('Delete this supplier?')) deleteSupplier(id);
    };

    // --- PO Logic ---
    const itemsForSelectedSupplier = useMemo(() => {
        if(!poSupplierId) return [];
        return inventory.filter(i => i.supplierId === parseInt(poSupplierId));
    }, [inventory, poSupplierId]);

    // Auto-populate PO quantities based on deficit
    const handleSupplierSelectForPO = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const suppId = e.target.value;
        setPoSupplierId(suppId);
        if(suppId) {
             const items = inventory.filter(i => i.supplierId === parseInt(suppId));
             const initialQtys: {[key:number]: number} = {};
             items.forEach(item => {
                 if (item.quantity <= item.reorderLevel) {
                     // Suggest reordering up to double the reorder level or a fixed amount
                     initialQtys[item.id] = (item.reorderLevel * 2) - item.quantity;
                 } else {
                     initialQtys[item.id] = 0;
                 }
             });
             setPoItems(initialQtys);
        }
    };
    
    const getSelectedPOItems = () => {
        return itemsForSelectedSupplier
            .filter(item => (poItems[item.id] || 0) > 0)
            .map(item => ({ item, orderQty: poItems[item.id] }));
    };

    const renderInventoryTable = (items: InventoryItem[]) => (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-200 dark:bg-slate-700">
                    <tr>
                        <th className="p-3">Item Name</th>
                        <th className="p-3">Stock Level</th>
                        <th className="p-3">Reorder Level</th>
                        <th className="p-3">Unit Cost</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Supplier</th>
                        <th className="p-3 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => {
                         const isLowStock = item.quantity <= item.reorderLevel;
                         const supplier = suppliers.find(s => s.id === item.supplierId)?.name || 'N/A';
                         return (
                            <tr key={item.id} className={`border-b border-slate-200 dark:border-slate-700 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                                <td className="p-3 font-medium">
                                    {item.name}
                                    {item.expiryDate && <div className="text-xs text-slate-500">Exp: {item.expiryDate}</div>}
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${isLowStock ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 animate-pulse' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                                        {item.quantity} {item.unit}
                                    </span>
                                </td>
                                <td className="p-3 text-sm text-slate-600 dark:text-slate-400">{item.reorderLevel} {item.unit}</td>
                                <td className="p-3 text-sm">₦{item.costPerUnit.toLocaleString()}</td>
                                <td className="p-3 text-sm">{item.location || '-'}</td>
                                <td className="p-3 text-sm">{supplier}</td>
                                <td className="p-3 text-center">
                                    <div className="flex justify-center space-x-2">
                                        <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => openEditItemModal(item)}>Edit</Button>
                                        <Button variant="secondary" className="px-2 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400" onClick={() => handleDeleteItem(item.id)}>Delete</Button>
                                    </div>
                                </td>
                            </tr>
                         )
                    })}
                </tbody>
            </table>
            {items.length === 0 && <p className="text-center py-8 text-slate-500">No items found.</p>}
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory Management</h1>
            
            {/* Tabs */}
            <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 pb-1 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('housekeeping')} 
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'housekeeping' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                    Housekeeping Supplies
                </button>
                <button 
                    onClick={() => setActiveTab('fnb')} 
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'fnb' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                    F&B Inventory
                </button>
                <button 
                    onClick={() => setActiveTab('suppliers')} 
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'suppliers' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                    Supplier Management
                </button>
                 <button 
                    onClick={() => setActiveTab('po')} 
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'po' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                    Generate PO
                </button>
            </div>

            {/* Content Areas */}
            {(activeTab === 'housekeeping' || activeTab === 'fnb') && (
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">{activeTab === 'housekeeping' ? 'Housekeeping Stock' : 'Food & Beverage Stock'}</h2>
                        <Button onClick={openAddItemModal}>Add New Item</Button>
                    </div>
                    {renderInventoryTable(filteredInventory)}
                </Card>
            )}

            {activeTab === 'suppliers' && (
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Approved Suppliers</h2>
                        <Button onClick={openAddSupplierModal}>Add Supplier</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-200 dark:bg-slate-700">
                                <tr>
                                    <th className="p-3">Company Name</th>
                                    <th className="p-3">Contact Person</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Category</th>
                                    <th className="p-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.map((supplier, index) => (
                                    <tr key={supplier.id} className={`border-b border-slate-200 dark:border-slate-700 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                                        <td className="p-3 font-medium">{supplier.name}</td>
                                        <td className="p-3">{supplier.contactPerson}</td>
                                        <td className="p-3">{supplier.email}</td>
                                        <td className="p-3"><span className="px-2 py-1 text-xs bg-slate-200 dark:bg-slate-600 rounded-full">{supplier.category}</span></td>
                                        <td className="p-3 text-center">
                                            <div className="flex justify-center space-x-2">
                                                <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => openEditSupplierModal(supplier)}>Edit</Button>
                                                <Button variant="secondary" className="px-2 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400" onClick={() => handleDeleteSupplier(supplier.id)}>Delete</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === 'po' && (
                <Card title="Purchase Order Generator">
                     <div className="mb-6 max-w-md">
                         <label className="block text-sm font-medium mb-1">Select Supplier</label>
                         <select className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" value={poSupplierId} onChange={handleSupplierSelectForPO}>
                             <option value="">-- Choose Supplier --</option>
                             {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                         </select>
                     </div>
                     
                     {poSupplierId && itemsForSelectedSupplier.length > 0 && (
                         <div className="space-y-4">
                             <h3 className="font-semibold text-lg">Order Items</h3>
                             <div className="overflow-x-auto max-h-[50vh]">
                                 <table className="w-full text-left">
                                     <thead className="bg-slate-100 dark:bg-slate-700">
                                         <tr>
                                             <th className="p-2">Item</th>
                                             <th className="p-2">In Stock</th>
                                             <th className="p-2">Reorder Level</th>
                                             <th className="p-2 w-32">Order Qty</th>
                                         </tr>
                                     </thead>
                                     <tbody>
                                         {itemsForSelectedSupplier.map(item => {
                                             const isLow = item.quantity <= item.reorderLevel;
                                             return (
                                                 <tr key={item.id} className="border-b border-slate-200 dark:border-slate-700">
                                                     <td className="p-2 font-medium">
                                                         {item.name} 
                                                         {isLow && <span className="ml-2 text-xs text-red-500 font-bold">(Low Stock)</span>}
                                                     </td>
                                                     <td className="p-2 text-sm">{item.quantity} {item.unit}</td>
                                                     <td className="p-2 text-sm">{item.reorderLevel} {item.unit}</td>
                                                     <td className="p-2">
                                                         <input 
                                                            type="number" 
                                                            min="0"
                                                            className="w-full p-1 border border-slate-300 rounded"
                                                            value={poItems[item.id] || 0}
                                                            onChange={(e) => setPoItems({...poItems, [item.id]: parseInt(e.target.value) || 0})}
                                                         />
                                                     </td>
                                                 </tr>
                                             );
                                         })}
                                     </tbody>
                                 </table>
                             </div>
                             <div className="pt-4 border-t border-slate-200 dark:border-slate-700 text-right">
                                 <Button onClick={() => setIsPOPrintModalOpen(true)} disabled={getSelectedPOItems().length === 0}>
                                     Preview & Print Order
                                 </Button>
                             </div>
                         </div>
                     )}
                     
                     {poSupplierId && itemsForSelectedSupplier.length === 0 && (
                         <p className="text-slate-500 italic">No inventory items associated with this supplier.</p>
                     )}
                </Card>
            )}

            {/* Item Modal */}
            <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title={itemModalMode === 'add' ? 'Add Inventory Item' : 'Edit Item'}>
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                             <label className="block text-sm font-medium mb-1">Item Name</label>
                             <input type="text" value={currentItem.name} onChange={e => setCurrentItem({...currentItem, name: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1">Category</label>
                             <select value={currentItem.category} onChange={e => setCurrentItem({...currentItem, category: e.target.value as InventoryCategory})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                                 <option value={InventoryCategory.Housekeeping}>Housekeeping</option>
                                 <option value={InventoryCategory.FoodAndBeverage}>F&B</option>
                             </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1">Quantity</label>
                             <input type="number" value={currentItem.quantity} onChange={e => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 0})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1">Unit (e.g., pcs, kg)</label>
                             <input type="text" value={currentItem.unit} onChange={e => setCurrentItem({...currentItem, unit: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1">Reorder Level</label>
                             <input type="number" value={currentItem.reorderLevel} onChange={e => setCurrentItem({...currentItem, reorderLevel: parseInt(e.target.value) || 0})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1">Unit Cost (₦)</label>
                             <input type="number" value={currentItem.costPerUnit} onChange={e => setCurrentItem({...currentItem, costPerUnit: parseFloat(e.target.value) || 0})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1">Supplier</label>
                             <select value={currentItem.supplierId || ''} onChange={e => setCurrentItem({...currentItem, supplierId: parseInt(e.target.value) || 0})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                                 <option value={0}>-- Select Supplier --</option>
                                 {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                             </select>
                        </div>
                         <div className="col-span-2">
                             <label className="block text-sm font-medium mb-1">Storage Location</label>
                             <input type="text" value={currentItem.location || ''} onChange={e => setCurrentItem({...currentItem, location: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                        {currentItem.category === InventoryCategory.FoodAndBeverage && (
                             <div className="col-span-2">
                                 <label className="block text-sm font-medium mb-1">Expiry Date</label>
                                 <input type="date" value={currentItem.expiryDate || ''} onChange={e => setCurrentItem({...currentItem, expiryDate: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsItemModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveItem}>Save Item</Button>
                    </div>
                </div>
            </Modal>

            {/* Supplier Modal */}
            <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title={supplierModalMode === 'add' ? 'Add Supplier' : 'Edit Supplier'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Company Name</label>
                        <input type="text" value={currentSupplier.name} onChange={e => setCurrentSupplier({...currentSupplier, name: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select value={currentSupplier.category} onChange={e => setCurrentSupplier({...currentSupplier, category: e.target.value as any})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                             <option value="General">General</option>
                             <option value={InventoryCategory.Housekeeping}>Housekeeping</option>
                             <option value={InventoryCategory.FoodAndBeverage}>F&B</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Contact Person</label>
                        <input type="text" value={currentSupplier.contactPerson} onChange={e => setCurrentSupplier({...currentSupplier, contactPerson: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" value={currentSupplier.email} onChange={e => setCurrentSupplier({...currentSupplier, email: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <input type="tel" value={currentSupplier.phone} onChange={e => setCurrentSupplier({...currentSupplier, phone: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <textarea rows={2} value={currentSupplier.address} onChange={e => setCurrentSupplier({...currentSupplier, address: e.target.value})} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsSupplierModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSupplier}>Save Supplier</Button>
                    </div>
                </div>
            </Modal>

            {/* PO Preview Modal */}
            <Modal isOpen={isPOPrintModalOpen} onClose={() => setIsPOPrintModalOpen(false)} title="Purchase Order Preview">
                <div className="max-h-[80vh] overflow-y-auto">
                    {poSupplierId && (
                        <PurchaseOrderPrintView 
                            supplier={suppliers.find(s => s.id === parseInt(poSupplierId))!} 
                            items={getSelectedPOItems()}
                        />
                    )}
                    <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 no-print">
                        <Button variant="secondary" onClick={() => setIsPOPrintModalOpen(false)}>Close</Button>
                        <Button onClick={() => window.print()}>Print</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

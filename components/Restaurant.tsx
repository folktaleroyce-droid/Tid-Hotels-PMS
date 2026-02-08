
import React, { useState } from 'react';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import type { HotelData, Room, MenuItem } from '../types.ts';
import { RoomStatus, UserRole } from '../types.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

interface RestaurantProps {
    hotelData: HotelData;
}

type OrderItem = { name: string; price: number; quantity: number };

export const Restaurant: React.FC<RestaurantProps> = ({ hotelData }) => {
    const { rooms, addOrder, addTransaction, menuItems, addMenuItem, updateMenuItem, deleteMenuItem } = hotelData;
    const { currentUser } = useAuth();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
    
    // Menu Management State
    const [newMenuItem, setNewMenuItem] = useState({ name: '', price: '', category: 'Food' as MenuItem['category'] });

    const isManager = currentUser?.role === UserRole.Manager || currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;
    const occupiedRooms = rooms.filter(r => r.status === RoomStatus.Occupied);

    const handleAddToOrder = (menuItem: MenuItem) => {
        setCurrentOrder(prevOrder => {
            const existingItem = prevOrder.find(item => item.name === menuItem.name);
            if (existingItem) {
                return prevOrder.map(item => item.name === menuItem.name ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prevOrder, { name: menuItem.name, price: menuItem.price, quantity: 1 }];
        });
    };

    const handlePlaceOrder = () => {
        if (!selectedRoom || currentOrder.length === 0) return;
        const total = currentOrder.reduce((acc, item) => acc + item.price * item.quantity, 0);
        addOrder({
            roomId: selectedRoom.id,
            items: currentOrder,
            total,
            status: 'Pending'
        });
        if (selectedRoom.guestId) {
            addTransaction({
                guestId: selectedRoom.guestId,
                description: `POS Catering: ${currentOrder.map(i => `${i.quantity}x ${i.name}`).join(', ')}`,
                amount: total,
                date: new Date().toISOString().split('T')[0],
                type: 'charge'
            });
        }
        setIsModalOpen(false);
        setCurrentOrder([]);
    };

    const handleSaveMenuItem = () => {
        if (!newMenuItem.name || !newMenuItem.price) return;
        addMenuItem({
            name: newMenuItem.name,
            price: parseFloat(newMenuItem.price),
            category: newMenuItem.category,
            isActive: true
        });
        setNewMenuItem({ name: '', price: '', category: 'Food' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Catering Terminal</h1>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-1">POS & Price Control Board</p>
                </div>
                {isManager && <Button variant="secondary" onClick={() => setIsMenuModalOpen(true)}>Manage Menu Prices</Button>}
            </div>

            <Card title="Operational Service Matrix">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {occupiedRooms.length > 0 ? occupiedRooms.map(room => (
                        <div key={room.id} className="p-4 rounded-xl shadow-md border-2 border-slate-200 dark:border-slate-700 text-center hover:border-indigo-500 transition-all bg-white dark:bg-slate-800">
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Unit</p>
                            <h4 className="font-black text-xl uppercase tracking-tighter">{room.number}</h4>
                            <Button className="mt-4 w-full uppercase font-black text-[10px] py-2" onClick={() => { setSelectedRoom(room); setIsModalOpen(true); }}>Open Session</Button>
                        </div>
                    )) : (
                      <div className="col-span-full py-40 text-center opacity-30">
                        <p className="text-sm font-black uppercase tracking-[0.2em]">Residency manifest clear: No active service units</p>
                      </div>
                    )}
                </div>
            </Card>

            {/* Service Session Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Active Service Session: Unit ${selectedRoom?.number}`}>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-black text-[10px] uppercase text-slate-400 mb-4 tracking-widest">Revenue Items</h4>
                        <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-2">
                            {menuItems.filter(m => m.isActive).map(item => (
                                <button key={item.id} onClick={() => handleAddToOrder(item)} className="p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg hover:border-indigo-500 transition-all text-left">
                                    <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white truncate">{item.name}</p>
                                    <p className="text-[11px] font-black text-indigo-600 font-mono mt-1">₦{item.price.toLocaleString()}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col border-l pl-6 border-slate-100 dark:border-slate-800">
                        <h4 className="font-black text-[10px] uppercase text-indigo-600 mb-4 tracking-widest">Order Manifest</h4>
                        <div className="flex-1 space-y-2 overflow-y-auto pr-2 max-h-[40vh]">
                            {currentOrder.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[11px] font-bold uppercase p-2 bg-slate-50 rounded border">
                                    <span>{item.quantity}x {item.name}</span>
                                    <span className="font-mono text-slate-500">₦{(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                            {currentOrder.length === 0 && <p className="text-center py-20 text-[10px] font-black uppercase text-slate-300">Session manifest empty</p>}
                        </div>
                        <div className="mt-6 pt-4 border-t-2">
                             <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black uppercase text-slate-400">Debt to Folio</span>
                                <p className="font-black text-2xl text-indigo-600 font-mono tracking-tighter">₦{currentOrder.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString()}</p>
                             </div>
                             <Button onClick={handlePlaceOrder} disabled={currentOrder.length === 0} className="w-full py-3 uppercase font-black">Commit to Guest Ledger</Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Menu Price Control Modal */}
            <Modal isOpen={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)} title="F&B Price Registry & Control">
                <div className="space-y-6">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-indigo-200">
                        <h5 className="text-[10px] font-black uppercase text-indigo-600 mb-3">Enroll New Commodity</h5>
                        <div className="grid grid-cols-3 gap-3">
                            <input type="text" value={newMenuItem.name} onChange={e => setNewMenuItem({...newMenuItem, name: e.target.value})} placeholder="Designation" className="p-2 border rounded font-black uppercase text-xs col-span-2" />
                            <input type="number" value={newMenuItem.price} onChange={e => setNewMenuItem({...newMenuItem, price: e.target.value})} placeholder="Valuation" className="p-2 border rounded font-mono font-black text-xs" />
                            <select value={newMenuItem.category} onChange={e => setNewMenuItem({...newMenuItem, category: e.target.value as any})} className="p-2 border rounded font-black uppercase text-[10px]">
                                <option value="Food">Meals</option>
                                <option value="Drink">Beverages</option>
                            </select>
                            <Button onClick={handleSaveMenuItem} className="col-span-2 text-[10px] font-black uppercase">Authorize Item</Button>
                        </div>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto pr-2">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 sticky top-0 border-b">
                                <tr>
                                    <th className="p-2 text-[9px] font-black uppercase text-slate-400">Designation</th>
                                    <th className="p-2 text-[9px] font-black uppercase text-slate-400 text-right">nominal Price</th>
                                    <th className="p-2 text-[9px] font-black uppercase text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {menuItems.map(mi => (
                                    <tr key={mi.id} className="border-b text-xs font-bold uppercase">
                                        <td className="p-2">{mi.name}</td>
                                        <td className="p-2 text-right font-mono">₦{mi.price.toLocaleString()}</td>
                                        <td className="p-2 text-right"><button onClick={() => deleteMenuItem(mi.id)} className="text-red-500 hover:underline">Revoke</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

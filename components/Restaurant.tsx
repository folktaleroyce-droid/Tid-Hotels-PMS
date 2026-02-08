import React, { useState, useMemo } from 'react';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import type { HotelData, Room, MenuItem, Guest } from '../types.ts';
import { RoomStatus, UserRole, LoyaltyTier } from '../types.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { LOYALTY_TIER_THEME } from '../constants.tsx';
import { POSDocket } from './restaurant/POSDocket.tsx';

interface RestaurantProps {
    hotelData: HotelData;
}

type OrderItem = { name: string; price: number; quantity: number };

export const Restaurant: React.FC<RestaurantProps> = ({ hotelData }) => {
    const { 
        rooms, guests, transactions, addOrder, addTransaction, 
        menuItems, addMenuItem, deleteMenuItem, addSyncLogEntry 
    } = hotelData;
    const { currentUser } = useAuth();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
    const [isDocketOpen, setIsDocketOpen] = useState(false);
    
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
    const [roomSearch, setRoomSearch] = useState('');
    const [showOnlyOccupied, setShowOnlyOccupied] = useState(true);
    
    // Last successful order details for printing
    const [lastOrderDetails, setLastOrderDetails] = useState<{ room: string, guest?: string, items: OrderItem[], total: number } | null>(null);

    // Menu Management State
    const [newMenuItem, setNewMenuItem] = useState({ name: '', price: '', category: 'Food' as MenuItem['category'] });

    const isManager = currentUser?.role === UserRole.Manager || currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;

    const filteredRooms = useMemo(() => {
        return rooms.filter(r => {
            const matchesSearch = r.number.includes(roomSearch);
            const matchesStatus = showOnlyOccupied ? r.status === RoomStatus.Occupied : true;
            return matchesSearch && matchesStatus;
        });
    }, [rooms, roomSearch, showOnlyOccupied]);

    const activeGuest = useMemo(() => {
        if (!selectedRoom?.guestId) return null;
        return guests.find(g => g.id === selectedRoom.guestId) || null;
    }, [selectedRoom, guests]);

    const guestFolioBalance = useMemo(() => {
        if (!activeGuest) return 0;
        return transactions
            .filter(t => t.guestId === activeGuest.id)
            .reduce((acc, t) => acc + t.amount, 0);
    }, [activeGuest, transactions]);

    const handleOpenSession = (room: Room) => {
        setCurrentOrder([]);
        setSelectedRoom(room);
        setIsModalOpen(true);
    };

    const handleCloseSession = () => {
        setIsModalOpen(false);
        setCurrentOrder([]);
        setSelectedRoom(null);
    };

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
            addSyncLogEntry(`Order posted to Unit ${selectedRoom.number} Folio`, 'success');
        }

        // Store details for docket printing
        setLastOrderDetails({
            room: selectedRoom.number,
            guest: activeGuest?.name,
            items: [...currentOrder],
            total: total
        });

        handleCloseSession();
        setIsDocketOpen(true);
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-1">POS & Revenue Management</p>
                </div>
                {isManager && <Button variant="secondary" onClick={() => setIsMenuModalOpen(true)}>Price Registry</Button>}
            </div>

            <Card title="Infrastructure Matrix Selection">
                <div className="flex flex-col md:flex-row gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex-1">
                        <input 
                            type="text" 
                            placeholder="Identify Unit Number..." 
                            value={roomSearch}
                            onChange={(e) => setRoomSearch(e.target.value)}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-black uppercase text-xs focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-black uppercase text-slate-400">Status Filtering:</span>
                        <button 
                            onClick={() => setShowOnlyOccupied(true)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${showOnlyOccupied ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-500'}`}
                        >
                            Residents
                        </button>
                        <button 
                            onClick={() => setShowOnlyOccupied(false)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${!showOnlyOccupied ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-500'}`}
                        >
                            Global Registry
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredRooms.length > 0 ? filteredRooms.map(room => {
                        const guest = room.guestId ? guests.find(g => g.id === room.guestId) : null;
                        return (
                            <div 
                                key={room.id} 
                                onClick={() => handleOpenSession(room)}
                                className={`p-4 rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:shadow-lg active:scale-95 ${room.status === RoomStatus.Occupied ? 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-900/50' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-black text-2xl uppercase tracking-tighter leading-none">{room.number}</h4>
                                    <div className={`w-2 h-2 rounded-full ${room.status === RoomStatus.Occupied ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                </div>
                                <p className="text-[9px] font-black uppercase text-slate-400 mb-2 truncate">{guest?.name || 'Vacant Unit'}</p>
                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                     <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-slate-900 text-white rounded">Open Session</span>
                                </div>
                            </div>
                        );
                    }) : (
                      <div className="col-span-full py-20 text-center opacity-30 border-2 border-dashed rounded-3xl">
                        <p className="text-xs font-black uppercase tracking-[0.2em]">Registry Vacant: Refine Search Protocol</p>
                      </div>
                    )}
                </div>
            </Card>

            {/* Service Session Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={handleCloseSession} 
                title={`Terminal: Unit ${selectedRoom?.number}`}
            >
                <div className="flex flex-col gap-6">
                    {/* High Contrast Guest Context Header */}
                    <div className="p-5 bg-slate-900 dark:bg-black rounded-2xl border border-slate-800 text-white shadow-xl">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-widest">Resident Identity</p>
                                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">{activeGuest?.name || 'UNREGISTERED ENTITY'}</h3>
                                {activeGuest && (
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${LOYALTY_TIER_THEME[activeGuest.loyaltyTier].bg} ${LOYALTY_TIER_THEME[activeGuest.loyaltyTier].text}`}>
                                            {activeGuest.loyaltyTier} MEMBER
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">IN: {activeGuest.arrivalDate}</span>
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Folio Liquidity</p>
                                <p className={`text-2xl font-black font-mono tracking-tighter ${guestFolioBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    ₦{guestFolioBalance.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Commodity Selector */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                                <h4 className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Revenue Commodity Registry</h4>
                                <Button size="sm" variant="secondary" className="text-[8px] py-1 px-3 uppercase font-black" onClick={() => setCurrentOrder([])}>Wipe Manifest</Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                                {menuItems.filter(m => m.isActive).map(item => (
                                    <button 
                                        key={item.id} 
                                        onClick={() => handleAddToOrder(item)} 
                                        className="p-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl hover:border-indigo-600 hover:shadow-md transition-all text-left group"
                                    >
                                        <p className="text-[11px] font-black uppercase text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">{item.name}</p>
                                        <p className="text-sm font-black text-indigo-600 font-mono mt-2 tracking-tighter">₦{item.price.toLocaleString()}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Order Manifest (Right Column) */}
                        <div className="flex flex-col bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                            <h4 className="font-black text-[10px] uppercase text-indigo-600 mb-6 tracking-widest border-b border-indigo-100 dark:border-indigo-900/50 pb-2">Session Manifest</h4>
                            
                            <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[35vh]">
                                {currentOrder.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in-right">
                                        <div>
                                            <p className="text-[11px] font-black uppercase text-slate-900 dark:text-white leading-none mb-1">{item.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Qty: {item.quantity} units</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-black text-xs text-indigo-600 font-mono">₦{(item.price * item.quantity).toLocaleString()}</span>
                                            <button 
                                                onClick={() => setCurrentOrder(prev => prev.filter((_, i) => i !== idx))}
                                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {currentOrder.length === 0 && (
                                    <div className="py-20 text-center opacity-30">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Session Empty</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t-2 border-slate-200 dark:border-slate-800">
                                 <div className="flex justify-between items-center mb-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gross Settlement</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase italic">Statutory VAT Integrated</span>
                                    </div>
                                    <p className="font-black text-3xl text-indigo-600 font-mono tracking-tighter">₦{currentOrder.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString()}</p>
                                 </div>
                                 <Button 
                                    onClick={handlePlaceOrder} 
                                    disabled={currentOrder.length === 0} 
                                    className="w-full py-4 uppercase font-black text-xs tracking-widest shadow-xl shadow-indigo-600/20"
                                 >
                                    Commit to Guest Ledger
                                 </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* POS Docket Modal */}
            <Modal isOpen={isDocketOpen} onClose={() => setIsDocketOpen(false)} title="Service Success: Print Docket">
                {lastOrderDetails && (
                    <POSDocket 
                        roomNumber={lastOrderDetails.room}
                        guestName={lastOrderDetails.guest}
                        items={lastOrderDetails.items}
                        total={lastOrderDetails.total}
                        onClose={() => setIsDocketOpen(false)}
                    />
                )}
            </Modal>

            {/* Menu Registry Control Modal */}
            <Modal isOpen={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)} title="F&B Price Registry & Control">
                <div className="space-y-6">
                    <div className="p-6 bg-slate-900 rounded-2xl border-2 border-slate-800">
                        <h5 className="text-[10px] font-black uppercase text-indigo-400 mb-4 tracking-widest">Enroll New Revenue Commodity</h5>
                        <div className="grid grid-cols-3 gap-3">
                            <input type="text" value={newMenuItem.name} onChange={e => setNewMenuItem({...newMenuItem, name: e.target.value})} placeholder="Item Designation" className="p-3 bg-slate-800 border-0 rounded-xl font-black uppercase text-xs col-span-2 text-white placeholder-slate-500" />
                            <input type="number" value={newMenuItem.price} onChange={e => setNewMenuItem({...newMenuItem, price: e.target.value})} placeholder="Valuation" className="p-3 bg-slate-800 border-0 rounded-xl font-mono font-black text-xs text-white placeholder-slate-500" />
                            <select value={newMenuItem.category} onChange={e => setNewMenuItem({...newMenuItem, category: e.target.value as any})} className="p-3 bg-slate-800 border-0 rounded-xl font-black uppercase text-[10px] text-white">
                                <option value="Food">Meals</option>
                                <option value="Drink">Beverages</option>
                            </select>
                            <Button onClick={handleSaveMenuItem} className="col-span-2 text-[10px] font-black uppercase py-3">Authorize Item Entry</Button>
                        </div>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 border-b z-10">
                                <tr>
                                    <th className="p-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">Designation</th>
                                    <th className="p-3 text-[10px] font-black uppercase text-slate-400 text-right tracking-widest">Price (₦)</th>
                                    <th className="p-3 text-[10px] font-black uppercase text-slate-400 text-right tracking-widest">Protocol</th>
                                </tr>
                            </thead>
                            <tbody>
                                {menuItems.map(mi => (
                                    <tr key={mi.id} className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                                        <td className="p-3 text-slate-900 dark:text-slate-200">{mi.name}</td>
                                        <td className="p-3 text-right font-black font-mono text-indigo-600">₦{mi.price.toLocaleString()}</td>
                                        <td className="p-3 text-right">
                                            <button 
                                                onClick={() => deleteMenuItem(mi.id)} 
                                                className="text-red-500 text-[9px] font-black uppercase hover:underline"
                                            >
                                                Revoke
                                            </button>
                                        </td>
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
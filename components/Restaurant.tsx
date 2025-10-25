import React, { useState } from 'react';
// FIX: Added file extensions to imports to resolve module errors.
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import type { HotelData, Room } from '../types.ts';
import { RoomStatus } from '../types.ts';
import { MENU_ITEMS } from '../constants.tsx';

interface RestaurantProps {
    hotelData: HotelData;
}

type OrderItem = { name: string; price: number; quantity: number };

export const Restaurant: React.FC<RestaurantProps> = ({ hotelData }) => {
    const { rooms, addOrder, addTransaction } = hotelData;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
    
    const occupiedRooms = rooms.filter(r => r.status === RoomStatus.Occupied);

    const handleOpenModal = (room: Room) => {
        setSelectedRoom(room);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRoom(null);
        setCurrentOrder([]);
    };
    
    const handleAddToOrder = (menuItem: { name: string; price: number }) => {
        setCurrentOrder(prevOrder => {
            const existingItem = prevOrder.find(item => item.name === menuItem.name);
            if (existingItem) {
                return prevOrder.map(item => item.name === menuItem.name ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prevOrder, { ...menuItem, quantity: 1 }];
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
                description: 'Room Service',
                amount: total,
                date: new Date().toISOString().split('T')[0]
            });
        }
        handleCloseModal();
    };
    
    const orderTotal = currentOrder.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return (
        <div>
            <Card title="Room Service Orders">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {occupiedRooms.map(room => (
                        <div key={room.id} className="p-4 rounded-lg shadow-md border-2 border-slate-200 dark:border-slate-700 text-center">
                            <h4 className="font-bold text-lg">Room {room.number}</h4>
                            <Button className="mt-4 w-full" onClick={() => handleOpenModal(room)}>New Order</Button>
                        </div>
                    ))}
                </div>
            </Card>
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`New Order for Room ${selectedRoom?.number}`}>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-bold mb-2">Menu</h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {MENU_ITEMS.map(item => (
                                <div key={item.name} className="flex justify-between items-center p-2 rounded bg-slate-200 dark:bg-slate-700">
                                    <span>{item.name} (₦{item.price.toLocaleString()})</span>
                                    <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => handleAddToOrder(item)}>+</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold mb-2">Current Order</h4>
                        <div className="space-y-1 max-h-80 overflow-y-auto">
                            {currentOrder.map(item => (
                                <p key={item.name}>{item.quantity}x {item.name} - ₦{(item.price * item.quantity).toLocaleString()}</p>
                            ))}
                        </div>
                        <hr className="my-2 border-slate-300 dark:border-slate-600"/>
                        <p className="font-bold text-lg">Total: ₦{orderTotal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                            <Button onClick={handlePlaceOrder} disabled={currentOrder.length === 0}>Place Order</Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
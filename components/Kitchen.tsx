import React from 'react';
// FIX: Added file extensions to imports to resolve module errors.
import type { HotelData, Order } from '../types.ts';
import { Card } from './common/Card.tsx';

interface KitchenProps {
    hotelData: HotelData;
}

export const Kitchen: React.FC<KitchenProps> = ({ hotelData }) => {
    const { orders, updateOrderStatus, rooms } = hotelData;
    
    const activeOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Preparing');

    const getRoomNumber = (roomId: number) => {
        return rooms.find(r => r.id === roomId)?.number || 'N/A';
    };

    return (
        <div>
            <Card title="Kitchen Order System">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeOrders.length > 0 ? activeOrders.map(order => (
                        <div key={order.id} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold text-lg">Order #{order.id} - Room {getRoomNumber(order.roomId)}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Status: {order.status}</p>
                            <ul className="my-2 list-disc list-inside">
                                {order.items.map(item => (
                                    <li key={item.name}>{item.quantity}x {item.name}</li>
                                ))}
                            </ul>
                            <div className="flex space-x-2 mt-4">
                                {order.status === 'Pending' && <button onClick={() => updateOrderStatus(order.id, 'Preparing')} className="bg-yellow-500 text-white px-3 py-1 rounded">Start Preparing</button>}
                                {order.status === 'Preparing' && <button onClick={() => updateOrderStatus(order.id, 'Ready')} className="bg-green-500 text-white px-3 py-1 rounded">Mark as Ready</button>}
                            </div>
                        </div>
                    )) : (
                        <p>No active orders.</p>
                    )}
                </div>
            </Card>
        </div>
    );
};
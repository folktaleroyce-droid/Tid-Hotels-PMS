
import React from 'react';
import type { HotelData, Order } from '../types';
import { OrderStatus } from '../types';
import { Card } from './common/Card';

interface KitchenProps {
  hotelData: HotelData;
}

const OrderCard: React.FC<{ order: Order; onUpdateStatus: (id: number, status: OrderStatus) => void }> = ({ order, onUpdateStatus }) => {
  const getNextStatus = (): OrderStatus | null => {
    if (order.status === OrderStatus.Pending) return OrderStatus.InProgress;
    if (order.status === OrderStatus.InProgress) return OrderStatus.Completed;
    return null;
  };

  const nextStatus = getNextStatus();

  return (
    <Card className="flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-lg font-bold">Room {order.roomNumber}</h4>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          order.status === OrderStatus.Pending ? 'bg-yellow-500' :
          order.status === OrderStatus.InProgress ? 'bg-blue-500' : 'bg-green-500'
        }`}>{order.status}</span>
      </div>
      <ul className="list-disc list-inside text-gray-300 flex-grow">
        {order.items.map((item, index) => (
          <li key={index}>{item.quantity}x {item.name}</li>
        ))}
      </ul>
      <p className="text-xs text-gray-500 mt-4">Ordered at: {new Date(order.createdAt).toLocaleTimeString()}</p>
      {nextStatus && (
        <button 
          onClick={() => onUpdateStatus(order.id, nextStatus)}
          className="mt-4 w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Mark as {nextStatus}
        </button>
      )}
    </Card>
  );
};


export const Kitchen: React.FC<KitchenProps> = ({ hotelData }) => {
  const { orders, setOrders, rooms } = hotelData;
  const guestsCheckedIn = rooms.filter(r => r.status === 'Occupied').length;

  const updateStatus = (id: number, status: OrderStatus) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
  };

  const pendingOrders = orders.filter(o => o.status === OrderStatus.Pending);
  const inProgressOrders = orders.filter(o => o.status === OrderStatus.InProgress);
  const completedOrders = orders.filter(o => o.status === OrderStatus.Completed).slice(0, 5); // show last 5

  return (
    <div>
        <Card className="mb-8">
            <h3 className="text-xl font-semibold text-white">Guests Currently Checked In: <span className="text-teal-400">{guestsCheckedIn}</span></h3>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
                <h3 className="text-2xl font-bold border-b-2 border-yellow-500 pb-2">Pending</h3>
                {pendingOrders.length > 0 ? pendingOrders.map(o => <OrderCard key={o.id} order={o} onUpdateStatus={updateStatus} />) : <p className="text-gray-500">No pending orders.</p>}
            </div>
            <div className="space-y-4">
                <h3 className="text-2xl font-bold border-b-2 border-blue-500 pb-2">In Progress</h3>
                {inProgressOrders.length > 0 ? inProgressOrders.map(o => <OrderCard key={o.id} order={o} onUpdateStatus={updateStatus} />) : <p className="text-gray-500">No orders in progress.</p>}
            </div>
            <div className="space-y-4">
                <h3 className="text-2xl font-bold border-b-2 border-green-500 pb-2">Completed (Recent)</h3>
                {completedOrders.length > 0 ? completedOrders.map(o => <OrderCard key={o.id} order={o} onUpdateStatus={updateStatus} />) : <p className="text-gray-500">No completed orders yet.</p>}
            </div>
        </div>
    </div>
  );
};


import React, { useState } from 'react';
import type { HotelData } from '../types';
import { RoomStatus, OrderStatus } from '../types';
import { Card } from './common/Card';
import { Button } from './common/Button';

interface RestaurantProps {
  hotelData: HotelData;
}

interface OrderItem {
    name: string;
    quantity: number;
}

export const Restaurant: React.FC<RestaurantProps> = ({ hotelData }) => {
  const { rooms, addOrder, addTransaction } = hotelData;
  const [roomNumber, setRoomNumber] = useState('');
  const [items, setItems] = useState<OrderItem[]>([{ name: '', quantity: 1 }]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...items];
    if (field === 'name') {
        newItems[index][field] = value as string;
    } else {
        newItems[index][field] = Number(value);
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const targetRoom = rooms.find(r => r.number === roomNumber && r.status === RoomStatus.Occupied);
    if (!targetRoom || !targetRoom.guestId) {
      setError('Invalid or unoccupied room number.');
      return;
    }

    const validItems = items.filter(item => item.name.trim() !== '' && item.quantity > 0);
    if (validItems.length === 0) {
      setError('Please add at least one valid item.');
      return;
    }
    
    // This is a mock price calculation
    const totalAmount = validItems.reduce((sum, item) => sum + (item.quantity * 15), 0);
    
    addOrder({
      roomId: targetRoom.id,
      roomNumber: targetRoom.number,
      items: validItems,
      status: OrderStatus.Pending,
    });

    addTransaction({
        guestId: targetRoom.guestId,
        description: `Room Service (Room ${targetRoom.number})`,
        amount: totalAmount,
        date: new Date().toISOString()
    });
    
    setSuccess(`Order for Room ${roomNumber} placed successfully! Total: $${totalAmount.toFixed(2)}`);
    setRoomNumber('');
    setItems([{ name: '', quantity: 1 }]);
    setTimeout(() => setSuccess(''), 5000);
  };

  return (
    <Card title="New Restaurant / Room Service Order">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-300 mb-1">Room Number</label>
          <select 
            id="roomNumber" 
            value={roomNumber} 
            onChange={e => setRoomNumber(e.target.value)}
            className="w-full bg-gray-700 text-white p-2 rounded"
          >
            <option value="">Select an occupied room</option>
            {rooms
              .filter(r => r.status === RoomStatus.Occupied)
              .map(r => <option key={r.id} value={r.number}>{r.number}</option>)
            }
          </select>
        </div>
        
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Items</label>
            {items.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <input type="text" placeholder="Item Name" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} className="flex-grow bg-gray-700 text-white p-2 rounded" />
                    <input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="w-20 bg-gray-700 text-white p-2 rounded" />
                    <Button type="button" variant="secondary" onClick={() => removeItem(index)}>&times;</Button>
                </div>
            ))}
            <Button type="button" variant="secondary" onClick={addItem}>+ Add Item</Button>
        </div>
        
        {error && <p className="text-red-400">{error}</p>}
        {success && <p className="text-green-400">{success}</p>}
        
        <Button type="submit">Charge to Room</Button>
      </form>
    </Card>
  );
};

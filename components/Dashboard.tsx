
import React from 'react';
import { Card } from './common/Card';
import type { HotelData, RoomStatus } from '../types';
import { RoomStatus as RoomStatusEnum } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface DashboardProps {
  hotelData: HotelData;
}

const COLORS = {
  [RoomStatusEnum.Vacant]: '#10B981', // Green-500
  [RoomStatusEnum.Occupied]: '#EF4444', // Red-500
  [RoomStatusEnum.Reserved]: '#F59E0B', // Yellow-500
  [RoomStatusEnum.OutOfOrder]: '#6B7280', // Gray-500
  [RoomStatusEnum.Dirty]: '#F97316', // Orange-500
};

export const Dashboard: React.FC<DashboardProps> = ({ hotelData }) => {
  const { rooms, transactions, orders } = hotelData;

  const occupiedRooms = rooms.filter(r => r.status === RoomStatusEnum.Occupied).length;
  const occupancyRate = (occupiedRooms / rooms.length) * 100;
  
  const totalRevenue = transactions.reduce((acc, t) => t.amount > 0 ? acc + t.amount : acc, 0);

  const roomStatusData = Object.values(RoomStatusEnum).map(status => ({
    name: status,
    value: rooms.filter(r => r.status === status).length,
  }));

  const revenueData = [
    { name: 'Room Charges', revenue: transactions.filter(t => t.description.includes('Room Charge')).reduce((sum, t) => sum + t.amount, 0)},
    { name: 'Room Service', revenue: transactions.filter(t => t.description.includes('Room Service')).reduce((sum, t) => sum + t.amount, 0)},
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <Card className="col-span-1">
        <h4 className="text-gray-400 font-semibold">Occupancy Rate</h4>
        <p className="text-4xl font-bold text-teal-400 mt-2">{occupancyRate.toFixed(1)}%</p>
        <p className="text-gray-500">{occupiedRooms} of {rooms.length} rooms occupied</p>
      </Card>
      <Card className="col-span-1">
        <h4 className="text-gray-400 font-semibold">Total Revenue (Today)</h4>
        <p className="text-4xl font-bold text-teal-400 mt-2">${totalRevenue.toFixed(2)}</p>
        <p className="text-gray-500">Gross revenue from all sources</p>
      </Card>
      <Card className="col-span-1">
        <h4 className="text-gray-400 font-semibold">Pending Orders</h4>
        <p className="text-4xl font-bold text-yellow-400 mt-2">{orders.filter(o => o.status === 'Pending').length}</p>
        <p className="text-gray-500">Restaurant & Room Service</p>
      </Card>
      <Card className="col-span-1">
        <h4 className="text-gray-400 font-semibold">Available Rooms</h4>
        <p className="text-4xl font-bold text-green-400 mt-2">{rooms.filter(r => r.status === RoomStatusEnum.Vacant).length}</p>
        <p className="text-gray-500">Ready for check-in</p>
      </Card>

      <Card title="Room Status Overview" className="col-span-1 md:col-span-2">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={roomStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
              {roomStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as RoomStatus]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>
      
      <Card title="Revenue Breakdown" className="col-span-1 md:col-span-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis dataKey="name" stroke="#a0aec0" />
            <YAxis stroke="#a0aec0" />
            <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }} />
            <Legend />
            <Bar dataKey="revenue" fill="#38b2ac" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

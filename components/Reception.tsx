
import React, { useState } from 'react';
import type { HotelData, Room, Guest } from '../types';
import { RoomStatus } from '../types';
import { ROOM_STATUS_COLORS } from '../constants';
import { Card } from './common/Card';
import { Modal } from './common/Modal';
import { Button } from './common/Button';

interface ReceptionProps {
  hotelData: HotelData;
}

const RoomCard: React.FC<{ room: Room; onSelect: (room: Room) => void }> = ({ room, onSelect }) => {
  const statusColor = ROOM_STATUS_COLORS[room.status];
  return (
    <div
      onClick={() => onSelect(room)}
      className={`p-4 rounded-lg shadow-md cursor-pointer border-2 transition-transform transform hover:scale-105 ${statusColor} bg-opacity-20`}
    >
      <div className="flex justify-between items-center">
        <p className="text-xl font-bold text-white">Room {room.number}</p>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor} text-white`}>
          {room.status}
        </span>
      </div>
      <p className="text-gray-400 mt-2">{room.type}</p>
    </div>
  );
};


export const Reception: React.FC<ReceptionProps> = ({ hotelData }) => {
  const { rooms, guests, updateRoomStatus, addTransaction, setGuests } = hotelData;
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [organization, setOrganization] = useState('');

  const handleSelectRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
    setGuestName('');
    setOrganization('');
  };

  const handleCheckIn = () => {
    if (selectedRoom && guestName) {
      const newGuest: Guest = {
        id: guests.length + 1,
        name: guestName,
        checkIn: new Date().toISOString().split('T')[0],
        checkOut: '',
        organization: organization,
      };
      setGuests(prev => [...prev, newGuest]);
      updateRoomStatus(selectedRoom.id, RoomStatus.Occupied, newGuest.id);
      addTransaction({ guestId: newGuest.id, description: `Room Charge - 1 Night (Room ${selectedRoom.number})`, amount: selectedRoom.rate, date: new Date().toISOString() });
      handleCloseModal();
    }
  };

  const handleCheckOut = () => {
    if (selectedRoom) {
      updateRoomStatus(selectedRoom.id, RoomStatus.Dirty); // Needs cleaning after checkout
      handleCloseModal();
    }
  };


  const getGuestForRoom = (room: Room): Guest | undefined => {
      return guests.find(g => g.id === room.guestId);
  }

  const renderModalContent = () => {
    if (!selectedRoom) return null;
    const guest = getGuestForRoom(selectedRoom);

    switch (selectedRoom.status) {
      case RoomStatus.Vacant:
        return (
          <div>
            <p className="mb-4">Check a new guest into Room {selectedRoom.number}.</p>
            <input type="text" placeholder="Guest Name" value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded mb-2" />
            <input type="text" placeholder="Organization (e.g., ECOWAS)" value={organization} onChange={e => setOrganization(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded mb-4" />
            <Button onClick={handleCheckIn}>Complete Check-In</Button>
          </div>
        );
      case RoomStatus.Occupied:
        return (
          <div>
            <p className="mb-2"><strong>Guest:</strong> {guest?.name}</p>
            <p className="mb-2"><strong>Checked In:</strong> {guest?.checkIn}</p>
            <p className="mb-4"><strong>Organization:</strong> {guest?.organization || 'N/A'}</p>
            <Button onClick={handleCheckOut} variant="secondary">Check-Out Guest</Button>
          </div>
        );
      default:
        return <p>This room is currently {selectedRoom.status}. No actions available.</p>;
    }
  };

  return (
    <div>
        <Card title="Room Overview">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {rooms.map(room => (
                    <RoomCard key={room.id} room={room} onSelect={handleSelectRoom} />
                ))}
            </div>
        </Card>
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Room ${selectedRoom?.number} Actions`}>
            {renderModalContent()}
        </Modal>
    </div>
  );
};

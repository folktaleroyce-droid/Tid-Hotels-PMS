import React, { useState } from 'react';
// FIX: Added file extensions to fix module resolution errors.
import type { HotelData, Room, RoomStatus } from '../types.ts';
import { RoomStatus as RoomStatusEnum } from '../types.ts';
import { ROOM_STATUS_THEME } from '../constants.tsx';
// FIX: Added file extensions to component imports.
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';

interface HousekeepingProps {
  hotelData: HotelData;
}

const StatusButton: React.FC<{
    status: RoomStatus;
    currentStatus: RoomStatus;
    onClick: (status: RoomStatus) => void;
}> = ({ status, currentStatus, onClick }) => {
    const theme = ROOM_STATUS_THEME[status];
    const isDisabled = status === currentStatus;

    return (
        <button
            onClick={() => onClick(status)}
            disabled={isDisabled}
            className={`w-full text-left p-3 my-1 rounded-md transition-colors ${theme.light} ${theme.dark} ${theme.text} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
        >
            {status}
        </button>
    );
};

export const Housekeeping: React.FC<HousekeepingProps> = ({ hotelData }) => {
  const { rooms, updateRoomStatus } = hotelData;
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleStatusUpdate = (newStatus: RoomStatus) => {
    if (selectedRoom) {
      updateRoomStatus(selectedRoom.id, newStatus);
    }
    setIsModalOpen(false);
    setSelectedRoom(null);
  };
  
  return (
    <div>
      <Card title="Housekeeping Status">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {rooms.map(room => (
            <div
              key={room.id}
              onClick={() => handleRoomSelect(room)}
              className={`p-4 rounded-lg shadow-md cursor-pointer border-2 transition-transform transform hover:scale-105 ${ROOM_STATUS_THEME[room.status].badge}`}
            >
              <p className="text-xl font-bold text-white">Room {room.number}</p>
              <p className="text-sm font-semibold mt-1 text-white">{room.status}</p>
            </div>
          ))}
        </div>
      </Card>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Update Status for Room ${selectedRoom?.number}`}>
          {selectedRoom && (
              <div>
                <p className="mb-4">Current Status: <strong>{selectedRoom.status}</strong></p>
                <p>Select new status:</p>
                <div className="space-y-2 mt-2">
                    <StatusButton status={RoomStatusEnum.Vacant} currentStatus={selectedRoom.status} onClick={handleStatusUpdate} />
                    <StatusButton status={RoomStatusEnum.Dirty} currentStatus={selectedRoom.status} onClick={handleStatusUpdate} />
                    <StatusButton status={RoomStatusEnum.OutOfOrder} currentStatus={selectedRoom.status} onClick={handleStatusUpdate} />
                </div>
              </div>
          )}
      </Modal>
    </div>
  );
};

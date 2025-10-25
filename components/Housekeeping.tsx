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
  const { rooms, reservations, updateRoomStatus } = hotelData;
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
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysArrivalReservations = reservations.filter(r => r.checkInDate === todayStr);

  const priorityRooms = rooms.filter(room => 
    (room.status === RoomStatusEnum.Dirty || room.status === RoomStatusEnum.Cleaning) &&
    todaysArrivalReservations.some(res => res.roomType === room.type)
  );

  const dirtyRooms = rooms.filter(r => r.status === RoomStatusEnum.Dirty);
  const cleaningRooms = rooms.filter(r => r.status === RoomStatusEnum.Cleaning);
  const occupiedRooms = rooms.filter(r => r.status === RoomStatusEnum.Occupied);

  const RoomCard: React.FC<{ room: Room }> = ({ room }) => (
    <div
      onClick={() => handleRoomSelect(room)}
      className={`p-3 rounded-lg shadow-sm cursor-pointer border-l-4 transition-transform transform hover:scale-105 ${ROOM_STATUS_THEME[room.status].light} ${ROOM_STATUS_THEME[room.status].dark}`}
      style={{ borderLeftColor: ROOM_STATUS_THEME[room.status].fill }}
    >
      <div className="flex justify-between items-center">
        <p className={`font-bold ${ROOM_STATUS_THEME[room.status].text}`}>Room {room.number}</p>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ROOM_STATUS_THEME[room.status].badge} text-white`}>{room.status}</span>
      </div>
      <p className={`text-sm mt-1 ${ROOM_STATUS_THEME[room.status].text}`}>{room.type}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card title="Priority: Upcoming Arrivals">
            <div className="space-y-2 max-h-64 overflow-y-auto p-1">
              {priorityRooms.length > 0 ? priorityRooms.map(room => <RoomCard key={room.id} room={room} />) : <p className="text-slate-500 dark:text-slate-400">All arrival rooms are ready.</p>}
            </div>
          </Card>
          <Card title="In Progress: Cleaning">
             <div className="space-y-2 max-h-64 overflow-y-auto p-1">
              {cleaningRooms.length > 0 ? cleaningRooms.map(room => <RoomCard key={room.id} room={room} />) : <p className="text-slate-500 dark:text-slate-400">No rooms are being cleaned.</p>}
            </div>
          </Card>
        </div>
        
        <Card title="To Do: Dirty Rooms">
          <div className="space-y-2 max-h-[36rem] lg:max-h-[calc(80vh)] overflow-y-auto p-1">
            {dirtyRooms.length > 0 ? dirtyRooms.map(room => <RoomCard key={room.id} room={room} />) : <p className="text-slate-500 dark:text-slate-400">No rooms require cleaning.</p>}
          </div>
        </Card>

        <Card title="Stay-overs: Occupied Rooms">
           <div className="space-y-2 max-h-[36rem] lg:max-h-[calc(80vh)] overflow-y-auto p-1">
            {occupiedRooms.length > 0 ? occupiedRooms.map(room => <RoomCard key={room.id} room={room} />) : <p className="text-slate-500 dark:text-slate-400">No rooms are occupied.</p>}
          </div>
        </Card>
      </div>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Update Status for Room ${selectedRoom?.number}`}>
          {selectedRoom && (
              <div>
                <p className="mb-4">Current Status: <strong className={ROOM_STATUS_THEME[selectedRoom.status].text}>{selectedRoom.status}</strong></p>
                <p>Select new status:</p>
                <div className="space-y-2 mt-2">
                    <StatusButton status={RoomStatusEnum.Vacant} currentStatus={selectedRoom.status} onClick={handleStatusUpdate} />
                    <StatusButton status={RoomStatusEnum.Cleaning} currentStatus={selectedRoom.status} onClick={handleStatusUpdate} />
                    <StatusButton status={RoomStatusEnum.Dirty} currentStatus={selectedRoom.status} onClick={handleStatusUpdate} />
                    <StatusButton status={RoomStatusEnum.OutOfOrder} currentStatus={selectedRoom.status} onClick={handleStatusUpdate} />
                </div>
              </div>
          )}
      </Modal>
    </div>
  );
};
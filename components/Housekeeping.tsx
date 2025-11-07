import React, { useState, useMemo } from 'react';
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

const RoomCard: React.FC<{ room: Room; onClick: (room: Room) => void; disabled?: boolean }> = ({ room, onClick, disabled = false }) => (
    <div
      onClick={!disabled ? () => onClick(room) : undefined}
      className={`p-3 rounded-lg shadow-sm border-l-4 transition-transform transform ${!disabled ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-80'} ${ROOM_STATUS_THEME[room.status].light} ${ROOM_STATUS_THEME[room.status].dark}`}
      style={{ borderLeftColor: ROOM_STATUS_THEME[room.status].fill }}
    >
      <div className="flex justify-between items-center">
        <p className={`font-bold ${ROOM_STATUS_THEME[room.status].text}`}>Room {room.number}</p>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ROOM_STATUS_THEME[room.status].badge} text-white`}>{room.status}</span>
      </div>
      <p className={`text-sm mt-1 ${ROOM_STATUS_THEME[room.status].text}`}>{room.type}</p>
    </div>
);

const StatusColumn: React.FC<{ title: string, rooms: Room[], onRoomSelect: (room: Room) => void }> = ({ title, rooms, onRoomSelect }) => {
    const status = rooms.length > 0 ? rooms[0].status : RoomStatusEnum.Vacant; // Bit of a hack to get a theme
    const theme = ROOM_STATUS_THEME[status] || ROOM_STATUS_THEME[RoomStatusEnum.Vacant];

    return (
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 flex-1">
            <div className="flex items-center mb-4">
                 <span className={`h-3 w-3 rounded-full mr-2`} style={{backgroundColor: theme.fill}}></span>
                 <h3 className={`font-bold text-lg ${theme.text}`}>{title}</h3>
                 <span className={`ml-2 text-sm font-bold px-2 py-0.5 rounded-full text-white ${theme.badge}`}>{rooms.length}</span>
            </div>
             <div className="space-y-3 max-h-[calc(100vh-22rem)] overflow-y-auto pr-2">
                {rooms.length > 0 ? rooms.map(room => (
                    <RoomCard 
                        key={room.id} 
                        room={room} 
                        onClick={onRoomSelect} 
                        disabled={room.status === RoomStatusEnum.OutOfOrder || room.status === RoomStatusEnum.Occupied}
                    />
                )) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No rooms.</p>
                )}
             </div>
        </div>
    );
};


export const Housekeeping: React.FC<HousekeepingProps> = ({ hotelData }) => {
  const { rooms, updateRoomStatus } = hotelData;
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleRoomSelect = (room: Room) => {
    if (room.status === RoomStatusEnum.OutOfOrder || room.status === RoomStatusEnum.Occupied) return;
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
  
  const categorizedRooms = useMemo(() => {
    return {
        dirty: rooms.filter(r => r.status === RoomStatusEnum.Dirty),
        cleaning: rooms.filter(r => r.status === RoomStatusEnum.Cleaning),
        vacant: rooms.filter(r => r.status === RoomStatusEnum.Vacant),
        occupied: rooms.filter(r => r.status === RoomStatusEnum.Occupied),
        outOfOrder: rooms.filter(r => r.status === RoomStatusEnum.OutOfOrder),
    }
  }, [rooms]);

  return (
    <div className="space-y-6">
       <Card title="Housekeeping Status Board">
          <div className="flex flex-col lg:flex-row gap-4">
            <StatusColumn title="Dirty" rooms={categorizedRooms.dirty} onRoomSelect={handleRoomSelect} />
            <StatusColumn title="Cleaning" rooms={categorizedRooms.cleaning} onRoomSelect={handleRoomSelect} />
            <StatusColumn title="Vacant" rooms={categorizedRooms.vacant} onRoomSelect={handleRoomSelect} />
            <StatusColumn title="Occupied" rooms={categorizedRooms.occupied} onRoomSelect={handleRoomSelect} />
            <StatusColumn title="Out of Order" rooms={categorizedRooms.outOfOrder} onRoomSelect={handleRoomSelect} />
          </div>
      </Card>
      
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
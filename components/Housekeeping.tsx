
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

const StatusColumn: React.FC<{ title: string, status: RoomStatus, rooms: Room[], onRoomSelect: (room: Room) => void }> = ({ title, status, rooms, onRoomSelect }) => {
    const theme = ROOM_STATUS_THEME[status];

    return (
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 flex-1 min-w-[250px]">
            <div className="flex items-center mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                 <span className={`h-4 w-4 rounded-full mr-2 shadow-sm`} style={{backgroundColor: theme.fill}}></span>
                 <h3 className={`font-bold text-lg flex-1 ${theme.text}`}>{title}</h3>
                 <span className={`ml-2 text-xs font-bold px-2.5 py-1 rounded-full text-white shadow-sm ${theme.badge}`}>{rooms.length}</span>
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
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400 opacity-60">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                         </svg>
                        <p className="text-sm">No rooms</p>
                    </div>
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
       {/* Summary Badges */}
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.values(RoomStatusEnum).map(status => {
                 const count = rooms.filter(r => r.status === status).length;
                 const theme = ROOM_STATUS_THEME[status];
                 return (
                     <div key={status} className={`flex flex-col items-center justify-center p-3 rounded-lg border shadow-sm ${theme.light} ${theme.dark} border-l-4`} style={{borderLeftColor: theme.fill}}>
                         <div className="flex items-center space-x-2 mb-1">
                             <div className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: theme.fill}}></div>
                             <span className={`text-xs font-bold uppercase ${theme.text} opacity-90`}>{status}</span>
                         </div>
                         <p className={`text-2xl font-bold ${theme.text}`}>{count}</p>
                     </div>
                 )
            })}
       </div>

       <Card title="Housekeeping Status Board">
          <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4">
            <StatusColumn title="Dirty" status={RoomStatusEnum.Dirty} rooms={categorizedRooms.dirty} onRoomSelect={handleRoomSelect} />
            <StatusColumn title="Cleaning" status={RoomStatusEnum.Cleaning} rooms={categorizedRooms.cleaning} onRoomSelect={handleRoomSelect} />
            <StatusColumn title="Vacant" status={RoomStatusEnum.Vacant} rooms={categorizedRooms.vacant} onRoomSelect={handleRoomSelect} />
            <StatusColumn title="Occupied" status={RoomStatusEnum.Occupied} rooms={categorizedRooms.occupied} onRoomSelect={handleRoomSelect} />
            <StatusColumn title="Out of Order" status={RoomStatusEnum.OutOfOrder} rooms={categorizedRooms.outOfOrder} onRoomSelect={handleRoomSelect} />
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

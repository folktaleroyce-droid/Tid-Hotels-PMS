
import React, { useState, useMemo } from 'react';
import type { HotelData, Room } from '../types.ts';
import { RoomStatus as RoomStatusEnum, HousekeepingStatus } from '../types.ts';
import { ROOM_STATUS_THEME } from '../constants.tsx';
import { Card } from './common/Card.tsx';
import { Modal } from './common/Modal.tsx';

const HK_STATUS_THEME = {
  [HousekeepingStatus.Clean]: 'bg-green-500',
  [HousekeepingStatus.Inspected]: 'bg-blue-500',
  [HousekeepingStatus.Dirty]: 'bg-red-500',
  [HousekeepingStatus.Pickup]: 'bg-amber-500',
};

export const Housekeeping: React.FC<{ hotelData: HotelData }> = ({ hotelData }) => {
  const { rooms, updateHousekeepingStatus, updateRoomStatus, addSyncLogEntry } = hotelData;
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const handleUpdateHK = (status: HousekeepingStatus) => {
    if (selectedRoom) {
      updateHousekeepingStatus(selectedRoom.id, status);
      addSyncLogEntry(`Unit ${selectedRoom.number} marked as ${status}`, 'info');
      setSelectedRoom(null);
    }
  };

  const handleRoomAction = (status: RoomStatusEnum) => {
      if (selectedRoom) {
          updateRoomStatus(selectedRoom.id, status);
          setSelectedRoom(null);
      }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Environmental Control</h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-2">Real-Time Facility Hygiene Board</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {rooms.map(room => {
          const theme = ROOM_STATUS_THEME[room.status];
          const hkColor = HK_STATUS_THEME[room.housekeepingStatus];
          return (
            <div 
              key={room.id} 
              onClick={() => setSelectedRoom(room)}
              className={`relative p-4 rounded-xl border-l-4 shadow-sm hover:shadow-lg transition-all cursor-pointer group ${theme.light} ${theme.dark}`}
              style={{ borderLeftColor: theme.fill }}
            >
              <div className="flex justify-between items-start">
                <h4 className={`text-lg font-black ${theme.text}`}>{room.number}</h4>
                <div className={`w-2.5 h-2.5 rounded-full ${hkColor} shadow-inner`}></div>
              </div>
              <p className={`text-[8px] font-black uppercase opacity-60 mt-2 ${theme.text}`}>{room.status}</p>
              <p className={`text-[8px] font-black uppercase ${theme.text} opacity-40`}>HK: {room.housekeepingStatus}</p>
              
              {/* Tooltip detail */}
              <div className="absolute top-full left-0 mt-2 bg-slate-900 text-white p-2 rounded text-[8px] uppercase font-black z-20 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
                Floor: {room.floor} | Last Mod: {new Date(room.updatedAt).toLocaleTimeString()}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={!!selectedRoom} onClose={() => setSelectedRoom(null)} title={`Unit ${selectedRoom?.number} Protocol`}>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <h5 className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Housekeeping Tier</h5>
            {Object.values(HousekeepingStatus).map(st => (
                <button 
                  key={st} 
                  onClick={() => handleUpdateHK(st)}
                  className={`w-full p-3 rounded-lg border-2 text-[10px] font-black uppercase transition-all text-left ${selectedRoom?.housekeepingStatus === st ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-indigo-300'}`}
                >
                  {st}
                </button>
            ))}
          </div>
          <div className="space-y-2">
            <h5 className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Room Operational State</h5>
            {Object.values(RoomStatusEnum).map(st => (
                <button 
                  key={st} 
                  onClick={() => handleRoomAction(st)}
                  className={`w-full p-3 rounded-lg border-2 text-[10px] font-black uppercase transition-all text-left ${selectedRoom?.status === st ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-indigo-300'}`}
                >
                  {st}
                </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

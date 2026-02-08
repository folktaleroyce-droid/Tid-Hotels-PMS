
import React, { useState, useMemo } from 'react';
import type { HotelData, Room } from '../types.ts';
import { RoomStatus as RoomStatusEnum, HousekeepingStatus } from '../types.ts';
import { ROOM_STATUS_THEME } from '../constants.tsx';
import { Card } from './common/Card.tsx';
import { Modal } from './common/Modal.tsx';
import { Button } from './common/Button.tsx';

const HK_STATUS_THEME = {
  [HousekeepingStatus.Clean]: 'bg-green-500',
  [HousekeepingStatus.Inspected]: 'bg-blue-500',
  [HousekeepingStatus.Dirty]: 'bg-red-500',
  [HousekeepingStatus.Pickup]: 'bg-amber-500',
};

export const Housekeeping: React.FC<{ hotelData: HotelData }> = ({ hotelData }) => {
  const { rooms, updateHousekeepingStatus, updateRoomStatus, addSyncLogEntry } = hotelData;
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [statusBriefing, setStatusBriefing] = useState('');

  const handleUpdateHK = (status: HousekeepingStatus) => {
    if (selectedRoom) {
      updateHousekeepingStatus(selectedRoom.id, status);
      addSyncLogEntry(`Unit ${selectedRoom.number} marked as ${status}`, 'info');
      setSelectedRoom(null);
      setStatusBriefing('');
    }
  };

  const handleRoomAction = (status: RoomStatusEnum) => {
      if (selectedRoom) {
          updateRoomStatus(selectedRoom.id, status, selectedRoom.guestId, statusBriefing);
          setSelectedRoom(null);
          setStatusBriefing('');
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Environmental Control</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-2">Real-Time Facility Hygiene Board</p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border-2 border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-[9px] font-black uppercase text-slate-400">Dirty</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-[9px] font-black uppercase text-slate-400">Clean</span>
            </div>
            <div className="flex items-center gap-1.5 border-l pl-4 border-slate-100 dark:border-slate-800">
                <svg className="w-3 h-3 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                <span className="text-[9px] font-black uppercase text-slate-400">Status Briefing Attached</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {rooms.map(room => {
          const theme = ROOM_STATUS_THEME[room.status];
          const hkColor = HK_STATUS_THEME[room.housekeepingStatus];
          return (
            <div 
              key={room.id} 
              onClick={() => {
                  setSelectedRoom(room);
                  setStatusBriefing(room.statusNotes || '');
              }}
              className={`relative p-4 rounded-xl border-l-4 shadow-sm hover:shadow-lg transition-all cursor-pointer group ${theme.light} ${theme.dark} border-2 border-transparent hover:border-indigo-500/30`}
              style={{ borderLeftColor: theme.fill }}
            >
              <div className="flex justify-between items-start">
                <h4 className={`text-lg font-black ${theme.text}`}>{room.number}</h4>
                <div className="flex flex-col items-end gap-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${hkColor} shadow-inner`}></div>
                    {room.statusNotes && (
                        <svg className="w-3 h-3 text-indigo-500 opacity-60" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    )}
                </div>
              </div>
              <p className={`text-[8px] font-black uppercase opacity-60 mt-2 ${theme.text}`}>{room.status}</p>
              <p className={`text-[8px] font-black uppercase ${theme.text} opacity-40`}>HK: {room.housekeepingStatus}</p>
              
              {/* Tooltip detail */}
              <div className="absolute top-full left-0 mt-2 bg-slate-900 text-white p-3 rounded-lg text-[9px] uppercase font-black z-20 opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 whitespace-nowrap pointer-events-none shadow-2xl border border-white/10">
                <div className="flex flex-col gap-1">
                    <span>Floor: {room.floor}</span>
                    <span>Mod: {new Date(room.updatedAt).toLocaleTimeString()}</span>
                    {room.statusNotes && (
                        <span className="text-indigo-400 mt-1 border-t border-white/10 pt-1">Briefing: {room.statusNotes.slice(0, 20)}...</span>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal 
        isOpen={!!selectedRoom} 
        onClose={() => {
            setSelectedRoom(null);
            setStatusBriefing('');
        }} 
        title={`Unit Protocol Registry: Unit ${selectedRoom?.number}`}
      >
        <div className="space-y-8">
          {/* Briefing Section - HIGH CONTRAST */}
          <div className="p-6 bg-slate-900 dark:bg-black rounded-2xl border-2 border-slate-800 text-white shadow-xl">
            <h5 className="text-[10px] font-black uppercase text-indigo-400 mb-3 tracking-widest leading-none">Operational Status Briefing</h5>
            <textarea 
                value={statusBriefing}
                onChange={(e) => setStatusBriefing(e.target.value)}
                placeholder="Log critical observations or shift transition directives here..."
                className="w-full bg-slate-800 border-0 rounded-xl p-4 text-xs font-bold uppercase placeholder-slate-600 focus:ring-2 focus:ring-indigo-600 min-h-[100px] resize-none"
            />
            {selectedRoom?.statusNotes && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Previous Entry Recorded</p>
                    <p className="text-[10px] italic text-slate-400">"{selectedRoom.statusNotes}"</p>
                </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h5 className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest border-b pb-2">Hygiene Hierarchy (HK)</h5>
              {Object.values(HousekeepingStatus).map(st => (
                  <button 
                    key={st} 
                    onClick={() => handleUpdateHK(st)}
                    className={`w-full p-4 rounded-xl border-2 text-[10px] font-black uppercase transition-all text-left shadow-sm ${selectedRoom?.housekeepingStatus === st ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-500 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
                  >
                    <div className="flex justify-between items-center">
                        <span>{st}</span>
                        {selectedRoom?.housekeepingStatus === st && <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded">Active</span>}
                    </div>
                  </button>
              ))}
            </div>
            <div className="space-y-3">
              <h5 className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest border-b pb-2">Operational Infrastructure State</h5>
              {Object.values(RoomStatusEnum).map(st => (
                  <button 
                    key={st} 
                    onClick={() => handleRoomAction(st)}
                    className={`w-full p-4 rounded-xl border-2 text-[10px] font-black uppercase transition-all text-left shadow-sm ${selectedRoom?.status === st ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-500 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
                  >
                    <div className="flex justify-between items-center">
                        <span>{st}</span>
                        {selectedRoom?.status === st && <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded">Active</span>}
                    </div>
                  </button>
              ))}
            </div>
          </div>
          
          <div className="pt-6 border-t flex justify-end">
            <Button variant="secondary" onClick={() => { setSelectedRoom(null); setStatusBriefing(''); }} className="uppercase font-black text-[10px] px-8">Abort Modifications</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

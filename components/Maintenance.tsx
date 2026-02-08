
import React, { useState, useMemo } from 'react';
import type { HotelData, MaintenanceRequest, BaseEntity } from '../types.ts';
import { MaintenanceStatus, MaintenancePriority } from '../types.ts';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import { MAINTENANCE_PRIORITY_THEME } from '../constants.tsx';

interface MaintenanceProps {
    hotelData: HotelData;
}

const INITIAL_FORM_STATE: Omit<MaintenanceRequest, keyof BaseEntity | 'id' | 'reportedAt' | 'status'> = {
    location: '',
    description: '',
    priority: MaintenancePriority.Medium,
    roomId: undefined
};

const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;

const PRIORITY_BORDER_THEME = {
    [MaintenancePriority.Low]: 'border-green-500',
    [MaintenancePriority.Medium]: 'border-yellow-500',
    [MaintenancePriority.High]: 'border-red-500',
};

const STATUS_THEME = {
    [MaintenanceStatus.Reported]: {
        text: 'text-yellow-800 dark:text-yellow-200',
        badge: 'bg-yellow-500',
        dot: 'bg-yellow-500'
    },
    [MaintenanceStatus.InProgress]: {
        text: 'text-blue-800 dark:text-blue-200',
        badge: 'bg-blue-500',
        dot: 'bg-blue-500'
    },
    [MaintenanceStatus.Completed]: {
        text: 'text-green-800 dark:text-green-200',
        badge: 'bg-green-500',
        dot: 'bg-green-500'
    }
};


const MaintenanceRequestCard: React.FC<{ request: MaintenanceRequest, onStatusChange: (id: number, status: MaintenanceStatus) => void }> = ({ request, onStatusChange }) => {
    return (
        <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border-l-4 ${PRIORITY_BORDER_THEME[request.priority]} hover:shadow-lg transition-shadow`}>
            <div className="flex justify-between items-start">
                <h4 className="font-black uppercase text-xs text-slate-800 dark:text-slate-200">{request.location}</h4>
                <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${MAINTENANCE_PRIORITY_THEME[request.priority].bg} ${MAINTENANCE_PRIORITY_THEME[request.priority].text} tracking-tighter`}>
                    {request.priority}
                </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 my-2 font-medium">{request.description}</p>
            <p className="text-[9px] text-slate-500 dark:text-slate-500 uppercase font-black">Logged: {new Date(request.reportedAt).toLocaleDateString()}</p>
            <div className="mt-4 flex space-x-2">
                {request.status === MaintenanceStatus.Reported && (
                    <Button className="w-full text-[9px] font-black uppercase py-1 flex items-center justify-center" onClick={() => onStatusChange(request.id, MaintenanceStatus.InProgress)}>
                        <PlayIcon /> Initiate
                    </Button>
                )}
                {request.status === MaintenanceStatus.InProgress && (
                    <Button className="w-full text-[9px] font-black uppercase py-1 flex items-center justify-center" variant="secondary" onClick={() => onStatusChange(request.id, MaintenanceStatus.Completed)}>
                        <CheckIcon /> Resolve
                    </Button>
                )}
            </div>
        </div>
    );
};


const MaintenanceColumn: React.FC<{ title: string, status: MaintenanceStatus, requests: MaintenanceRequest[], onStatusChange: (id: number, status: MaintenanceStatus) => void }> = ({ title, status, requests, onStatusChange }) => {
    const theme = STATUS_THEME[status];
    return (
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 flex-1 min-w-[250px]">
            <div className="flex items-center mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className={`h-2.5 w-2.5 rounded-full mr-2 ${theme.dot}`}></span>
                <h3 className={`font-black uppercase text-xs flex-1 ${theme.text}`}>{title}</h3>
                <span className={`ml-2 text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-sm ${theme.badge}`}>{requests.length}</span>
            </div>
            <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
                {requests.length > 0 ? requests.map(req => (
                    <MaintenanceRequestCard key={req.id} request={req} onStatusChange={onStatusChange} />
                )) : (
                    <div className="py-20 text-center opacity-30">
                      <p className="text-[10px] font-black uppercase">Category Inactive</p>
                    </div>
                )}
            </div>
        </div>
    );
};


export const Maintenance: React.FC<MaintenanceProps> = ({ hotelData }) => {
    const { maintenanceRequests, addMaintenanceRequest, updateMaintenanceRequestStatus, rooms } = hotelData;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formState, setFormState] = useState(INITIAL_FORM_STATE);
    const [isGeneralArea, setIsGeneralArea] = useState(false);

    const columns = useMemo(() => ({
        reported: maintenanceRequests.filter(r => r.status === MaintenanceStatus.Reported),
        inProgress: maintenanceRequests.filter(r => r.status === MaintenanceStatus.InProgress),
        completed: maintenanceRequests.filter(r => r.status === MaintenanceStatus.Completed),
    }), [maintenanceRequests]);
    
    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormState(INITIAL_FORM_STATE);
        setIsGeneralArea(false);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'general') {
            setIsGeneralArea(true);
            setFormState(prev => ({ ...prev, roomId: undefined, location: '' }));
        } else {
            setIsGeneralArea(false);
            const roomId = parseInt(value);
            const room = rooms.find(r => r.id === roomId);
            setFormState(prev => ({ ...prev, roomId, location: `Unit ${room?.number}` }));
        }
    };

    const handleSubmit = () => {
        if (!formState.location || !formState.description) {
            alert('Required parameters missing.');
            return;
        }
        addMaintenanceRequest(formState);
        handleCloseModal();
    };


    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Engineering Control</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-1">Infrastructure Maintenance Board</p>
                  </div>
                  <Button onClick={handleOpenModal} className="uppercase font-black text-[10px]">Log Fault</Button>
                </div>
                <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-4">
                    <MaintenanceColumn title="Logged" status={MaintenanceStatus.Reported} requests={columns.reported} onStatusChange={updateMaintenanceRequestStatus} />
                    <MaintenanceColumn title="Active" status={MaintenanceStatus.InProgress} requests={columns.inProgress} onStatusChange={updateMaintenanceRequestStatus} />
                    <MaintenanceColumn title="Resolved" status={MaintenanceStatus.Completed} requests={columns.completed} onStatusChange={updateMaintenanceRequestStatus} />
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Fault Manifest Entry">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Infrastructure Location</label>
                        <select
                            onChange={handleLocationChange}
                            defaultValue=""
                            className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-bold uppercase text-xs"
                        >
                            <option value="" disabled>Select Location</option>
                            {rooms.map(room => (
                                <option key={room.id} value={room.id}>Unit {room.number}</option>
                            ))}
                            <option value="general">Common Utility Area</option>
                        </select>
                    </div>
                    {isGeneralArea && (
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Specific Designation</label>
                            <input
                                type="text"
                                name="location"
                                value={formState.location}
                                onChange={handleFormChange}
                                className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-bold uppercase text-xs"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Fault Description</label>
                        <textarea
                            name="description"
                            value={formState.description}
                            onChange={handleFormChange}
                            rows={3}
                            className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs italic"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Urgency Tier</label>
                        <select
                            name="priority"
                            value={formState.priority}
                            onChange={handleFormChange}
                            className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 font-black uppercase text-xs"
                        >
                            <option value={MaintenancePriority.Low}>Tier 3 (Low)</option>
                            <option value={MaintenancePriority.Medium}>Tier 2 (Medium)</option>
                            <option value={MaintenancePriority.High}>Tier 1 (Critical)</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button variant="secondary" onClick={handleCloseModal} className="uppercase font-black text-[10px]">Abort</Button>
                        <Button onClick={handleSubmit} className="uppercase font-black text-[10px]">Commit Manifest</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

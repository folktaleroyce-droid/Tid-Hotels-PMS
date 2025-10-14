import React, { useState, useMemo } from 'react';
import type { HotelData, MaintenanceRequest } from '../types.ts';
import { MaintenanceStatus, MaintenancePriority } from '../types.ts';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import { MAINTENANCE_PRIORITY_THEME } from '../constants.tsx';

interface MaintenanceProps {
    hotelData: HotelData;
}

const INITIAL_FORM_STATE: Omit<MaintenanceRequest, 'id' | 'reportedAt' | 'status'> = {
    location: '',
    description: '',
    priority: MaintenancePriority.Medium,
    roomId: undefined
};

const MaintenanceRequestCard: React.FC<{ request: MaintenanceRequest, onStatusChange: (id: number, status: MaintenanceStatus) => void }> = ({ request, onStatusChange }) => {
    return (
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg shadow-sm border-l-4 border-slate-400 dark:border-slate-500">
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-slate-800 dark:text-slate-200">{request.location}</h4>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${MAINTENANCE_PRIORITY_THEME[request.priority].bg} ${MAINTENANCE_PRIORITY_THEME[request.priority].text}`}>
                    {request.priority}
                </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 my-2">{request.description}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500">Reported on: {request.reportedAt}</p>
            <div className="mt-4 flex space-x-2">
                {request.status === MaintenanceStatus.Reported && (
                    <Button className="w-full text-xs py-1" onClick={() => onStatusChange(request.id, MaintenanceStatus.InProgress)}>Start Work</Button>
                )}
                {request.status === MaintenanceStatus.InProgress && (
                    <Button className="w-full text-xs py-1" variant="secondary" onClick={() => onStatusChange(request.id, MaintenanceStatus.Completed)}>Mark as Complete</Button>
                )}
            </div>
        </div>
    );
};


const MaintenanceColumn: React.FC<{ title: string, requests: MaintenanceRequest[], onStatusChange: (id: number, status: MaintenanceStatus) => void }> = ({ title, requests, onStatusChange }) => {
    return (
        <div className="bg-slate-200 dark:bg-slate-900/50 rounded-lg p-4 flex-1">
            <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">{title} ({requests.length})</h3>
            <div className="space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto pr-2">
                {requests.map(req => (
                    <MaintenanceRequestCard key={req.id} request={req} onStatusChange={onStatusChange} />
                ))}
                {requests.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No requests.</p>}
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
            setFormState(prev => ({ ...prev, roomId, location: `Room ${room?.number}` }));
        }
    };

    const handleSubmit = () => {
        if (!formState.location || !formState.description) {
            alert('Please fill out all required fields.');
            return;
        }
        addMaintenanceRequest(formState);
        handleCloseModal();
    };


    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Maintenance Board</h2>
                    <Button onClick={handleOpenModal}>Report New Issue</Button>
                </div>
                <div className="flex flex-col lg:flex-row gap-6">
                    <MaintenanceColumn title="Reported" requests={columns.reported} onStatusChange={updateMaintenanceRequestStatus} />
                    <MaintenanceColumn title="In Progress" requests={columns.inProgress} onStatusChange={updateMaintenanceRequestStatus} />
                    <MaintenanceColumn title="Completed" requests={columns.completed} onStatusChange={updateMaintenanceRequestStatus} />
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Report a Maintenance Issue">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Location*</label>
                        <select
                            onChange={handleLocationChange}
                            defaultValue=""
                            className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                        >
                            <option value="" disabled>Select a location...</option>
                            {rooms.map(room => (
                                <option key={room.id} value={room.id}>Room {room.number}</option>
                            ))}
                            <option value="general">General Area</option>
                        </select>
                    </div>
                    {isGeneralArea && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Specify General Area*</label>
                            <input
                                type="text"
                                name="location"
                                value={formState.location}
                                onChange={handleFormChange}
                                placeholder="e.g., Lobby, Pool, Gym"
                                className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium mb-1">Description of Issue*</label>
                        <textarea
                            name="description"
                            value={formState.description}
                            onChange={handleFormChange}
                            rows={3}
                            className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Priority*</label>
                        <select
                            name="priority"
                            value={formState.priority}
                            onChange={handleFormChange}
                            className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                        >
                            <option value={MaintenancePriority.Low}>Low</option>
                            <option value={MaintenancePriority.Medium}>Medium</option>
                            <option value={MaintenancePriority.High}>High</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                        <Button onClick={handleSubmit}>Submit Report</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

import React, { useState, useMemo } from 'react';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import { useHotelData } from '../hooks/useHotelData.ts';
import { UserRole } from '../types.ts';
import type { Staff, Role } from '../types.ts';

type AdminTab = 'users' | 'roles' | 'audit' | 'config';

export const Admin: React.FC = () => {
    const { staff, customRoles, auditLog, addStaff, updateStaff, deleteStaff, addCustomRole, updateCustomRole, deleteCustomRole, addSyncLogEntry } = useHotelData();
    const [activeTab, setActiveTab] = useState<AdminTab>('users');
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<Staff>>({});

    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Partial<Role>>({ moduleAccess: [] });

    const filteredAudit = useMemo(() => {
        return auditLog.filter(e => e.details.toLowerCase().includes(searchTerm.toLowerCase()) || e.action.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [auditLog, searchTerm]);

    const handleSaveUser = () => {
        if (!editingUser.name || !editingUser.role || !editingUser.email) {
            addSyncLogEntry('Actor provisioning aborted: Parameters missing', 'error');
            return;
        }
        if (editingUser.id) {
            updateStaff(editingUser as Staff);
        } else {
            addStaff(editingUser as any);
        }
        setIsUserModalOpen(false);
    };

    const handleRevokeStaff = (id: number) => {
        if (window.confirm('Confirm permanent access revocation for this actor?')) {
            deleteStaff(id);
            addSyncLogEntry('Actor identity revoked from registry', 'warn');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Command Center</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-2">Governance & Authority Panel</p>
              </div>
              <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-300 dark:border-slate-700">
                {(['users', 'roles', 'audit', 'config'] as AdminTab[]).map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-500'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'users' && (
                <Card title="Authoritative Identity Registry">
                    <div className="flex justify-between gap-4 mb-6">
                        <input type="text" placeholder="Search actor..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 max-w-sm p-2 border rounded font-bold text-xs uppercase" />
                        <Button onClick={() => { setEditingUser({ role: UserRole.Staff, status: 'Active' }); setIsUserModalOpen(true); }}>Deploy Identity</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                                <tr>
                                    <th className="p-3 text-[10px] font-black uppercase text-slate-400">Identity</th>
                                    <th className="p-3 text-[10px] font-black uppercase text-slate-400">Privilege Role</th>
                                    <th className="p-3 text-[10px] font-black uppercase text-slate-400">Operational Status</th>
                                    <th className="p-3 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staff.map(s => (
                                    <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50">
                                        <td className="p-3">
                                            <div className="font-black text-xs uppercase text-slate-900 dark:text-white">{s.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono lowercase">{s.email}</div>
                                        </td>
                                        <td className="p-3">
                                            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-indigo-100">{s.role}</span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <button onClick={() => { setEditingUser(s); setIsUserModalOpen(true); }} className="text-indigo-600 text-[10px] font-black uppercase mr-4 hover:underline">Config</button>
                                            <button onClick={() => handleRevokeStaff(s.id)} className="text-red-500 text-[10px] font-black uppercase hover:underline">Revoke</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === 'audit' && (
                <Card title="Forensic Ecosystem Log">
                    <div className="flex justify-between gap-4 mb-6">
                         <input type="text" placeholder="Search forensic details..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 max-w-md p-2 border rounded font-bold text-xs uppercase" />
                         <Button variant="secondary" onClick={() => window.print()} className="text-[10px] font-black uppercase">Export Forensic Manifest</Button>
                    </div>
                    <div className="overflow-x-auto max-h-[60vh]">
                        <table className="w-full text-left text-[11px]">
                            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 border-b">
                                <tr>
                                    <th className="p-2 font-black uppercase text-slate-400">Timeline</th>
                                    <th className="p-2 font-black uppercase text-slate-400">Actor</th>
                                    <th className="p-2 font-black uppercase text-slate-400">Protocol Action</th>
                                    <th className="p-2 font-black uppercase text-slate-400">Fact Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAudit.map(log => (
                                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                        <td className="p-2 font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="p-2">
                                            <div className="font-black uppercase text-slate-700">{log.userName}</div>
                                            <div className="text-[8px] opacity-60 uppercase">{log.userRole}</div>
                                        </td>
                                        <td className="p-2"><span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-black uppercase text-[8px] border border-indigo-100">{log.action}</span></td>
                                        <td className="p-2 text-slate-600 font-medium italic">{log.details}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Actor Provisioning">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Legal Nomenclature</label>
                            <input type="text" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full p-2 border rounded font-black uppercase text-xs" />
                        </div>
                         <div className="col-span-2">
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Electronic Mail</label>
                            <input type="email" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full p-2 border rounded font-mono text-xs" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Privilege Role</label>
                            <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})} className="w-full p-2 border rounded text-xs font-black uppercase">
                                {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Registry Status</label>
                            <select value={editingUser.status} onChange={e => setEditingUser({...editingUser, status: e.target.value as any})} className="w-full p-2 border rounded text-xs font-black uppercase">
                                <option value="Active">Active Session</option>
                                <option value="Suspended">Suspended</option>
                                <option value="Pending">Approval Pending</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Security Credential (Password)</label>
                            <input type="password" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="w-full p-2 border rounded font-mono text-xs" placeholder="••••••••" />
                        </div>
                    </div>
                    <div className="pt-4 border-t flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsUserModalOpen(false)}>Abort</Button>
                        <Button onClick={handleSaveUser}>Deploy Actor</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
import React, { useState, useMemo } from 'react';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import type { HotelData, Staff, Branch, Role, ModulePermissions, AuditLogEntry, SystemSecuritySettings } from '../types.ts';
import { UserRole } from '../types.ts';

interface SuperAdminProps {
  hotelData: HotelData;
}

type Tab = 'dashboard' | 'users' | 'roles' | 'branches' | 'settings' | 'audit';

export const SuperAdminControlCenter: React.FC<SuperAdminProps> = ({ hotelData }) => {
  const { 
    staff, branches, customRoles, auditLog, systemStatus, licenseStatus, propertyInfo, securitySettings,
    systemModules, toggleModule, updatePropertyInfo, updateSecuritySettings, updateSystemStatus, addBranch,
    addCustomRole, updateCustomRole, deleteCustomRole, addStaff, updateStaff, deleteStaff
  } = hotelData;

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<Staff> | null>(null);
  const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);

  const filteredStaff = staff.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleRevoke = (id: number) => {
    if (window.confirm('CRITICAL: Permanently revoke all access for this identity?')) {
        deleteStaff(id);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-indigo-600 text-white p-4">
          <p className="text-xs uppercase font-black opacity-60">System Status</p>
          <h4 className="text-2xl font-black">{systemStatus.toUpperCase()}</h4>
          <div className="mt-2 text-[10px] bg-white/20 p-1 rounded inline-block">Cloud Engine: V4.15.2-PROD</div>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase font-black text-slate-400">Total Users</p>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white">{staff.length}</h4>
          <p className="text-[10px] text-green-500 font-bold">{staff.filter(s => s.status === 'Active').length} Active sessions</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase font-black text-slate-400">Branches</p>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white">{branches.length}</h4>
          <p className="text-[10px] text-slate-500">Global Coverage</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase font-black text-slate-400">License</p>
          <h4 className="text-2xl font-black text-indigo-600">{licenseStatus.toUpperCase()}</h4>
          <p className="text-[10px] text-slate-500">Full Enterprise Stack</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Authoritative Audit Pulse">
          <div className="space-y-3">
            {auditLog.length > 0 ? auditLog.slice(0, 8).map(log => (
              <div key={log.id} className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-black uppercase text-indigo-500">{log.action}</p>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">{log.details}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500">{log.userName}</p>
                  <p className="text-[9px] font-mono opacity-60">{new Date(log.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center opacity-40">
                <p className="text-xs font-black uppercase">No Recent Activity Detected</p>
              </div>
            )}
          </div>
        </Card>
        
        <Card title="Module Control Board">
          <div className="space-y-4">
            {Object.keys(systemModules).map(moduleId => (
              <div key={moduleId} className="flex justify-between items-center py-2 border-b last:border-0 border-slate-100 dark:border-slate-800">
                <span className="font-black uppercase text-xs text-slate-700 dark:text-slate-300">{moduleId} module</span>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-black uppercase ${systemModules[moduleId] ? 'text-green-500' : 'text-red-500'}`}>
                    {systemModules[moduleId] ? 'Operational' : 'Disabled'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={systemModules[moduleId]} 
                        onChange={() => toggleModule(moduleId)}
                        className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <Card title="Identity Registry">
      <div className="mb-4 flex justify-between gap-4">
        <div className="flex-1 max-w-sm">
          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Search Identifier</label>
          <input 
            type="text" 
            placeholder="Name or Email..."
            className="p-2 w-full rounded border dark:bg-slate-700 text-xs font-bold uppercase" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="self-end">
          <Button onClick={() => { setEditingUser({ role: UserRole.Staff, status: 'Active' }); setIsUserModalOpen(true); }}>Add Identity</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b">
            <tr>
              <th className="p-3 text-xs font-black uppercase">Identity</th>
              <th className="p-3 text-xs font-black uppercase">Dept / Authority</th>
              <th className="p-3 text-xs font-black uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map(s => (
              <tr key={s.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50">
                <td className="p-3">
                  <div className="font-black text-xs uppercase">{s.name}</div>
                  <div className="text-[10px] opacity-60 font-mono lowercase">{s.email}</div>
                </td>
                <td className="p-3">
                  <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">{s.role}</span>
                  <div className="text-[10px] text-slate-500 mt-0.5 uppercase font-bold">{s.department}</div>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => { setEditingUser(s); setIsUserModalOpen(true); }} className="text-indigo-600 text-xs font-black mr-4 uppercase hover:underline">Config</button>
                  <button onClick={() => handleRevoke(s.id)} className="text-red-500 text-xs font-black uppercase hover:underline">Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Super Admin</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mt-2">Central Governance Hub</p>
        </div>
        <nav className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-300 dark:border-slate-700">
          {(['dashboard', 'users', 'roles', 'branches', 'settings', 'audit'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-500'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === 'dashboard' && renderOverview()}
        {activeTab === 'users' && renderUserManagement()}
        
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card title="Corporate Identity & Locale">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 ml-1">Entity Name</label>
                    <input type="text" value={propertyInfo.name} className="w-full p-2.5 rounded-lg border dark:bg-slate-700 font-bold uppercase" readOnly />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 ml-1">Interface Language</label>
                    <select className="w-full p-2.5 rounded-lg border dark:bg-slate-700 font-black uppercase text-xs">
                      <option>English (Lagos)</option>
                      <option>International Standard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 ml-1">Primary Currency</label>
                    <select className="w-full p-2.5 rounded-lg border dark:bg-slate-700 font-black uppercase text-xs">
                      <option>NGN (₦)</option>
                      <option>USD ($)</option>
                    </select>
                  </div>
                </div>
              </Card>

              <Card title="System Hardening">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div>
                      <h5 className="text-sm font-black uppercase text-slate-700 dark:text-slate-300 leading-none">Authoritative MFA</h5>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium italic">Enforce 2FA for administrative workflows</p>
                    </div>
                    <input type="checkbox" checked={securitySettings.enforce2FA} onChange={e => updateSecuritySettings({...securitySettings, enforce2FA: e.target.checked})} className="w-5 h-5 accent-indigo-600" />
                  </div>
                </div>
              </Card>
            </div>

            <Card title="Resilience Controls">
                <div className="space-y-2">
                  <Button className="w-full py-3 font-black uppercase text-xs" variant="secondary">Run Cloud Backup</Button>
                  <Button className="w-full py-3 font-black uppercase text-xs" variant="secondary">Integrity Check</Button>
                  <Button className="w-full py-3 font-black uppercase text-xs" variant="danger">Emergency Isolate</Button>
                </div>
                <div className="mt-6 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded border border-indigo-100 dark:border-indigo-800">
                  <h6 className="text-[10px] font-black text-indigo-600 uppercase">Protection Level</h6>
                  <p className="text-[10px] text-indigo-700 dark:text-indigo-300 mt-1 italic">Industrial Grade Encryption Enabled</p>
                </div>
            </Card>
          </div>
        )}

        {activeTab === 'audit' && (
          <Card title="Forensic Ecosystem">
            <div className="overflow-x-auto max-h-[70vh]">
                <table className="w-full text-left text-[11px]">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 border-b">
                        <tr>
                            <th className="p-2 uppercase font-black text-slate-400">Timeline</th>
                            <th className="p-2 uppercase font-black text-slate-400">Actor</th>
                            <th className="p-2 uppercase font-black text-slate-400">Action</th>
                            <th className="p-2 uppercase font-black text-slate-400">Fact Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditLog.map(e => (
                            <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="p-2 font-mono text-slate-500">{new Date(e.timestamp).toLocaleString()}</td>
                                <td className="p-2">
                                    <div className="font-black text-slate-700 dark:text-slate-200 uppercase leading-none">{e.userName}</div>
                                    <div className="text-[9px] opacity-60 uppercase mt-1 tracking-wider font-bold">{e.userRole}</div>
                                </td>
                                <td className="p-2"><span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 px-1.5 py-0.5 rounded font-black uppercase text-[9px] border border-indigo-200">{e.action}</span></td>
                                <td className="p-2 text-slate-600 dark:text-slate-400 font-medium italic">{e.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </Card>
        )}
      </div>

      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Identity Configuration">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase mb-1">Identity nomenclature</label>
              <input type="text" value={editingUser?.name || ''} onChange={e => setEditingUser({...editingUser!, name: e.target.value})} className="w-full p-2 border rounded font-black uppercase text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase mb-1">Email Endpoint</label>
              <input type="email" value={editingUser?.email || ''} onChange={e => setEditingUser({...editingUser!, email: e.target.value})} className="w-full p-2 border rounded font-mono text-xs" />
            </div>
            <div>
                <label className="block text-[10px] font-black uppercase mb-1">Privilege Rank</label>
                <select value={editingUser?.role || UserRole.Staff} onChange={e => setEditingUser({...editingUser!, role: e.target.value as UserRole})} className="w-full p-2 border rounded font-black uppercase text-xs">
                    {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
          </div>
          <div className="pt-6 flex justify-end gap-2 border-t">
            <Button variant="secondary" onClick={() => setIsUserModalOpen(false)}>Abort</Button>
            <Button onClick={() => { 
              if (editingUser?.id) updateStaff(editingUser as Staff); 
              else addStaff(editingUser as any); 
              setIsUserModalOpen(false); 
            }}>Commit Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
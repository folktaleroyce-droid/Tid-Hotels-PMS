
import React, { useState, useMemo } from 'react';
import type { HotelData, Employee, BaseEntity, AuditLogEntry } from '../types.ts';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import { useHotelData } from '../hooks/useHotelData.ts';
import { DEPARTMENTS } from '../constants.tsx';

const HOTEL_ASSETS = [
    'Master Key Card',
    'Maintenance Terminal',
    'Mobile Radio Unit',
    'Company Vehicle',
    'Executive Uniform Set',
    'Personal Laptop',
    'Safe Key 01',
    'Store Access Token',
    'Staff ID Badge',
    'Gym Access Card'
];

const initialEmployeeState: Omit<Employee, keyof BaseEntity | 'id'> = {
  name: '',
  department: DEPARTMENTS[0],
  jobTitle: '',
  salary: 0,
  hireDate: new Date().toISOString().split('T')[0],
  email: '',
  phone: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  profilePicture: '',
  assignedAssets: [],
  password: '',
};

const UserCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-slate-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
    </svg>
);

export const PeopleAndCulture: React.FC = () => {
    const { employees, addEmployee, updateEmployee, deleteEmployee, auditLog } = useHotelData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [activeModalTab, setActiveModalTab] = useState<'profile' | 'assets' | 'history'>('profile');
    const [currentEmployee, setCurrentEmployee] = useState<Omit<Employee, keyof BaseEntity | 'id'> | Employee>(initialEmployeeState);
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [jobTitleFilter, setJobTitleFilter] = useState('');
    
    const jobTitles = useMemo(() => {
        return [...new Set(employees.map(e => e.jobTitle))].sort();
    }, [employees]);
    
    const filteredEmployees = useMemo(() => {
        return employees.filter(employee => {
            const nameMatch = employee.name.toLowerCase().includes(searchTerm.toLowerCase());
            const departmentMatch = departmentFilter ? employee.department === departmentFilter : true;
            const jobTitleMatch = jobTitleFilter ? employee.jobTitle === jobTitleFilter : true;
            return nameMatch && departmentMatch && jobTitleMatch;
        });
    }, [employees, searchTerm, departmentFilter, jobTitleFilter]);

    const openAddModal = () => {
        setCurrentEmployee(initialEmployeeState);
        setModalMode('add');
        setActiveModalTab('profile');
        setIsModalOpen(true);
    };

    const openEditModal = (employee: Employee) => {
        setCurrentEmployee(employee);
        setModalMode('edit');
        setActiveModalTab('profile');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
      setIsModalOpen(false);
    };
    
    const handleSubmit = () => {
      if (!currentEmployee.name || !currentEmployee.jobTitle || !currentEmployee.email || !currentEmployee.phone) {
          alert("Operational Failure: Required fields missing.");
          return;
      }

      if(modalMode === 'add') {
          addEmployee(currentEmployee as Omit<Employee, keyof BaseEntity | 'id'>);
      } else {
          updateEmployee(currentEmployee as Employee);
      }
      handleCloseModal();
    };
  
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setCurrentEmployee(prev => ({ ...prev, [name]: name === 'salary' ? parseFloat(value) : value }) as any);
    };

    const toggleAsset = (asset: string) => {
        const assets = currentEmployee.assignedAssets || [];
        const nextAssets = assets.includes(asset) 
            ? assets.filter(a => a !== asset) 
            : [...assets, asset];
        setCurrentEmployee(prev => ({ ...prev, assignedAssets: nextAssets }) as any);
    };

    const employeeHistory = useMemo(() => {
        if (!('id' in currentEmployee)) return [];
        return auditLog.filter(log => 
            log.userName.toLowerCase() === (currentEmployee as Employee).name.toLowerCase() || 
            (log.entityType === 'Employee' && log.entityId === (currentEmployee as Employee).id)
        );
    }, [currentEmployee, auditLog]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCurrentEmployee(prev => ({...prev, profilePicture: reader.result as string}));
            };
            reader.readAsDataURL(file);
        }
    }
    
    const handleDeleteEmployee = (employeeId: number) => {
      if(window.confirm("CRITICAL ACTION: Confirm permanent removal of this identity record?")) {
        deleteEmployee(employeeId);
      }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">People & Culture</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-2">Enterprise Identity Registry</p>
              </div>
              <Button onClick={openAddModal} className="font-black uppercase text-xs">Deploy New Identity</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Registered Actors</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{employees.length}</p>
                 </div>
                 <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Fiscal Allocation (Avg)</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                        ₦{(employees.reduce((acc, emp) => acc + emp.salary, 0) / (employees.length || 1)).toLocaleString()}
                    </p>
                 </div>
                 <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Active Departments</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                        {[...new Set(employees.map(e => e.department))].length}
                    </p>
                 </div>
            </div>

            <Card>
                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder="Identify by legal nomenclature..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full p-2.5 rounded-lg border dark:bg-slate-700 font-bold text-xs uppercase"
                        />
                        <select
                            value={departmentFilter}
                            onChange={e => setDepartmentFilter(e.target.value)}
                            className="w-full p-2.5 rounded-lg border dark:bg-slate-700 font-black text-[10px] uppercase"
                        >
                            <option value="">Global Departments</option>
                            {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                        </select>
                        <select
                            value={jobTitleFilter}
                            onChange={e => setJobTitleFilter(e.target.value)}
                            className="w-full p-2.5 rounded-lg border dark:bg-slate-700 font-black text-[10px] uppercase"
                        >
                            <option value="">Global Authority Levels</option>
                            {jobTitles.map(title => <option key={title} value={title}>{title}</option>)}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                            <tr>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400">Actor Entity</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400">Authority Rank</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400">Infrastructure</th>
                                <th className="p-4 text-[10px] font-black uppercase text-slate-400 text-right">Operational Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((employee) => (
                                <tr key={employee.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 shadow-inner">
                                                {employee.profilePicture ? (
                                                    <img src={employee.profilePicture} alt="" className="h-full w-full object-cover"/>
                                                ) : <UserCircleIcon />}
                                            </div>
                                            <div>
                                                <div className="font-black text-xs uppercase text-slate-900 dark:text-white">{employee.name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{employee.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-black text-[10px] uppercase text-indigo-600">{employee.jobTitle}</div>
                                        <div className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{employee.department}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {employee.assignedAssets?.slice(0, 2).map(a => (
                                                <span key={a} className="bg-slate-100 dark:bg-slate-900 text-[8px] font-black uppercase px-1.5 py-0.5 rounded border">
                                                    {a.split(' ')[0]}
                                                </span>
                                            ))}
                                            {(employee.assignedAssets?.length || 0) > 2 && (
                                                <span className="text-[8px] font-black text-slate-400">+{employee.assignedAssets.length - 2} items</span>
                                            )}
                                            {(!employee.assignedAssets || employee.assignedAssets.length === 0) && (
                                                <span className="text-[8px] font-black text-slate-300 uppercase italic">Unassigned</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end space-x-4">
                                            <button onClick={() => openEditModal(employee)} className="text-indigo-600 text-[10px] font-black uppercase hover:underline">Configure</button>
                                            <button onClick={() => handleDeleteEmployee(employee.id)} className="text-red-500 text-[10px] font-black uppercase hover:underline">Revoke</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Identity Configuration: ${modalMode === 'add' ? 'New Entity' : (currentEmployee as Employee).name}`}>
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg mb-6 border border-slate-200 dark:border-slate-800">
                    <button onClick={() => setActiveModalTab('profile')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded transition-all ${activeModalTab === 'profile' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}>Profile Registry</button>
                    <button onClick={() => setActiveModalTab('assets')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded transition-all ${activeModalTab === 'assets' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}>Asset Inventory</button>
                    <button onClick={() => setActiveModalTab('history')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded transition-all ${activeModalTab === 'history' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500'}`}>Forensic Ledger</button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    {activeModalTab === 'profile' && (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-6">
                                <div className="h-20 w-20 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-inner border-2 border-white dark:border-slate-800">
                                    {currentEmployee.profilePicture ? <img src={currentEmployee.profilePicture} alt="" className="h-full w-full object-cover" /> : <UserCircleIcon />}
                                </div>
                                <div className="flex-1">
                                    <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg hover:bg-indigo-700 transition-colors inline-block">
                                        Upload Biometric Photo
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    </label>
                                    <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">Reference Protocol: 400x400 JPG/PNG</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Legal Nomenclature</label>
                                    <input type="text" name="name" value={currentEmployee.name} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border dark:bg-slate-700 font-bold uppercase text-xs" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Electronic Mail</label>
                                    <input type="email" name="email" value={currentEmployee.email} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border dark:bg-slate-700 font-mono text-xs" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Terminal Contact</label>
                                    <input type="tel" name="phone" value={currentEmployee.phone} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border dark:bg-slate-700 font-mono text-xs" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Authority Rank</label>
                                    <input type="text" name="jobTitle" value={currentEmployee.jobTitle} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border dark:bg-slate-700 font-black text-xs uppercase" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Department Registry</label>
                                    <select name="department" value={currentEmployee.department} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border dark:bg-slate-700 font-black text-[10px] uppercase">
                                       {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <label className="block text-[10px] font-black uppercase text-indigo-600 mb-2 tracking-widest">Security Credentials</label>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Access Password</p>
                                            <input 
                                                type="password" 
                                                name="password" 
                                                placeholder="••••••••"
                                                value={currentEmployee.password || ''} 
                                                onChange={handleInputChange} 
                                                className="w-full p-2 border rounded font-mono text-xs" 
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Fiscal Tier (Annual)</p>
                                            <input type="number" name="salary" value={currentEmployee.salary} onChange={handleInputChange} className="w-full p-2 border rounded font-black text-xs" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeModalTab === 'assets' && (
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-4">Infrastructure Matrix Assignment</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {HOTEL_ASSETS.map(asset => {
                                    const isAssigned = (currentEmployee.assignedAssets || []).includes(asset);
                                    return (
                                        <div 
                                            key={asset} 
                                            onClick={() => toggleAsset(asset)}
                                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex justify-between items-center ${isAssigned ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'border-slate-100 dark:border-slate-800'}`}
                                        >
                                            <span className={`text-[10px] font-black uppercase ${isAssigned ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-400'}`}>{asset}</span>
                                            {isAssigned && <span className="text-indigo-600">✓</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeModalTab === 'history' && (
                        <div className="space-y-3">
                            {employeeHistory.length > 0 ? employeeHistory.map(log => (
                                <div key={log.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black uppercase text-indigo-500">{log.action}</span>
                                        <span className="text-[8px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mt-1">{log.details}</p>
                                </div>
                            )) : (
                                <div className="py-20 text-center opacity-30">
                                    <p className="text-[10px] font-black uppercase">No registry activity recorded</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-2 pt-6 border-t border-slate-200 dark:border-slate-700 mt-6">
                  <Button variant="secondary" onClick={handleCloseModal} className="font-black uppercase text-[10px]">Abort</Button>
                  <Button onClick={handleSubmit} className="font-black uppercase text-[10px]">Commit Identity</Button>
                </div>
            </Modal>
        </div>
    );
};

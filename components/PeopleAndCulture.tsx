import React, { useState, useMemo } from 'react';
import type { HotelData, Employee } from '../types.ts';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import { useHotelData } from '../hooks/useHotelData.ts';
import { DEPARTMENTS } from '../constants.tsx';

const initialEmployeeState: Omit<Employee, 'id'> = {
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
};

const UserCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-slate-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
    </svg>
);


export const PeopleAndCulture: React.FC = () => {
    const { employees, addEmployee, updateEmployee, setEmployees } = useHotelData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentEmployee, setCurrentEmployee] = useState<Omit<Employee, 'id'> | Employee>(initialEmployeeState);
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [jobTitleFilter, setJobTitleFilter] = useState('');
    
    // Analytics
    const averageSalary = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(employees.reduce((acc, emp) => acc + emp.salary, 0) / (employees.length || 1));
    const departmentsCount = [...new Set(employees.map(e => e.department))].length;
    
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
        setIsModalOpen(true);
    };

    const openEditModal = (employee: Employee) => {
        setCurrentEmployee(employee);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
      setIsModalOpen(false);
    };
    
    const handleSubmit = () => {
      if (!currentEmployee.name || !currentEmployee.jobTitle || !currentEmployee.email || !currentEmployee.phone) {
          alert("Please fill all required fields.");
          return;
      }

      if(modalMode === 'add') {
          addEmployee(currentEmployee as Omit<Employee, 'id'>);
      } else {
          updateEmployee(currentEmployee as Employee);
      }
      handleCloseModal();
    };
  
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setCurrentEmployee(prev => ({ ...prev, [name]: name === 'salary' ? parseFloat(value) : value }));
    };

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
      if(window.confirm("Are you sure you want to remove this employee?")) {
        setEmployees(employees.filter(emp => emp.id !== employeeId));
      }
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">People & Culture</h2>
                 <Button onClick={openAddModal}>Add New Employee</Button>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Total Employees</h4>
                    <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{employees.length}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Average Salary</h4>
                    <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{averageSalary}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Departments</h4>
                    <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{departmentsCount}</p>
                </div>
            </div>

            {/* Employee Management Section */}
            <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                    />
                    <select
                        value={departmentFilter}
                        onChange={e => setDepartmentFilter(e.target.value)}
                        className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                    >
                        <option value="">All Departments</option>
                        {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                    <select
                        value={jobTitleFilter}
                        onChange={e => setJobTitleFilter(e.target.value)}
                        className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                    >
                        <option value="">All Job Titles</option>
                        {jobTitles.map(title => <option key={title} value={title}>{title}</option>)}
                    </select>
                 </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-200 dark:bg-slate-700">
                  <tr>
                    <th className="p-3 text-xs font-bold uppercase">Employee</th>
                    <th className="p-3 text-xs font-bold uppercase">Job Title</th>
                    <th className="p-3 text-xs font-bold uppercase">Department</th>
                    <th className="p-3 text-xs font-bold uppercase">Contact</th>
                    <th className="p-3 text-xs font-bold uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee, index) => (
                    <tr key={employee.id} className={`border-b border-slate-200 dark:border-slate-700 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'} `}>
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                                {employee.profilePicture ? (
                                    <img src={employee.profilePicture} alt={employee.name} className="h-full w-full object-cover"/>
                                ) : <UserCircleIcon />}
                            </div>
                            <span className="font-medium">{employee.name}</span>
                        </div>
                      </td>
                      <td className="p-3">{employee.jobTitle}</td>
                      <td className="p-3">{employee.department}</td>
                      <td className="p-3">
                        <div className="text-sm">
                            <div>{employee.email}</div>
                            <div className="text-slate-500">{employee.phone}</div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center space-x-2">
                           <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => openEditModal(employee)}>Edit</Button>
                           <Button variant="secondary" className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 text-red-700 dark:text-red-300" onClick={() => handleDeleteEmployee(employee.id)}>Remove</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEmployees.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No employees found matching your criteria.
                </div>
              )}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalMode === 'add' ? 'Add New Employee' : `Edit ${currentEmployee.name}`}>
              <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                <div className="flex items-center space-x-4">
                    <div className="h-24 w-24 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                        {currentEmployee.profilePicture ? <img src={currentEmployee.profilePicture} alt="Profile" className="h-full w-full object-cover" /> : <UserCircleIcon />}
                    </div>
                    <div>
                        <label htmlFor="profile-picture-upload" className="cursor-pointer bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-md text-sm font-medium">
                            Upload Photo
                        </label>
                        <input id="profile-picture-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <p className="text-xs text-slate-500 mt-2">Recommended: Square, min 200x200px</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name</label>
                      <input type="text" name="name" value={currentEmployee.name} onChange={handleInputChange} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                     <div>
                      <label className="block text-sm font-medium mb-1">Job Title</label>
                      <input type="text" name="jobTitle" value={currentEmployee.jobTitle} onChange={handleInputChange} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Department</label>
                        <select name="department" value={currentEmployee.department} onChange={handleInputChange} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                           {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                        </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Salary (Annual, NGN)</label>
                      <input type="number" name="salary" value={currentEmployee.salary} onChange={handleInputChange} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input type="email" name="email" value={currentEmployee.email} onChange={handleInputChange} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <input type="tel" name="phone" value={currentEmployee.phone} onChange={handleInputChange} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                    <div className="md:col-span-2">
                        <hr className="my-2 border-slate-200 dark:border-slate-700" />
                    </div>
                     <div>
                      <label className="block text-sm font-medium mb-1">Emergency Contact Name</label>
                      <input type="text" name="emergencyContactName" value={currentEmployee.emergencyContactName} onChange={handleInputChange} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                     <div>
                      <label className="block text-sm font-medium mb-1">Emergency Contact Phone</label>
                      <input type="tel" name="emergencyContactPhone" value={currentEmployee.emergencyContactPhone} onChange={handleInputChange} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                  <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                  <Button onClick={handleSubmit}>Save Employee</Button>
                </div>
              </div>
            </Modal>
        </Card>
    );
};

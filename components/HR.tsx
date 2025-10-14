import React, { useState } from 'react';
// FIX: Added file extensions to imports to resolve module errors.
import type { HotelData, Employee } from '../types.ts';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';

interface HRProps {
  hotelData: HotelData;
}

export const HR: React.FC<HRProps> = ({ hotelData }) => {
  const { employees, addEmployee, setEmployees } = hotelData;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, 'id'>>({
    name: '',
    position: '',
    salary: 0,
    hireDate: new Date().toISOString().split('T')[0]
  });

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewEmployee({ name: '', position: '', salary: 0, hireDate: new Date().toISOString().split('T')[0] });
  };
  
  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.position || newEmployee.salary <= 0) {
        alert("Please fill all fields correctly.");
        return;
    }
    addEmployee(newEmployee);
    handleCloseModal();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEmployee(prev => ({ ...prev, [name]: name === 'salary' ? parseFloat(value) : value }));
  };
  
  const handleDeleteEmployee = (employeeId: number) => {
    if(window.confirm("Are you sure you want to remove this employee?")) {
      setEmployees(employees.filter(emp => emp.id !== employeeId));
    }
  };

  return (
    <div>
      <Card title="Employee Management">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Current Staff</h3>
          <Button onClick={handleOpenModal}>Add New Employee</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr className="border-b border-slate-200 dark:border-slate-600">
                <th className="p-3">Name</th>
                <th className="p-3">Position</th>
                <th className="p-3">Salary</th>
                <th className="p-3">Hire Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee, index) => (
                <tr key={employee.id} className={`border-b border-slate-200 dark:border-slate-700 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'} `}>
                  <td className="p-3 font-medium">{employee.name}</td>
                  <td className="p-3">{employee.position}</td>
                  <td className="p-3">${employee.salary.toLocaleString()}</td>
                  <td className="p-3">{employee.hireDate}</td>
                  <td className="p-3">
                    <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => handleDeleteEmployee(employee.id)}>Remove</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Add New Employee">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Full Name</label>
            <input type="text" name="name" value={newEmployee.name} onChange={handleInputChange} className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Position</label>
            <input type="text" name="position" value={newEmployee.position} onChange={handleInputChange} className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Salary (Annual)</label>
            <input type="number" name="salary" value={newEmployee.salary} onChange={handleInputChange} className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Hire Date</label>
            <input type="date" name="hireDate" value={newEmployee.hireDate} onChange={handleInputChange} className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleAddEmployee}>Save Employee</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
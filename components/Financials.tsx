
import React, { useState, useMemo } from 'react';
import type { HotelData, Expense } from '../types.ts';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { UserRole } from '../types.ts';

declare const XLSX: any;

interface FinancialsProps {
    hotelData: HotelData;
}

type UnifiedTransaction = {
    id: string;
    date: string;
    source: 'In-house' | 'Walk-in' | 'Expenditure';
    guestName: string;
    description: string;
    charge: number;
    payment: number;
    tax: number;
    expense: number;
};

const today = new Date().toISOString().split('T')[0];
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(new Date().getDate() - 30);
const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

export const Financials: React.FC<FinancialsProps> = ({ hotelData }) => {
    const { transactions, guests, walkInTransactions, expenses, addExpense, deleteExpense, addSyncLogEntry } = hotelData;
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'pnl' | 'expenditure' | 'history'>('pnl');
    const [dateRange, setDateRange] = useState({ start: thirtyDaysAgoStr, end: today });
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expenseForm, setExpenseForm] = useState({ category: 'Supplies' as Expense['category'], amount: '', description: '', date: today });

    const isManager = currentUser?.role === UserRole.Manager || currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;

    const unifiedTransactions = useMemo(() => {
        const inHouse = transactions.map(t => ({
            id: `inhouse-${t.id}`,
            date: t.date,
            source: 'In-house' as const,
            guestName: guests.find(g => g.id === t.guestId)?.name || 'N/A',
            description: t.description,
            charge: t.amount > 0 && !t.description.toLowerCase().includes('tax') ? t.amount : 0,
            payment: t.amount < 0 ? -t.amount : 0,
            tax: t.description.toLowerCase().includes('tax') ? t.amount : 0,
            expense: 0
        }));

        const walkIn = walkInTransactions.map(t => ({
            id: `walkin-${t.id}`,
            date: t.date,
            source: 'Walk-in' as const,
            guestName: 'Walk-in Guest',
            description: t.service,
            charge: t.amount - t.discount,
            payment: t.amountPaid,
            tax: t.tax,
            expense: 0
        }));

        const exps = expenses.map(e => ({
            id: `exp-${e.id}`,
            date: e.date,
            source: 'Expenditure' as const,
            guestName: 'Supplier/Internal',
            description: `[${e.category}] ${e.description}`,
            charge: 0,
            payment: 0,
            tax: 0,
            expense: e.amount
        }));

        return [...inHouse, ...walkIn, ...exps].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, walkInTransactions, expenses, guests]);

    const filteredTransactions = useMemo(() => {
        return unifiedTransactions.filter(t => t.date >= dateRange.start && t.date <= dateRange.end);
    }, [unifiedTransactions, dateRange]);

    const reportData = useMemo(() => {
        const totalRevenue = filteredTransactions.reduce((s, t) => s + t.charge + t.tax, 0);
        const totalExpenses = filteredTransactions.reduce((s, t) => s + t.expense, 0);
        const netProfit = totalRevenue - totalExpenses;
        return { totalRevenue, totalExpenses, netProfit };
    }, [filteredTransactions]);

    const handleSaveExpense = () => {
        if (!expenseForm.amount || !expenseForm.description) return;
        addExpense({
            category: expenseForm.category,
            amount: parseFloat(expenseForm.amount),
            description: expenseForm.description,
            date: expenseForm.date
        });
        setIsExpenseModalOpen(false);
        setExpenseForm({ category: 'Supplies', amount: '', description: '', date: today });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Fiscal Command</h1>
                <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-300 dark:border-slate-700">
                    <button onClick={() => setActiveTab('pnl')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'pnl' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>P&L Engine</button>
                    <button onClick={() => setActiveTab('expenditure')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'expenditure' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Expenditure</button>
                    <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Full Log</button>
                </div>
            </div>

            <Card className="print:hidden">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Timeline Start</label>
                        <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="w-full p-2 border rounded font-bold text-xs" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Timeline End</label>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="w-full p-2 border rounded font-bold text-xs" />
                    </div>
                    {activeTab === 'expenditure' && isManager && (
                        <div className="md:col-span-2 flex justify-end">
                            <Button onClick={() => setIsExpenseModalOpen(true)}>Log New Expense</Button>
                        </div>
                    )}
                </div>
            </Card>

            {activeTab === 'pnl' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="border-l-4 border-green-500">
                        <p className="text-[10px] font-black uppercase text-slate-500">Gross Realized Revenue</p>
                        <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mt-1">₦{reportData.totalRevenue.toLocaleString()}</h4>
                    </Card>
                    <Card className="border-l-4 border-red-500">
                        <p className="text-[10px] font-black uppercase text-slate-500">Total Operational Expenditure</p>
                        <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mt-1">₦{reportData.totalExpenses.toLocaleString()}</h4>
                    </Card>
                    <Card className={`border-l-4 ${reportData.netProfit >= 0 ? 'border-indigo-600' : 'border-orange-500'} bg-slate-900 text-white`}>
                        <p className="text-[10px] font-black uppercase opacity-60">Net Operational Yield (P&L)</p>
                        <h4 className="text-3xl font-black tracking-tighter mt-1">₦{reportData.netProfit.toLocaleString()}</h4>
                    </Card>
                    
                    <Card title="Revenue Distribution" className="lg:col-span-3">
                        <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-hidden">
                             <div className="bg-green-500 h-full" style={{ width: `${(reportData.totalRevenue / (reportData.totalRevenue + reportData.totalExpenses || 1)) * 100}%` }}></div>
                             <div className="bg-red-500 h-full" style={{ width: `${(reportData.totalExpenses / (reportData.totalRevenue + reportData.totalExpenses || 1)) * 100}%` }}></div>
                        </div>
                        <div className="flex gap-4 mt-4 text-[10px] font-black uppercase">
                            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-500 rounded"></span> Inbound</div>
                            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-500 rounded"></span> Outbound</div>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'expenditure' && (
                <Card title="Expenditure Ledger">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                                <tr>
                                    <th className="p-3 text-[10px] font-black uppercase text-slate-400">Timeline</th>
                                    <th className="p-3 text-[10px] font-black uppercase text-slate-400">Category</th>
                                    <th className="p-3 text-[10px] font-black uppercase text-slate-400">Description</th>
                                    <th className="p-3 text-[10px] font-black uppercase text-slate-400 text-right">Value</th>
                                    {isManager && <th className="p-3 text-[10px] font-black uppercase text-slate-400 text-right">Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end).map(e => (
                                    <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50">
                                        <td className="p-3 font-mono text-[10px]">{e.date}</td>
                                        <td className="p-3"><span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[9px] font-black uppercase border">{e.category}</span></td>
                                        <td className="p-3 text-xs font-bold text-slate-700 dark:text-slate-300">{e.description}</td>
                                        <td className="p-3 text-right font-black text-red-500 font-mono">₦{e.amount.toLocaleString()}</td>
                                        {isManager && <td className="p-3 text-right"><button onClick={() => deleteExpense(e.id)} className="text-red-500 text-[9px] font-black uppercase hover:underline">Revoke</button></td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Operational Outbound Posting">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Expenditure Tier</label>
                            <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value as any})} className="w-full p-2 border rounded font-black text-xs uppercase">
                                <option value="Payroll">Human Resources / Payroll</option>
                                <option value="Utilities">Utilities & Energy</option>
                                <option value="Supplies">Operating Supplies</option>
                                <option value="Maintenance">Infrastructure Maintenance</option>
                                <option value="Marketing">Sales & Marketing</option>
                                <option value="Other">Miscellaneous Outbound</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Posting Date</label>
                            <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} className="w-full p-2 border rounded font-bold text-xs" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Commodity / Service Designation</label>
                        <input type="text" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full p-2 border rounded font-black uppercase text-xs" placeholder="e.g. Electricity Bill Jan 2024" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Settlement Valuation (₦)</label>
                        <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full p-3 border rounded font-mono font-black text-xl" />
                    </div>
                    <div className="pt-4 flex justify-end gap-2 border-t">
                        <Button variant="secondary" onClick={() => setIsExpenseModalOpen(false)}>Abort</Button>
                        <Button onClick={handleSaveExpense}>Authorize Posting</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

import React, { useState, useMemo } from 'react';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';
import { useHotelData } from '../hooks/useHotelData.ts';
import { WALK_IN_SERVICES, PAYMENT_METHODS } from '../constants.tsx';
import type { WalkInTransaction } from '../types.ts';
import { PrintableWalkInReceipt } from './common/PrintableWalkInReceipt.tsx';

// Declare XLSX library from CDN
declare const XLSX: any;

const INITIAL_FORM_STATE = {
    service: WALK_IN_SERVICES[0],
    serviceDetails: '',
    amount: '',
    discount: '',
    amountPaid: '',
    paymentMethod: PAYMENT_METHODS[0] as WalkInTransaction['paymentMethod'],
    currency: 'NGN' as 'NGN' | 'USD'
};

export const WalkIn: React.FC = () => {
    const { walkInTransactions, addWalkInTransaction, taxSettings } = useHotelData();
    const [formState, setFormState] = useState(INITIAL_FORM_STATE);
    const [errors, setErrors] = useState({ amount: '', discount: '', serviceDetails: '', amountPaid: '' });
    const [isReceiptModalOpen, setReceiptModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<WalkInTransaction | null>(null);
    
    const { taxAmount, amountDue, balance } = useMemo(() => {
        const subtotal = parseFloat(formState.amount) || 0;
        const discount = parseFloat(formState.discount) || 0;
        const paid = parseFloat(formState.amountPaid) || 0;
        
        const taxableAmount = subtotal - discount;
        const tax = (taxSettings.isEnabled && taxSettings.rate > 0 && taxableAmount > 0) 
            ? taxableAmount * (taxSettings.rate / 100) 
            : 0;

        const due = Math.max(0, taxableAmount + tax);
        const bal = due - paid;
        return { taxAmount: tax, amountDue: due, balance: bal };
    }, [formState.amount, formState.discount, formState.amountPaid, taxSettings]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const newErrors = { amount: '', discount: '', serviceDetails: '', amountPaid: '' };
        const amount = parseFloat(formState.amount);
        const discount = parseFloat(formState.discount) || 0;
        const amountPaid = parseFloat(formState.amountPaid);

        if (isNaN(amount) || amount <= 0) {
            newErrors.amount = 'Please enter a valid, positive amount.';
        }
        if (isNaN(discount) || discount < 0) {
            newErrors.discount = 'Discount must be a positive number.';
        }
        if (discount > amount) {
            newErrors.discount = 'Discount cannot exceed the total amount.';
        }
        if (formState.service === 'Other' && !formState.serviceDetails.trim()) {
            newErrors.serviceDetails = 'Please specify the service.';
        }
        if (isNaN(amountPaid) || amountPaid < 0) {
            newErrors.amountPaid = 'Amount paid must be a positive number.';
        }

        setErrors(newErrors);
        return !newErrors.amount && !newErrors.discount && !newErrors.serviceDetails && !newErrors.amountPaid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            addWalkInTransaction({
                ...formState,
                amount: parseFloat(formState.amount),
                discount: parseFloat(formState.discount) || 0,
                tax: taxAmount,
                amountPaid: parseFloat(formState.amountPaid) || 0,
            });
            setFormState(INITIAL_FORM_STATE); // Reset form
        }
    };
    
    const handlePrintReceipt = (transaction: WalkInTransaction) => {
        setSelectedTransaction(transaction);
        setReceiptModalOpen(true);
    };
    
    const handleExportExcel = () => {
        const wsData = [
            ["Date", "Service", "Service Details", "Subtotal", "Discount", "Tax", "Amount Paid", "Balance", "Currency", "Payment Method"],
            ...walkInTransactions.map(t => {
                const amountDue = t.amount - t.discount + t.tax;
                const balance = amountDue - t.amountPaid;
                return [
                    t.date, 
                    t.service,
                    t.serviceDetails || 'N/A',
                    t.amount,
                    t.discount,
                    t.tax,
                    t.amountPaid,
                    balance,
                    t.currency,
                    t.paymentMethod
                ]
            })
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [ { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Walk-in Transactions");
        XLSX.writeFile(wb, "Tide_Hotels_Walk_In_Transactions.xlsx");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <Card title="New Walk-in Charge">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="service" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Service</label>
                            <select
                                id="service"
                                name="service"
                                value={formState.service}
                                onChange={handleFormChange}
                                className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                            >
                                {WALK_IN_SERVICES.map(service => <option key={service} value={service}>{service}</option>)}
                            </select>
                        </div>
                        
                        {formState.service === 'Other' && (
                            <div>
                                <label htmlFor="serviceDetails" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Specify Service</label>
                                <input
                                    type="text"
                                    id="serviceDetails"
                                    name="serviceDetails"
                                    value={formState.serviceDetails}
                                    onChange={handleFormChange}
                                    placeholder="e.g., Conference Hall Rental"
                                    className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                                />
                                {errors.serviceDetails && <p className="text-red-500 text-xs mt-1">{errors.serviceDetails}</p>}
                            </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subtotal</label>
                                <input
                                    type="number"
                                    id="amount"
                                    name="amount"
                                    value={formState.amount}
                                    onChange={handleFormChange}
                                    placeholder="e.g., 5000"
                                    className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                                />
                                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                             </div>
                             <div>
                                <label htmlFor="discount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Discount</label>
                                <input
                                    type="number"
                                    id="discount"
                                    name="discount"
                                    value={formState.discount}
                                    onChange={handleFormChange}
                                    placeholder="e.g., 500"
                                    className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                                />
                                {errors.discount && <p className="text-red-500 text-xs mt-1">{errors.discount}</p>}
                             </div>
                        </div>
                        <div>
                            <label htmlFor="amountPaid" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount Paid</label>
                            <input
                                type="number"
                                id="amountPaid"
                                name="amountPaid"
                                value={formState.amountPaid}
                                onChange={handleFormChange}
                                placeholder="e.g., 4500"
                                className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                            />
                            {errors.amountPaid && <p className="text-red-500 text-xs mt-1">{errors.amountPaid}</p>}
                        </div>

                         <div>
                            <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                            <select
                                id="paymentMethod"
                                name="paymentMethod"
                                value={formState.paymentMethod}
                                onChange={handleFormChange}
                                className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                            >
                                {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label htmlFor="currency" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Currency</label>
                             <select
                                id="currency"
                                name="currency"
                                value={formState.currency}
                                onChange={handleFormChange}
                                className="w-full p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                             >
                                <option value="NGN">Naira (₦)</option>
                                <option value="USD">Dollar ($)</option>
                             </select>
                        </div>

                        <div className="p-3 space-y-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Tax ({taxSettings.rate}%):</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {formState.currency === 'NGN' ? '₦' : '$'}{taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Amount Due: </span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {formState.currency === 'NGN' ? '₦' : '$'}{amountDue.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Balance: </span>
                                <span className={`text-xl font-bold ${balance < 0 ? 'text-green-500' : (balance > 0 ? 'text-red-500' : 'text-slate-800 dark:text-slate-200')}`}>
                                    {formState.currency === 'NGN' ? '₦' : '$'}{balance.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </span>
                            </div>
                        </div>
                        
                        <Button type="submit" className="w-full">Post Transaction</Button>
                    </form>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Card>
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Transaction Log</h3>
                        <Button variant="secondary" onClick={handleExportExcel} disabled={walkInTransactions.length === 0}>
                            Export as Excel
                        </Button>
                    </div>
                    <div className="overflow-x-auto max-h-[calc(100vh-16rem)]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-200 dark:bg-slate-700 sticky top-0">
                                <tr>
                                    <th className="p-3 text-xs font-bold uppercase">Date</th>
                                    <th className="p-3 text-xs font-bold uppercase">Service</th>
                                    <th className="p-3 text-xs font-bold uppercase text-right">Subtotal</th>
                                    <th className="p-3 text-xs font-bold uppercase text-right">Discount</th>
                                    <th className="p-3 text-xs font-bold uppercase text-right">Paid</th>
                                    <th className="p-3 text-xs font-bold uppercase text-right">Balance</th>
                                    <th className="p-3 text-xs font-bold uppercase text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {walkInTransactions.map((t, index) => {
                                    const amountDue = t.amount - t.discount + t.tax;
                                    const balance = amountDue - t.amountPaid;
                                    const currencySymbol = t.currency === 'NGN' ? '₦' : '$';
                                    return (
                                        <tr key={t.id} className={`border-b border-slate-200 dark:border-slate-700 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                                            <td className="p-3">{t.date}</td>
                                            <td className="p-3">{t.service === 'Other' ? t.serviceDetails : t.service}</td>
                                            <td className="p-3 text-right">{currencySymbol}{t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className="p-3 text-right text-yellow-600">{currencySymbol}{t.discount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className="p-3 text-right text-green-600 font-semibold">{currencySymbol}{t.amountPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className={`p-3 text-right font-bold ${balance <= 0 ? 'text-slate-500' : 'text-red-500'}`}>{currencySymbol}{balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className="p-3 text-center">
                                                <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => handlePrintReceipt(t)}>Print Receipt</Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {walkInTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-slate-500 dark:text-slate-400">No walk-in transactions recorded yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <Modal isOpen={isReceiptModalOpen} onClose={() => setReceiptModalOpen(false)} title="Walk-in Guest Receipt">
                {selectedTransaction && <PrintableWalkInReceipt transaction={selectedTransaction} />}
            </Modal>
        </div>
    );
};
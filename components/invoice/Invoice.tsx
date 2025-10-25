// NEW EXTENSION - DO NOT MODIFY ORIGINAL
import React, { useMemo } from 'react';
import type { Guest, Transaction, TaxSettings } from '../../types.ts';
import { Button } from '../common/Button.tsx';

interface InvoiceProps {
    guest: Guest;
    transactions: Transaction[];
    taxSettings: TaxSettings;
}

export const Invoice: React.FC<InvoiceProps> = ({ guest, transactions, taxSettings }) => {

    const invoiceData = useMemo(() => {
        const charges = transactions.filter(t => t.amount > 0 && !t.description.toLowerCase().includes('tax'));
        const payments = transactions.filter(t => t.amount < 0);
        const taxes = transactions.filter(t => t.amount > 0 && t.description.toLowerCase().includes('tax'));

        const subtotal = charges.reduce((sum, t) => sum + t.amount, 0);
        const totalTax = taxes.reduce((sum, t) => sum + t.amount, 0);
        const totalPayments = payments.reduce((sum, t) => sum + t.amount, 0);
        
        const totalAmount = subtotal + totalTax;
        const balanceDue = totalAmount + totalPayments;

        return {
            charges,
            payments,
            taxes,
            subtotal,
            totalTax,
            totalPayments,
            totalAmount,
            balanceDue,
        };
    }, [transactions]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div>
             <style>
            {`
            @media print {
                body * {
                    visibility: hidden;
                }
                .printable-invoice, .printable-invoice * {
                    visibility: visible;
                }
                .printable-invoice {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    padding: 20px;
                }
                .dark .printable-invoice {
                    color: black !important;
                    background-color: white !important;
                }
                .dark .printable-invoice * {
                    color: black !important;
                    background-color: transparent !important;
                    border-color: #ccc !important;
                }
                .no-print {
                    display: none;
                }
            }
            `}
            </style>
            <div className="printable-invoice max-h-[75vh] overflow-y-auto p-1">
                <header className="flex justify-between items-start pb-4 border-b-2 border-slate-900 dark:border-slate-300">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">INVOICE</h1>
                        <p className="text-slate-500 dark:text-slate-400">Tidé Hotels and Resorts</p>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold">Invoice #: {guest.id}-{new Date().getTime().toString().slice(-6)}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Date: {new Date().toISOString().split('T')[0]}</p>
                    </div>
                </header>
                <section className="grid grid-cols-2 gap-8 my-6">
                     <div>
                        <h3 className="font-semibold mb-2 text-slate-600 dark:text-slate-400">BILL TO:</h3>
                        <p className="font-bold text-lg">{guest.name}</p>
                        <p>{guest.email}</p>
                        <p>{guest.phone}</p>
                     </div>
                     <div className="text-right">
                        <h3 className="font-semibold mb-2 text-slate-600 dark:text-slate-400">STAY DETAILS:</h3>
                        <p>Room: {guest.roomNumber} ({guest.roomType})</p>
                        <p>Arrival: {guest.arrivalDate}</p>
                        <p>Departure: {guest.departureDate}</p>
                     </div>
                </section>
                <section>
                    <table className="w-full text-left">
                        <thead className="bg-slate-200 dark:bg-slate-700">
                            <tr>
                                <th className="p-2 text-xs font-bold uppercase">Date</th>
                                <th className="p-2 text-xs font-bold uppercase">Description</th>
                                <th className="p-2 text-xs font-bold uppercase text-right">Amount (₦)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoiceData.charges.map(t => (
                                <tr key={`charge-${t.id}`} className="border-b border-slate-200 dark:border-slate-700">
                                    <td className="p-2">{t.date}</td>
                                    <td className="p-2">{t.description}</td>
                                    <td className="p-2 font-medium text-right">{t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
                <section className="flex justify-end mt-6">
                    <div className="w-full max-w-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-400">Subtotal:</span>
                            <span className="font-medium">₦{invoiceData.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-400">Tax ({taxSettings.rate}%):</span>
                            <span className="font-medium">₦{invoiceData.totalTax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-300 dark:border-slate-600">
                            <span className="text-slate-900 dark:text-white">Total:</span>
                            <span className="text-slate-900 dark:text-white">₦{invoiceData.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                            <span className="font-medium">Payments Received:</span>
                            <span className="font-medium">₦{(invoiceData.totalPayments * -1).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                         <div className="flex justify-between text-xl font-bold pt-2 border-t-2 border-slate-900 dark:border-slate-300">
                            <span className="text-slate-900 dark:text-white">Balance Due:</span>
                            <span className={invoiceData.balanceDue > 0 ? "text-red-500" : "text-slate-900 dark:text-white"}>
                                ₦{invoiceData.balanceDue.toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </span>
                        </div>
                    </div>
                </section>
                <footer className="mt-8 pt-4 border-t border-slate-300 dark:border-slate-600 text-center text-xs text-slate-500 dark:text-slate-400">
                    <p>Thank you for staying at Tidé Hotels and Resorts. We hope to see you again soon!</p>
                </footer>
            </div>
             <div className="no-print flex justify-end mt-6">
                <Button onClick={handlePrint}>Print Invoice</Button>
            </div>
        </div>
    );
};
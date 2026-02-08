
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
        // Find charges that are not taxes
        const baseCharges = transactions.filter(t => t.amount > 0 && !t.description.includes('%'));
        const payments = transactions.filter(t => t.amount < 0);
        
        // Use the base charges sum to calculate what the taxes SHOULD be based on CURRENT settings
        // if they were not already posted as static transactions.
        const subtotal = baseCharges.reduce((sum, t) => sum + t.amount, 0);
        
        // For Receipts, we might want to iterate through active tax nodes
        const receiptTaxes = taxSettings.isEnabled ? taxSettings.components.filter(c => c.isActive && c.showOnReceipt).map(c => {
            // Logic: If inclusive, the amount is already in subtotal. We just show it.
            // If exclusive, the amount is added to total.
            const taxAmount = subtotal * (c.rate / 100);
            return {
                name: c.name,
                rate: c.rate,
                amount: taxAmount,
                isInclusive: c.isInclusive
            };
        }) : [];

        const exclusiveTaxSum = receiptTaxes.filter(t => !t.isInclusive).reduce((s, t) => s + t.amount, 0);
        const totalPayments = payments.reduce((sum, t) => sum + t.amount, 0);
        
        const totalAmount = subtotal + exclusiveTaxSum;
        const balanceDue = totalAmount + totalPayments;

        return {
            baseCharges,
            payments,
            receiptTaxes,
            subtotal,
            totalPayments,
            totalAmount,
            balanceDue,
        };
    }, [transactions, taxSettings]);

    return (
        <div className="flex flex-col items-center">
             <style>
            {`
            @media print {
                body * {
                    visibility: hidden;
                }
                .printable-invoice-wrapper, .printable-invoice-wrapper * {
                    visibility: visible;
                }
                .printable-invoice-wrapper {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                }
                .printable-invoice {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 20mm;
                    margin: 0 auto;
                    background: white !important;
                    color: black !important;
                }
                @page {
                    size: A4;
                    margin: 0;
                }
                .dark .printable-invoice * {
                    color: black !important;
                    background-color: transparent !important;
                    border-color: #333 !important;
                }
                .no-print {
                    display: none;
                }
            }
            `}
            </style>
            <div className="printable-invoice-wrapper w-full">
                <div className="printable-invoice max-h-[75vh] overflow-y-auto p-4 md:p-8 bg-white dark:bg-slate-900 rounded-xl">
                    <header className="flex justify-between items-start pb-6 border-b-4 border-slate-900">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Tax Invoice</h1>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Smartwave Enterprise HUB</p>
                        </div>
                        <div className="text-right">
                            <p className="font-black text-xs uppercase text-slate-400">Reference Protocol</p>
                            <p className="font-black text-lg">#{guest.id}-{new Date().getTime().toString().slice(-6)}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase">Date: {new Date().toISOString().split('T')[0]}</p>
                        </div>
                    </header>

                    <section className="grid grid-cols-2 gap-12 my-10">
                         <div>
                            <h3 className="font-black text-[10px] uppercase text-indigo-600 mb-3 tracking-[0.2em]">Billing Entity</h3>
                            <p className="font-black text-xl uppercase tracking-tight">{guest.name}</p>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{guest.email}</p>
                            <p className="text-sm font-mono">{guest.phone}</p>
                         </div>
                         <div className="text-right">
                            <h3 className="font-black text-[10px] uppercase text-indigo-600 mb-3 tracking-[0.2em]">Operational Context</h3>
                            <p className="text-sm font-bold uppercase">Unit: <span className="font-black text-slate-900 dark:text-white">{guest.roomNumber} ({guest.roomType})</span></p>
                            <p className="text-xs text-slate-500 font-bold uppercase mt-1">Stay Period: {guest.arrivalDate} — {guest.departureDate}</p>
                         </div>
                    </section>

                    <section className="mt-8">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="p-3 text-[10px] font-black uppercase tracking-widest">Timeline</th>
                                    <th className="p-3 text-[10px] font-black uppercase tracking-widest">Service Designation</th>
                                    <th className="p-3 text-[10px] font-black uppercase tracking-widest text-right">Value (₦)</th>
                                </tr>
                            </thead>
                            <tbody className="border-x border-b">
                                {invoiceData.baseCharges.map(t => (
                                    <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800">
                                        <td className="p-3 font-mono text-xs text-slate-500">{t.date}</td>
                                        <td className="p-3 font-bold text-xs uppercase">{t.description}</td>
                                        <td className="p-3 font-black text-sm text-right font-mono">{t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <section className="flex justify-end mt-10">
                        <div className="w-full max-w-xs space-y-3">
                            <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-500">
                                <span>Subtotal</span>
                                <span className="font-mono text-slate-900 dark:text-white">₦{invoiceData.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                            </div>
                            
                            {invoiceData.receiptTaxes.map((tax, i) => (
                                <div key={i} className="flex justify-between items-center text-xs font-bold uppercase text-slate-500">
                                    <span>{tax.name} ({tax.rate}%) {tax.isInclusive ? '[Inc]' : ''}</span>
                                    <span className="font-mono text-slate-900 dark:text-white">₦{tax.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                </div>
                            ))}

                            <div className="flex justify-between items-center text-lg font-black uppercase pt-3 border-t-2 border-slate-200">
                                <span className="tracking-tighter">Gross Total</span>
                                <span className="font-mono text-indigo-600">₦{invoiceData.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-black uppercase text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                <span>Settled Amount</span>
                                <span className="font-mono">₦{(invoiceData.totalPayments * -1).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                            </div>
                             <div className="flex justify-between items-center text-2xl font-black uppercase pt-4 border-t-4 border-slate-900">
                                <span className="tracking-tighter">Balance</span>
                                <span className={invoiceData.balanceDue > 0 ? "text-red-600 font-mono" : "text-slate-900 dark:text-white font-mono"}>
                                    ₦{invoiceData.balanceDue.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </span>
                            </div>
                        </div>
                    </section>

                    <footer className="mt-20 pt-8 border-t border-dashed border-slate-300 text-center">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Authoritative Document — Smartwave Enterprise HUB Revenue Control</p>
                        <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">Thank you for your residence. Direct inquiries to accounts@smartwavehub.com</p>
                    </footer>
                </div>
            </div>
             <div className="no-print flex justify-center mt-8 gap-4">
                <Button variant="secondary" onClick={() => window.print()} className="font-black uppercase text-xs px-8">Print Professional A4 Copy</Button>
            </div>
        </div>
    );
};

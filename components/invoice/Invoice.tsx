
import React, { useMemo } from 'react';
import type { Guest, Transaction, TaxSettings } from '../../types.ts';
import { Button } from '../common/Button.tsx';
import { useHotelData } from '../../hooks/useHotelData.ts';

interface InvoiceProps {
    guest: Guest;
    transactions: Transaction[];
    taxSettings: TaxSettings;
}

export const Invoice: React.FC<InvoiceProps> = ({ guest, transactions, taxSettings }) => {
    const { propertyInfo } = useHotelData();
    const brandColor = propertyInfo.brandColor || 'indigo';

    const colorMap: Record<string, string> = {
        indigo: '#4f46e5', emerald: '#10b981', rose: '#e11d48', amber: '#f59e0b', sky: '#0ea5e9', slate: '#334155',
        violet: '#8b5cf6', orange: '#f97316', teal: '#14b8a6', fuchsia: '#d946ef', lime: '#84cc16', cyan: '#06b6d4'
    };
    const accentColor = colorMap[brandColor];

    const invoiceData = useMemo(() => {
        const baseCharges = transactions.filter(t => t.amount > 0 && !t.description.includes('%'));
        const payments = transactions.filter(t => t.amount < 0);
        const subtotal = baseCharges.reduce((sum, t) => sum + t.amount, 0);
        
        const receiptTaxes = taxSettings.isEnabled ? taxSettings.components.filter(c => c.isActive && c.showOnReceipt).map(c => {
            const taxAmount = subtotal * (c.rate / 100);
            return { name: c.name, rate: c.rate, amount: taxAmount, isInclusive: c.isInclusive };
        }) : [];

        const exclusiveTaxSum = receiptTaxes.filter(t => !t.isInclusive).reduce((s, t) => s + t.amount, 0);
        const totalPayments = payments.reduce((sum, t) => sum + t.amount, 0);
        const totalAmount = subtotal + exclusiveTaxSum;
        const balanceDue = totalAmount + totalPayments;

        return { baseCharges, payments, receiptTaxes, subtotal, totalPayments, totalAmount, balanceDue };
    }, [transactions, taxSettings]);

    return (
        <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
             <style>
            {`
            @media print {
                body * { visibility: hidden; }
                .printable-invoice-wrapper, .printable-invoice-wrapper * { visibility: visible; }
                .printable-invoice-wrapper { position: absolute; left: 0; top: 0; width: 100%; display: flex; justify-content: center; background: white; }
                .printable-invoice { width: 210mm; min-height: 297mm; padding: 20mm; margin: 0 auto; background: white !important; color: black !important; }
                @page { size: A4; margin: 0; }
                .no-print { display: none; }
                .accent-border { border-color: ${accentColor} !important; }
                .accent-text { color: ${accentColor} !important; }
                .accent-bg { background-color: ${accentColor} !important; color: white !important; }
            }
            `}
            </style>
            <div className="printable-invoice-wrapper w-full">
                <div className="printable-invoice w-full max-w-4xl bg-white dark:bg-slate-950 p-10 shadow-2xl rounded-[2rem] border-t-[12px]" style={{ borderColor: accentColor }}>
                    <header className="flex justify-between items-start pb-10 mb-10 border-b border-slate-100 dark:border-slate-800">
                        <div className="space-y-4">
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-tighter leading-none" style={{ color: accentColor }}>{propertyInfo.name}</h1>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mt-1">{propertyInfo.tagline || 'Industrial Enterprise Node'}</p>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed max-w-xs">
                                <p>{propertyInfo.address}</p>
                                <p className="mt-2 font-mono">{propertyInfo.phone} • {propertyInfo.email}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="px-4 py-1 text-[10px] font-black uppercase rounded-full border-2 mb-4 inline-block" style={{ color: accentColor, borderColor: accentColor }}>Official Protocol Document</span>
                            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Tax Invoice</h2>
                            <p className="font-mono text-lg font-black mt-2">REF: #{guest.id}-{Date.now().toString().slice(-6)}</p>
                            <p className="text-[10px] font-black uppercase text-slate-400">Timeline: {new Date().toLocaleDateString()}</p>
                        </div>
                    </header>

                    <div className="grid grid-cols-2 gap-16 mb-12">
                         <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <h3 className="font-black text-[9px] uppercase text-slate-400 mb-4 tracking-[0.2em]">Recipient Identity</h3>
                            <p className="font-black text-xl uppercase text-slate-900 dark:text-white">{guest.name}</p>
                            <p className="text-[11px] font-mono text-slate-500 mt-1">{guest.email}</p>
                            <p className="text-[11px] font-mono text-slate-500">{guest.phone}</p>
                            {guest.company && <p className="mt-4 text-[10px] font-black uppercase p-2 bg-white dark:bg-slate-800 rounded inline-block">Affiliation: {guest.company}</p>}
                         </div>
                         <div className="text-right">
                            <h3 className="font-black text-[9px] uppercase text-slate-400 mb-4 tracking-[0.2em]">Operational Manifest</h3>
                            <div className="space-y-1">
                                <p className="text-sm font-black uppercase">Infrastructure: Unit {guest.roomNumber}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">{guest.roomType} Tier</p>
                                <p className="text-[10px] font-black text-indigo-600 uppercase mt-4">Residency Timeline</p>
                                <p className="text-xs font-mono font-bold">{guest.arrivalDate} TO {guest.departureDate}</p>
                            </div>
                         </div>
                    </div>

                    <table className="w-full text-left mb-12">
                        <thead style={{ backgroundColor: accentColor }}>
                            <tr className="text-white">
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest rounded-l-xl">Timeline</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest">Service Designation</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right rounded-r-xl">Value (₦)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {invoiceData.baseCharges.map(t => (
                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                    <td className="p-4 font-mono text-[11px] text-slate-400">{t.date}</td>
                                    <td className="p-4 font-black text-xs uppercase text-slate-800 dark:text-slate-200">{t.description}</td>
                                    <td className="p-4 font-black text-sm text-right font-mono">₦{t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="grid grid-cols-2 gap-16 pt-8 border-t-2 border-slate-100 dark:border-slate-800">
                        <div className="space-y-4">
                            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                                <h3 className="font-black text-[9px] uppercase tracking-widest mb-3" style={{ color: accentColor }}>Fiscal Settlement Nodes</h3>
                                <div className="space-y-4">
                                    {propertyInfo.bankAccounts.map((acc, i) => (
                                        <div key={acc.id} className={`text-[10px] uppercase ${i > 0 ? 'pt-2 border-t border-slate-100 dark:border-slate-800' : ''}`}>
                                            <p className="font-black text-slate-900 dark:text-white">{acc.bankName}</p>
                                            <p className="text-slate-500 font-mono">A/C: {acc.accountNumber}</p>
                                            <p className="text-slate-500">{acc.accountName}</p>
                                        </div>
                                    ))}
                                    {propertyInfo.bankAccounts.length === 0 && <p className="text-[10px] text-slate-400">CONTACT FRONT DESK FOR SETTLEMENT NODES</p>}
                                </div>
                            </div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase leading-relaxed italic">
                                * Protocol: All settlements are final upon document authorization. Residual balances are due within 24 hours of vacancy.
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs font-black uppercase text-slate-400">
                                <span>Net Subtotal</span>
                                <span className="font-mono text-slate-900 dark:text-white">₦{invoiceData.subtotal.toLocaleString()}</span>
                            </div>
                            {invoiceData.receiptTaxes.map((tax, i) => (
                                <div key={i} className="flex justify-between items-center text-xs font-black uppercase text-slate-400">
                                    <span>{tax.name} ({tax.rate}%)</span>
                                    <span className="font-mono text-slate-900 dark:text-white">₦{tax.amount.toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center py-4 border-y border-slate-100 dark:border-slate-800">
                                <span className="text-lg font-black uppercase tracking-tighter" style={{ color: accentColor }}>Gross Valuation</span>
                                <span className="text-2xl font-black font-mono" style={{ color: accentColor }}>₦{invoiceData.totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-black uppercase text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl border border-green-100">
                                <span>Realized Settlement</span>
                                <span className="font-mono">₦{(invoiceData.totalPayments * -1).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4">
                                <span className="text-2xl font-black uppercase tracking-tighter">Residual Balance</span>
                                <span className={`text-3xl font-black font-mono ${invoiceData.balanceDue > 0 ? "text-red-600" : "text-indigo-600"}`}>
                                    ₦{invoiceData.balanceDue.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <footer className="mt-24 pt-10 border-t-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                        <div className="grid grid-cols-2 gap-20 mb-12">
                            <div className="border-t border-slate-400 pt-2"><p className="text-[9px] font-black uppercase text-slate-400">Authorizing Official</p></div>
                            <div className="border-t border-slate-400 pt-2"><p className="text-[9px] font-black uppercase text-slate-400">Resident Approval</p></div>
                        </div>
                        <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.4em] mb-2">Excellence in Enterprise Logic — Smartwave HUB Group</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase italic">Document electronically generated. Integrity hash: {Math.random().toString(36).substring(7).toUpperCase()}</p>
                    </footer>
                </div>
            </div>
             <div className="no-print flex justify-center mt-10 gap-4">
                <Button onClick={() => window.print()} className="font-black uppercase text-xs px-12 py-4 shadow-2xl transition-transform active:scale-95" style={{ backgroundColor: accentColor }}>Execute Professional Print (A4)</Button>
            </div>
        </div>
    );
};

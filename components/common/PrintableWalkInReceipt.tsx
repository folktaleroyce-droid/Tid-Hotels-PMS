import React from 'react';
import type { WalkInTransaction } from '../../types.ts';
import { Button } from './Button.tsx';

interface PrintableWalkInReceiptProps {
    transaction: WalkInTransaction;
}

export const PrintableWalkInReceipt: React.FC<PrintableWalkInReceiptProps> = ({ transaction }) => {
    const handlePrint = () => {
        window.print();
    };

    const currencySymbol = transaction.currency === 'NGN' ? '₦' : '$';
    const formatCurrency = (amount: number) => `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const serviceName = transaction.service === 'Other' && transaction.serviceDetails ? transaction.serviceDetails : transaction.service;
    const totalAmount = transaction.amount - transaction.discount + transaction.tax;
    const balance = totalAmount - transaction.amountPaid;

    return (
        <div className="flex flex-col items-center">
            <style>
            {`
            @media print {
                body * {
                    visibility: hidden;
                }
                .printable-walkin-wrapper, .printable-walkin-wrapper * {
                    visibility: visible;
                }
                .printable-walkin-wrapper {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                }
                .printable-receipt {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 25mm;
                    margin: 0 auto;
                    background: white !important;
                    color: black !important;
                }
                @page {
                    size: A4;
                    margin: 0;
                }
                .no-print {
                    display: none;
                }
            }
            `}
            </style>
            <div className="printable-walkin-wrapper w-full">
                <div className="printable-receipt bg-white text-slate-900 p-8 shadow-inner">
                    <div className="text-center mb-12 border-b-4 border-slate-900 pb-6">
                        <h2 className="text-3xl font-black uppercase tracking-tighter">Official Receipt</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Smartwave Enterprise HUB — Walk-In Service Terminal</p>
                    </div>

                    <div className="grid grid-cols-2 gap-10 mb-10">
                        <div>
                            <h4 className="text-[10px] font-black uppercase text-indigo-600 mb-2 tracking-widest">Settlement Reference</h4>
                            <p className="text-lg font-black">REC-POS-{transaction.id}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase">Timestamp: {transaction.date}</p>
                        </div>
                        <div className="text-right">
                            <h4 className="text-[10px] font-black uppercase text-indigo-600 mb-2 tracking-widest">Payment Protocol</h4>
                            <p className="text-lg font-black uppercase">{transaction.paymentMethod}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase">Currency: {transaction.currency}</p>
                        </div>
                    </div>

                    <div className="mb-10">
                        <h4 className="text-[10px] font-black uppercase text-indigo-600 mb-4 tracking-widest">Service Provisioning</h4>
                        <div className="p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl flex justify-between items-center">
                            <div>
                                <p className="text-xl font-black uppercase tracking-tight">{serviceName}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase">Operational Commodity Registry</p>
                            </div>
                            <p className="text-2xl font-black font-mono">{formatCurrency(transaction.amount)}</p>
                        </div>
                    </div>

                    <div className="flex justify-end mt-12">
                        <div className="w-full max-w-xs space-y-4">
                            <div className="flex justify-between items-center text-sm font-bold uppercase text-slate-500">
                                <span>Gross Base Value</span>
                                <span className="font-mono text-slate-900">{formatCurrency(transaction.amount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold uppercase text-red-500">
                                <span>Rebate / Discount</span>
                                <span className="font-mono">-{formatCurrency(transaction.discount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold uppercase text-slate-500">
                                <span>Statutory Tax</span>
                                <span className="font-mono text-slate-900">{formatCurrency(transaction.tax)}</span>
                            </div>
                            <div className="flex justify-between items-center text-2xl font-black uppercase pt-4 border-t-4 border-slate-900">
                                <span className="tracking-tighter">Total Due</span>
                                <span className="font-mono text-indigo-600">{formatCurrency(totalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg font-black uppercase text-green-600 bg-green-50 px-3 py-2 rounded-xl border-2 border-green-100">
                                <span>Settled</span>
                                <span className="font-mono">{formatCurrency(transaction.amountPaid)}</span>
                            </div>
                            {balance > 0 && (
                                <div className="flex justify-between items-center text-sm font-black uppercase text-red-600 px-3 py-1">
                                    <span>Residual Balance</span>
                                    <span className="font-mono">{formatCurrency(balance)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-24">
                        <div className="grid grid-cols-2 gap-16 text-center">
                            <div className="pt-6 border-t-2 border-slate-300">
                                <p className="text-[10px] font-black uppercase text-slate-400">Resident / Client Signature</p>
                            </div>
                            <div className="pt-6 border-t-2 border-slate-300">
                                <p className="text-[10px] font-black uppercase text-slate-400">Authorizing Official</p>
                            </div>
                        </div>
                        <p className="text-center text-[9px] font-bold text-slate-400 mt-12 uppercase tracking-[0.2em]">
                            Excellence in Enterprise Logic — Smartwave HUB Group
                        </p>
                    </div>
                </div>
            </div>
             <div className="no-print flex justify-center mt-10">
                <Button onClick={handlePrint} className="font-black uppercase text-xs px-12 py-4 shadow-xl">Execute Print Command (A4)</Button>
            </div>
        </div>
    );
};
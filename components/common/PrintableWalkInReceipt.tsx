import React from 'react';
import type { WalkInTransaction } from '../../types.ts';
import { Button } from './Button.tsx';

interface PrintableWalkInReceiptProps {
    transaction: WalkInTransaction;
}

const DetailRow: React.FC<{ label: string; value: string | number; isBold?: boolean }> = ({ label, value, isBold = false }) => (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-slate-200">
        <dt className={`text-sm ${isBold ? 'font-bold' : 'font-medium'} text-slate-600`}>{label}</dt>
        <dd className={`text-sm text-slate-900 col-span-2 sm:mt-0 ${isBold ? 'font-bold text-base' : 'font-semibold'}`}>{value}</dd>
    </div>
);

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
        <div>
            <style>
            {`
            @media print {
                .no-print {
                    display: none;
                }
                @page {
                    size: A5 portrait;
                    margin: 1.5cm;
                }
                 body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                 }
                 .printable-content {
                    color: black !important;
                 }
            }
            `}
            </style>
            <div className="printable-content text-slate-900">
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold">Tidé Hotels and Resorts</h2>
                    <p className="text-sm text-slate-600">Walk-in Service Receipt</p>
                </div>
                <div className="space-y-1">
                    <DetailRow label="Guest Name" value="Walk in Guest" />
                    <DetailRow label="Date" value={transaction.date} />
                    <DetailRow label="Service Rendered" value={serviceName} />
                    <DetailRow label="Payment Method" value={transaction.paymentMethod} />
                    <hr className="my-2" />
                    <DetailRow label="Subtotal" value={formatCurrency(transaction.amount)} />
                    <DetailRow label="Discount" value={formatCurrency(transaction.discount)} />
                    <DetailRow label="Tax" value={formatCurrency(transaction.tax)} />
                    <DetailRow label="Total" value={formatCurrency(totalAmount)} isBold={true} />
                    <hr className="my-2" />
                    <DetailRow label="Amount Paid" value={formatCurrency(transaction.amountPaid)} />
                    <DetailRow label="Balance Due" value={formatCurrency(balance)} isBold={true} />
                </div>
                <div className="mt-12 text-sm">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="pt-8 border-t border-dashed border-slate-400">
                            <p>Guest Signature</p>
                        </div>
                        <div className="pt-8 border-t border-dashed border-slate-400">
                            <p>Cashier Signature</p>
                        </div>
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-8">
                        Thank you for your patronage!
                    </p>
                </div>
            </div>
             <div className="no-print flex justify-end mt-6">
                <Button onClick={handlePrint}>Print</Button>
            </div>
        </div>
    );
};
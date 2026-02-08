import React from 'react';
import { Button } from '../common/Button.tsx';

interface POSDocketProps {
    roomNumber: string;
    guestName?: string;
    items: { name: string; price: number; quantity: number }[];
    total: number;
    onClose: () => void;
}

export const POSDocket: React.FC<POSDocketProps> = ({ roomNumber, guestName, items, total, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col items-center">
            <style>
            {`
            @media print {
                body * {
                    visibility: hidden;
                }
                .pos-docket-print-area, .pos-docket-print-area * {
                    visibility: visible;
                }
                .pos-docket-print-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 80mm;
                    padding: 4mm;
                    background: white !important;
                    color: black !important;
                }
                .pos-docket-print-area * {
                    color: black !important;
                    background-color: transparent !important;
                }
                @page {
                    size: 80mm auto;
                    margin: 0;
                }
                .no-print {
                    display: none;
                }
            }
            `}
            </style>
            <div className="pos-docket-print-area bg-white text-slate-900 font-mono text-xs w-[80mm] p-4 shadow-xl rounded border-2 border-slate-200">
                <div className="text-center mb-4 border-b-2 border-dashed border-slate-900 pb-2">
                    <h2 className="text-lg font-black uppercase tracking-tight">Smartwave POS Terminal</h2>
                    <p className="text-[10px] font-bold uppercase">Catering Service Docket</p>
                </div>

                <div className="mb-4 text-[11px] leading-tight">
                    <div className="flex justify-between">
                        <span className="font-bold uppercase">Unit Number:</span>
                        <span className="font-black text-sm">{roomNumber}</span>
                    </div>
                    <div className="flex justify-between truncate">
                        <span className="font-bold uppercase">Resident:</span>
                        <span className="font-black uppercase">{guestName || 'WALK-IN'}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="font-bold uppercase">Timestamp:</span>
                        <span>{new Date().toLocaleString()}</span>
                    </div>
                </div>

                <div className="border-t-2 border-b-2 border-dashed border-slate-900 py-2 my-2">
                    <div className="grid grid-cols-6 font-black uppercase text-[9px] mb-1">
                        <span className="col-span-3">Item</span>
                        <span className="text-center">Qty</span>
                        <span className="col-span-2 text-right">Value</span>
                    </div>
                    {items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-6 text-[10px] py-0.5 border-b border-slate-100 last:border-0">
                            <span className="col-span-3 uppercase truncate font-bold">{item.name}</span>
                            <span className="text-center font-black">x{item.quantity}</span>
                            <span className="col-span-2 text-right font-black">{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                    ))}
                </div>

                <div className="text-right mt-2">
                    <p className="text-[9px] font-black uppercase text-slate-500">Gross Manifest Total</p>
                    <p className="text-xl font-black">₦{total.toLocaleString()}</p>
                </div>

                <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-900 text-center">
                    <p className="text-[10px] font-black uppercase mb-4 tracking-widest">Internal Service Token</p>
                    <div className="h-8 border border-slate-200 bg-slate-50 flex items-center justify-center opacity-50 mb-4 italic text-[8px]">
                        Service Staff Signature Area
                    </div>
                    <p className="text-[8px] font-bold text-slate-400">Docket generated via Smartwave Enterprise HUB</p>
                </div>
            </div>

            <div className="no-print flex gap-2 mt-8">
                <Button variant="secondary" onClick={onClose} className="uppercase font-black text-xs px-6 py-2">Abort</Button>
                <Button onClick={handlePrint} className="uppercase font-black text-xs px-8 py-2">Print POS Docket</Button>
            </div>
        </div>
    );
};
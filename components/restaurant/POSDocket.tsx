
import React from 'react';
import { Button } from '../common/Button.tsx';
import { useHotelData } from '../../hooks/useHotelData.ts';

interface POSDocketProps {
    roomNumber: string;
    guestName?: string;
    items: { name: string; price: number; quantity: number }[];
    total: number;
    onClose: () => void;
}

export const POSDocket: React.FC<POSDocketProps> = ({ roomNumber, guestName, items, total, onClose }) => {
    const { propertyInfo } = useHotelData();
    const brandColor = propertyInfo.brandColor || 'indigo';

    const colorMap: Record<string, string> = {
        indigo: '#4f46e5', emerald: '#10b981', rose: '#e11d48', amber: '#f59e0b', sky: '#0ea5e9', slate: '#334155'
    };
    const accentColor = colorMap[brandColor];

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col items-center bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-slate-100 dark:border-slate-800">
            <style>
            {`
            @media print {
                body * { visibility: hidden; }
                .pos-docket-print-area, .pos-docket-print-area * { visibility: visible; }
                .pos-docket-print-area { position: absolute; left: 0; top: 0; width: 80mm; padding: 6mm; background: white !important; color: black !important; font-family: 'Courier New', Courier, monospace; }
                .pos-docket-print-area * { color: black !important; background-color: transparent !important; border-color: black !important; }
                @page { size: 80mm auto; margin: 0; }
                .no-print { display: none; }
                .docket-accent { border-left: 4px solid black !important; }
            }
            `}
            </style>
            <div className="pos-docket-print-area bg-white text-slate-900 font-mono text-xs w-[80mm] p-6 shadow-2xl rounded-xl border-2 border-slate-200">
                <div className="text-center mb-6 border-b-2 border-slate-900 pb-4">
                    <h2 className="text-xl font-black uppercase tracking-tight leading-none mb-1">{propertyInfo.name}</h2>
                    <p className="text-[10px] font-black uppercase opacity-60">Terminal POS / Service Docket</p>
                </div>

                <div className="mb-6 space-y-2 border-l-4 p-3 bg-slate-50 border-slate-900">
                    <div className="flex justify-between items-center">
                        <span className="font-bold uppercase text-[9px]">Node ID:</span>
                        <span className="font-black text-sm uppercase">UNIT {roomNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold uppercase text-[9px]">Identity:</span>
                        <span className="font-black uppercase text-[11px] truncate ml-2">{guestName || 'EXTERNAL GUEST'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 border-dashed">
                        <span className="font-bold uppercase text-[9px]">Log Time:</span>
                        <span className="text-[10px]">{new Date().toLocaleString()}</span>
                    </div>
                </div>

                <div className="border-y-2 border-slate-900 border-dashed py-3 mb-6">
                    <div className="grid grid-cols-8 font-black uppercase text-[8px] mb-2 pb-1 border-b">
                        <span className="col-span-4">Designation</span>
                        <span className="col-span-1 text-center">QTY</span>
                        <span className="col-span-3 text-right">Value</span>
                    </div>
                    {items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-8 text-[10px] py-1 border-b border-slate-50 last:border-0">
                            <span className="col-span-4 uppercase truncate font-bold">{item.name}</span>
                            <span className="col-span-1 text-center font-black">x{item.quantity}</span>
                            <span className="col-span-3 text-right font-black">{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                    ))}
                </div>

                <div className="text-right mb-8">
                    <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Gross Manifest Total</p>
                    <p className="text-2xl font-black">₦{total.toLocaleString()}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase italic">Statutory VAT Integrated</p>
                </div>

                <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-900 text-center">
                    <p className="text-[10px] font-black uppercase mb-4 tracking-widest">Internal Service Token</p>
                    <div className="h-12 border-2 border-slate-200 flex items-center justify-center opacity-40 mb-4 italic text-[8px] uppercase font-black">
                        Service Authorization Area
                    </div>
                    <div className="flex justify-center mb-4">
                         {/* Placeholder for QR Code */}
                         <div className="w-16 h-16 border-2 border-slate-900 p-1">
                             <div className="w-full h-full bg-slate-900"></div>
                         </div>
                    </div>
                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                        Authorized via Smartwave HUB<br/>Session Hash: {Math.random().toString(36).substring(7).toUpperCase()}
                    </p>
                </div>
            </div>

            <div className="no-print flex gap-3 mt-10">
                <Button variant="secondary" onClick={onClose} className="uppercase font-black text-[10px] px-8 py-3">Abort Session</Button>
                <Button onClick={handlePrint} className="uppercase font-black text-[10px] px-12 py-3 shadow-2xl" style={{ backgroundColor: accentColor }}>Execute Docket Print</Button>
            </div>
        </div>
    );
};

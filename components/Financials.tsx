import React, { useState, useMemo } from 'react';
import type { HotelData, Transaction } from '../types.ts';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';

// Declare the XLSX library which is loaded from a CDN script in index.html
declare const XLSX: any;


interface FinancialsProps {
    hotelData: HotelData;
}

const today = new Date().toISOString().split('T')[0];
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(new Date().getDate() - 30);
const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

export const Financials: React.FC<FinancialsProps> = ({ hotelData }) => {
    const { transactions, guests } = hotelData;
    const [dateRange, setDateRange] = useState({ start: thirtyDaysAgoStr, end: today });

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const tDate = new Date(t.date);
            // Add a day to the end date to make it inclusive
            const endDate = new Date(dateRange.end);
            endDate.setDate(endDate.getDate() + 1);
            const startDate = new Date(dateRange.start);
            return tDate >= startDate && tDate < endDate;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, dateRange]);

    const reportData = useMemo(() => {
        const totalCharges = filteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const totalPayments = filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
        const netRevenue = totalCharges + totalPayments;

        return {
            totalCharges,
            totalPayments: Math.abs(totalPayments),
            netRevenue
        };
    }, [filteredTransactions]);
    
    const handlePrint = () => {
        window.print();
    }
    
    const getGuestName = (guestId: number) => {
        return guests.find(g => g.id === guestId)?.name || 'N/A';
    };

    const handleDownloadExcel = () => {
        const summaryData = [
            ["Tidé Hotels Financial Report"],
            [`Period: ${dateRange.start} to ${dateRange.end}`],
            [], // Empty row
            ["Summary"],
            ["Total Charges", reportData.totalCharges],
            ["Total Payments", reportData.totalPayments],
            ["Net Revenue", reportData.netRevenue],
            [], // Empty row
        ];

        const transactionHeaders = ["Date", "Guest", "Description", "Amount"];
        const transactionRows = filteredTransactions.map(t => [
            t.date,
            getGuestName(t.guestId),
            t.description,
            { v: t.amount, t: 'n', z: '$#,##0.00' } // Format as currency
        ]);
        
        // Create worksheet from summary data
        const ws = XLSX.utils.aoa_to_sheet(summaryData);
        
        // Add transaction log to the same sheet, starting after the summary
        XLSX.utils.sheet_add_aoa(ws, [transactionHeaders, ...transactionRows], { origin: -1 });

        // Set column widths for better readability
        ws['!cols'] = [
            { wch: 12 }, // Date
            { wch: 25 }, // Guest
            { wch: 40 }, // Description
            { wch: 12 }  // Amount
        ];
        
        // Create a new workbook and append the sheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Financial Report");

        // Trigger the download
        XLSX.writeFile(wb, `Tide_Hotels_Financial_Report_${dateRange.start}_to_${dateRange.end}.xlsx`);
    };

    return (
        <div>
            <style>
                {`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .printable-area, .printable-area * {
                        visibility: visible;
                    }
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .dark .printable-area {
                         color: black;
                         background: white;
                    }
                }
                `}
            </style>
            <Card title="Financial Reports">
                <div className="flex flex-wrap gap-4 items-center mb-6 print:hidden">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium mb-1">Start Date</label>
                        <input
                            type="date"
                            id="start-date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium mb-1">End Date</label>
                        <input
                            type="date"
                            id="end-date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                        />
                    </div>
                    <div className="self-end flex space-x-2">
                         <Button onClick={handlePrint} variant="secondary" className="flex items-center space-x-2">
                            <PrintIcon/>
                            <span>Print Report</span>
                         </Button>
                         <Button onClick={handleDownloadExcel} variant="secondary" className="flex items-center space-x-2">
                             <ExcelIcon/>
                             <span>Download Excel</span>
                         </Button>
                    </div>
                </div>

                <div className="printable-area p-4">
                    <div className="text-center mb-8 hidden print:block">
                        <h1 className="text-2xl font-bold">Tidé Hotels PMS</h1>
                        <h2 className="text-xl">Financial Summary</h2>
                        <p className="text-sm">For period: {dateRange.start} to {dateRange.end}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                            <h4 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Total Charges</h4>
                            <p className="text-3xl font-bold mt-2 text-green-600 dark:text-green-400">${reportData.totalCharges.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                            <h4 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Total Payments</h4>
                            <p className="text-3xl font-bold mt-2 text-blue-600 dark:text-blue-400">${reportData.totalPayments.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                            <h4 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Net Revenue</h4>
                            <p className="text-3xl font-bold mt-2 text-indigo-600 dark:text-indigo-400">${reportData.netRevenue.toFixed(2)}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Transaction Log</h3>
                         <div className="overflow-x-auto max-h-[50vh]">
                          <table className="w-full text-left">
                            <thead className="bg-slate-200 dark:bg-slate-700 sticky top-0">
                              <tr className="border-b border-slate-200 dark:border-slate-600">
                                <th className="p-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Date</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Guest</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Description</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredTransactions.map((t, index) => (
                                <tr key={t.id} className={`border-b border-slate-200 dark:border-slate-700 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'} `}>
                                  <td className="p-3 text-slate-800 dark:text-slate-300">{t.date}</td>
                                  <td className="p-3 text-slate-800 dark:text-slate-300">{getGuestName(t.guestId)}</td>
                                  <td className="p-3 text-slate-800 dark:text-slate-300">{t.description}</td>
                                  <td className={`p-3 font-semibold ${t.amount < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    ${t.amount.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const PrintIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
);

const ExcelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
);
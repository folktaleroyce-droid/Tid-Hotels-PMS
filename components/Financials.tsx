import React, { useState, useMemo } from 'react';
import type { HotelData } from '../types.ts';
import { Card } from './common/Card.tsx';
import { Button } from './common/Button.tsx';
import { Modal } from './common/Modal.tsx';

// Declare the XLSX library which is loaded from a CDN script in index.html
declare const XLSX: any;


interface FinancialsProps {
    hotelData: HotelData;
}

type UnifiedTransaction = {
    id: string; // e.g., 'inhouse-1', 'walkin-1'
    date: string;
    source: 'In-house' | 'Walk-in';
    guestName: string;
    description: string;
    charge: number;
    payment: number;
    tax: number;
};


const today = new Date().toISOString().split('T')[0];
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(new Date().getDate() - 30);
const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

export const Financials: React.FC<FinancialsProps> = ({ hotelData }) => {
    const { transactions, guests, walkInTransactions, addSyncLogEntry, clearAllTransactions } = hotelData;
    const [dateRange, setDateRange] = useState({ start: thirtyDaysAgoStr, end: today });

    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    
    const getGuestName = (guestId: number) => {
        return guests.find(g => g.id === guestId)?.name || 'N/A';
    };

    const unifiedTransactions = useMemo(() => {
        const inHouse: UnifiedTransaction[] = transactions.map(t => {
            const isTax = t.description.toLowerCase().includes('tax');
            return {
                id: `inhouse-${t.id}`,
                date: t.date,
                source: 'In-house',
                guestName: getGuestName(t.guestId),
                description: t.description,
                charge: t.amount > 0 && !isTax ? t.amount : 0,
                payment: t.amount < 0 ? -t.amount : 0,
                tax: isTax ? t.amount : 0,
            };
        });

        const walkIn: UnifiedTransaction[] = walkInTransactions.map(t => ({
            id: `walkin-${t.id}`,
            date: t.date,
            source: 'Walk-in',
            guestName: 'Walk-in Guest',
            description: t.service === 'Other' && t.serviceDetails ? t.serviceDetails : t.service,
            charge: t.amount - t.discount, // This is the net charge before tax
            payment: t.amountPaid,
            tax: t.tax,
        }));

        return [...inHouse, ...walkIn].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, walkInTransactions, guests]);


    const filteredTransactions = useMemo(() => {
        return unifiedTransactions.filter(t => {
            const tDate = new Date(t.date);
            // Add a day to the end date to make it inclusive
            const endDate = new Date(dateRange.end);
            endDate.setDate(endDate.getDate() + 1);
            const startDate = new Date(dateRange.start);
            return tDate >= startDate && tDate < endDate;
        });
    }, [unifiedTransactions, dateRange]);

    const reportData = useMemo(() => {
        const totalCharges = filteredTransactions.reduce((sum, t) => sum + t.charge, 0);
        const totalPayments = filteredTransactions.reduce((sum, t) => sum + t.payment, 0);
        const totalTax = filteredTransactions.reduce((sum, t) => sum + t.tax, 0);
        const netRevenue = totalCharges + totalTax; // Net is charges + tax

        return {
            totalCharges,
            totalPayments,
            totalTax,
            netRevenue
        };
    }, [filteredTransactions]);
    
    const handlePrint = () => {
        window.print();
    }
    
    const handleDownloadExcel = () => {
        const summaryData = [
            ["Tidé Hotels Financial Report"],
            [`Period: ${dateRange.start} to ${dateRange.end}`],
            [], // Empty row
            ["Summary"],
            ["Total Charges (excl. Tax)", reportData.totalCharges],
            ["Total Tax Collected", reportData.totalTax],
            ["Total Payments", reportData.totalPayments],
            ["Net Revenue (Charges + Tax)", reportData.netRevenue],
            [], // Empty row
        ];

        const transactionHeaders = ["Date", "Source", "Guest", "Description", "Charge", "Tax", "Payment"];
        const transactionRows = filteredTransactions.map(t => [
            t.date,
            t.source,
            t.guestName,
            t.description,
            { v: t.charge, t: 'n', z: '₦#,##0.00' },
            { v: t.tax, t: 'n', z: '₦#,##0.00' },
            { v: t.payment, t: 'n', z: '₦#,##0.00' }
        ]);
        
        // Create worksheet from summary data
        const ws = XLSX.utils.aoa_to_sheet(summaryData);
        
        // Add transaction log to the same sheet, starting after the summary
        XLSX.utils.sheet_add_aoa(ws, [transactionHeaders, ...transactionRows], { origin: -1 });

        // Set column widths for better readability
        ws['!cols'] = [
            { wch: 12 }, // Date
            { wch: 10 }, // Source
            { wch: 25 }, // Guest
            { wch: 40 }, // Description
            { wch: 15 }, // Charge
            { wch: 15 }, // Tax
            { wch: 15 }  // Payment
        ];
        
        // Create a new workbook and append the sheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Financial Report");

        // Trigger the download
        XLSX.writeFile(wb, `Tide_Hotels_Financial_Report_${dateRange.start}_to_${dateRange.end}.xlsx`);
    };

    const handleDownloadFullHistory = () => {
        const headerData = [
            ["Tidé Hotels Complete Transaction History"],
            []
        ];

        const transactionHeaders = ["Date", "Source", "Guest", "Description", "Charge", "Tax", "Payment"];
        const transactionRows = unifiedTransactions.map(t => [
            t.date,
            t.source,
            t.guestName,
            t.description,
            { v: t.charge, t: 'n', z: '₦#,##0.00' },
            { v: t.tax, t: 'n', z: '₦#,##0.00' },
            { v: t.payment, t: 'n', z: '₦#,##0.00' }
        ]);

        const ws = XLSX.utils.aoa_to_sheet(headerData);
        XLSX.utils.sheet_add_aoa(ws, [transactionHeaders, ...transactionRows], { origin: -1 });

        ws['!cols'] = [ { wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 } ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Full Transaction History");
        XLSX.writeFile(wb, `Tide_Hotels_Full_Transaction_History.xlsx`);
        addSyncLogEntry('Downloaded complete transaction history.', 'info');
    };
    
    const handleOpenEmailModal = () => setIsEmailModalOpen(true);
    const handleCloseEmailModal = () => {
        setIsEmailModalOpen(false);
        setRecipientEmail('');
        setEmailError('');
    };

    const handleSendEmail = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipientEmail)) {
            setEmailError('Please enter a valid email address.');
            return;
        }
        
        // Simulate sending email
        addSyncLogEntry(`Financial report for ${dateRange.start} to ${dateRange.end} sent to ${recipientEmail}.`, 'success');
        alert(`Report successfully sent to ${recipientEmail}.`);
        handleCloseEmailModal();
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
                    <div className="self-end flex flex-wrap gap-2">
                         <Button onClick={handleOpenEmailModal} variant="secondary" className="flex items-center space-x-2">
                             <EmailIcon />
                             <span>Email Report</span>
                         </Button>
                         <Button onClick={handlePrint} variant="secondary" className="flex items-center space-x-2">
                            <PrintIcon/>
                            <span>Print Report</span>
                         </Button>
                         <Button onClick={handleDownloadExcel} variant="secondary" className="flex items-center space-x-2">
                             <ExcelIcon/>
                             <span>Download Report (Excel)</span>
                         </Button>
                         <Button onClick={handleDownloadFullHistory} variant="secondary" className="flex items-center space-x-2">
                             <ExcelIcon/>
                             <span>Download Full History</span>
                         </Button>
                         <Button onClick={() => setIsClearModalOpen(true)} variant="secondary" className="flex items-center space-x-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 text-red-700 dark:text-red-300">
                            <TrashIcon />
                            <span>Clear All Data</span>
                        </Button>
                    </div>
                </div>

                <div className="printable-area p-4">
                    <div className="text-center mb-8 hidden print:block">
                        <h1 className="text-2xl font-bold">Tidé Hotels PMS</h1>
                        <h2 className="text-xl">Financial Summary</h2>
                        <p className="text-sm">For period: {dateRange.start} to ${dateRange.end}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                            <h4 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Total Charges</h4>
                            <p className="text-3xl font-bold mt-2 text-green-600 dark:text-green-400">₦{reportData.totalCharges.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                         <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                            <h4 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Total Tax</h4>
                            <p className="text-3xl font-bold mt-2 text-amber-600 dark:text-amber-400">₦{reportData.totalTax.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                            <h4 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Total Payments</h4>
                            <p className="text-3xl font-bold mt-2 text-blue-600 dark:text-blue-400">₦{reportData.totalPayments.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                            <h4 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Net Revenue</h4>
                            <p className="text-3xl font-bold mt-2 text-indigo-600 dark:text-indigo-400">₦{reportData.netRevenue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Transaction Log</h3>
                         <div className="overflow-x-auto max-h-[50vh]">
                          <table className="w-full text-left">
                            <thead className="bg-slate-200 dark:bg-slate-700 sticky top-0">
                              <tr className="border-b border-slate-200 dark:border-slate-600">
                                <th className="p-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Date</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Source</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Guest</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Description</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">Charge</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">Tax</th>
                                <th className="p-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">Payment</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredTransactions.map((t, index) => (
                                <tr key={t.id} className={`border-b border-slate-200 dark:border-slate-700 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'} `}>
                                  <td className="p-3 text-slate-800 dark:text-slate-300">{t.date}</td>
                                  <td className="p-3 text-slate-800 dark:text-slate-300">{t.source}</td>
                                  <td className="p-3 text-slate-800 dark:text-slate-300">{t.guestName}</td>
                                  <td className="p-3 text-slate-800 dark:text-slate-300">{t.description}</td>
                                  <td className="p-3 font-semibold text-red-600 dark:text-red-400 text-right">
                                     {t.charge > 0 ? `₦${t.charge.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                  </td>
                                   <td className="p-3 font-semibold text-amber-600 dark:text-amber-400 text-right">
                                     {t.tax > 0 ? `₦${t.tax.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                  </td>
                                  <td className="p-3 font-semibold text-green-600 dark:text-green-400 text-right">
                                     {t.payment > 0 ? `₦${t.payment.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                  </td>
                                </tr>
                              ))}
                               {filteredTransactions.length === 0 && (
                                  <tr>
                                      <td colSpan={7} className="text-center py-4 text-slate-500 dark:text-slate-400">No transactions found for the selected period.</td>
                                  </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                    </div>
                </div>
            </Card>

            <Modal isOpen={isEmailModalOpen} onClose={handleCloseEmailModal} title="Email Financial Report">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="email-recipient" className="block text-sm font-medium mb-1">Recipient Email Address*</label>
                        <input
                            type="email"
                            id="email-recipient"
                            value={recipientEmail}
                            onChange={(e) => { setRecipientEmail(e.target.value); setEmailError(''); }}
                            placeholder="recipient@example.com"
                            className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500"
                        />
                        {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        This will simulate sending a summary of the current report for the period <strong>{dateRange.start}</strong> to <strong>{dateRange.end}</strong>.
                    </p>
                </div>
                <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button variant="secondary" onClick={handleCloseEmailModal}>Cancel</Button>
                    <Button onClick={handleSendEmail}>Send Email</Button>
                </div>
            </Modal>
            
            <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} title="Confirm Clear All Data">
                <div className="space-y-4">
                    <div className="p-3 rounded-md bg-red-100 dark:bg-red-900/50 border border-red-500/50 flex items-start space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="text-sm">
                            <p className="font-semibold text-red-800 dark:text-red-200">Warning: This is a destructive action and cannot be undone.</p>
                        </div>
                    </div>
                    <p>
                        Are you sure you want to delete ALL transaction data? This includes:
                    </p>
                    <ul className="list-disc list-inside ml-4 text-sm text-slate-600 dark:text-slate-400">
                        <li>In-house guest charges and payments</li>
                        <li>Walk-in service transactions</li>
                        <li>Restaurant orders</li>
                        <li>Loyalty point history</li>
                    </ul>
                    <p>
                        This will reset the financial records to a clean slate.
                    </p>
                </div>
                <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button variant="secondary" onClick={() => setIsClearModalOpen(false)}>Cancel</Button>
                    <Button onClick={() => { clearAllTransactions(); setIsClearModalOpen(false); }} className="bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white">
                        Yes, Clear All Data
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

const PrintIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
);

const ExcelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
);

const EmailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);
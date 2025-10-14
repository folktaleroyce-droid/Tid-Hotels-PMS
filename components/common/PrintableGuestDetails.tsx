import React from 'react';
import type { Guest } from '../../types.ts';
import { Button } from './Button.tsx';

interface PrintableGuestDetailsProps {
    guest: Guest;
}

const DetailRow: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-slate-200">
        <dt className="text-sm font-medium text-slate-500">{label}</dt>
        <dd className="mt-1 text-sm text-slate-900 col-span-2 sm:mt-0">{value || 'N/A'}</dd>
    </div>
);

export const PrintableGuestDetails: React.FC<PrintableGuestDetailsProps> = ({ guest }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div>
            <style>
            {`
            @media print {
                .no-print {
                    display: none;
                }
                @page {
                    size: A4;
                    margin: 2cm;
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
            <div className="printable-content">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Tidé Hotels Guest Registration</h2>
                    <p className="text-sm text-slate-500">Thank you for choosing to stay with us.</p>
                </div>
                <div className="space-y-4">
                    <DetailRow label="Full Name" value={guest.name} />
                    <DetailRow label="Email Address" value={guest.email} />
                    <DetailRow label="Phone Number" value={guest.phone} />
                    <DetailRow label="Date of Birth" value={guest.birthdate} />
                    <DetailRow label="Nationality" value={guest.nationality} />
                    <DetailRow label="ID Type" value={guest.idType === 'Other' ? guest.idOtherType : guest.idType} />
                    <DetailRow label="ID Number" value={guest.idNumber} />
                    <DetailRow label="Full Address" value={guest.address} />
                    <hr className="my-4"/>
                    <DetailRow label="Arrival Date" value={guest.arrivalDate} />
                    <DetailRow label="Departure Date" value={guest.departureDate} />
                    <DetailRow label="Room Number" value={guest.roomNumber} />
                    <DetailRow label="Room Type" value={guest.roomType} />
                    <DetailRow label="Guests" value={`${guest.adults} Adult(s), ${guest.children || 0} Child(ren)`} />
                    <DetailRow label="Booking Source" value={guest.bookingSource} />
                    <DetailRow label="Special Requests" value={guest.specialRequests} />
                </div>
                <div className="mt-8">
                    <p className="text-xs text-slate-500">
                        I agree to abide by the hotel rules and regulations and confirm that the above information is correct. I am responsible for all charges incurred during my stay.
                    </p>
                    <div className="mt-8 pt-8 border-t-2 border-dashed border-slate-300">
                         <p>Guest Signature: _________________________________________</p>
                    </div>
                </div>
            </div>
             <div className="no-print flex justify-end mt-6">
                <Button onClick={handlePrint}>Print</Button>
            </div>
        </div>
    );
};

import React from 'react';
// FIX: Added file extensions to imports to resolve module errors.
import { PaymentStatus } from '../../types.ts';
import { PAYMENT_STATUS_THEME } from '../../constants.tsx';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  showLabel?: boolean;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status, showLabel = false }) => {
    const theme = PAYMENT_STATUS_THEME[status];
    if (!theme) return null;
    
    return (
        <span 
            title={theme.label}
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${theme.bg} ${theme.text}`}
        >
            {theme.icon}
            {showLabel && <span className="ml-1.5">{theme.label}</span>}
        </span>
    );
};

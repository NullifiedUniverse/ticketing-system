
import React from 'react';

const StatusBadge = ({ status }) => {
    const statusStyles = {
        'checked-in': 'bg-green-500/20 text-green-300 ring-green-500/30',
        'on-leave': 'bg-yellow-500/20 text-yellow-300 ring-yellow-500/30',
        'valid': 'bg-blue-500/20 text-blue-300 ring-blue-500/30',
    };
    const text = status.replace('-', ' ').toUpperCase();
    return <span className={`px-3 py-1 text-xs font-semibold rounded-full ring-1 ${statusStyles[status] || ''}`}>{text}</span>;
}

export default StatusBadge;

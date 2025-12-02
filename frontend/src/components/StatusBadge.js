import React from 'react';

const StatusBadge = ({ status }) => {
    const config = {
        'checked-in': {
            style: 'bg-green-500/10 text-green-400 border-green-500/20',
            icon: (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            ),
            label: 'CHECKED IN'
        },
        'on-leave': {
            style: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            icon: (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            ),
            label: 'ON LEAVE'
        },
        'valid': {
            style: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            icon: (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            label: 'VALID'
        },
    };

    const current = config[status] || { style: 'bg-gray-700 text-gray-400', icon: null, label: status };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-md border ${current.style} transition-colors`}>
            {current.icon}
            {current.label}
        </span>
    );
}

export default StatusBadge;
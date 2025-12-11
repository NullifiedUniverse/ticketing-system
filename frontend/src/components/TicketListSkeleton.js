import React from 'react';
import Skeleton from './Skeleton';

const TicketListSkeleton = () => {
    return (
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-xl space-y-6">
            {/* Search Bar Skeleton */}
            <div className="flex gap-4">
                <Skeleton height="48px" width="100%" className="rounded-xl" />
                <Skeleton height="48px" width="120px" className="rounded-xl" />
            </div>

            {/* Table Header Skeleton */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <Skeleton height="16px" width="30px" />
                <Skeleton height="16px" width="60px" />
                <Skeleton height="16px" width="100px" />
                <Skeleton height="16px" width="80px" />
                <Skeleton height="16px" width="80px" />
            </div>

            {/* Rows */}
            <div className="space-y-0">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-4">
                            <Skeleton height="16px" width="20px" />
                            <Skeleton height="24px" width="80px" className="rounded-full" />
                            <div>
                                <Skeleton height="20px" width="150px" className="mb-2" />
                                <Skeleton height="14px" width="200px" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Skeleton height="36px" width="36px" className="rounded-xl" />
                            <Skeleton height="36px" width="100px" className="rounded-xl" />
                            <Skeleton height="36px" width="36px" className="rounded-xl" />
                            <Skeleton height="36px" width="36px" className="rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TicketListSkeleton;

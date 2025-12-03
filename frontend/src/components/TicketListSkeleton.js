import React from 'react';
import Skeleton from './Skeleton';

const TicketListSkeleton = () => {
    return (
        <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <Skeleton height="24px" width="80px" className="rounded-full" />
                        <div>
                            <Skeleton height="20px" width="150px" className="mb-2" />
                            <Skeleton height="14px" width="200px" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Skeleton height="36px" width="36px" className="rounded-lg" />
                        <Skeleton height="36px" width="100px" className="rounded-lg" />
                        <Skeleton height="36px" width="36px" className="rounded-lg" />
                        <Skeleton height="36px" width="36px" className="rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TicketListSkeleton;

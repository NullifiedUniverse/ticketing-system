import React from 'react';
import Skeleton from './Skeleton';

const PageSkeleton = () => {
    return (
        <div className="flex h-screen bg-black overflow-hidden">
            {/* Sidebar Skeleton (Desktop) */}
            <div className="hidden xl:flex w-72 border-r border-white/10 flex-col p-6 gap-8">
                {/* Title Area */}
                <div className="flex items-center gap-3">
                    <Skeleton width="2rem" height="2rem" className="rounded-lg" />
                    <Skeleton width="8rem" height="1.5rem" />
                </div>

                {/* List Area */}
                <div className="space-y-4 mt-4">
                    <Skeleton width="40%" height="0.75rem" className="mb-2 opacity-50" /> {/* Label */}
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} height="3rem" className="rounded-xl" />
                    ))}
                </div>

                {/* Bottom Button */}
                <div className="mt-auto pt-6 border-t border-white/5">
                    <Skeleton height="3.5rem" className="rounded-xl" />
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Header */}
                <div className="h-[73px] border-b border-white/10 flex items-center px-6 justify-between bg-slate-900/50">
                    <Skeleton width="12rem" height="1.5rem" />
                    <Skeleton width="8rem" height="2.5rem" className="rounded-xl" />
                </div>

                {/* Content */}
                <div className="flex-1 p-6 md:p-10 space-y-10 overflow-hidden">
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} height="8rem" className="rounded-3xl bg-white/5" />
                        ))}
                    </div>

                    {/* Chart */}
                    <Skeleton height="20rem" className="rounded-3xl bg-white/5" />

                    {/* Bottom Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-1 space-y-8">
                             <Skeleton height="15rem" className="rounded-3xl bg-white/5" />
                        </div>
                        <div className="xl:col-span-2">
                             <Skeleton height="25rem" className="rounded-3xl bg-white/5" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageSkeleton;

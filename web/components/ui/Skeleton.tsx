/**
 * Skeleton — Reusable loading placeholder components.
 * Replace ALL Loader2 spinners with contextual skeletons.
 *
 * Usage:
 *   <Skeleton.Card />         — stat card
 *   <Skeleton.Row count={5} /> — table rows
 *   <Skeleton.Text lines={3} /> — text block
 */
import React from 'react';

const shimmer = 'animate-pulse bg-gray-100 rounded-lg';

// ── Primitives ─────────────────────────────────────────────────────────────
const Box = ({ className = '' }: { className?: string }) => (
    <div className={`${shimmer} ${className}`} />
);

// ── Composites ─────────────────────────────────────────────────────────────
function StatCard() {
    return (
        <div className="bg-white rounded-xl p-6 border border-gray-100 space-y-3">
            <Box className="h-3 w-24" />
            <Box className="h-8 w-36" />
            <Box className="h-3 w-16" />
        </div>
    );
}

function Row({ cols = 4 }: { cols?: number }) {
    return (
        <div className="flex items-center gap-4 p-4 border-b border-gray-50 last:border-0">
            <Box className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
                <Box className="h-3 w-48" />
                <Box className="h-2.5 w-32" />
            </div>
            {Array.from({ length: cols - 2 }).map((_, i) => (
                <Box key={i} className="h-3 w-20" />
            ))}
            <Box className="h-7 w-16 rounded-full" />
        </div>
    );
}

function Text({ lines = 3 }: { lines?: number }) {
    const widths = ['w-full', 'w-5/6', 'w-4/6', 'w-3/4', 'w-full'];
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Box key={i} className={`h-3 ${widths[i % widths.length]}`} />
            ))}
        </div>
    );
}

function TableList({ count = 5, cols = 4 }: { count?: number; cols?: number }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <Box className="h-4 w-32" />
                <Box className="h-8 w-24 rounded-lg" />
            </div>
            {Array.from({ length: count }).map((_, i) => (
                <Row key={i} cols={cols} />
            ))}
        </div>
    );
}

function Page() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <Box className="h-7 w-48" />
                <Box className="h-4 w-72" />
            </div>
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <StatCard key={i} />)}
            </div>
            {/* Table */}
            <TableList count={6} />
        </div>
    );
}

function ApprovalList({ count = 4 }: { count?: number }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="p-6 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <Box className="h-12 w-12 rounded-xl shrink-0" />
                        <div className="space-y-2">
                            <Box className="h-4 w-40" />
                            <Box className="h-3 w-56" />
                            <Box className="h-3 w-24" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Box className="h-9 w-20 rounded-lg" />
                        <Box className="h-9 w-20 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function DashboardStats() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-100 rounded-xl p-6 space-y-3">
                <Box className="h-3 w-20 bg-blue-200" />
                <Box className="h-8 w-32 bg-blue-200" />
            </div>
            <StatCard />
            <StatCard />
            <StatCard />
            <StatCard />
        </div>
    );
}

// ── Namespace export ───────────────────────────────────────────────────────
export const Skeleton = {
    Box,
    StatCard,
    Row,
    Text,
    TableList,
    Page,
    ApprovalList,
    DashboardStats,
};

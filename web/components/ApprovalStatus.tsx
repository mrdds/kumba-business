import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

interface ApprovalStatusProps {
    status: string;
    currentStep?: number;
    steps?: any[]; // If we have step details
}

export default function ApprovalStatus({ status, currentStep }: ApprovalStatusProps) {
    if (!status) return null;

    const getStatusConfig = () => {
        switch (status) {
            case 'APPROVED':
                return {
                    icon: CheckCircle2,
                    color: 'text-green-600',
                    bg: 'bg-green-50',
                    label: 'Approved'
                };
            case 'REJECTED':
                return {
                    icon: XCircle,
                    color: 'text-red-600',
                    bg: 'bg-red-50',
                    label: 'Rejected'
                };
            case 'PENDING':
            case 'SUBMITTED':
                return {
                    icon: Clock,
                    color: 'text-orange-600',
                    bg: 'bg-orange-50',
                    label: currentStep ? `Pending Approval (Step ${currentStep})` : 'Pending Approval'
                };
                return {
                    icon: AlertCircle,
                    color: 'text-gray-500',
                    bg: 'bg-gray-100',
                    label: 'Draft'
                };
            case 'SENT':
                return {
                    icon: CheckCircle2,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                    label: 'Sent'
                };
            case 'PAID':
                return {
                    icon: CheckCircle2,
                    color: 'text-green-700',
                    bg: 'bg-green-100',
                    label: 'Paid'
                };
            case 'PARTIAL':
                return {
                    icon: Clock,
                    color: 'text-yellow-700',
                    bg: 'bg-yellow-50',
                    label: 'Partial'
                };
            case 'OVERDUE':
                return {
                    icon: AlertCircle,
                    color: 'text-red-700',
                    bg: 'bg-red-100',
                    label: 'Overdue'
                };
            default:
                return {
                    icon: AlertCircle,
                    color: 'text-gray-600',
                    bg: 'bg-gray-50',
                    label: status
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <div className={`flex items-center px-3 py-1.5 rounded-full border ${config.bg} ${config.color} border-current/20`}>
            <Icon size={16} className="mr-2" />
            <span className="text-sm font-medium">{config.label}</span>
        </div>
    );
}

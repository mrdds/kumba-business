import { 
    CheckCircle2, Clock, XCircle, AlertCircle, 
    Send, DollarSign, ShieldCheck 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ApprovalStatusProps {
    status: string;
    currentStep?: number;
    reason?: string;
}

export default function ApprovalStatus({ status, reason }: ApprovalStatusProps) {
    const { t } = useTranslation();
    if (!status) return null;

    const s = status.toUpperCase();

    const getStatusConfig = () => {
        // Multi-level pending status
        if (s.startsWith('PENDING_LEVEL_')) {
            const level = s.split('_').pop();
            const labels: any = { '1': 'Manager', '2': 'Finance', '3': 'Direction' };
            return {
                icon: Clock,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                label: `Attente ${labels[level || '1']}`
            };
        }

        switch (s) {
            case 'APPROVED':
                return {
                    icon: ShieldCheck,
                    color: 'text-green-600',
                    bg: 'bg-green-50',
                    label: t('approval_status.approved', 'Approuvé')
                };
            case 'REJECTED':
                return {
                    icon: XCircle,
                    color: 'text-red-600',
                    bg: 'bg-red-50',
                    label: t('approval_status.rejected', 'Rejeté')
                };
            case 'DRAFT':
                return {
                    icon: AlertCircle,
                    color: 'text-gray-500',
                    bg: 'bg-gray-100',
                    label: t('approval_status.draft', 'Brouillon')
                };
            case 'SENT':
                return {
                    icon: Send,
                    color: 'text-indigo-600',
                    bg: 'bg-indigo-50',
                    label: t('approval_status.sent', 'Envoyé')
                };
            case 'PAID':
                return {
                    icon: DollarSign,
                    color: 'text-emerald-700',
                    bg: 'bg-emerald-100',
                    label: t('approval_status.paid', 'Payé')
                };
            case 'OVERDUE':
                return {
                    icon: AlertCircle,
                    color: 'text-rose-700',
                    bg: 'bg-rose-100',
                    label: t('approval_status.overdue', 'Retard')
                };
            case 'CANCELLED':
                return {
                    icon: XCircle,
                    color: 'text-gray-400',
                    bg: 'bg-gray-50',
                    label: t('approval_status.cancelled', 'Annulé')
                };
            default:
                return {
                    icon: Clock,
                    color: 'text-gray-600',
                    bg: 'bg-gray-50',
                    label: status
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <div className="flex flex-col gap-1">
            <div className={`inline-flex items-center self-start px-3 py-1 rounded-xl border font-black text-[10px] uppercase tracking-tighter ${config.bg} ${config.color} border-current/10 shadow-sm`}>
                <Icon size={12} className="mr-1.5 opacity-70" />
                <span>{config.label}</span>
            </div>
            {s === 'REJECTED' && reason && (
                <div className="text-[10px] text-red-500 italic font-medium max-w-[200px] truncate" title={reason}>
                    &ldquo;{reason}&rdquo;
                </div>
            )}
        </div>
    );
}


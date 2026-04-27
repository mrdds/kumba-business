'use client';
import { useApiQuery } from '@/hooks/useApiQuery';
import { getApprovalTimeline } from '@/services/auth.service';
import { Skeleton } from '@/components/ui/Skeleton';
import { X, CheckCircle, Clock, XCircle, User, ArrowRight, ShieldCheck } from 'lucide-react';

interface TimelineModalProps {
    isOpen: boolean;
    onClose: () => void;
    approvalId: number;
}


export default function TimelineModal({ isOpen, onClose, approvalId }: TimelineModalProps) {
    const { data: timeline, loading } = useApiQuery(
        () => getApprovalTimeline(approvalId),
        [approvalId],
        { enabled: isOpen && !!approvalId }
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Parcours d'Approbation</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Demande #{approvalId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4">
                                    <Skeleton.Box className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton.Box className="h-4 w-1/3" />
                                        <Skeleton.Box className="h-3 w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : timeline ? (
                        <div className="relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100" />

                            <div className="space-y-8 relative">
                                {/* Step: Creation */}
                                <TimelineStep 
                                    status="success"
                                    title="Document Créé"
                                    user={timeline.created_by_name}
                                    date={timeline.created_at}
                                    icon={<CheckCircle size={16} />}
                                />

                                {/* Step: Levels */}
                                {(timeline.steps || []).map((step: any) => {
                                    const log = (timeline.history || []).find((h: any) => h.step_order === step.order);
                                    
                                    return (
                                        <TimelineStep 
                                            key={step.order}
                                            status={step.status.toLowerCase()}
                                            title={step.role || `Étape ${step.order}`}
                                            user={log?.actor_name || step.approver}
                                            date={log?.timestamp}
                                            comment={log?.comments}
                                            isCurrent={step.status === 'CURRENT'}
                                        />
                                    );
                                })}

                                {/* Final Status */}
                                {timeline.status === 'APPROVED' && (
                                    <TimelineStep 
                                        status="success"
                                        title="Approbation Finale"
                                        description="Le document est maintenant entièrement approuvé."
                                        icon={<ShieldCheck size={16} />}
                                    />
                                )}
                                {timeline.status === 'REJECTED' && (
                                    <TimelineStep 
                                        status="error"
                                        title="Demande Rejetée"
                                        description="La demande a été rejetée et le processus arrêté."
                                        icon={<XCircle size={16} />}
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-gray-400 py-10">Aucun historique trouvé.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function TimelineStep({ status, title, description, user, date, comment, icon, isCurrent }: any) {
    const s = status.toLowerCase();
    const configs = {
        success:   { bg: 'bg-green-500', text: 'text-green-600', ring: 'ring-green-100' },
        completed: { bg: 'bg-green-500', text: 'text-green-600', ring: 'ring-green-100' },
        error:     { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-100' },
        rejected:  { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-100' },
        pending:   { bg: 'bg-blue-600', text: 'text-blue-600', ring: 'ring-blue-100' },
        current:   { bg: 'bg-blue-600', text: 'text-blue-600', ring: 'ring-blue-100' },
        idle:      { bg: 'bg-gray-200', text: 'text-gray-400', ring: 'bg-transparent' },
        future:    { bg: 'bg-gray-200', text: 'text-gray-400', ring: 'bg-transparent' },
    };
    const c = configs[s as keyof typeof configs] || configs.idle;

    return (
        <div className="flex gap-5 relative group">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-all border-4 border-white ring-4 ${c.ring} ${c.bg} text-white`}>
                {icon || (['success', 'completed'].includes(s) ? <CheckCircle size={16} /> : ['error', 'rejected'].includes(s) ? <XCircle size={16} /> : ['pending', 'current'].includes(s) ? <Clock size={16} className="animate-spin-slow" /> : <div className="h-2 w-2 rounded-full bg-white opacity-50" />)}
            </div>
            <div className="flex-1 pt-1">
                <div className="flex justify-between items-start">
                    <h4 className={`text-sm font-black uppercase tracking-tight ${c.text}`}>
                        {title}
                        {isCurrent && <span className="ml-2 lowercase font-medium text-[10px] bg-blue-100 px-1.5 py-0.5 rounded text-blue-700 animate-pulse">En attente</span>}
                    </h4>
                    {date && <span className="text-[10px] text-gray-400 font-bold">{new Date(date).toLocaleDateString()}</span>}
                </div>
                {user && (
                    <div className="flex items-center gap-1.5 mt-1 text-gray-600">
                        <User size={12} className="opacity-40" />
                        <span className="text-xs font-bold">{user}</span>
                    </div>
                )}
                {comment && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs italic text-gray-600 relative after:content-[''] after:absolute after:bottom-full after:left-4 after:border-8 after:border-transparent after:border-b-gray-50">
                        &ldquo;{comment}&rdquo;
                    </div>
                )}
                {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
            </div>
        </div>
    );
}

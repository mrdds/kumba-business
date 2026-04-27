/**
 * useAutoSave — Debounced auto-save with visual status indicator.
 * Prevents data loss on long forms (bills, invoices, employees).
 *
 * Usage:
 *   const saveStatus = useAutoSave(formData, saveDraft, 2000);
 *   <AutoSaveIndicator status={saveStatus} />
 */
import { useState, useEffect, useRef } from 'react';

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

interface AutoSaveOptions {
    delay?: number;         // ms before save triggers (default: 2000)
    enabled?: boolean;      // Disable when form hasn't loaded yet
    onlyWhenDirty?: boolean; // Skip first render save
}

export function useAutoSave<T>(
    data: T,
    saveFn: (data: T) => Promise<void>,
    options?: AutoSaveOptions
): SaveStatus {
    const { delay = 2000, enabled = true, onlyWhenDirty = true } = options ?? {};
    const [status, setStatus] = useState<SaveStatus>('idle');
    const isFirstRender = useRef(true);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        if (onlyWhenDirty && isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (!enabled) return;

        setStatus('unsaved');
        clearTimeout(timerRef.current);

        timerRef.current = setTimeout(async () => {
            setStatus('saving');
            try {
                await saveFn(data);
                setStatus('saved');
                // Reset to idle after 3s
                setTimeout(() => setStatus('idle'), 3000);
            } catch {
                setStatus('error');
            }
        }, delay);

        return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(data), enabled]);

    return status;
}


/**
 * AutoSaveIndicator — Visual badge showing save status.
 * Drop into any form header.
 */
import React from 'react';
import { Check, Loader2, AlertCircle, Circle } from 'lucide-react';

interface AutoSaveIndicatorProps {
    status: SaveStatus;
}

export function AutoSaveIndicator({ status }: AutoSaveIndicatorProps) {
    if (status === 'idle') return null;

    const config = {
        unsaved: {
            icon: <Circle size={10} className="fill-current" />,
            text: 'Modifications non sauvegardées',
            cls: 'text-amber-600 bg-amber-50 border-amber-200',
        },
        saving: {
            icon: <Loader2 size={12} className="animate-spin" />,
            text: 'Enregistrement...',
            cls: 'text-blue-600 bg-blue-50 border-blue-200',
        },
        saved: {
            icon: <Check size={12} strokeWidth={3} />,
            text: 'Enregistré automatiquement',
            cls: 'text-green-600 bg-green-50 border-green-200',
        },
        error: {
            icon: <AlertCircle size={12} />,
            text: 'Échec de la sauvegarde',
            cls: 'text-red-600 bg-red-50 border-red-200',
        },
    }[status];

    return (
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${config.cls}`}>
            {config.icon}
            {config.text}
        </span>
    );
}

/**
 * useApiQuery — Centralized data fetching hook.
 * Replaces the 55 duplicated loading/error/data state patterns across pages.
 *
 * Usage:
 *   const { data: bills, loading, error, refetch } = useApiQuery(getBills);
 *   const { data: emp } = useApiQuery(() => getEmployee(id), [id]);
 */
import { useState, useEffect, useCallback, useRef } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface QueryResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    status: Status;
    refetch: () => Promise<void>;
}

export function useApiQuery<T>(
    fetcher: () => Promise<T>,
    deps: any[] = [],
    options?: {
        enabled?: boolean;          // Run only when true (default: true)
        initialData?: T;            // Optimistic initial value
        onSuccess?: (data: T) => void;
        onError?: (err: string) => void;
    }
): QueryResult<T> {
    const { enabled = true, initialData, onSuccess, onError } = options ?? {};
    const [data, setData] = useState<T | null>(initialData ?? null);
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const execute = useCallback(async () => {
        if (!enabled) return;

        // Cancel any in-flight request
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        setStatus('loading');
        setError(null);

        try {
            const result = await fetcher();
            setData(result);
            setStatus('success');
            onSuccess?.(result);
        } catch (e: any) {
            if (e.name === 'AbortError') return;
            const msg = e.response?.data?.message ?? e.message ?? 'Une erreur est survenue';
            setError(msg);
            setStatus('error');
            onError?.(msg);
        }
    }, [enabled, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        execute();
        return () => abortRef.current?.abort();
    }, [execute]);

    return { data, loading: status === 'loading', error, status, refetch: execute };
}


/**
 * useApiMutation — For POST / PUT / DELETE calls.
 * Returns a mutate function + state, enabling optimistic UI.
 *
 * Usage:
 *   const { mutate: approve, loading } = useApiMutation(approveRequest);
 *   await approve(id);
 */
interface MutationResult<TArgs, TData> {
    mutate: (...args: TArgs extends any[] ? TArgs : [TArgs]) => Promise<TData | null>;
    loading: boolean;
    error: string | null;
    reset: () => void;
}

export function useApiMutation<TArgs extends any[], TData>(
    mutator: (...args: TArgs) => Promise<TData>,
    options?: {
        onSuccess?: (data: TData, ...args: TArgs) => void;
        onError?: (err: string, ...args: TArgs) => void;
    }
): MutationResult<TArgs, TData> {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutate = async (...args: TArgs): Promise<TData | null> => {
        setLoading(true);
        setError(null);
        try {
            const result = await mutator(...args);
            options?.onSuccess?.(result, ...args);
            return result;
        } catch (e: any) {
            const msg = e.response?.data?.message ?? e.message ?? 'Erreur';
            setError(msg);
            options?.onError?.(msg, ...args);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { mutate, loading, error, reset: () => setError(null) };
}

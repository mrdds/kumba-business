/**
 * useHotkeys — Global keyboard shortcut manager.
 * Provides ⌘K command palette, fast navigation, and form shortcuts.
 */
import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type HotkeyMap = Record<string, () => void>;

/**
 * Low-level hook — bind arbitrary hotkeys.
 *
 * Usage:
 *   useHotkeys({ 'cmd+k': openPalette, 'cmd+n': createInvoice });
 */
export function useHotkeys(map: HotkeyMap) {
    const handler = useCallback((e: KeyboardEvent) => {
        if (!e.key) return;
        const mod = e.metaKey || e.ctrlKey;
        const shift = e.shiftKey;
        const key = e.key.toLowerCase();

        // Build combo string, e.g. "cmd+k", "cmd+shift+n"
        const combo = [
            mod ? 'cmd' : '',
            shift ? 'shift' : '',
            key
        ].filter(Boolean).join('+');

        if (map[combo]) {
            // Don't hijack when typing in inputs
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

            e.preventDefault();
            map[combo]();
        }
    }, [map]);

    useEffect(() => {
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handler]);
}


/**
 * useGlobalHotkeys — App-wide shortcuts, mount once in layout.
 *
 * Shortcuts:
 *   ⌘K         → Command Palette
 *   ⌘N         → New Invoice
 *   ⌘⇧N        → New Bill
 *   ⌘⇧E        → New Employee
 *   ⌘/         → Go to Dashboard
 *   ⌘.         → Go to Settings
 *   Escape      → Close modals/palettes (handled at component level)
 */
export function useGlobalHotkeys(options: {
    onOpenPalette: () => void;
}) {
    const router = useRouter();

    useHotkeys({
        'cmd+k':       options.onOpenPalette,
        'cmd+n':       () => router.push('/invoices/create'),
        'cmd+shift+n': () => router.push('/bills/create'),
        'cmd+shift+e': () => router.push('/hr/employees/create'),
        'cmd+/':       () => router.push('/dashboard'),
        'cmd+.':       () => router.push('/settings'),
    });
}

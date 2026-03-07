import { useState, useEffect, useCallback, useRef } from 'react';

const DEBOUNCE_DELAY_MS = 250;

/**
 * Returns a debounced value that updates after `delayMs` of no changes.
 * Use for search/filter inputs to avoid expensive recomputes on every keystroke.
 */
export function useDebounce<T>(value: T, delayMs: number = DEBOUNCE_DELAY_MS): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedValue(value), delayMs);
        return () => window.clearTimeout(timer);
    }, [value, delayMs]);

    return debouncedValue;
}

/**
 * Returns a debounced setter that batches rapid updates and only calls the
 * inner setter after `delayMs` of no new calls.
 */
export function useDebouncedCallback<T>(
    callback: (value: T) => void,
    delayMs: number = DEBOUNCE_DELAY_MS
): (value: T) => void {
    const timeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
    const latestValueRef = useRef<T | null>(null);

    const flush = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (latestValueRef.current !== null) {
            const v = latestValueRef.current;
            latestValueRef.current = null;
            callback(v);
        }
    }, [callback]);

    return useCallback(
        (value: T) => {
            latestValueRef.current = value;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = window.setTimeout(flush, delayMs);
        },
        [delayMs, flush]
    );
}

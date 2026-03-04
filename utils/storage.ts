import { useRef, useEffect } from 'react';

// Custom hook to get the previous value of a state or prop
export const usePrevious = <T,>(value: T): T | undefined => {
    const ref = useRef<T | undefined>(undefined);
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
};

// Utility to compare two objects and find changed fields
export const getChangedFields = (prev: any, current: any): { field: string; from: any; to: any }[] => {
    const changes: { field: string; from: any; to: any }[] = [];
    if (!prev || !current) return [];

    const allKeys = new Set([...Object.keys(prev), ...Object.keys(current)]);

    allKeys.forEach(key => {
        const prevValue = prev[key];
        const currentValue = current[key];

        // Sanitize function to handle file objects
        const sanitize = (val: any) => {
            if (typeof val === 'object' && val !== null && val.name && typeof val.data === 'string') {
                return `[File: ${val.name}]`;
            }
            return val;
        };

        const fromValue = sanitize(prevValue);
        const toValue = sanitize(currentValue);

        // Simple comparison for primitive types and sanitized objects
        if (fromValue !== toValue) {
             changes.push({
                field: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
                from: fromValue || 'Not Set',
                to: toValue || 'Not Set',
            });
        }
    });

    return changes;
};

// Utility to append an item to an array stored in localStorage
export const appendToLocalStorageArray = (key: string, newItem: any) => {
    if (typeof window === 'undefined') return;

    try {
        const existingRaw = window.localStorage.getItem(key);
        const existingArray = existingRaw ? JSON.parse(existingRaw) : [];
        
        if (Array.isArray(existingArray)) {
            existingArray.push(newItem);
            // Cap logs at 2000 for performance
            const finalArray = existingArray.length > 2000 ? existingArray.slice(-2000) : existingArray;
            const valueToStore = JSON.stringify(finalArray);
            window.localStorage.setItem(key, valueToStore);
            
            // Standard StorageEvent for cross-tab, also works for local listeners if properly dispatched
            window.dispatchEvent(new StorageEvent('storage', { 
                key, 
                newValue: valueToStore,
                storageArea: window.localStorage 
            }));
            
            // Custom event for ultra-reliable local-window synchronization
            window.dispatchEvent(new CustomEvent('logip-storage-update', { detail: { key, newValue: valueToStore } }));
        } else {
             console.warn(`localStorage item with key “${key}” is not an array.`);
        }
    } catch (error) {
        console.warn(`Error appending to localStorage key “${key}”:`, error);
    }
};

export type LogUserType = 'admin' | 'student';

/**
 * Log a system activity
 */
export const logActivity = (
    user: { name: string, avatar: string, type?: LogUserType }, 
    action: string, 
    eventType: string, 
    details?: string, 
    schoolId?: string
) => {
    const logEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        user: {
            ...user,
            type: user.type || 'admin'
        },
        action,
        eventType,
        details,
        schoolId
    };
    appendToLocalStorageArray('logip_activity_logs', logEntry);
};

// Dispatches events to ensure both same-tab and cross-tab listeners are notified of a change.
export const setLocalStorageAndNotify = (key: string, value: any) => {
    if (typeof window === 'undefined') return;

    try {
        const valueToStore = JSON.stringify(value);
        window.localStorage.setItem(key, valueToStore);
        
        window.dispatchEvent(new StorageEvent('storage', { 
            key, 
            newValue: valueToStore,
            storageArea: window.localStorage
        }));
        
        window.dispatchEvent(new CustomEvent('logip-storage-update', { detail: { key, newValue: valueToStore } }));
    } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
    }
};
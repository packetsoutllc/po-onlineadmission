import React, { useState, useEffect, useCallback } from 'react';

// Custom event to notify components in the same tab of a localStorage change.
const dispatchStorageEvent = (key: string, newValue: string | null) => {
    window.dispatchEvent(new StorageEvent('storage', { 
        key, 
        newValue, 
        storageArea: window.localStorage 
    }));
    window.dispatchEvent(new CustomEvent('logip-storage-update', { detail: { key, newValue } }));
};

// A custom hook to synchronize state with localStorage and across tabs.
export function useLocalStorage<T>(key: string, initialValue: T, reviver?: (value: any) => T) {
    const initialValueRef = React.useRef(initialValue);
    const reviverRef = React.useRef(reviver);
    const lastRawValueRef = React.useRef<string | null>(null);
    const lastParsedValueRef = React.useRef<T>(initialValue);

    useEffect(() => {
        initialValueRef.current = initialValue;
        reviverRef.current = reviver;
    }, [initialValue, reviver]);

    // Function to read value from localStorage
    const readValue = useCallback((): T => {
        if (typeof window === 'undefined') {
            return initialValueRef.current;
        }
        try {
            const item = window.localStorage.getItem(key);
            if (!item) return initialValueRef.current;
            
            if (item === lastRawValueRef.current) {
                return lastParsedValueRef.current;
            }
            
            const parsed = JSON.parse(item);
            const value = reviverRef.current ? reviverRef.current(parsed) : (parsed as T);
            
            lastRawValueRef.current = item;
            lastParsedValueRef.current = value;
            
            return value;
        } catch (error) {
            console.warn(`Error reading localStorage key “${key}”:`, error);
            return initialValueRef.current;
        }
    }, [key]);

    const [storedValue, setStoredValue] = useState<T>(readValue);

    const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback((value) => {
        try {
            const prevValue = lastParsedValueRef.current;
            const newValue = value instanceof Function ? value(prevValue) : value;
            
            if (typeof window !== 'undefined') {
                const replacer = (key: string, val: any) => {
                    if(val instanceof Set) {
                        return Array.from(val);
                    }
                    return val;
                };
                const serializedValue = JSON.stringify(newValue, replacer);
                window.localStorage.setItem(key, serializedValue);
                
                lastRawValueRef.current = serializedValue;
                lastParsedValueRef.current = newValue;

                // Manually dispatch for other components in the same tab to update
                dispatchStorageEvent(key, serializedValue);
            }
            
            setStoredValue(newValue);
        } catch (error) {
            console.warn(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key]);


    // Listen for changes to this key from other tabs or manual dispatches.
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent | CustomEvent) => {
            const eventKey = (e as StorageEvent).key || (e as CustomEvent).detail?.key;
            if (eventKey === key) {
                setStoredValue(readValue());
            }
        };

        window.addEventListener('storage', handleStorageChange as EventListener);
        window.addEventListener('logip-storage-update', handleStorageChange as EventListener);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange as EventListener);
            window.removeEventListener('logip-storage-update', handleStorageChange as EventListener);
        };
    }, [key, readValue]);

    // Listen for changes to the key itself (e.g., student changes) and update the state.
    useEffect(() => {
        setStoredValue(readValue());
    }, [key, readValue]);


    return [storedValue, setValue] as const;
}

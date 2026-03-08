/**
 * Safe guards for runtime values. Use to avoid "Cannot read properties of undefined" in live/production.
 */

/** Returns the value if it's an array, otherwise a copy of fallback (default empty array). */
export function asArray<T>(value: T[] | undefined | null, fallback: T[] = []): T[] {
    return Array.isArray(value) ? value : fallback;
}

/** Returns the value if it's a non-null object, otherwise fallback (default empty object). */
export function asObject<T extends Record<string, unknown>>(value: T | undefined | null, fallback: T = {} as T): T {
    return value != null && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
}

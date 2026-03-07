/**
 * Security utilities to prevent XSS, injection, and unsafe URL usage.
 * Use these whenever interpolating user or external data into HTML, URLs, or document.write.
 */

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape a string for safe use in HTML text content or attribute values.
 * Prevents XSS when interpolating into document.write, innerHTML, or attribute values.
 */
export function escapeHtml(str: string | null | undefined): string {
  if (str == null || typeof str !== 'string') return '';
  return String(str).replace(/[&<>"'`=/]/g, (c) => HTML_ENTITIES[c] ?? c);
}

/**
 * Allowed URL schemes for resources used in print/preview (images, PDFs).
 * Only https:, blob:, and data: (with restricted MIME) are safe.
 */
const SAFE_SCHEMES = ['https:', 'http:']; // http for backwards compat with existing Unsplash URLs
const SAFE_DATA_PREFIXES = ['data:image/', 'data:application/pdf;base64,'];

/**
 * Returns true if the URL is safe to use in img src, iframe src, or document.write.
 * Allows: https:, http:, blob:, and data:image/* or data:application/pdf;base64,*
 */
export function isSafeResourceUrl(url: string | null | undefined): boolean {
  if (url == null || typeof url !== 'string' || !url.trim()) return false;
  const trimmed = url.trim();
  try {
    if (trimmed.startsWith('data:')) {
      const lower = trimmed.toLowerCase();
      return SAFE_DATA_PREFIXES.some((p) => lower.startsWith(p));
    }
    if (trimmed.startsWith('blob:')) return true;
    const parsed = new URL(trimmed, 'https://dummy.example');
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Return a URL safe for img/iframe: either the original if allowed, or empty string.
 */
export function sanitizeResourceUrl(url: string | null | undefined): string {
  return isSafeResourceUrl(url) ? String(url).trim() : '';
}

/**
 * Safe JSON.parse with fallback. Use when reading from localStorage or external input.
 */
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (raw == null || typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (trimmed === '') return fallback;
  try {
    const parsed = JSON.parse(trimmed) as T;
    return parsed != null ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Sanitize a string for use as a slug (alphanumeric, hyphen, underscore only).
 * Use for path segments to prevent path traversal or injection.
 */
export function sanitizeSlug(segment: string | null | undefined): string {
  if (segment == null || typeof segment !== 'string') return '';
  return segment.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 200);
}

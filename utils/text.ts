/**
 * Replaces literal backslash-n (\n) with real newlines.
 * Use when displaying text from DB/API that may have been stored with escaped newlines.
 */
export function normalizeNewlines(s: string): string {
  return s.replace(/\\n/g, "\n");
}

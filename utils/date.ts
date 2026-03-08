/**
 * System-wide date format: dd-mmmm-yyyy (e.g. 07-March-2025).
 */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null) return null;
  const d = typeof value === "object" && "getTime" in value ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format as dd-mmmm-yyyy (e.g. 07-March-2025). Returns '' for invalid/missing.
 */
export function formatDate(value: Date | string | number | null | undefined): string {
  const d = toDate(value);
  if (!d) return "";
  const day = d.getDate().toString().padStart(2, "0");
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format as dd-mmmm-yyyy, HH:MM AM/PM (e.g. 07-March-2025, 2:30 PM). Returns '' for invalid/missing.
 */
export function formatDateTime(value: Date | string | number | null | undefined): string {
  const d = toDate(value);
  if (!d) return "";
  const datePart = formatDate(d);
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${datePart}, ${timeStr}`;
}

import { setLocalStorageAndNotify } from '../../../utils/storage';
import { safeJsonParse } from '../../../utils/security';

/** Single key used everywhere so the Cyber Security monitor shows all events. */
export const LOGS_STORAGE_KEY = 'admin_security_logs';

export interface SecurityLogEntry {
  id: string;
  timestamp: string;
  riskType: string;
  target: string;
  action: string;
  details?: string;
  icon?: string;
}

/**
 * Log a security event so it appears in the Cyber Security monitor.
 * Call this for any failed access, invalid credentials, 2FA failure, forced logout, or suspicious activity.
 */
export const logSecurityEvent = (
    riskType: string,
    target: string,
    action: string,
    icon?: string,
    details?: string,
) => {
    const newLog: SecurityLogEntry = {
        id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        timestamp: new Date().toISOString(),
        riskType,
        target,
        action,
        ...(details !== undefined && { details }),
        ...(icon !== undefined && { icon }),
    };

    const existingRaw = typeof window !== 'undefined' ? localStorage.getItem(LOGS_STORAGE_KEY) : null;
    const existingLogs: SecurityLogEntry[] = safeJsonParse<SecurityLogEntry[]>(existingRaw, []);

    const updatedLogs = [newLog, ...existingLogs].slice(0, 200);

    setLocalStorageAndNotify(LOGS_STORAGE_KEY, updatedLogs);
};

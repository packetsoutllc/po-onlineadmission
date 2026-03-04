import { setLocalStorageAndNotify } from '../../../utils/storage';

export interface SecurityLogEntry {
  id: string;
  timestamp: string;
  riskType: string;
  target: string;
  action: string;
  icon: string;
}

export const LOGS_STORAGE_KEY = 'cyber_security_logs';

export const logSecurityEvent = (
    riskType: string,
    target: string,
    action: string,
    icon: string,
) => {
    const newLog: SecurityLogEntry = {
        id: `log_${Date.now()}_${Math.random()}`,
        timestamp: new Date().toISOString(),
        riskType,
        target,
        action,
        icon,
    };

    const existingRaw = localStorage.getItem(LOGS_STORAGE_KEY);
    const existingLogs: SecurityLogEntry[] = existingRaw ? JSON.parse(existingRaw) : [];
    
    // Prepend new log and keep only the last 100 entries
    const updatedLogs = [newLog, ...existingLogs].slice(0, 100);

    setLocalStorageAndNotify(LOGS_STORAGE_KEY, updatedLogs);
};

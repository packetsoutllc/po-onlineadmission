import React, { useState, useEffect } from 'react';
import AdminModal from './AdminModal';
import { AdminStudent, EditLogEntry } from '../pages/StudentsPage';

interface EditLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: AdminStudent;
    logType: 'student' | 'admin';
}

const EditLogModal: React.FC<EditLogModalProps> = ({ isOpen, onClose, student, logType }) => {
    const [logs, setLogs] = useState<EditLogEntry[]>([]);

    useEffect(() => {
        if (isOpen && student) {
            try {
                const logRaw = localStorage.getItem(`editHistory_${student.indexNumber}`);
                const history: EditLogEntry[] = logRaw ? JSON.parse(logRaw) : [];
                const filteredHistory = history.filter(log => log.editor === logType);
                const seen = new Set();
                const uniqueHistory = filteredHistory.filter(entry => {
                    const signature = `${entry.timestamp}-${JSON.stringify(entry.changedFields)}`;
                    if (seen.has(signature)) return false;
                    seen.add(signature);
                    return true;
                });
                setLogs(uniqueHistory.reverse());
            } catch (e) {
                setLogs([]);
            }
        }
    }, [isOpen, student, logType]);
    
    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title={`Edit History: ${student.name}`}>
            <div className="space-y-4">
                {logs.length > 0 ? (
                    logs.map((log, index) => (
                        <div key={log.timestamp + index} className="p-4 rounded-lg border border-logip-border dark:border-dark-border bg-gray-50 dark:bg-dark-bg/50">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                     <span className={`material-symbols-outlined text-xl ${log.editor === 'admin' ? 'text-blue-600' : 'text-blue-500'}`}>
                                        {log.editor === 'admin' ? 'shield_person' : 'person'}
                                    </span>
                                    <span className="font-bold text-logip-text-header dark:text-dark-text-primary capitalize">{log.editor}</span>
                                </div>
                                <div className="text-sm text-logip-text-subtle">{new Date(log.timestamp).toLocaleString()}</div>
                            </div>
                             <ul className="space-y-1.5 pl-4 border-l-2 border-logip-border dark:border-dark-border">
                                {log.changedFields.map((change, i) => (
                                    <li key={i} className="text-sm text-logip-text-body dark:text-dark-text-secondary">
                                        <span className="font-semibold text-logip-text-header dark:text-dark-text-primary">{change.field}:</span> {String(change.from)} → {String(change.to)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-logip-text-subtle">
                        <span className="material-symbols-outlined text-5xl">history_toggle_off</span>
                        <p className="mt-2 text-lg font-semibold">No Edit History</p>
                    </div>
                )}
            </div>
             <div className="pt-6 flex justify-end">
                <button onClick={onClose} className="px-5 py-2 text-base font-semibold rounded-lg border border-logip-border dark:border-dark-border hover:bg-gray-100 transition-colors">Close</button>
            </div>
        </AdminModal>
    );
};

export default EditLogModal;
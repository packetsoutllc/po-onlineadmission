import React, { useState, useMemo, useEffect } from 'react';
import PaginationControls from '../shared/PaginationControls';
import { useSortableData } from '../../hooks/useSortableData';
import SortableHeader from '../shared/SortableHeader';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { AdminUser } from '../AdminLayout';
import { AdminInput, AdminSelect } from '../shared/forms';
import { School } from './SettingsPage';
import { useToast } from '../shared/ToastContext';
import ConfirmationModal from '../shared/ConfirmationModal';

// --- TYPE DEFINITIONS ---
type LogEventType = 'user_management' | 'student_update' | 'system_settings' | 'admission_process' | 'student_delete' | 'user_add' | 'security' | 'navigation' | 'document_access';

interface LogEntry {
    id: string;
    timestamp: string;
    user: {
        name: string;
        avatar: string;
        type?: 'admin' | 'student';
    };
    action: string;
    eventType: LogEventType;
    details?: string;
    schoolId?: string;
}

const EVENT_TYPE_MAP: { [key in LogEventType]: { name: string, icon: string, color: string } } = {
    user_management: { name: 'User Management', icon: 'edit', color: 'text-blue-500 bg-blue-100 dark:text-blue-300 dark:bg-blue-500/20' },
    user_add: { name: 'User Added', icon: 'person_add', color: 'text-sky-500 bg-sky-100 dark:text-sky-300 dark:bg-sky-500/20' },
    student_update: { name: 'Student Update', icon: 'school', color: 'text-purple-500 bg-purple-100 dark:text-purple-300 dark:bg-purple-500/20' },
    student_delete: { name: 'Student Deletion', icon: 'delete', color: 'text-red-500 bg-red-100 dark:text-red-300 dark:bg-red-500/20' },
    system_settings: { name: 'System Settings', icon: 'settings', color: 'text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-500/20' },
    admission_process: { name: 'Admission Process', icon: 'how_to_reg', color: 'text-green-500 bg-green-100 dark:text-green-300 dark:bg-green-500/20' },
    security: { name: 'Security', icon: 'shield', color: 'text-orange-500 bg-orange-100 dark:text-orange-300 dark:bg-orange-500/20' },
    navigation: { name: 'Navigation', icon: 'explore', color: 'text-blue-400 bg-blue-50 dark:text-blue-200 dark:bg-blue-500/10' },
    document_access: { name: 'Document Access', icon: 'article', color: 'text-emerald-500 bg-emerald-50 dark:text-emerald-200 dark:bg-emerald-500/10' },
};

const dateFilterOptions = {
    'all': 'All Time',
    'today': 'Today',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
};

interface LogsPageProps {
  adminUser: AdminUser;
  selectedSchool?: School | null;
}

const LogsPage: React.FC<LogsPageProps> = ({ adminUser, selectedSchool }) => {
    const { showToast } = useToast();
    const userPrefix = adminUser.email;
    const isSuperAdmin = adminUser.roleId === 'role_super_admin';
    
    // Switch to new storage key for activity logs to match schema update
    const [logs, setLogs] = useLocalStorage<LogEntry[]>('logip_activity_logs', []);
    const [searchTerm, setSearchTerm] = useState('');
    const [eventTypeFilter, setEventTypeFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

    // PERMANENCE: Scope logs page settings by user email
    const [viewMode, setViewMode] = useLocalStorage<'all' | 'me' | 'applicants'>(`${userPrefix}_admin_logs_view_mode`, 'all');
    const [itemsPerPage, setItemsPerPage] = useLocalStorage<number>(`${userPrefix}_admin_logs_items_per_page`, 10);

    const [currentPage, setCurrentPage] = useState(1);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSchool = isSuperAdmin || !log.schoolId || (selectedSchool && log.schoolId === selectedSchool.id);
            if (!matchesSchool) return false;

            let matchesUser = true;
            if (viewMode === 'me') {
                matchesUser = log.user.name === adminUser.name;
            } else if (viewMode === 'applicants') {
                matchesUser = log.user.type === 'student';
            }
            if (!matchesUser) return false;

            const matchesSearch = log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (log.details || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesEventType = eventTypeFilter === 'all' || log.eventType === eventTypeFilter;
            
            const now = new Date();
            const logDate = new Date(log.timestamp);
            let matchesDate = true;
            if (dateFilter === 'today') {
                matchesDate = logDate.toDateString() === now.toDateString();
            } else if (dateFilter === '7d') {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(now.getDate() - 7);
                matchesDate = logDate >= sevenDaysAgo;
            } else if (dateFilter === '30d') {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(now.getDate() - 30);
                matchesDate = logDate >= thirtyDaysAgo;
            }
            
            return matchesSearch && matchesEventType && matchesDate;
        });
    }, [logs, searchTerm, eventTypeFilter, dateFilter, viewMode, adminUser, selectedSchool, isSuperAdmin]);
    
    const { items: sortedLogs, requestSort, sortConfig } = useSortableData(filteredLogs, { key: 'timestamp', direction: 'descending' });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, eventTypeFilter, dateFilter, itemsPerPage, viewMode, selectedSchool]);

    const handleClearAll = () => {
        setLogs([]);
        showToast('All activity logs have been cleared.', 'info');
        setIsClearModalOpen(false);
    };

    const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedLogs = sortedLogs.slice(startIndex, startIndex + itemsPerPage);
    const startItem = startIndex + 1;
    const endItem = Math.min(startIndex + itemsPerPage, sortedLogs.length);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="bg-logip-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-logip-border dark:border-dark-border">
                {/* Header */}
                 <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-logip-border dark:border-dark-border pb-6">
                    <div className="w-full md:w-auto">
                        <h2 className="text-2xl font-bold text-logip-text-header dark:text-dark-text-primary">Activity Logs</h2>
                        <p className="text-logip-text-subtle dark:text-dark-text-secondary mt-1">
                            Reviewing active portal usage for <span className="font-bold">{selectedSchool?.name || 'All Schools'}</span>.
                        </p>
                    </div>
                    {isSuperAdmin && (
                        <button 
                            onClick={() => setIsClearModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">delete_sweep</span>
                            Clear Logs
                        </button>
                    )}
                </div>
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-dark-bg rounded-lg">
                            <button
                                onClick={() => setViewMode('all')}
                                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === 'all' ? 'bg-white dark:bg-dark-surface shadow-sm text-logip-primary dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'}`}
                            >
                                All Users
                            </button>
                            <button
                                onClick={() => setViewMode('applicants')}
                                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === 'applicants' ? 'bg-white dark:bg-dark-surface shadow-sm text-logip-primary dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'}`}
                            >
                                Applicants
                            </button>
                            <button
                                onClick={() => setViewMode('me')}
                                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === 'me' ? 'bg-white dark:bg-dark-surface shadow-sm text-logip-primary dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'}`}
                            >
                                Me
                            </button>
                        </div>
                        <div className="relative w-full sm:w-auto sm:flex-1 min-w-[200px]">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-logip-text-subtle dark:text-dark-text-secondary">search</span>
                            <AdminInput
                                type="text"
                                placeholder="Search activities..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 !bg-gray-50 dark:!bg-dark-bg"
                            />
                        </div>
                    </div>

                    <div className="flex w-full sm:w-auto items-center gap-2">
                         <div className="w-48">
                            <AdminSelect value={eventTypeFilter} onChange={e => setEventTypeFilter(e.target.value)} align="left">
                                <option value="all">All Event Types</option>
                                {Object.entries(EVENT_TYPE_MAP).map(([key, value]) => (
                                    <option key={key} value={key}>{value.name}</option>
                                ))}
                            </AdminSelect>
                        </div>

                        <div className="w-40">
                            <AdminSelect value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                                {Object.entries(dateFilterOptions).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                ))}
                            </AdminSelect>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 bg-logip-white dark:bg-dark-surface rounded-lg border border-logip-border dark:border-dark-border overflow-hidden">
                {paginatedLogs.length > 0 ? (
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full min-w-[900px]">
                            <thead className="border-b border-logip-border dark:border-dark-border bg-gray-50 dark:bg-white/5">
                                <tr>
                                    <th className="p-4 text-left text-sm font-semibold text-logip-text-subtle dark:text-dark-text-secondary uppercase tracking-wider">Type</th>
                                    <SortableHeader sortKey="user.name" sortConfig={sortConfig} requestSort={requestSort}>User / Applicant</SortableHeader>
                                    <SortableHeader sortKey="action" sortConfig={sortConfig} requestSort={requestSort}>Activity Details</SortableHeader>
                                    <SortableHeader sortKey="timestamp" sortConfig={sortConfig} requestSort={requestSort}>Date & Time</SortableHeader>
                                </tr>
                            </thead>
                             <tbody>
                                {paginatedLogs.map(log => {
                                    const eventMeta = EVENT_TYPE_MAP[log.eventType] || EVENT_TYPE_MAP.system_settings;
                                    const isStudent = log.user.type === 'student';
                                    return (
                                        <tr key={log.id} className="border-b border-logip-border dark:border-dark-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div className={`inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-bold uppercase rounded-md ${eventMeta.color}`}>
                                                    <span className="material-symbols-outlined text-sm">{eventMeta.icon}</span>
                                                    <span>{eventMeta.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <img src={log.user.avatar || `https://i.pravatar.cc/32?u=${log.user.name}`} alt={log.user.name} className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700" />
                                                        {isStudent && (
                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 border-2 border-white dark:border-dark-surface rounded-full flex items-center justify-center" title="Student Applicant">
                                                                <span className="text-[6px] text-white font-bold">S</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-base text-logip-text-header dark:text-dark-text-primary">{log.user.name}</span>
                                                        <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">{isStudent ? 'Applicant' : 'Administrator'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-base text-logip-text-body dark:text-dark-text-secondary">
                                                <span className="font-medium">{log.action} </span>
                                                {log.details && <span className="font-bold text-logip-text-header dark:text-dark-text-primary border-b border-dashed border-gray-300 dark:border-gray-600 pb-0.5">{log.details}</span>}
                                            </td>
                                            <td className="p-4 text-base text-logip-text-body dark:text-dark-text-secondary whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-20 text-logip-text-subtle">
                        <span className="material-symbols-outlined text-6xl opacity-20">history_toggle_off</span>
                        <p className="mt-4 text-xl font-semibold">No Activity Recorded</p>
                        <p className="text-sm">User actions and page visits will appear here as they occur.</p>
                    </div>
                )}
                <div className="p-4 border-t border-logip-border dark:border-dark-border flex items-center justify-between">
                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={sortedLogs.length}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={setItemsPerPage}
                        startItem={startItem}
                        endItem={endItem}
                    />
                </div>
            </div>

            <ConfirmationModal 
                isOpen={isClearModalOpen}
                onClose={() => setIsClearModalOpen(false)}
                onConfirm={handleClearAll}
                title="Clear Activity Logs"
            >
                Are you sure you want to permanently delete <strong>all activity logs</strong>? This will remove all audit trails from the system, including navigation history and record updates.
            </ConfirmationModal>
        </div>
    );
};

export default LogsPage;
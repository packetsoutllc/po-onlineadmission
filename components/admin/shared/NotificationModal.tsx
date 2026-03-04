import React, { useState, useMemo, useEffect } from 'react';
import AdminModal from './AdminModal';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { mockNotifications, Notification } from './notificationsData';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from './ToastContext';
import { School, Admission } from '../pages/SettingsPage';

const NOTIFICATIONS_STORAGE_KEY = 'admin_notifications';

const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 5) return "Just now";
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} years ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} months ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} days ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;
    return `${Math.floor(seconds)} seconds ago`;
};

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedSchool?: School | null;
    selectedAdmission?: Admission | null;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, selectedSchool, selectedAdmission }) => {
    const { showToast } = useToast();
    const [notifications, setNotifications] = useLocalStorage<Notification[]>(NOTIFICATIONS_STORAGE_KEY, mockNotifications);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
    const [notifToDelete, setNotifToDelete] = useState<Notification | 'all' | null>(null);

    const filteredNotifications = useMemo(() => {
        let items = [...notifications];

        // Filter by specific school and admission context
        if (selectedSchool) {
            items = items.filter(n => !n.schoolId || n.schoolId === selectedSchool.id);
        }
        if (selectedAdmission) {
            items = items.filter(n => !n.admissionId || n.admissionId === selectedAdmission.id);
        }

        if (activeFilter === 'unread') {
            items = items.filter(n => !n.read);
        }
        if (searchTerm) {
            const lowercasedSearch = searchTerm.toLowerCase();
            items = items.filter(n => 
                n.text.toLowerCase().includes(lowercasedSearch) ||
                (n.details || '').toLowerCase().includes(lowercasedSearch) ||
                n.user.name.toLowerCase().includes(lowercasedSearch)
            );
        }
        return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    }, [notifications, activeFilter, searchTerm, selectedSchool, selectedAdmission]);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        showToast('All notifications marked as read.', 'success');
    };
    
    const handleDelete = () => {
        if (!notifToDelete) return;

        if (notifToDelete === 'all') {
            setNotifications([]);
            showToast('All notifications have been cleared.', 'info');
        } else {
            setNotifications(prev => prev.filter(n => n.id !== notifToDelete.id));
        }
        setNotifToDelete(null);
    };

    return (
        <>
            <AdminModal isOpen={isOpen} onClose={onClose} title="Notifications" size="3xl">
                <div className="flex flex-col h-[70vh]">
                    {/* Header with Search and Filters */}
                    <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                        <div className="relative w-full sm:w-auto sm:flex-1 max-sm-sm">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-logip-text-subtle dark:text-dark-text-secondary">search</span>
                            <input
                                type="text"
                                placeholder="Search notifications..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-base text-logip-text-header dark:text-dark-text-primary placeholder-logip-text-subtle dark:placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-logip-primary dark:focus:ring-dark-accent-blue transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-dark-bg rounded-lg">
                            <button onClick={() => setActiveFilter('all')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${activeFilter === 'all' ? 'bg-white dark:bg-dark-surface shadow-sm text-logip-primary dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}>All</button>
                            <button onClick={() => setActiveFilter('unread')} className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${activeFilter === 'unread' ? 'bg-white dark:bg-dark-surface shadow-sm text-logip-primary dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}>Unread</button>
                        </div>
                    </div>
                    {/* Notification List */}
                    <div className="flex-1 overflow-y-auto no-scrollbar -mx-4 px-4">
                        <ul className="-my-2">
                            {filteredNotifications.map(notif => (
                                <li key={notif.id} className="py-2">
                                    <div className={`relative px-4 py-4 rounded-lg transition-colors ${notif.read ? 'hover:bg-gray-50 dark:hover:bg-dark-border/30' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                                        <div className="flex items-start space-x-4">
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white ${notif.color}`}>
                                                <span className="material-symbols-outlined">{notif.icon}</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-logip-text-header dark:text-dark-text-primary truncate">
                                                    {notif.text}
                                                </p>
                                                {notif.details && <p className="text-sm text-logip-text-subtle dark:text-dark-text-secondary">{notif.details}</p>}
                                                <p className="text-xs text-logip-text-subtle dark:text-dark-text-secondary mt-1">
                                                    By {notif.user.name} &middot; {timeSince(notif.time)}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0 self-center flex items-center gap-1">
                                                {!notif.read && (
                                                    <button onClick={() => markAsRead(notif.id)} title="Mark as read" className="p-1.5 rounded-full text-logip-text-subtle hover:bg-gray-100 dark:hover:bg-dark-border">
                                                        <span className="material-symbols-outlined text-base">done</span>
                                                    </button>
                                                )}
                                                <button onClick={() => setNotifToDelete(notif)} title="Delete notification" className="p-1.5 rounded-full text-logip-text-subtle hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400">
                                                    <span className="material-symbols-outlined text-base">delete</span>
                                                </button>
                                                {!notif.read && (
                                                    <div className="h-2 w-2 rounded-full bg-logip-primary" aria-hidden="true" title="Unread"></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                         {filteredNotifications.length === 0 && (
                            <div className="text-center py-20 text-logip-text-subtle">
                                <span className="material-symbols-outlined text-5xl">notifications_off</span>
                                <p className="mt-2 font-medium">No notifications found</p>
                                <p className="text-sm">Try adjusting your search or filters.</p>
                            </div>
                        )}
                    </div>
                    {/* Footer Actions */}
                    <div className="flex-shrink-0 pt-6 flex justify-between items-center">
                        <button onClick={() => setNotifToDelete('all')} className="text-sm font-semibold text-red-600 dark:text-red-400 hover:underline">Clear All Notifications</button>
                        <button onClick={markAllAsRead} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-logip-border dark:border-dark-border text-logip-text-body dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-border">
                            <span className="material-symbols-outlined text-base">drafts</span>
                            Mark all as read
                        </button>
                    </div>
                </div>
            </AdminModal>

            <ConfirmationModal
                isOpen={!!notifToDelete}
                onClose={() => setNotifToDelete(null)}
                onConfirm={handleDelete}
                title={notifToDelete === 'all' ? 'Clear All Notifications' : 'Delete Notification'}
            >
                Are you sure you want to delete {notifToDelete === 'all' ? 'all notifications' : 'this notification'}? This action cannot be undone.
            </ConfirmationModal>
        </>
    );
};

export default NotificationModal;
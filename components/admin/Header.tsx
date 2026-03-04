
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { School, Admission } from './pages/SettingsPage';
import { AdminUser } from './AdminLayout';
import { Role } from './pages/RolesAndPermissionsPage';
import { Notification } from './shared/notificationsData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import NotificationModal from './shared/NotificationModal';

interface HeaderProps {
    adminUser: AdminUser;
    userRole?: Role;
    toggleTheme: () => void;
    isDarkMode: boolean;
    className?: string;
    schools: School[];
    selectedSchool?: School | null;
    setSelectedSchoolId: (id: string | null) => void;
    admissions: Admission[];
    selectedAdmission?: Admission | null;
    setSelectedAdmissionId: (id: string | null) => void;
    setActivePage: (page: string) => void;
    onExitAdmin: () => void;
    onMenuClick: () => void;
}

const LiveClock: React.FC = () => {
    const [liveTime, setLiveTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setLiveTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const { datePart, timePart } = useMemo(() => {
        const dateOptions: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'GMT',
        };
        const timeOptions: Intl.DateTimeFormatOptions = {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'GMT',
            timeZoneName: 'short',
        };
        
        const datePart = new Intl.DateTimeFormat('en-GB', dateOptions).format(liveTime);
        const timePart = new Intl.DateTimeFormat('en-US', timeOptions).format(liveTime);
        
        return { datePart, timePart };

    }, [liveTime]);

    return (
        <div className="hidden md:flex flex-shrink-0 items-center gap-3 bg-logip-white dark:bg-report-dark border border-logip-border dark:border-report-border px-3 py-1.5 rounded-lg">
            <span className="material-symbols-outlined text-xl text-logip-text-subtle">calendar_today</span>
            <div className="text-sm text-logip-text-header dark:text-gray-100 whitespace-nowrap">
                <strong className="font-bold">{datePart}</strong>
                <span className="ml-2 font-medium text-logip-text-body dark:text-gray-400">{timePart}</span>
            </div>
        </div>
    );
};

const SystemStatusIndicator: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const statusConfig = isOnline
        ? { text: 'System is online and running', color: 'green', icon: 'wifi' }
        : { text: 'System is offline', color: 'red', icon: 'wifi_off' };

    return (
        <div className="hidden sm:flex items-center gap-2 bg-logip-border/60 dark:bg-gray-800 px-3 py-1.5 rounded-lg" title={statusConfig.text}>
            <span className={`relative flex h-2.5 w-2.5`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${statusConfig.color}-400 opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 bg-${statusConfig.color}-500`}></span>
            </span>
            <span className={`hidden sm:block text-sm font-medium text-${statusConfig.color}-600 dark:text-${statusConfig.color}-400`}>
                {isOnline ? 'Online' : 'Offline'}
            </span>
        </div>
    );
};

const NotificationDropdown: React.FC<{ 
    onClick: () => void; 
    selectedSchool?: School | null; 
    selectedAdmission?: Admission | null; 
}> = ({ onClick, selectedSchool, selectedAdmission }) => {
    const [notifications] = useLocalStorage<Notification[]>('admin_notifications', []);
    
    const unreadCount = useMemo(() => {
        let items = notifications.filter(n => !n.read);
        if (selectedSchool) {
            items = items.filter(n => !n.schoolId || n.schoolId === selectedSchool.id);
        }
        if (selectedAdmission) {
            items = items.filter(n => !n.admissionId || n.admissionId === selectedAdmission.id);
        }
        return items.length;
    }, [notifications, selectedSchool, selectedAdmission]);

    return (
        <div className="relative">
            <button
                onClick={onClick}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-logip-border dark:border-report-border text-logip-text-body dark:text-gray-400 hover:bg-logip-border/60 dark:hover:bg-gray-800 transition-colors"
                aria-label="Notifications"
            >
                <span className="material-symbols-outlined text-xl">notifications</span>
                 {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                )}
            </button>
        </div>
    );
};


const ProfileDropdown: React.FC<{
    adminUser: AdminUser;
    userRole?: Role;
    setActivePage: (page: string) => void;
    onExitAdmin: () => void;
}> = ({ adminUser, userRole, setActivePage, onExitAdmin }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigate = (page: string) => {
        setActivePage(page);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center gap-3 p-1 rounded-lg hover:bg-logip-border/60 dark:hover:bg-gray-800 transition-colors"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <img src={adminUser.avatar || `https://i.pravatar.cc/32?u=${adminUser.email}`} alt={adminUser.name} className="w-8 h-8 rounded-full object-cover" />
                <div className="hidden lg:flex flex-col text-left">
                    <span className="text-sm font-semibold text-logip-text-header dark:text-gray-100">{adminUser.name}</span>
                    <span className="text-xs text-logip-text-subtle">{userRole?.name || 'User'}</span>
                </div>
                <span className="material-symbols-outlined text-xl text-logip-text-subtle hidden lg:block">{isOpen ? 'expand_less' : 'expand_more'}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-logip-white dark:bg-dark-surface border border-logip-border dark:border-dark-border rounded-lg dark:shadow-lg z-20 animate-scaleIn origin-top-right">
                    <div className="p-2">
                        <button onClick={() => handleNavigate('Settings')} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-base text-logip-text-body dark:text-report-subtle hover:bg-logip-border/60 dark:hover:bg-gray-800/50 transition-colors">
                            <span className="material-symbols-outlined text-xl">settings</span> Settings
                        </button>
                        <div className="my-1 border-t border-logip-border dark:border-report-border"></div>
                        <button onClick={onExitAdmin} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-base text-logip-danger hover:bg-logip-danger-bg transition-colors">
                            <span className="material-symbols-outlined text-xl">logout</span> Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


const Header: React.FC<HeaderProps> = ({
    adminUser,
    userRole,
    toggleTheme,
    isDarkMode,
    className,
    schools,
    selectedSchool,
    setSelectedSchoolId,
    admissions,
    selectedAdmission,
    setSelectedAdmissionId,
    setActivePage,
    onExitAdmin,
    onMenuClick
}) => {
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

    return (
        <>
            <header className={`flex justify-between items-center p-3 flex-shrink-0 border-b border-logip-border dark:border-report-border bg-logip-white dark:bg-report-dark ${className}`}>
                <div className="flex items-center gap-3 min-w-0">
                     <button onClick={onMenuClick} className="p-2 rounded-full lg:hidden text-logip-text-body dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    {selectedSchool && (
                        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/40">
                            {selectedSchool.logo ? (
                                <img src={selectedSchool.logo} alt={selectedSchool.name} className="w-full h-full object-contain p-1 rounded-lg" />
                            ) : (
                                <span className="material-symbols-outlined text-xl text-purple-600 dark:text-purple-300">school</span>
                            )}
                        </div>
                    )}
                    <div className="flex items-center gap-3 min-w-0">
                        <h1 className="text-lg md:text-xl font-bold text-logip-text-header dark:text-gray-100 truncate">{selectedSchool?.name || 'No School Selected'}</h1>
                        {selectedAdmission && (
                            <>
                                <span className="text-xl font-light text-gray-300 dark:text-gray-600 hidden sm:block">|</span>
                                <p className="text-base text-logip-text-subtle dark:text-gray-400 truncate hidden sm:block">{selectedAdmission.title}</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <LiveClock />
                    <SystemStatusIndicator />
                    <NotificationDropdown 
                        onClick={() => setIsNotificationModalOpen(true)} 
                        selectedSchool={selectedSchool}
                        selectedAdmission={selectedAdmission}
                    />
                    <button
                        onClick={toggleTheme}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-logip-border dark:border-report-border text-logip-text-body dark:text-gray-400 hover:bg-logip-border/60 dark:hover:bg-gray-800"
                        aria-label="Toggle theme"
                        title="Toggle theme"
                    >
                        <span className="material-symbols-outlined text-xl">
                            {isDarkMode ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>
                    <div className="w-px h-6 bg-logip-border dark:border-report-border mx-2 hidden sm:block"></div>
                    <ProfileDropdown adminUser={adminUser} userRole={userRole} setActivePage={setActivePage} onExitAdmin={onExitAdmin} />
                </div>
            </header>

            <NotificationModal 
                isOpen={isNotificationModalOpen}
                onClose={() => setIsNotificationModalOpen(false)}
                selectedSchool={selectedSchool}
                selectedAdmission={selectedAdmission}
            />
        </>
    );
};

export default Header;

import React, { useMemo } from 'react';
import { Conversation } from './pages/MessagesPage';
import Icon from './shared/Icons';
import PacketsOutLogo from '../PacketsOutLogo';

interface NavItemProps {
    icon: string;
    label: string;
    active?: boolean;
    onClick?: () => void;
    notificationCount?: number;
    color?: string;
}

const LogipLogo: React.FC = () => (
    <PacketsOutLogo
        size="md"
        className="text-logip-text-header dark:text-gray-100"
        textClassName="text-2xl"
    />
);

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, notificationCount, color }) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-base transition-colors text-left ${active ? 'bg-logip-border dark:bg-gray-800 font-bold text-logip-text-header dark:text-gray-100' : 'text-logip-text-body dark:text-report-subtle hover:bg-logip-border/60 dark:hover:bg-gray-800/50'}`}>
        <div className="flex items-center gap-3">
            <Icon name={icon} className={`w-5 h-5 ${!active ? color : ''}`} />
            <span>{label}</span>
        </div>
        {typeof notificationCount === 'number' && notificationCount > 0 ? (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                {notificationCount}
            </span>
        ) : null}
    </button>
);

interface SidebarProps {
    activePage: string;
    setActivePage: (page: string) => void;
    onExitAdmin: () => void;
    permissions: Set<string>;
    conversations: Conversation[];
    isOpen: boolean;
    isSuperAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, onExitAdmin, permissions, conversations, isOpen, isSuperAdmin }) => {
    const unreadMessagesCount = useMemo(() => conversations.filter(c => c.status === 'unread').length, [conversations]);

    const items = [
        { id: 'Dashboard', icon: 'home', label: 'Dashboard', perm: 'page:dashboard', color: 'text-blue-500' },
        { id: 'Students', icon: 'school', label: 'Students', perm: 'page:students', color: 'text-blue-500' },
        { id: 'Transactions', icon: 'payments', label: 'Transactions', perm: 'page:transactions', color: 'text-emerald-500' },
        { id: 'Messages', icon: 'chat', label: 'Messages', perm: 'page:messages', color: 'text-sky-500' },
        { id: 'Programmes', icon: 'category', label: 'Programmes', perm: 'page:programmes', color: 'text-pink-500' },
        { id: 'Classes', icon: 'class', label: 'Classes', perm: 'page:classes', color: 'text-amber-500' },
        { id: 'Houses', icon: 'house', label: 'Houses', perm: 'page:houses', color: 'text-teal-500' },
        { id: 'Logs', icon: 'receipt_long', label: 'Activity Logs', perm: 'page:logs', color: 'text-slate-500' },
        { id: 'Roles and Permissions', icon: 'admin_panel_settings', label: 'Roles & Permissions', perm: 'page:roles', color: 'text-red-500' },
        { id: 'Users', icon: 'manage_accounts', label: 'Users', perm: 'page:users', color: 'text-indigo-500' },
        { id: 'Settings', icon: 'settings', label: 'Settings', perm: 'page:settings', color: 'text-gray-500' },
    ];

    const visibleItems = items.filter(i => isSuperAdmin || permissions.has(i.perm));

    return (
        <aside className={`fixed top-0 left-0 h-full z-50 w-80 bg-logip-white dark:bg-report-dark flex-shrink-0 p-6 flex flex-col justify-between border-r border-logip-border dark:border-report-border transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'}`}>
            <div>
                <div className="mb-10"><LogipLogo /></div>
                <nav className="space-y-0.5">
                    {visibleItems.map(item => (
                        <NavItem 
                            key={item.id} 
                            icon={item.icon} 
                            label={item.label} 
                            color={item.color} 
                            active={activePage === item.id} 
                            onClick={() => setActivePage(item.id)} 
                        />
                    ))}
                </nav>
            </div>
            <div className="w-full px-3">
                <button onClick={onExitAdmin} className="w-full flex items-center gap-3 pl-0 pr-0 py-2 rounded-lg hover:bg-logip-danger-bg text-logip-danger font-medium transition-colors text-left">
                    <Icon name="power_settings_new" className="w-5 h-5 flex-shrink-0" />
                    <span>Log out</span>
                </button>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 flex items-center gap-1 text-left justify-start pl-0">
                    Powered by:
                    <PacketsOutLogo size="sm" className="ml-1 text-gray-600 dark:text-gray-200" />
                </p>
            </div>
        </aside>
    );
};

export default Sidebar;

import React, { useState, useMemo, useEffect } from 'react';
import AdminModal from '../shared/AdminModal';
import ConfirmationModal from '../shared/ConfirmationModal';
import { AdminInput, AdminTextarea, AdminCheckbox } from '../shared/forms';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../shared/ToastContext';

export type PermissionCategory = 'pages' | 'tabs' | 'sections' | 'buttons' | 'icons';

interface Permission {
    id: string;
    name: string;
    description: string;
    category: PermissionCategory;
    resource: string;
    parentId?: string;
}

export interface Role {
    id: string;
    name: string;
    description: string;
    permissionIds: string[];
}

const formatRoleName = (name: string) => {
    if (!name) return "";
    return name.charAt(0).toUpperCase() + name.slice(1);
};

const CategoryTab: React.FC<{ id: string; label: string; icon: string; active: boolean; onClick: () => void; count: number }> = ({ label, icon, active, onClick, count }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            active 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-logip-text-body dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-border/50'
        }`}
    >
        <span className="material-symbols-outlined text-xl">{icon}</span>
        <span>{label}</span>
        <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${active ? 'bg-white/20' : 'bg-gray-100 dark:bg-dark-border'}`}>
            {count}
        </span>
    </button>
);

const ALL_PERMISSIONS_LIST: Permission[] = [
    // --- PAGES ---
    { id: 'page:dashboard', name: 'Dashboard Page', description: 'Main overview', category: 'pages', resource: 'Dashboard' },
    { id: 'page:students', name: 'Students Page', description: 'Student records', category: 'pages', resource: 'Students' },
    { id: 'page:transactions', name: 'Transactions Page', description: 'Finance module', category: 'pages', resource: 'Transactions' },
    { id: 'page:messages', name: 'Messages Page', description: 'Inbox and support module', category: 'pages', resource: 'Messages' },
    { id: 'page:programmes', name: 'Programmes Page', description: 'Academic streams', category: 'pages', resource: 'Programmes' },
    { id: 'page:classes', name: 'Classes Page', description: 'Class management', category: 'pages', resource: 'Classes' },
    { id: 'page:houses', name: 'Houses Page', description: 'Residential management', category: 'pages', resource: 'Houses' },
    { id: 'page:users', name: 'Users Page', description: 'User account management', category: 'pages', resource: 'Users' },
    { id: 'page:settings', name: 'Settings Page', description: 'Portal configuration and profile', category: 'pages', resource: 'Settings' },

    // --- TABS ---
    { id: 'tab:set:setup', name: 'Setup Tab', description: 'School & Admission Group mapping', category: 'tabs', resource: 'Settings', parentId: 'page:settings' },
    { id: 'tab:set:sms', name: 'SMS Tab', description: 'SMS Templates and Gateway', category: 'tabs', resource: 'Settings', parentId: 'page:settings' },
    { id: 'tab:set:fin', name: 'Financials Tab', description: 'Voucher price and Gateway', category: 'tabs', resource: 'Settings', parentId: 'page:settings' },
    { id: 'tab:set:doc', name: 'Admission Doc Tab', description: 'Template management', category: 'tabs', resource: 'Settings', parentId: 'page:settings' },
    { id: 'tab:set:ai', name: 'AI Features Tab', description: 'Gemini system settings', category: 'tabs', resource: 'Settings', parentId: 'page:settings' },
    { id: 'tab:set:bak', name: 'Backup Tab', description: 'Cloud & Local restoration', category: 'tabs', resource: 'Settings', parentId: 'page:settings' },
    { id: 'tab:set:sec', name: 'Security Tab', description: 'Policy & Monitoring', category: 'tabs', resource: 'Settings', parentId: 'page:settings' },
    { id: 'tab:set:prof', name: 'User Profile Tab', description: 'Account settings', category: 'tabs', resource: 'Settings', parentId: 'page:settings' },

    // --- SECTIONS ---
    { id: 'sec:set:setup', name: 'School & Admission Setup', description: 'Primary configuration', category: 'sections', resource: 'Settings', parentId: 'tab:set:setup' },
    { id: 'sec:set:app_dash', name: 'Application Dashboard Settings', description: 'Field visibility rules', category: 'sections', resource: 'Settings', parentId: 'tab:set:setup' },
    { id: 'sec:set:sms_notif', name: 'Automated SMS Notifications', description: 'Auto-triggered templates', category: 'sections', resource: 'Settings', parentId: 'tab:set:sms' },
    { id: 'sec:set:sms_gate', name: 'SMS Gateway Configuration', description: 'Provider API settings', category: 'sections', resource: 'Settings', parentId: 'tab:set:sms' },
    { id: 'sec:set:sms_compose', name: 'Compose SMS Message', description: 'Manual bulk sending', category: 'sections', resource: 'Settings', parentId: 'tab:set:sms' },
    { id: 'sec:set:pay_policy', name: 'Payment Policy & Pricing', description: 'Set voucher rates', category: 'sections', resource: 'Settings', parentId: 'tab:set:fin' },
    { id: 'sec:set:pay_gate', name: 'Payment Gateway Configuration', description: 'Payment provider keys', category: 'sections', resource: 'Settings', parentId: 'tab:set:fin' },
    { id: 'sec:set:adm_docs', name: 'Admission Document Templates', description: 'Letter and prospectus files', category: 'sections', resource: 'Settings', parentId: 'tab:set:doc' },
    { id: 'sec:set:ai_chat', name: 'AI Support Chat', description: 'Chatbot behavior', category: 'sections', resource: 'Settings', parentId: 'tab:set:ai' },
    { id: 'sec:set:ai_uniform', name: 'AI Uniform Generation', description: 'Passport photo processing', category: 'sections', resource: 'Settings', parentId: 'tab:set:ai' },
    { id: 'sec:set:ai_watchdog', name: 'AI Watchdog', description: 'Fraud detection', category: 'sections', resource: 'Settings', parentId: 'tab:set:ai' },
    { id: 'sec:set:bak_hist', name: 'Backup History', description: 'Snapshots management', category: 'sections', resource: 'Settings', parentId: 'tab:set:bak' },
    { id: 'sec:set:glob_sec', name: 'Global Admin Security', description: '2FA and Password rules', category: 'sections', resource: 'Settings', parentId: 'tab:set:sec' },
    { id: 'sec:set:adm_portal', name: 'Admission Portal Configuration', description: 'Approval rules', category: 'sections', resource: 'Settings', parentId: 'tab:set:sec' },
    { id: 'sec:set:house_dorm', name: 'Housing & Dormitory Settings', description: 'Allocation logic', category: 'sections', resource: 'Settings', parentId: 'tab:set:sec' },
    { id: 'sec:set:notif_sys', name: 'Notification System', description: 'Banner management', category: 'sections', resource: 'Settings', parentId: 'tab:set:sec' },
    { id: 'sec:set:cred_gen', name: 'Credential Generation Policy', description: 'Serial/PIN formats', category: 'sections', resource: 'Settings', parentId: 'tab:set:sec' },
    { id: 'sec:set:cyber_mon', name: 'Cyber Security Monitor', description: 'Access audit trail', category: 'sections', resource: 'Settings', parentId: 'tab:set:sec' },
    { id: 'sec:set:browsing_mon', name: 'Browsing Monitor', description: 'Visitor IP tracking', category: 'sections', resource: 'Settings', parentId: 'tab:set:sec' },

    // --- BUTTONS ---
    { id: 'btn:std:add', name: 'Add Student', description: 'Manual registration', category: 'buttons', resource: 'Students', parentId: 'page:students' },
    // Nested Button Permissions
    { id: 'field:add_std:official', name: 'Official Records Area', description: 'Show pre-filled placement records', category: 'buttons', resource: 'Students', parentId: 'btn:std:add' },
    { id: 'field:std:edit_official', name: 'Edit Official Records', description: 'Allow editing pre-filled placement data', category: 'buttons', resource: 'Students', parentId: 'btn:std:add' },
    { id: 'field:add_std:assignments', name: 'School Assignments Area', description: 'Show Class/House/Dorm allocation', category: 'buttons', resource: 'Students', parentId: 'btn:std:add' },
    { id: 'field:add_std:status', name: 'Admission Status Field', description: 'Show status dropdown', category: 'buttons', resource: 'Students', parentId: 'btn:std:add' },
    { id: 'field:add_std:phone', name: 'Phone Number Field', description: 'Show student contact field', category: 'buttons', resource: 'Students', parentId: 'btn:std:add' },
    
    { id: 'btn:std:bulk_ul', name: 'Bulk Upload', description: 'CSV Import', category: 'buttons', resource: 'Students', parentId: 'page:students' },
    { id: 'btn:std:bulk_dl', name: 'Bulk Download', description: 'CSV Export', category: 'buttons', resource: 'Students', parentId: 'page:students' },
    { id: 'btn:std:print', name: 'Print Student Table', description: 'Printable list', category: 'buttons', resource: 'Students', parentId: 'page:students' },
    { id: 'btn:std:cols', name: 'Column Selection', description: 'Toggle columns', category: 'buttons', resource: 'Students', parentId: 'page:students' },
    { id: 'btn:std:filters', name: 'Filters Menu', description: 'Advanced search', category: 'buttons', resource: 'Students', parentId: 'page:students' },
    { id: 'btn:std:dash', name: 'Toggle Stats Dashboard', description: 'Show/Hide stats', category: 'buttons', resource: 'Students', parentId: 'page:students' },
    { id: 'btn:std:bulk_del', name: 'Bulk Delete', description: 'Remove multiple', category: 'buttons', resource: 'Students', parentId: 'page:students' },
    { id: 'btn:tx:print', name: 'Print Transactions', description: 'Print receipts', category: 'buttons', resource: 'Transactions', parentId: 'page:transactions' },
    { id: 'btn:tx:dash', name: 'Toggle Revenue Stats', description: 'Financial charts', category: 'buttons', resource: 'Transactions', parentId: 'page:transactions' },
    { id: 'btn:prog:add', name: 'Add Programme', description: 'New academic stream', category: 'buttons', resource: 'Programmes', parentId: 'page:programmes' },
    { id: 'btn:cls:add', name: 'Add Class', description: 'New class group', category: 'buttons', resource: 'Classes', parentId: 'page:classes' },
    { id: 'btn:cls:subjects', name: 'Assign Subjects', description: 'Class subject mapping', category: 'buttons', resource: 'Classes', parentId: 'page:classes' },
    { id: 'btn:house:add', name: 'Add House', description: 'New dormitory hall', category: 'buttons', resource: 'Houses', parentId: 'page:houses' },
    { id: 'btn:house:allocate', name: 'Manual Allocation', description: 'Manual assigning tool', category: 'buttons', resource: 'Houses', parentId: 'page:houses' },
    { id: 'btn:user:add', name: 'Add User', description: 'Create admin account', category: 'buttons', resource: 'Users', parentId: 'page:users' },
    { id: 'btn:role:add', name: 'New Role', description: 'Define security profile', category: 'buttons', resource: 'Roles', parentId: 'page:roles' },

    // --- ICONS ---
    { id: 'icon:std:album', name: 'Photo Album', description: 'Student portraits', category: 'icons', resource: 'Students', parentId: 'page:students' },
    { id: 'icon:std:preview', name: 'Preview', description: 'Full application view', category: 'icons', resource: 'Students', parentId: 'page:students' },
    { id: 'icon:std:edit', name: 'Edit', description: 'Modify record', category: 'icons', resource: 'Students', parentId: 'page:students' },
    { id: 'icon:std:delete', name: 'Delete', description: 'Remove record', category: 'icons', resource: 'Students', parentId: 'page:students' },
    { id: 'icon:tx:edit', name: 'Edit Transaction', description: 'Modify payment', category: 'icons', resource: 'Transactions', parentId: 'page:transactions' },
    { id: 'icon:tx:regen', name: 'Regenerate', description: 'New Serial/PIN', category: 'icons', resource: 'Transactions', parentId: 'page:transactions' },
    { id: 'icon:tx:delete', name: 'Delete Transaction', description: 'Void payment', category: 'icons', resource: 'Transactions', parentId: 'page:transactions' },
    { id: 'icon:prog:edit', name: 'Edit Programme', description: 'Update course', category: 'icons', resource: 'Programmes', parentId: 'page:programmes' },
    { id: 'icon:prog:delete', name: 'Delete Programme', description: 'Remove course', category: 'icons', resource: 'Programmes', parentId: 'page:programmes' },
    { id: 'icon:cls:edit', name: 'Edit Class', description: 'Update class', category: 'icons', resource: 'Classes', parentId: 'page:classes' },
    { id: 'icon:cls:delete', name: 'Delete Class', description: 'Remove class', category: 'icons', resource: 'Classes', parentId: 'page:classes' },
    { id: 'icon:house:edit', name: 'Edit House', description: 'Update hall', category: 'icons', resource: 'Houses', parentId: 'page:houses' },
    { id: 'icon:house:delete', name: 'Delete House', description: 'Remove hall', category: 'icons', resource: 'Houses', parentId: 'page:houses' },
    { id: 'icon:user:edit', name: 'Edit User', description: 'Staff details', category: 'icons', resource: 'Users', parentId: 'page:users' },
    { id: 'icon:user:lock', name: 'Suspend/Activate', description: 'Staff login toggle', category: 'icons', resource: 'Users', parentId: 'page:users' },
    { id: 'icon:user:reset', name: 'Reset Password', description: 'Password recovery', category: 'icons', resource: 'Users', parentId: 'page:users' },
    { id: 'icon:role:edit', name: 'Edit Role', description: 'Update role info', category: 'icons', resource: 'Roles', parentId: 'page:roles' },
    { id: 'icon:role:delete', name: 'Delete Role', description: 'Delete role profile', category: 'icons', resource: 'Roles', parentId: 'page:roles' },
];

export const INITIAL_ROLES: Role[] = [
    {
        id: 'role_super_admin',
        name: 'Super Administrator',
        description: 'Unrestricted access to all system features.',
        permissionIds: ALL_PERMISSIONS_LIST.map(p => p.id),
    },
    {
        id: 'role_admission_officer',
        name: 'Admission Officer',
        description: 'Viewing access for records. Restricted from bulk, print, and destructive actions.',
        permissionIds: [
            ...ALL_PERMISSIONS_LIST.filter(p => {
                const isAction = ['add', 'edit', 'delete', 'bulk', 'print', 'regen', 'archive', 'lock', 'reset', 'clear', 'subjects', 'allocate', 'save'].some(t => p.id.includes(t));
                return !isAction;
            }).map(p => p.id),
            'page:settings',
            'tab:set:setup'
        ],
    },
];

interface RolesAndPermissionsPageProps {
    permissions: Set<string>;
    isSuperAdmin: boolean;
}

const RolesAndPermissionsPage: React.FC<RolesAndPermissionsPageProps> = ({ permissions, isSuperAdmin }) => {
    const { showToast } = useToast();
    const [roles, setRoles] = useLocalStorage<Role[]>('admin_roles', INITIAL_ROLES, (value: any) => {
        if (Array.isArray(value)) {
            return value.map(role => ({
                ...role,
                permissionIds: Array.isArray(role.permissionIds) ? role.permissionIds : []
            }));
        }
        return value;
    });

    const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || '');
    const [modalState, setModalState] = useState<{ mode: 'add' | 'edit' | 'delete' | null; role: Role | null }>({ mode: null, role: null });
    const [activeCategory, setActiveCategory] = useState<PermissionCategory>('pages');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedPermissionIds, setExpandedPermissionIds] = useState<Set<string>>(new Set());

    const activeRole = useMemo(() => roles.find(r => r.id === selectedRoleId), [roles, selectedRoleId]);
    const activePermissionIds = useMemo(() => new Set(activeRole?.permissionIds || []), [activeRole]);

    const filteredPermissions = useMemo(() => {
        return ALL_PERMISSIONS_LIST.filter(p => {
            // Only show root-level permissions for the current category in the main list,
            // unless we're searching.
            if (!searchTerm && p.parentId && ALL_PERMISSIONS_LIST.find(parent => parent.id === p.parentId && parent.category === activeCategory)) {
                return false;
            }

            if (p.category !== activeCategory) return false;
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 p.resource.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [activeCategory, searchTerm]);

    const handleTogglePermission = (permissionId: string) => {
        if (!activeRole || activeRole.id === 'role_super_admin') return;

        setRoles(prev => prev.map(r => {
            if (r.id === selectedRoleId) {
                const newIds = new Set(r.permissionIds);
                if (newIds.has(permissionId)) {
                    newIds.delete(permissionId);
                    // Cascade uncheck
                    const uncheckChildren = (pid: string) => {
                        ALL_PERMISSIONS_LIST.filter(child => child.parentId === pid).forEach(child => {
                            newIds.delete(child.id);
                            uncheckChildren(child.id);
                        });
                    };
                    uncheckChildren(permissionId);
                } else {
                    newIds.add(permissionId);
                    // Auto-check parent chain for visibility logic
                    const checkParent = (pid: string) => {
                        const parent = ALL_PERMISSIONS_LIST.find(p => p.id === pid);
                        if (parent && parent.parentId) {
                            newIds.add(parent.parentId);
                            checkParent(parent.parentId);
                        }
                    };
                    const target = ALL_PERMISSIONS_LIST.find(p => p.id === permissionId);
                    if (target?.parentId) {
                        newIds.add(target.parentId);
                        checkParent(target.parentId);
                    }
                }
                return { ...r, permissionIds: Array.from(newIds) };
            }
            return r;
        }));
    };

    const handleToggleCategory = (category: PermissionCategory, enabled: boolean) => {
        if (!activeRole || activeRole.id === 'role_super_admin') return;
        setRoles(prev => prev.map(r => {
            if (r.id === selectedRoleId) {
                const newIds = new Set(r.permissionIds);
                ALL_PERMISSIONS_LIST.filter(p => p.category === category).forEach(p => {
                    if (enabled) newIds.add(p.id);
                    else newIds.delete(p.id);
                });
                return { ...r, permissionIds: Array.from(newIds) };
            }
            return r;
        }));
    };

    const handleSaveRoleMeta = (name: string, description: string) => {
        setRoles(prev => prev.map(r => 
            r.id === selectedRoleId ? { ...r, name: formatRoleName(name), description } : r
        ));
    };

    const handleCreateRole = (data: { id?: string; name: string; description: string; permissions?: { view: boolean; add: boolean; edit: boolean; delete: boolean } }) => {
        const calculatePermissionIds = (perms: { view: boolean; add: boolean; edit: boolean; delete: boolean }) => {
            const initialPerms = new Set<string>();
            
            const anyChecked = perms.view || perms.add || perms.edit || perms.delete;
            if (!anyChecked) return [];

            // 1. Navigation baseline: Give access to all navigation containers if any action is enabled
            ALL_PERMISSIONS_LIST.forEach(p => {
                if (p.category === 'pages' || p.category === 'tabs' || p.category === 'sections') {
                    initialPerms.add(p.id);
                }
            });

            // Keywords for strict action mapping
            const VIEW_K = ['cols', 'filters', 'album', 'preview', 'expand', 'print', 'dash'];
            const ADD_K = ['add', 'bulk_ul', 'generate', 'create'];
            const EDIT_K = ['edit', 'config', 'save', 'update', 'reset', 'lock', 'subjects', 'allocate', 'archive', 'unarchive'];
            const DELETE_K = ['delete', 'remove', 'trash', 'clear'];

            if (perms.view) {
                ALL_PERMISSIONS_LIST.forEach(p => { if (VIEW_K.some(k => p.id.includes(k))) initialPerms.add(p.id); });
            }
            if (perms.add) {
                ALL_PERMISSIONS_LIST.forEach(p => { if (ADD_K.some(k => p.id.includes(k))) initialPerms.add(p.id); });
            }
            if (perms.edit) {
                ALL_PERMISSIONS_LIST.forEach(p => { if (EDIT_K.some(k => p.id.includes(k))) initialPerms.add(p.id); });
            }
            if (perms.delete) {
                ALL_PERMISSIONS_LIST.forEach(p => { if (DELETE_K.some(k => p.id.includes(k))) initialPerms.add(p.id); });
            }

            return Array.from(initialPerms);
        };

        if (modalState.mode === 'edit' && data.id) {
            setRoles(prev => prev.map(r => {
                if (r.id === data.id) {
                    const updatedRole = { ...r, name: formatRoleName(data.name), description: data.description };
                    if (data.permissions) {
                        updatedRole.permissionIds = calculatePermissionIds(data.permissions);
                    }
                    return updatedRole;
                }
                return r;
            }));
            showToast(`Role "${data.name}" updated.`, 'success');
            setModalState({ mode: null, role: null });
            return;
        }

        const initialPermissionIds = data.permissions ? calculatePermissionIds(data.permissions) : [];

        const newRole: Role = {
            id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: formatRoleName(data.name),
            description: data.description,
            permissionIds: initialPermissionIds
        };
        
        setRoles(prev => [...prev, newRole]);
        setSelectedRoleId(newRole.id);
        showToast(`Role "${newRole.name}" created.`, 'success');
        setModalState({ mode: null, role: null });
    };

    const handleDeleteRole = () => {
        if (!activeRole) return;
        const remaining = roles.filter(r => r.id !== activeRole.id);
        setRoles(remaining);
        setSelectedRoleId(remaining[0]?.id || '');
        showToast(`Role deleted.`, 'info');
        setModalState({ mode: null, role: null });
    };

    const toggleExpand = (e: React.MouseEvent, permissionId: string) => {
        e.stopPropagation();
        setExpandedPermissionIds(prev => {
            const next = new Set(prev);
            if (next.has(permissionId)) next.delete(permissionId);
            else next.add(permissionId);
            return next;
        });
    };

    const canAddRole = isSuperAdmin || permissions.has('btn:role:add');
    const canEditRole = isSuperAdmin || permissions.has('icon:role:edit');
    const canDeleteRole = isSuperAdmin || permissions.has('icon:role:delete');

    const renderPermissionCard = (perm: Permission, isNested: boolean = false) => {
        const isChecked = activePermissionIds.has(perm.id);
        const isSuper = activeRole?.id === 'role_super_admin' || !canEditRole;
        const children = ALL_PERMISSIONS_LIST.filter(p => p.parentId === perm.id);
        const hasChildren = children.length > 0;
        const isExpanded = expandedPermissionIds.has(perm.id);

        return (
            <div key={perm.id} className={`${isNested ? 'ml-4 mt-2' : ''}`}>
                <div 
                    onClick={() => handleTogglePermission(perm.id)}
                    className={`group relative p-4 rounded-xl border-2 transition-all select-none ${
                        isChecked
                            ? 'bg-white dark:bg-dark-surface border-emerald-500 shadow-md'
                            : 'bg-white dark:bg-dark-surface border-transparent hover:border-emerald-200 opacity-70'
                    } ${isSuper ? 'cursor-default' : 'cursor-pointer'}`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold uppercase text-emerald-600 tracking-widest">{perm.resource}</span>
                                {hasChildren && (
                                    <button 
                                        onClick={(e) => toggleExpand(e, perm.id)}
                                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center"
                                    >
                                        <span className={`material-symbols-outlined text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                            keyboard_arrow_down
                                        </span>
                                    </button>
                                )}
                            </div>
                            <p className="font-bold text-sm text-logip-text-header dark:text-dark-text-primary mt-1">{perm.name}</p>
                            <p className="text-[11px] text-logip-text-subtle dark:text-dark-text-secondary mt-1">{perm.description}</p>
                        </div>
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isChecked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300'
                        }`}>
                            {isChecked && <span className="material-symbols-outlined text-[14px]">done</span>}
                        </div>
                    </div>
                </div>
                {isExpanded && hasChildren && (
                    <div className="grid grid-cols-1 gap-2 border-l-2 border-emerald-100 dark:border-emerald-900/30 ml-2 pl-2">
                        {children.map(child => renderPermissionCard(child, true))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col gap-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-logip-text-header dark:text-dark-text-primary">Roles & Permissions</h2>
                    <p className="text-logip-text-subtle dark:text-dark-text-secondary mt-1">Configure access for Admission Officers and Admins.</p>
                </div>
                {canAddRole && (
                    <button 
                        onClick={() => setModalState({ mode: 'add', role: null })}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-base bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-all shadow-md transform active:scale-95"
                    >
                        <span className="material-symbols-outlined">add</span>
                        New Role
                    </button>
                )}
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col bg-white dark:bg-dark-surface rounded-xl border border-logip-border dark:border-dark-border overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-logip-border dark:border-dark-border bg-gray-50 dark:bg-white/5">
                        <h3 className="font-bold text-logip-text-header dark:text-dark-text-primary uppercase tracking-wider text-xs">Security Profiles</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
                        {roles.map(role => (
                            <div
                                key={role.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedRoleId(role.id)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedRoleId(role.id); } }}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all cursor-pointer ${
                                    selectedRoleId === role.id 
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-100 dark:ring-emerald-800/30' 
                                        : 'hover:bg-gray-50 dark:hover:bg-dark-border text-logip-text-body dark:text-dark-text-secondary'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${selectedRoleId === role.id ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                    <span className="font-semibold text-sm">{role.name}</span>
                                </div>
                                {role.id !== 'role_super_admin' && selectedRoleId === role.id && (
                                    <div className="flex items-center gap-1">
                                        {canEditRole && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setModalState({ mode: 'edit', role }); }}
                                                className="material-symbols-outlined text-lg text-logip-primary hover:text-logip-primary-hover p-1 hover:bg-logip-primary/10 rounded-full transition-colors"
                                                title="Edit Role metadata"
                                            >
                                                edit
                                            </button>
                                        )}
                                        {canDeleteRole && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setModalState({ mode: 'delete', role }); }}
                                                className="material-symbols-outlined text-lg text-red-500 hover:text-red-700 p-1 hover:bg-red-900/20 rounded-full transition-colors"
                                            >
                                                delete
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>

                <main className="flex-1 flex flex-col bg-white dark:bg-dark-surface rounded-xl border border-logip-border dark:border-dark-border shadow-sm overflow-hidden">
                    {activeRole ? (
                        <>
                            <div className="p-6 border-b border-logip-border dark:border-dark-border bg-gray-50 dark:bg-white/5">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <input 
                                            value={activeRole.name}
                                            disabled={activeRole.id === 'role_super_admin' || !canEditRole}
                                            onChange={(e) => handleSaveRoleMeta(e.target.value, activeRole.description)}
                                            className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary bg-transparent border-none focus:ring-0 w-full p-0 disabled:opacity-80"
                                            placeholder="Role name..."
                                        />
                                        <textarea 
                                            value={activeRole.description}
                                            disabled={activeRole.id === 'role_super_admin' || !canEditRole}
                                            onChange={(e) => handleSaveRoleMeta(activeRole.name, e.target.value)}
                                            className="mt-1 text-sm text-logip-text-subtle dark:text-dark-text-secondary bg-transparent border-none focus:ring-0 w-full p-0 resize-none h-12 no-scrollbar disabled:opacity-80"
                                            placeholder="Role scope description..."
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-sm font-bold text-logip-text-header dark:text-dark-text-primary">
                                                {activePermissionIds.size}
                                            </p>
                                            <p className="text-[10px] uppercase font-bold text-logip-text-subtle">Privileges Granted</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500 dark:bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                                            <span className="material-symbols-outlined text-3xl">shield</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-b border-logip-border dark:border-dark-border bg-white dark:bg-dark-surface flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
                                <div className="flex items-center gap-2">
                                    <CategoryTab id="pages" label="Pages" icon="auto_stories" active={activeCategory === 'pages'} onClick={() => setActiveCategory('pages')} count={ALL_PERMISSIONS_LIST.filter(p => p.category === 'pages' && !p.parentId).length} />
                                    <CategoryTab id="tabs" label="Tabs" icon="tab" active={activeCategory === 'tabs'} onClick={() => setActiveCategory('tabs')} count={ALL_PERMISSIONS_LIST.filter(p => p.category === 'tabs' && !p.parentId).length} />
                                    <CategoryTab id="sections" label="Sections" icon="view_quilt" active={activeCategory === 'sections'} onClick={() => setActiveCategory('sections')} count={ALL_PERMISSIONS_LIST.filter(p => p.category === 'sections' && !p.parentId).length} />
                                    <CategoryTab id="buttons" label="Buttons" icon="buttons_alt" active={activeCategory === 'buttons'} onClick={() => setActiveCategory('buttons')} count={ALL_PERMISSIONS_LIST.filter(p => p.category === 'buttons' && !p.parentId).length} />
                                    <CategoryTab id="icons" label="Icons" icon="token" active={activeCategory === 'icons'} onClick={() => setActiveCategory('icons')} count={ALL_PERMISSIONS_LIST.filter(p => p.category === 'icons' && !p.parentId).length} />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-black/10 no-scrollbar">
                                <div className="mb-6 flex items-center justify-between">
                                    <h4 className="font-bold text-logip-text-header dark:text-dark-text-primary flex items-center gap-2">
                                        {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Permissions
                                    </h4>
                                    {activeRole.id !== 'role_super_admin' && canEditRole && (
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => handleToggleCategory(activeCategory, true)} className="text-xs font-bold text-emerald-600 hover:underline">Enable All</button>
                                            <button onClick={() => handleToggleCategory(activeCategory, false)} className="text-xs font-bold text-red-500 hover:underline">Disable All</button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {filteredPermissions.map(perm => renderPermissionCard(perm))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-logip-text-subtle">
                            <span className="material-symbols-outlined text-6xl opacity-30">admin_panel_settings</span>
                            <h3 className="mt-4 text-xl font-bold">Select Role to Manage Access</h3>
                        </div>
                    )}
                </main>
            </div>

            {(modalState.mode === 'add' || modalState.mode === 'edit') && (
                <RoleFormModal 
                    isOpen={true} 
                    onClose={() => setModalState({ mode: null, role: null })} 
                    onSave={handleCreateRole} 
                    role={modalState.role} 
                    mode={modalState.mode} 
                />
            )}

            {modalState.mode === 'delete' && (
                <ConfirmationModal isOpen={true} onClose={() => setModalState({ mode: null, role: null })} onConfirm={handleDeleteRole} title="Delete Role">
                    Delete <strong>{modalState.role?.name}</strong>?
                </ConfirmationModal>
            )}
        </div>
    );
};

const RoleFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { id?: string; name: string; description: string; permissions?: { view: boolean; add: boolean; edit: boolean; delete: boolean } }) => void;
    role: Role | null;
    mode: 'add' | 'edit';
}> = ({ isOpen, onClose, onSave, role, mode }) => {
    const [name, setName] = useState(role?.name || '');
    const [description, setDescription] = useState(role?.description || '');

    const initialPermissions = useMemo(() => {
        if (!role || mode === 'add') {
            return { view: false, add: false, edit: false, delete: false };
        }
        const ids = role.permissionIds || [];
        
        // Accurate derivation logic based on functional keywords
        return {
            view: ids.some(id => ['cols', 'filters', 'album', 'preview', 'expand', 'print', 'dash'].some(k => id.includes(k))),
            add: ids.some(id => ['add', 'bulk_ul', 'generate', 'create'].some(k => id.includes(k))),
            edit: ids.some(id => ['edit', 'config', 'save', 'update', 'reset', 'lock', 'subjects', 'allocate', 'archive', 'unarchive'].some(k => id.includes(k))),
            delete: ids.some(id => ['delete', 'remove', 'trash', 'clear'].some(k => id.includes(k)))
        };
    }, [role, mode]);

    const [permissions, setPermissions] = useState(initialPermissions);

    useEffect(() => {
        if (isOpen) {
            setName(role?.name || '');
            setDescription(role?.description || '');
            setPermissions(initialPermissions);
        }
    }, [isOpen, role, initialPermissions]);

    const isAnyPermissionChecked = useMemo(() => Object.values(permissions).some(v => v), [permissions]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (mode === 'edit' && role) {
            onSave({ id: role.id, name, description, permissions });
        } else {
            onSave({ name, description, permissions });
        }
    };

    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit Role' : 'Define New Role'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold mb-1.5 dark:text-gray-200">Role Name</label>
                    <AdminInput value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Admission Assistant" required />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-1.5 dark:text-gray-200">Description</label>
                    <AdminTextarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Briefly define the purpose of this role..." />
                </div>

                <div className="pt-2 border-t border-logip-border dark:border-dark-border">
                    <label className="block text-sm font-bold mb-4 uppercase tracking-wider text-emerald-600 dark:text-emerald-400">INITIAL ACCESS RIGHTS</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center p-3 rounded-lg border border-logip-border dark:border-dark-border bg-gray-50 dark:bg-dark-bg/50">
                            <AdminCheckbox label="View" checked={permissions.view} onChange={e => setPermissions(p => ({ ...p, view: e.target.checked }))} />
                        </div>
                        <div className="flex items-center p-3 rounded-lg border border-logip-border dark:border-dark-border bg-gray-50 dark:bg-dark-bg/50">
                            <AdminCheckbox label="Add / Create" checked={permissions.add} onChange={e => setPermissions(p => ({ ...p, add: e.target.checked }))} />
                        </div>
                        <div className="flex items-center p-3 rounded-lg border border-logip-border dark:border-dark-border bg-gray-50 dark:bg-dark-bg/50">
                            <AdminCheckbox label="Edit / Update" checked={permissions.edit} onChange={e => setPermissions(p => ({ ...p, edit: e.target.checked }))} />
                        </div>
                        <div className="flex items-center p-3 rounded-lg border border-logip-border dark:border-dark-border bg-gray-50 dark:bg-dark-bg/50">
                            <AdminCheckbox label="Delete / Remove" checked={permissions.delete} onChange={e => setPermissions(p => ({ ...p, delete: e.target.checked }))} />
                        </div>
                    </div>
                    <p className="text-[10px] text-logip-text-subtle dark:text-gray-500 mt-3 italic">
                        * Note: Baseline view access is implicitly granted when any action right is selected.
                    </p>
                </div>

                <div className="pt-4 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold rounded-lg border border-logip-border dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Cancel</button>
                    <button 
                        type="submit" 
                        disabled={!name.trim()}
                        className="px-5 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {mode === 'edit' ? 'Update Role' : 'Create Role'}
                    </button>
                </div>
            </form>
        </AdminModal>
    );
};

export default RolesAndPermissionsPage;
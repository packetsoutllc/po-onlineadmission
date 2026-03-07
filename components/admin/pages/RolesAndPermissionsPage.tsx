import React, { useState, useMemo, useEffect } from 'react';
import AdminModal from '../shared/AdminModal';
import ConfirmationModal from '../shared/ConfirmationModal';
import { AdminInput, AdminTextarea } from '../shared/forms';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../shared/ToastContext';

export type PermissionCategory = 'pages' | 'tabs' | 'sections' | 'buttons' | 'icons';
export type ActionType = 'view' | 'add' | 'edit' | 'delete';

export interface PermissionActions {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
}

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
    /** Per-resource actions. If missing, legacy: having id in permissionIds = view only. */
    permissionActions?: Record<string, PermissionActions>;
}

const formatRoleName = (name: string) => {
    if (!name) return "";
    return name.charAt(0).toUpperCase() + name.slice(1);
};

export const DEFAULT_ACTIONS: PermissionActions = { view: true, add: false, edit: false, delete: false };

/** Resolve effective actions for a permission id for a given role (for use in AdminLayout and pages). */
export function getActionsForRole(role: Role | undefined, permId: string): PermissionActions {
    if (!role) return { view: false, add: false, edit: false, delete: false };
    if (role.id === 'role_super_admin') return { view: true, add: true, edit: true, delete: true };
    const ids = Array.isArray(role.permissionIds) ? role.permissionIds : [];
    if (!ids.includes(permId)) return { view: false, add: false, edit: false, delete: false };
    return role.permissionActions?.[permId] ?? DEFAULT_ACTIONS;
}

/** Which actions are configurable for this permission id (for UI toggles). */
const getRelevantActions = (permId: string): ActionType[] => {
    if (permId.startsWith('page:') || permId.startsWith('tab:') || permId.startsWith('sec:')) return ['view'];
    const lower = permId.toLowerCase();
    const out: ActionType[] = ['view'];
    if (['add', 'bulk_ul', 'generate', 'create'].some(k => lower.includes(k))) out.push('add');
    if (['edit', 'config', 'save', 'update', 'reset', 'lock', 'subjects', 'allocate', 'archive', 'unarchive', 'regen'].some(k => lower.includes(k))) out.push('edit');
    if (['delete', 'remove', 'trash', 'clear'].some(k => lower.includes(k))) out.push('delete');
    return out;
};

/** Default actions when granting a permission (view + primary action for buttons/icons). */
const getDefaultActionsForPermission = (permId: string): PermissionActions => {
    const relevant = getRelevantActions(permId);
    return {
        view: relevant.includes('view'),
        add: relevant.includes('add'),
        edit: relevant.includes('edit'),
        delete: relevant.includes('delete'),
    };
};

const CategoryTab: React.FC<{ id: string; label: string; icon: string; active: boolean; onClick: () => void; count: number }> = ({ label, icon, active, onClick, count }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
            active 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-logip-text-body dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-border/50'
        }`}
    >
        <span className="material-symbols-outlined text-lg">{icon}</span>
        <span>{label}</span>
        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${active ? 'bg-white/20' : 'bg-gray-100 dark:bg-dark-border'}`}>
            {count}
        </span>
    </button>
);

/** Root-level count per category: pages = no parent; tabs/buttons/icons = direct child of page; sections = direct child of tab. */
const getRootCountForCategory = (list: Permission[], category: PermissionCategory): number => {
    if (category === 'pages') return list.filter(p => p.category === 'pages' && !p.parentId).length;
    if (category === 'tabs') return list.filter(p => p.category === 'tabs' && p.parentId?.startsWith('page:')).length;
    if (category === 'sections') return list.filter(p => p.category === 'sections' && p.parentId?.startsWith('tab:')).length;
    if (category === 'buttons') return list.filter(p => p.category === 'buttons' && p.parentId?.startsWith('page:')).length;
    if (category === 'icons') return list.filter(p => p.category === 'icons' && p.parentId?.startsWith('page:')).length;
    return 0;
};

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
    { id: 'page:roles', name: 'Roles & Permissions Page', description: 'Security profiles and access control', category: 'pages', resource: 'Roles' },
    { id: 'page:logs', name: 'Logs Page', description: 'Activity and audit logs', category: 'pages', resource: 'Logs' },

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

const fullActions: PermissionActions = { view: true, add: true, edit: true, delete: true };
const allPermIds = ALL_PERMISSIONS_LIST.map(p => p.id);
const superAdminActions: Record<string, PermissionActions> = {};
allPermIds.forEach(id => { superAdminActions[id] = fullActions; });

/** All permissions except Roles & Permissions and Users (for default "other users" role). */
const otherUsersPermIds = ALL_PERMISSIONS_LIST.filter(p => p.resource !== 'Roles' && p.resource !== 'Users').map(p => p.id);
const otherUsersActions: Record<string, PermissionActions> = {};
otherUsersPermIds.forEach(id => { otherUsersActions[id] = fullActions; });

export const INITIAL_ROLES: Role[] = [
    {
        id: 'role_super_admin',
        name: 'Super Administrator',
        description: 'Unrestricted access to all system features.',
        permissionIds: allPermIds,
        permissionActions: superAdminActions,
    },
    {
        id: 'role_admission_officer',
        name: 'Admission Officer',
        description: 'All pages except Roles & Permissions and Users; all tabs, sections, buttons, and icons on those pages.',
        permissionIds: otherUsersPermIds,
        permissionActions: otherUsersActions,
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
                permissionIds: Array.isArray(role.permissionIds) ? role.permissionIds : [],
                permissionActions: role.permissionActions && typeof role.permissionActions === 'object' ? role.permissionActions : undefined,
            }));
        }
        return value;
    });

    const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || '');
    const [modalState, setModalState] = useState<{ mode: 'add' | 'edit' | 'delete' | null; role: Role | null }>({ mode: null, role: null });
    const [activeCategory, setActiveCategory] = useState<PermissionCategory>('pages');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedPermissionIds, setExpandedPermissionIds] = useState<Set<string>>(new Set());

    // Ensure Super Admin always has all permissions in storage (fixes stale data from before new pages were added)
    useEffect(() => {
        const superRole = roles.find(r => r.id === 'role_super_admin');
        if (!superRole || superRole.permissionIds.length >= allPermIds.length) return;
        setRoles(prev => prev.map(r =>
            r.id === 'role_super_admin'
                ? { ...r, permissionIds: allPermIds, permissionActions: superAdminActions }
                : r
        ));
    }, []);

    const activeRole = useMemo(() => roles.find(r => r.id === selectedRoleId), [roles, selectedRoleId]);
    const activePermissionIds = useMemo(() => {
        if (activeRole?.id === 'role_super_admin') return new Set(allPermIds);
        return new Set(activeRole?.permissionIds || []);
    }, [activeRole]);

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

    const getActionsForPermission = (permId: string): PermissionActions => {
        if (!activeRole || activeRole.id === 'role_super_admin') return { view: true, add: true, edit: true, delete: true };
        if (!activePermissionIds.has(permId)) return { view: false, add: false, edit: false, delete: false };
        return activeRole.permissionActions?.[permId] ?? DEFAULT_ACTIONS;
    };

    const handleTogglePermission = (permissionId: string) => {
        if (!activeRole || activeRole.id === 'role_super_admin') return;

        setRoles(prev => prev.map(r => {
            if (r.id !== selectedRoleId) return r;
            const newIds = new Set(r.permissionIds);
            const newActions = { ...r.permissionActions };
            if (newIds.has(permissionId)) {
                newIds.delete(permissionId);
                delete newActions[permissionId];
                const uncheckChildren = (pid: string) => {
                    ALL_PERMISSIONS_LIST.filter(child => child.parentId === pid).forEach(child => {
                        newIds.delete(child.id);
                        delete newActions[child.id];
                        uncheckChildren(child.id);
                    });
                };
                uncheckChildren(permissionId);
            } else {
                newIds.add(permissionId);
                newActions[permissionId] = getDefaultActionsForPermission(permissionId);
                const checkParent = (pid: string) => {
                    const parent = ALL_PERMISSIONS_LIST.find(p => p.id === pid);
                    if (parent && parent.parentId) {
                        newIds.add(parent.parentId);
                        if (!newActions[parent.parentId]) newActions[parent.parentId] = getDefaultActionsForPermission(parent.parentId);
                        checkParent(parent.parentId);
                    }
                };
                const target = ALL_PERMISSIONS_LIST.find(p => p.id === permissionId);
                if (target?.parentId) {
                    newIds.add(target.parentId);
                    if (!newActions[target.parentId]) newActions[target.parentId] = getDefaultActionsForPermission(target.parentId);
                    checkParent(target.parentId);
                }
            }
            return { ...r, permissionIds: Array.from(newIds), permissionActions: newActions };
        }));
    };

    const handleSetPermissionAction = (permissionId: string, action: ActionType, value: boolean) => {
        if (!activeRole || activeRole.id === 'role_super_admin') return;
        setRoles(prev => prev.map(r => {
            if (r.id !== selectedRoleId) return r;
            const current = r.permissionActions?.[permissionId] ?? DEFAULT_ACTIONS;
            const next = { ...current, [action]: value };
            return { ...r, permissionActions: { ...r.permissionActions, [permissionId]: next } };
        }));
    };

    const handleToggleCategory = (category: PermissionCategory, enabled: boolean) => {
        if (!activeRole || activeRole.id === 'role_super_admin') return;
        setRoles(prev => prev.map(r => {
            if (r.id !== selectedRoleId) return r;
            const newIds = new Set(r.permissionIds);
            const newActions = { ...r.permissionActions };
            ALL_PERMISSIONS_LIST.filter(p => p.category === category).forEach(p => {
                if (enabled) {
                    newIds.add(p.id);
                    newActions[p.id] = getDefaultActionsForPermission(p.id);
                } else {
                    newIds.delete(p.id);
                    delete newActions[p.id];
                }
            });
            return { ...r, permissionIds: Array.from(newIds), permissionActions: newActions };
        }));
    };

    const handleSaveRoleMeta = (name: string, description: string) => {
        setRoles(prev => prev.map(r => 
            r.id === selectedRoleId ? { ...r, name: formatRoleName(name), description } : r
        ));
    };

    const handleCreateRole = (data: { id?: string; name: string; description: string }) => {
        if (modalState.mode === 'edit' && data.id) {
            setRoles(prev => prev.map(r =>
                r.id !== data.id ? r : { ...r, name: formatRoleName(data.name), description: data.description }
            ));
            showToast(`Role "${data.name}" updated.`, 'success');
            setModalState({ mode: null, role: null });
            return;
        }
        const newRole: Role = {
            id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: formatRoleName(data.name),
            description: data.description,
            permissionIds: [],
            permissionActions: undefined,
        };
        setRoles(prev => [...prev, newRole]);
        setSelectedRoleId(newRole.id);
        showToast(`Role "${newRole.name}" created. Assign permissions in the panel.`, 'success');
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

    const actionLabels: Record<ActionType, string> = { view: 'View', add: 'Add', edit: 'Edit', delete: 'Delete' };
    const actionColors: Record<ActionType, string> = {
        view: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
        add: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        edit: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };

    const renderPermissionCard = (perm: Permission, isNested: boolean = false) => {
        const isChecked = activePermissionIds.has(perm.id);
        const isSuper = activeRole?.id === 'role_super_admin' || !canEditRole;
        const children = ALL_PERMISSIONS_LIST.filter(p => p.parentId === perm.id);
        const hasChildren = children.length > 0;
        const isExpanded = expandedPermissionIds.has(perm.id);
        const actions = getActionsForPermission(perm.id);
        const allActions: ActionType[] = ['view', 'edit', 'add', 'delete'];

        return (
            <div key={perm.id} className={isNested ? 'ml-4 mt-2' : ''}>
                <div 
                    onClick={() => !isSuper && handleTogglePermission(perm.id)}
                    className={`group relative p-4 rounded-xl border transition-all select-none ${
                        isChecked
                            ? 'bg-white dark:bg-dark-surface border-emerald-500/60 shadow-sm ring-1 ring-emerald-500/20'
                            : 'bg-white/80 dark:bg-dark-surface/80 border-gray-200 dark:border-dark-border hover:border-emerald-300 dark:hover:border-emerald-700/50 opacity-80'
                    } ${isSuper ? 'cursor-default' : 'cursor-pointer'}`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{perm.resource}</span>
                                {hasChildren && (
                                    <button 
                                        onClick={(e) => toggleExpand(e, perm.id)}
                                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center"
                                    >
                                        <span className={`material-symbols-outlined text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>keyboard_arrow_down</span>
                                    </button>
                                )}
                            </div>
                            <p className="font-semibold text-sm text-logip-text-header dark:text-dark-text-primary mt-1">{perm.name}</p>
                            <p className="text-xs text-logip-text-subtle dark:text-dark-text-secondary mt-0.5">{perm.description}</p>
                            {isChecked && !isSuper && (
                                <div className="flex flex-nowrap gap-1 mt-3 overflow-x-auto overflow-y-hidden min-h-[28px]" onClick={e => e.stopPropagation()}>
                                    {allActions.map(action => (
                                        <label key={action} className={`inline-flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[9px] font-medium cursor-pointer whitespace-nowrap flex-shrink-0 ${actionColors[action]}`}>
                                            <span className="relative flex items-center justify-center flex-shrink-0">
                                                <input
                                                    type="checkbox"
                                                    checked={actions[action]}
                                                    onChange={e => handleSetPermissionAction(perm.id, action, e.target.checked)}
                                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border-2 border-gray-300 dark:border-gray-600 transition-all checked:bg-logip-primary checked:border-logip-primary dark:checked:bg-logip-primary focus:ring-2 focus:ring-logip-primary/30 focus:ring-offset-0"
                                                />
                                                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </span>
                                            </span>
                                            {actionLabels[action]}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isChecked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300 dark:border-gray-600'
                        }`}>
                            {isChecked && <span className="material-symbols-outlined text-sm">check</span>}
                        </div>
                    </div>
                </div>
                {isExpanded && hasChildren && (
                    <div className="grid grid-cols-1 gap-2 border-l-2 border-emerald-100 dark:border-emerald-900/30 ml-2 pl-2 mt-2">
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
                    <h2 className="text-2xl sm:text-3xl font-bold text-logip-text-header dark:text-dark-text-primary tracking-tight">Roles & Permissions</h2>
                    <p className="text-logip-text-subtle dark:text-dark-text-secondary mt-1.5 text-sm">Configure access so users only see pages, tabs, sections, buttons and icons assigned to them. Assign view, add, edit, or delete per resource.</p>
                </div>
                {canAddRole && (
                    <button 
                        onClick={() => setModalState({ mode: 'add', role: null })}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                    >
                        <span className="material-symbols-outlined text-xl">add</span>
                        New Role
                    </button>
                )}
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                <aside className="w-full lg:w-72 flex-shrink-0 flex flex-col bg-white dark:bg-dark-surface rounded-2xl border border-logip-border dark:border-dark-border overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-logip-border dark:border-dark-border bg-gradient-to-b from-gray-50 to-white dark:from-white/5 dark:to-transparent">
                        <h3 className="font-bold text-logip-text-header dark:text-dark-text-primary uppercase tracking-wider text-xs text-gray-500 dark:text-gray-400">Security Profiles</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-0.5">
                        {roles.map(role => (
                            <div
                                key={role.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedRoleId(role.id)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedRoleId(role.id); } }}
                                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                                    selectedRoleId === role.id 
                                        ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30' 
                                        : 'hover:bg-gray-50 dark:hover:bg-dark-border/50 text-logip-text-body dark:text-dark-text-secondary'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${selectedRoleId === role.id ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                    <span className="font-semibold text-sm truncate">{role.name}</span>
                                </div>
                                {role.id !== 'role_super_admin' && selectedRoleId === role.id && (
                                    <div className="flex items-center gap-0.5 flex-shrink-0">
                                        {canEditRole && (
                                            <button onClick={(e) => { e.stopPropagation(); setModalState({ mode: 'edit', role }); }} className="material-symbols-outlined text-lg text-logip-primary hover:bg-logip-primary/10 p-1.5 rounded-lg transition-colors" title="Edit role">edit</button>
                                        )}
                                        {canDeleteRole && (
                                            <button onClick={(e) => { e.stopPropagation(); setModalState({ mode: 'delete', role }); }} className="material-symbols-outlined text-lg text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors" title="Delete role">delete</button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>

                <main className="flex-1 flex flex-col bg-white dark:bg-dark-surface rounded-2xl border border-logip-border dark:border-dark-border shadow-sm overflow-hidden">
                    {activeRole ? (
                        <>
                            <div className="p-6 border-b border-logip-border dark:border-dark-border bg-gradient-to-b from-gray-50/80 to-white dark:from-white/5 dark:to-transparent">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary w-full p-0">{activeRole.name}</p>
                                        <p className="mt-1 text-sm text-logip-text-subtle dark:text-dark-text-secondary w-full min-h-[2.5rem]">{activeRole.description || '—'}</p>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-logip-text-header dark:text-dark-text-primary tabular-nums">{activePermissionIds.size}</p>
                                            <p className="text-[10px] uppercase font-semibold text-logip-text-subtle tracking-wider">Privileges</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                                            <span className="material-symbols-outlined text-3xl">shield</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 py-3 border-b border-logip-border dark:border-dark-border flex items-center justify-between gap-4 overflow-x-auto no-scrollbar bg-white dark:bg-dark-surface">
                                <div className="flex items-center gap-1.5">
                                    <CategoryTab id="pages" label="Pages" icon="auto_stories" active={activeCategory === 'pages'} onClick={() => setActiveCategory('pages')} count={getRootCountForCategory(ALL_PERMISSIONS_LIST, 'pages')} />
                                    <CategoryTab id="tabs" label="Tabs" icon="tab" active={activeCategory === 'tabs'} onClick={() => setActiveCategory('tabs')} count={getRootCountForCategory(ALL_PERMISSIONS_LIST, 'tabs')} />
                                    <CategoryTab id="sections" label="Sections" icon="view_quilt" active={activeCategory === 'sections'} onClick={() => setActiveCategory('sections')} count={getRootCountForCategory(ALL_PERMISSIONS_LIST, 'sections')} />
                                    <CategoryTab id="buttons" label="Buttons" icon="buttons_alt" active={activeCategory === 'buttons'} onClick={() => setActiveCategory('buttons')} count={getRootCountForCategory(ALL_PERMISSIONS_LIST, 'buttons')} />
                                    <CategoryTab id="icons" label="Icons" icon="token" active={activeCategory === 'icons'} onClick={() => setActiveCategory('icons')} count={getRootCountForCategory(ALL_PERMISSIONS_LIST, 'icons')} />
                                </div>
                                {activeRole.id !== 'role_super_admin' && canEditRole && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <button onClick={() => handleToggleCategory(activeCategory, true)} className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">Enable all</button>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <button onClick={() => handleToggleCategory(activeCategory, false)} className="font-semibold text-red-500 hover:underline">Disable all</button>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-black/10 no-scrollbar">
                                <h4 className="mb-4 font-semibold text-logip-text-header dark:text-dark-text-primary text-sm uppercase tracking-wider">
                                    {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} — assign access and actions (View / Add / Edit / Delete)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {filteredPermissions.map(perm => renderPermissionCard(perm))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-logip-text-subtle dark:text-dark-text-secondary">
                            <span className="material-symbols-outlined text-6xl opacity-30">admin_panel_settings</span>
                            <h3 className="mt-4 text-xl font-bold text-logip-text-header dark:text-dark-text-primary">Select a role to manage access</h3>
                            <p className="mt-2 text-sm">Users only see pages, tabs, sections, buttons and icons assigned to their role.</p>
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
    onSave: (data: { id?: string; name: string; description: string }) => void;
    role: Role | null;
    mode: 'add' | 'edit';
}> = ({ isOpen, onClose, onSave, role, mode }) => {
    const [name, setName] = useState(role?.name || '');
    const [description, setDescription] = useState(role?.description || '');

    useEffect(() => {
        if (isOpen) {
            setName(role?.name || '');
            setDescription(role?.description || '');
        }
    }, [isOpen, role?.name, role?.description]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (mode === 'edit' && role) {
            onSave({ id: role.id, name, description });
        } else {
            onSave({ name, description });
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
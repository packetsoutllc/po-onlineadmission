import React, { useState, useMemo, useEffect } from 'react';
import { Role, INITIAL_ROLES } from './RolesAndPermissionsPage';
import { School, Admission, initialSchools, initialAdmissions } from './SettingsPage';
import AdminModal from '../shared/AdminModal';
import ConfirmationModal from '../shared/ConfirmationModal';
import { AdminInput, AdminSelect } from '../shared/forms';
import PaginationControls from '../shared/PaginationControls';
import PrintButton from '../shared/PrintButton';
import { printTable } from '../shared/PrintService';
import { useSortableData } from '../../hooks/useSortableData';
import SortableHeader from '../shared/SortableHeader';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../shared/ToastContext';
import { logActivity } from '../../../utils/storage';

// --- TYPE DEFINITIONS ---
type UserStatus = 'active' | 'suspended' | 'inactive';

export interface User {
    id: number;
    username: string;
    email: string;
    phoneNumber?: string;
    whatsappNumber?: string;
    password?: string;
    roleId: string;
    schoolId?: string;
    admissionId?: string;
    accountDuration: 'No limit' | 'Set Expiry Date';
    expiryDate?: string; // ISO string for date and time
    status: UserStatus;
}

// --- MOCK DATA ---
export const initialUsers: User[] = [
    { id: 1, username: 'REGISTRATION OFFICER', email: 'pescoobserver@gmail.com', phoneNumber: '0244222222', whatsappNumber: '0244222222', roleId: 'role_registration_officer', schoolId: 's1', admissionId: 'a1', accountDuration: 'No limit', status: 'active', password: 'password123' },
    { id: 2, username: 'GAMELI FAITHSON AXAME', email: 'ec@gameli.com', phoneNumber: '0244444444', whatsappNumber: '0244444444', roleId: 'role_school_admin', schoolId: 's1', admissionId: 'a1', accountDuration: 'No limit', status: 'active', password: 'password123' },
    { id: 3, username: 'SYSTEM ADMINISTRATOR', email: 'amabotsi@gmail.com', phoneNumber: '0244333333', roleId: 'role_super_admin', accountDuration: 'No limit', status: 'active', password: 'password123' },
    { id: 4, username: 'MARGARET', email: 'admin@peki.edu', phoneNumber: '0244111111', whatsappNumber: '0244111111', roleId: 'role_school_admin', schoolId: 's1', accountDuration: 'No limit', status: 'active', password: 'password123' },
];

const getSchoolById = (id?: string) => initialSchools.find(s => s.id === id);

// --- HELPER COMPONENTS ---

const StatusPill: React.FC<{ status: UserStatus }> = ({ status }) => {
    const baseClasses = 'px-3 py-1 text-sm font-semibold rounded-full capitalize';
    const styles: Record<UserStatus, string> = {
        active: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
        suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
        inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400',
    };
    return <span className={`${baseClasses} ${styles[status]}`}>{status}</span>;
};

const ActionButton: React.FC<{ icon: string, onClick: (e: React.MouseEvent) => void, title: string, colorClass?: string }> = ({ icon, onClick, title, colorClass = 'text-logip-text-subtle hover:text-logip-text-header dark:text-dark-text-secondary dark:hover:text-dark-text-primary' }) => (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-md transition-colors no-print ${colorClass}`}>
        <span className="material-symbols-outlined text-xl">{icon}</span>
    </button>
);


// --- MAIN COMPONENT ---
interface UsersPageProps {
    selectedSchool?: School | null;
    selectedAdmission?: Admission | null;
    permissions: Set<string>;
    isSuperAdmin: boolean;
}

const UsersPage: React.FC<UsersPageProps> = ({ selectedSchool, selectedAdmission, permissions, isSuperAdmin }) => {
    const { showToast } = useToast();
    const [users, setUsers] = useLocalStorage<User[]>('admin_users', initialUsers);
    const [roles] = useLocalStorage<Role[]>('admin_roles', INITIAL_ROLES);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    // Retrieve current logged in user name for logging
    const adminName = localStorage.getItem('admin_login_name') || 'Administrator';
    const adminAvatar = localStorage.getItem('admin_login_avatar') || '';

    const [modalState, setModalState] = useState<{
        mode: 'add' | 'edit' | 'delete' | 'suspend' | null;
        user: User | null;
    }>({ mode: null, user: null });

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            // For Super Administrators, skip school and admission context filtering to show all users globally.
            const matchesSchool = isSuperAdmin ? true : (!selectedSchool || !user.schoolId || user.schoolId === selectedSchool.id || user.schoolId === 'none');
            const matchesAdmission = isSuperAdmin ? true : (!selectedAdmission || !user.admissionId || user.admissionId === 'none' || user.admissionId === selectedAdmission.id);
            
            const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  user.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
            const matchesCategory = categoryFilter === 'all' || user.roleId === categoryFilter;

            return matchesSchool && matchesAdmission && matchesSearch && matchesStatus && matchesCategory;
        });
    }, [users, searchTerm, statusFilter, categoryFilter, selectedSchool, selectedAdmission, isSuperAdmin]);
    
    const { items: sortedUsers, requestSort, sortConfig } = useSortableData(filteredUsers, { key: 'username', direction: 'ascending' });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, categoryFilter, itemsPerPage]);

    const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = sortedUsers.slice(startIndex, startIndex + itemsPerPage);
    const startItem = startIndex + 1;
    const endItem = Math.min(startIndex + itemsPerPage, sortedUsers.length);

    const handleOpenModal = (mode: 'add' | 'edit' | 'delete' | 'suspend', user: User | null = null) => {
        setModalState({ mode, user });
    };

    const handleCloseModal = () => {
        setModalState({ mode: null, user: null });
    };

    const handleSaveUser = (userData: Omit<User, 'id'>) => {
        if (modalState.mode === 'edit' && modalState.user) {
            setUsers(users.map(u => u.id === modalState.user!.id ? { ...modalState.user!, ...userData } : u));
            showToast(`User "${userData.username}" updated successfully.`, 'success');
            logActivity(
                { name: adminName, avatar: adminAvatar },
                'updated user details for',
                'user_management',
                userData.username,
                selectedSchool?.id
            );
        } else {
            const newUser: User = { id: Date.now() + Math.random(), ...userData };
            setUsers([...users, newUser]);
            showToast(`User "${userData.username}" created successfully.`, 'success');
            logActivity(
                { name: adminName, avatar: adminAvatar },
                'added a new user:',
                'user_add',
                userData.username,
                selectedSchool?.id
            );
        }
        handleCloseModal();
    };

    const handleDeleteUser = () => {
        if (!modalState.user) return;
        const name = modalState.user.username;
        setUsers(users.filter(u => u.id !== modalState.user!.id));
        showToast(`User "${name}" deleted.`, 'info');
        logActivity(
            { name: adminName, avatar: adminAvatar },
            'deleted user account for',
            'user_management',
            name,
            selectedSchool?.id
        );
        handleCloseModal();
    };

    const handleSuspendUser = () => {
        if (!modalState.user) return;
        const newStatus = modalState.user.status === 'suspended' ? 'active' : 'suspended';
        setUsers(users.map(u => u.id === modalState.user!.id ? { ...u, status: newStatus } : u));
        showToast(`User "${modalState.user.username}" has been ${newStatus === 'active' ? 'reactivated' : 'suspended'}.`, 'info');
        logActivity(
            { name: adminName, avatar: adminAvatar },
            `${newStatus === 'active' ? 'reactivated' : 'suspended'} user account for`,
            'user_management',
            modalState.user.username,
            selectedSchool?.id
        );
        handleCloseModal();
    };

    const handlePrint = () => {
        printTable('users-table', 'User List', selectedSchool, undefined, selectedAdmission?.title);
        logActivity(
            { name: adminName, avatar: adminAvatar },
            'printed the user list for',
            'user_management',
            selectedSchool?.name || 'All Schools'
        );
    };

    const thClassName = "p-4 text-left text-sm font-semibold text-logip-text-subtle dark:text-dark-text-secondary uppercase tracking-wider";
    
    const canAdd = isSuperAdmin || permissions.has('btn:user:add');
    const canEdit = isSuperAdmin || permissions.has('icon:user:edit');
    const canDelete = isSuperAdmin || permissions.has('icon:user:delete');
    const canLock = isSuperAdmin || permissions.has('icon:user:lock');

    return (
        <div className="p-4 sm:p-6 lg:p-8 text-logip-text-body dark:text-dark-text-primary">
            <div className="bg-logip-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-logip-border dark:border-dark-border">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-logip-border dark:border-dark-border pb-6 no-print">
                    <div className="w-full md:w-auto">
                        <h2 className="text-2xl font-bold text-logip-text-header dark:text-dark-text-primary">Administrative Users</h2>
                        <p className="text-logip-text-subtle dark:text-dark-text-secondary mt-1">Manage all personnel accounts and their access levels.</p>
                    </div>
                    <div className="flex w-full md:w-auto items-center gap-2">
                        <PrintButton onClick={handlePrint} />
                        {canAdd && (
                            <button onClick={() => handleOpenModal('add')} className="flex items-center justify-center gap-2 px-4 py-2 text-base bg-logip-primary text-white font-semibold rounded-lg hover:bg-logip-primary-hover transition-colors whitespace-nowrap">
                                <span className="material-symbols-outlined text-xl">person_add</span>
                                Add User
                            </button>
                        )}
                    </div>
                </div>
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 no-print">
                    <div className="relative w-full sm:w-auto sm:flex-1 max-w-sm">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-logip-text-subtle dark:text-dark-text-secondary">search</span>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2 text-base text-logip-text-header dark:text-dark-text-primary placeholder-logip-text-subtle dark:placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-logip-primary transition-colors"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <AdminSelect value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                            <option value="all">All Roles</option>
                            {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                        </AdminSelect>
                        <AdminSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="inactive">Inactive</option>
                        </AdminSelect>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="mt-6 bg-logip-white dark:bg-dark-surface rounded-lg border border-logip-border dark:border-dark-border overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full min-w-[1200px]" id="users-table">
                        <thead className="border-b border-logip-border dark:border-dark-border bg-gray-50 dark:bg-white/5">
                            <tr>
                                <th className={thClassName}>S/N</th>
                                <SortableHeader sortKey="username" sortConfig={sortConfig} requestSort={requestSort} className={thClassName}>Username</SortableHeader>
                                <SortableHeader sortKey="email" sortConfig={sortConfig} requestSort={requestSort} className={thClassName}>Email</SortableHeader>
                                <SortableHeader sortKey="phoneNumber" sortConfig={sortConfig} requestSort={requestSort} className={thClassName}>Phone Number</SortableHeader>
                                <SortableHeader sortKey="roleId" sortConfig={sortConfig} requestSort={requestSort} className={thClassName}>Role</SortableHeader>
                                <SortableHeader sortKey="schoolId" sortConfig={sortConfig} requestSort={requestSort} className={thClassName}>School</SortableHeader>
                                <SortableHeader sortKey="status" sortConfig={sortConfig} requestSort={requestSort} className={thClassName}>Status</SortableHeader>
                                <th className="p-4 text-left text-sm font-semibold text-logip-text-subtle dark:text-dark-text-secondary uppercase tracking-wider no-print">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-logip-border dark:divide-dark-border">
                            {paginatedUsers.map((user, index) => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-base text-gray-600 dark:text-gray-400">{startIndex + index + 1}</td>
                                    <td className="p-4 font-bold text-base text-gray-900 dark:text-gray-100">{user.username}</td>
                                    <td className="p-4 text-base text-gray-600 dark:text-gray-400">{user.email}</td>
                                    <td className="p-4 text-base text-gray-600 dark:text-gray-400">{user.phoneNumber || 'N/A'}</td>
                                    <td className="p-4 text-base text-gray-600 dark:text-gray-400">{roles.find(r => r.id === user.roleId)?.name || user.roleId}</td>
                                    <td className="p-4 text-base text-gray-600 dark:text-gray-400">{getSchoolById(user.schoolId)?.name || (user.schoolId === 'none' ? 'All Schools' : 'N/A')}</td>
                                    <td className="p-4"><StatusPill status={user.status} /></td>
                                    <td className="p-4 no-print">
                                        <div className="flex items-center gap-1">
                                            {canEdit && <ActionButton icon="edit" onClick={() => handleOpenModal('edit', user)} title="Edit User" colorClass="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"/>}
                                            {canLock && (
                                                user.status !== 'suspended' ? (
                                                    <ActionButton icon="block" onClick={() => handleOpenModal('suspend', user)} title="Suspend User" colorClass="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"/>
                                                ) : (
                                                    <ActionButton icon="check_circle" onClick={() => handleOpenModal('suspend', user)} title="Activate User" colorClass="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"/>
                                                )
                                            )}
                                            {canDelete && <ActionButton icon="delete" onClick={() => handleOpenModal('delete', user)} title="Delete User" colorClass="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"/>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="p-4 border-t border-logip-border dark:border-dark-border flex items-center justify-between no-print">
                     <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={sortedUsers.length}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={setItemsPerPage}
                        startItem={startItem}
                        endItem={endItem}
                    />
                </div>
            </div>

            {/* Modals */}
             {(modalState.mode === 'add' || modalState.mode === 'edit') && (
                <UserFormModal 
                    isOpen={true} 
                    onClose={handleCloseModal} 
                    onSave={handleSaveUser} 
                    user={modalState.user} 
                    roles={roles}
                    schools={initialSchools}
                    admissions={initialAdmissions}
                />
            )}

            {modalState.mode === 'delete' && (
                <ConfirmationModal isOpen={true} onClose={handleCloseModal} onConfirm={handleDeleteUser} title="Delete User">
                    Are you sure you want to delete <strong>{modalState.user?.username}</strong>? This action cannot be undone.
                </ConfirmationModal>
            )}

             {modalState.mode === 'suspend' && (
                <ConfirmationModal 
                    isOpen={true} 
                    onClose={handleCloseModal} 
                    onConfirm={handleSuspendUser} 
                    title={modalState.user?.status === 'suspended' ? 'Reactivate User' : 'Suspend User'}
                    confirmButtonClass={modalState.user?.status === 'suspended' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
                >
                    Are you sure you want to {modalState.user?.status === 'suspended' ? 'reactivate' : 'suspend'} <strong>{modalState.user?.username}</strong>?
                </ConfirmationModal>
            )}

        </div>
    );
};

// Sub-component: UserFormModal
const UserFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<User, 'id'>) => void;
    user: User | null;
    roles: Role[];
    schools: School[];
    admissions: Admission[];
}> = ({ isOpen, onClose, onSave, user, roles, schools, admissions }) => {
    const [formData, setFormData] = useState<Omit<User, 'id'> & { confirmPassword?: string }>({
        username: user?.username || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        whatsappNumber: user?.whatsappNumber || '',
        password: user?.password || '',
        confirmPassword: user?.password || '',
        roleId: user?.roleId || '',
        schoolId: user?.schoolId || 'none',
        admissionId: user?.admissionId || 'none',
        accountDuration: user?.accountDuration || 'No limit',
        expiryDate: user?.expiryDate || '',
        status: user?.status || 'active'
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (formData.accountDuration === 'Set Expiry Date' && formData.expiryDate) {
            const expiry = new Date(formData.expiryDate).getTime();
            const now = new Date().getTime();
            const newStatus: UserStatus = expiry > now ? 'active' : 'inactive';
            
            if (formData.status !== newStatus && formData.status !== 'suspended') {
                setFormData(prev => ({ ...prev, status: newStatus }));
            }
        }
    }, [formData.expiryDate, formData.accountDuration, formData.status]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Password validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (formData.password && formData.password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        // Expiry check
        if (formData.accountDuration === 'Set Expiry Date' && !formData.expiryDate) {
            setError('Please set an expiry date and time.');
            return;
        }

        const { confirmPassword, ...dataToSave } = formData;
        onSave(dataToSave as Omit<User, 'id'>);
    };

    const relevantAdmissions = useMemo(() => {
        if (!formData.schoolId || formData.schoolId === 'none') return [];
        return admissions.filter(a => a.schoolId === formData.schoolId);
    }, [formData.schoolId, admissions]);

    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User' : 'Add New User'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Username <span className="text-red-500">*</span></label>
                        <AdminInput name="username" value={formData.username} onChange={handleChange} required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                        <AdminInput name="email" type="email" value={formData.email} onChange={handleChange} required />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Phone Number</label>
                        <AdminInput name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} placeholder="024..." />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">WhatsApp Number</label>
                        <AdminInput name="whatsappNumber" type="tel" value={formData.whatsappNumber} onChange={handleChange} placeholder="024..." />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Password {user ? '(Leave blank to keep current)' : '<span className="text-red-500">*</span>'}</label>
                        <AdminInput name="password" type="password" value={formData.password} onChange={handleChange} required={!user} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Confirm Password</label>
                        <AdminInput name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required={!user} />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Role <span className="text-red-500">*</span></label>
                        <AdminSelect name="roleId" value={formData.roleId} onChange={handleChange} required>
                            <option value="">Select Role</option>
                            {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                        </AdminSelect>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">School Scope</label>
                        <AdminSelect name="schoolId" value={formData.schoolId} onChange={handleChange}>
                            <option value="none">Global (All Schools)</option>
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </AdminSelect>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Admission Scope</label>
                        <AdminSelect name="admissionId" value={formData.admissionId} onChange={handleChange} disabled={formData.schoolId === 'none'}>
                            <option value="none">All Admission Types</option>
                            {relevantAdmissions.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                        </AdminSelect>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-logip-border dark:border-dark-border">
                    <div>
                        <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Account Duration</label>
                         <AdminSelect name="accountDuration" value={formData.accountDuration} onChange={handleChange}>
                            <option value="No limit">No limit</option>
                            <option value="Set Expiry Date">Set Expiry Date</option>
                        </AdminSelect>
                    </div>
                    {formData.accountDuration === 'Set Expiry Date' && (
                        <div className="animate-fadeIn">
                            <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Expiry Date & Time</label>
                            <AdminInput name="expiryDate" type="datetime-local" value={formData.expiryDate} onChange={handleChange} required />
                        </div>
                    )}
                </div>
                {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
                <div className="pt-4 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-base font-semibold rounded-lg border border-logip-border dark:border-dark-border text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Cancel</button>
                    <button type="submit" className="px-5 py-2 text-base font-semibold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover transition-colors">{user ? 'Save Changes' : 'Create User'}</button>
                </div>
            </form>
        </AdminModal>
    );
};

export default UsersPage;

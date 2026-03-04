import React, { useState, useRef } from 'react';
import { useToast } from '../shared/ToastContext';
import { AdminInput } from '../shared/forms';
import ConfirmationModal from '../shared/ConfirmationModal';
import { AdminUser } from '../AdminLayout';
import { INITIAL_ROLES } from './RolesAndPermissionsPage';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface UserProfileSettingsTabProps {
    adminUser: AdminUser;
    setAdminUser: React.Dispatch<React.SetStateAction<AdminUser | null>>;
    onExitAdmin: () => void;
}

// Mock passwords for verification. In a real app, this would be a secure backend check.
const USER_PASSWORDS: Record<string, string> = {
    'admin@peki.edu': 'password123',
    'pescoobserver@gmail.com': '00000000',
    'amabotsi@gmail.com': 'password123',
    'ec@gameli.com': 'password123',
};

const UserProfileSettingsTab: React.FC<UserProfileSettingsTabProps> = ({ adminUser, setAdminUser, onExitAdmin }) => {
    const { showToast } = useToast();
    
    const isSuperAdmin = adminUser.roleId === 'role_super_admin';

    // Local state for form editing, initialized from props
    const [profile, setProfile] = useState({
        name: adminUser.name,
        email: adminUser.email,
        avatar: adminUser.avatar || `https://i.pravatar.cc/160?u=${adminUser.email}`,
    });

    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: '',
    });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const role = INITIAL_ROLES.find(r => r.id === adminUser.roleId)?.name || 'User';

    const [globalSettings] = useLocalStorage('globalAdminSecuritySettings', {
        passwordMinLength: 8,
        passwordRequiresNumber: true,
        passwordRequiresLetter: true,
        passwordRequiresSpecialChar: false,
    });


    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile(p => ({
            ...p,
            [name]: name === 'name' ? value.toUpperCase() : value
        }));
    };
    
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(p => ({ ...p, [name]: value }));
    };
    
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(p => ({ ...p, avatar: reader.result as string }));
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSaveChanges = () => {
        setAdminUser(prevUser => {
            if (!prevUser) return null;
            const updatedUser = {
                ...prevUser,
                name: profile.name,
                email: profile.email,
                avatar: profile.avatar,
            };
            return updatedUser;
        });
        showToast('Profile information updated successfully.', 'success');
    };

    const handleChangePassword = () => {
        const correctCurrentPassword = USER_PASSWORDS[adminUser.email];
        if (passwordData.current !== correctCurrentPassword) {
            showToast('Incorrect current password.', 'error');
            return;
        }
        if (passwordData.new !== passwordData.confirm) {
            showToast('New passwords do not match.', 'error');
            return;
        }
        if (passwordData.new.length < globalSettings.passwordMinLength) {
            showToast(`Password must be at least ${globalSettings.passwordMinLength} characters long.`, 'error');
            return;
        }
        if (globalSettings.passwordRequiresNumber && !/\d/.test(passwordData.new)) {
            showToast("Password must contain at least one number.", 'error');
            return;
        }
        if (globalSettings.passwordRequiresLetter && !/[a-zA-Z]/.test(passwordData.new)) {
            showToast("Password must contain at least one letter.", 'error');
            return;
        }
        if (globalSettings.passwordRequiresSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.new)) {
            showToast("Password must contain at least one special character.", 'error');
            return;
        }
        
        // Simulate password change
        console.log(`Password for ${adminUser.email} has been changed.`);
        USER_PASSWORDS[adminUser.email] = passwordData.new; // Update mock password
        showToast('Password changed successfully.', 'success');
        setPasswordData({ current: '', new: '', confirm: '' });
    };

    const handleDeleteAccount = () => {
        setIsDeleteModalOpen(false);
        showToast('Account deleted. You will be logged out.', 'info');
        setTimeout(() => {
            onExitAdmin();
        }, 1500);
    };

    return (
        <div className="animate-fadeIn space-y-8">
            {/* Profile Information Card */}
            <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary">Profile Information</h3>
                <div className="mt-6 flex flex-col md:flex-row items-start gap-8">
                    <div className="flex-shrink-0 flex flex-col items-center">
                        <img src={profile.avatar} alt="Profile" className="w-40 h-40 rounded-full object-cover border-4 border-white dark:border-dark-surface shadow-md" />
                        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg border border-logip-border dark:border-dark-border text-logip-text-body dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
                            Change Picture
                        </button>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Full Name</label>
                            <AdminInput name="name" value={profile.name} onChange={handleProfileChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Email Address</label>
                            <AdminInput 
                                name="email" 
                                type="email" 
                                value={profile.email} 
                                onChange={handleProfileChange} 
                                disabled={!isSuperAdmin}
                                className={!isSuperAdmin ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-75' : ''}
                            />
                            {!isSuperAdmin && <p className="text-[10px] text-gray-400 mt-1 italic">Only Super Administrators can update email addresses.</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Role</label>
                            <AdminInput value={role} disabled />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Last Login</label>
                            <AdminInput value="11/7/2025, 2:41:15 PM" disabled />
                        </div>
                    </div>
                </div>
                 <div className="mt-6 pt-4 border-t border-logip-border dark:border-dark-border flex justify-end">
                    <button onClick={handleSaveChanges} className="px-5 py-2 text-base font-semibold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover transition-colors">
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Change Password Card - Restrict to Super Admin */}
            {isSuperAdmin && (
                <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                    <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary">Change Password</h3>
                    <div className="mt-6 space-y-6 max-w-xl">
                        <div>
                            <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Current Password</label>
                            <AdminInput name="current" type="password" value={passwordData.current} onChange={handlePasswordChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">New Password</label>
                            <AdminInput name="new" type="password" value={passwordData.new} onChange={handlePasswordChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Confirm New Password</label>
                            <AdminInput name="confirm" type="password" value={passwordData.confirm} onChange={handlePasswordChange} />
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-logip-border dark:border-dark-border flex justify-end">
                        <button onClick={handleChangePassword} className="px-5 py-2 text-base font-semibold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover transition-colors">
                            Update Password
                        </button>
                    </div>
                </div>
            )}

             {/* Delete Account Card - Restrict to Super Admin */}
            {isSuperAdmin && (
                <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-red-500/30 dark:border-red-500/50">
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Delete Account</h3>
                    <p className="text-logip-text-subtle dark:text-dark-text-secondary mt-1">Permanently delete your account and all associated data. This action cannot be undone.</p>
                    <div className="mt-4 flex justify-start">
                        <button onClick={() => setIsDeleteModalOpen(true)} className="px-5 py-2 text-base font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
                            Delete My Account
                        </button>
                    </div>
                </div>
            )}

            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteAccount}
                title="Confirm Account Deletion"
            >
                Are you sure you want to permanently delete your account? All of your data will be removed. This action cannot be undone.
            </ConfirmationModal>
        </div>
    );
};

export default UserProfileSettingsTab;
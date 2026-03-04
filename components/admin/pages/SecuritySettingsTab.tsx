import React, { useEffect, useState, useMemo, useRef } from 'react';
import { School, Admission } from './SettingsPage';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../shared/ToastContext';
import { AdminInput, AdminSelect, AdminCheckbox, AdminTextarea, AdminFormField } from '../shared/forms';
import { AdminUser } from '../AdminLayout';
import NotificationPreviewModal from '../shared/NotificationPreviewModal';
import VideoPreviewModal from '../shared/VideoPreviewModal';
import ScrollingBannerPreviewModal from '../shared/ScrollingBannerPreviewModal';
import ConfirmationModal from '../shared/ConfirmationModal';
import PaginationControls from '../shared/PaginationControls';
import { AdminStudent, initialAdminStudents } from './StudentsPage';
import DatePicker from '../../DatePicker';
import { appendToLocalStorageArray } from '../../../utils/storage';

// --- TYPE DEFINITIONS ---

export interface SecurityLog {
    id: string;
    timestamp: string;
    riskType: 'Failed Login' | 'Forced Logout' | 'Suspicious Activity';
    target: string;
    action: 'Logged Attempt' | 'User Sessions Terminated' | 'Flagged';
    details?: string;
    icon?: string;
}

export interface BrowsingLogEntry {
    id: string;
    ipAddress: string;
    country: string;
    town: string;
    timestamp: string;
    device: string;
}

export interface NotificationSettings {
    enabled: boolean;
    text?: string; 
    title?: string; 
    message?: string; 
    position?: 'top' | 'bottom';
    textColor?: string;
    backgroundColor?: string;
    iconColor?: string;
    icon?: string;
    speed?: number; 
    startTime?: string;
    endTime?: string;
    frequency?: 'always' | 'once';
    targetPages?: string[];
    url?: string; 
    autoplay?: boolean; 
    fontSize?: number;
    isBold?: boolean;
    isItalic?: boolean;
    popupStyle?: 'standard' | 'modern' | 'flyer';
    popupImage?: string; 
}

export interface AdmissionSettings {
    adminOnlyAccess: boolean;
    autoApproveProspective: boolean;
    autoAdmitPolicy: 'all' | 'selected';
    autoAdmitStudents: string[];
    autoApproveProtocol: boolean;
    autoPlacePolicy: 'all' | 'selected';
    autoPlaceStudents: string[];
    houseAssignmentMethod: 'automatic' | 'student_choice' | 'manual';
    enableRoomManagement: boolean;
    dormAssignmentMethod: 'automatic' | 'student_choice' | 'manual';
    activateWhatsappId: boolean;
    enableProtocolApplication: boolean;
    allowStudentEdit: boolean;
    serialNumberFormat: 'numeric' | 'alphabetic' | 'alphanumeric';
    serialNumberLength: number;
    pinFormat: 'numeric' | 'alphabetic' | 'alphanumeric';
    pinLength: number;
    maintenanceTitle: string;
    maintenanceMessage: string;
    maintenanceCountdownEnd: string | null;
    verificationErrorMessage?: string; 
}

export interface GlobalAdminSecuritySettings {
    enable2FA: boolean;
    passwordMinLength: number;
    passwordRequiresNumber: boolean;
    passwordRequiresLetter: boolean;
    passwordRequiresSpecialChar: boolean;
}

interface SecuritySettingsTabProps {
    selectedSchool?: School | null;
    selectedAdmission?: Admission | null;
    adminUser: AdminUser;
}

const initialBrowsingLogs: BrowsingLogEntry[] = [
    { id: 'b1', ipAddress: '154.160.12.45', country: 'Ghana', town: 'Accra', timestamp: new Date().toISOString(), device: 'Chrome / Windows' },
    { id: 'b2', ipAddress: '197.251.33.12', country: 'Ghana', town: 'Kumasi', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), device: 'Safari / iPhone' },
    { id: 'b3', ipAddress: '41.210.12.8', country: 'Ghana', town: 'Tamale', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), device: 'Firefox / Android' },
    { id: 'b4', ipAddress: '102.176.44.21', country: 'Ghana', town: 'Tema', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), device: 'Chrome / Mac' },
    { id: 'b5', ipAddress: '154.160.22.99', country: 'Ghana', town: 'Ho', timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), device: 'Edge / Windows' },
    { id: 'b6', ipAddress: '197.251.10.5', country: 'Ghana', town: 'Koforidua', timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(), device: 'Chrome / Android' },
];

export const ToggleSwitch: React.FC<{ checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled?: boolean }> = ({ checked, onChange, disabled }) => (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-logip-primary"></div>
    </label>
);

const RadioCard: React.FC<{ title: string; description: string; value: string; selectedValue: string; onClick: (val: string) => void }> = ({ title, description, value, selectedValue, onClick }) => (
    <div 
        onClick={() => onClick(value)}
        className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${selectedValue === value ? 'border-logip-primary bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-dark-border hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-dark-bg'}`}
    >
        <div className="flex items-center gap-3 mb-2">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedValue === value ? 'border-logip-primary' : 'border-gray-400'}`}>
                {selectedValue === value && <div className="w-2.5 h-2.5 rounded-full bg-logip-primary"></div>}
            </div>
            <span className="font-bold text-logip-text-header dark:text-gray-100">{title}</span>
        </div>
        <p className="text-xs text-logip-text-subtle dark:text-dark-text-secondary ml-8">{description}</p>
    </div>
);

const PageTargetSelector: React.FC<{ selectedPages?: string[]; onChange: (pages: string[]) => void }> = ({ selectedPages = ['all'], onChange }) => {
    const pages = [
        { label: 'All Pages', id: 'all' },
        { label: 'Index number', id: 'auth' },
        { label: 'Students login', id: 'applicant_login' },
        { label: 'Protocol admission', id: 'protocol_admission' },
        { label: 'personal info', id: 'personal_info' },
        { label: 'academic info', id: 'academic_info' },
        { label: 'other info', id: 'other_info' },
        { label: 'parents info', id: 'parents_info' },
        { label: 'submit app', id: 'submit' },
        { label: 'admission docs', id: 'admission_docs' }
    ];
    
    const handleChange = (pageId: string, checked: boolean) => {
        if (pageId === 'all') {
             if (checked) onChange(['all']);
             else onChange([]);
             return;
        }
        const current = new Set(selectedPages);
        if (current.has('all')) current.delete('all');
        if (checked) current.add(pageId);
        else current.delete(pageId);
        onChange(Array.from(current));
    };

    return (
        <div className="flex flex-wrap gap-x-6 gap-y-3 mt-2">
            {pages.map(page => {
                const isChecked = selectedPages.includes(page.id);
                return <AdminCheckbox key={page.id} label={page.label} checked={isChecked} onChange={e => handleChange(page.id, e.target.checked)} />;
            })}
        </div>
    );
};

const SecuritySettingsTab: React.FC<SecuritySettingsTabProps> = ({ selectedSchool, selectedAdmission, adminUser }) => {
    const { showToast } = useToast();
    
    const [globalSettings, setGlobalSettings] = useLocalStorage<GlobalAdminSecuritySettings>('globalAdminSecuritySettings', {
        enable2FA: true,
        passwordMinLength: 8,
        passwordRequiresNumber: true,
        passwordRequiresLetter: true,
        passwordRequiresSpecialChar: false,
    });

    const admissionSettingsKey = selectedSchool && selectedAdmission ? `admissionSettings_${selectedSchool.id}_${selectedAdmission.id}` : null;
    const [admissionSettings, setAdmissionSettings] = useLocalStorage<AdmissionSettings | null>(admissionSettingsKey, null);

    const [localAdmissionSettings, setLocalAdmissionSettings] = useState<AdmissionSettings>({
        adminOnlyAccess: false,
        autoApproveProspective: false,
        autoAdmitPolicy: 'all',
        autoAdmitStudents: [],
        autoApproveProtocol: false,
        autoPlacePolicy: 'all',
        autoPlaceStudents: [],
        houseAssignmentMethod: 'automatic',
        enableRoomManagement: true,
        dormAssignmentMethod: 'automatic',
        activateWhatsappId: false,
        enableProtocolApplication: true,
        allowStudentEdit: true,
        serialNumberFormat: 'numeric',
        serialNumberLength: 10,
        pinFormat: 'numeric',
        pinLength: 5,
        maintenanceTitle: 'Site under maintenance',
        maintenanceMessage: 'The online admission system is currently offline and will be back online soon.',
        maintenanceCountdownEnd: null,
        verificationErrorMessage: ''
    });

    const [adminStudents] = useLocalStorage<AdminStudent[]>('admin_students', initialAdminStudents);

    const scrollingKey = selectedSchool && selectedAdmission ? `notification_scrolling_${selectedSchool.id}_${selectedAdmission.id}` : 'temp_scroll';
    const popupKey = selectedSchool && selectedAdmission ? `notification_popup_${selectedSchool.id}_${selectedAdmission.id}` : 'temp_popup';
    const videoKey = selectedSchool && selectedAdmission ? `notification_video_${selectedSchool.id}_${selectedAdmission.id}` : 'temp_video';

    const [scrollingBanner, setScrollingBanner] = useLocalStorage<NotificationSettings>(scrollingKey, { 
        enabled: false, text: '', position: 'top', textColor: '#ffffff', backgroundColor: '#3b82f6', speed: 25, frequency: 'always', targetPages: ['all'], fontSize: 14, isBold: true, isItalic: false
    });
    
    const [popupBanner, setPopupBanner] = useLocalStorage<NotificationSettings>(popupKey, { 
        enabled: false, title: '', message: '', icon: 'info', iconColor: '#3b82f6', textColor: '#1f2937', frequency: 'once', targetPages: ['all'], popupStyle: 'standard', popupImage: ''
    });
    
    const [videoNotification, setVideoNotification] = useLocalStorage<NotificationSettings>(videoKey, { enabled: false, url: '', autoplay: true, frequency: 'once', targetPages: ['all'] });
    
    const [isPreviewPopupOpen, setIsPreviewPopupOpen] = useState(false);
    const [isPreviewVideoOpen, setIsPreviewVideoOpen] = useState(false);
    const [isPreviewScrollOpen, setIsPreviewScrollOpen] = useState(false);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const [securityLogs, setSecurityLogs] = useLocalStorage<SecurityLog[]>('admin_security_logs', []);
    const [browsingLogs] = useLocalStorage<BrowsingLogEntry[]>('admin_browsing_logs', initialBrowsingLogs);
    const [browsingSearchTerm, setBrowsingSearchTerm] = useState('');
    const [browsingPage, setBrowsingPage] = useState(1);
    const [browsingItemsPerPage, setBrowsingItemsPerPage] = useLocalStorage<number>(`${adminUser.email}_browsing_logs_items_per_page`, 10);

    useEffect(() => { if (admissionSettings) setLocalAdmissionSettings(admissionSettings); }, [admissionSettings, selectedAdmission]);

    const filteredBrowsingLogs = useMemo(() => {
        return browsingLogs.filter(log => {
            const searchLower = browsingSearchTerm.toLowerCase();
            return log.ipAddress.toLowerCase().includes(searchLower) || log.country.toLowerCase().includes(searchLower) || log.town.toLowerCase().includes(searchLower) || log.device.toLowerCase().includes(searchLower);
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [browsingLogs, browsingSearchTerm]);

    const totalBrowsingPages = Math.ceil(filteredBrowsingLogs.length / browsingItemsPerPage);
    const browsingStartIndex = (browsingPage - 1) * browsingItemsPerPage;
    // FIX: Corrected undeclared variable 'startIndex' to 'browsingStartIndex'
    const paginatedBrowsingLogs = filteredBrowsingLogs.slice(browsingStartIndex, browsingStartIndex + browsingItemsPerPage);

    const handleSaveAdmissionSettings = () => { if (admissionSettingsKey) { setAdmissionSettings(localAdmissionSettings); showToast('Settings saved successfully.', 'success'); } };

    const handleForceLogout = () => {
        if (selectedSchool && selectedAdmission) {
            const timestamp = new Date().getTime().toString();
            localStorage.setItem(`force_logout_timestamp_${selectedSchool.id}_${selectedAdmission.id}`, timestamp);
            
            const newLog: SecurityLog = { 
                id: `sec_${Date.now()}`, 
                timestamp: new Date().toISOString(), 
                riskType: 'Failed Login', 
                target: `${selectedAdmission.title} Users`, 
                action: 'Logged Attempt', 
                details: `Admin ${adminUser.name} forced logout for all users.` 
            };
            setSecurityLogs(prev => [newLog, ...prev].slice(0, 100));
            showToast('All active users have been logged out.', 'success');
            setIsLogoutConfirmOpen(false);
        }
    };

    return (
        <div className="animate-fadeIn space-y-8 pb-20">
            {/* Global Admin Security */}
            <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary mb-2">Global Admin Security</h3>
                <p className="text-sm text-logip-text-subtle dark:text-dark-text-secondary mb-6">System-wide security policies affecting all administrators.</p>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-logip-text-header dark:text-dark-text-primary text-base">Enable Two-Factor Authentication (2FA)</p>
                            <p className="text-sm text-logip-text-subtle">Require 2FA for all admin logins.</p>
                        </div>
                        <ToggleSwitch checked={globalSettings.enable2FA} onChange={(e) => setGlobalSettings(s => ({...s, enable2FA: e.target.checked}))} />
                    </div>
                    <div className="pt-4 border-t border-logip-border dark:border-dark-border">
                        <p className="font-bold text-logip-text-header dark:text-dark-text-primary text-base mb-4">Password Policy</p>
                        <div className="mb-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-logip-text-subtle font-medium">Minimum Length</span>
                                <span className="font-bold text-logip-primary">{globalSettings.passwordMinLength} characters</span>
                            </div>
                            <input type="range" min="6" max="16" value={globalSettings.passwordMinLength} onChange={(e) => setGlobalSettings(s => ({...s, passwordMinLength: parseInt(e.target.value)}))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-logip-primary" />
                        </div>
                        <div className="flex flex-wrap gap-6">
                             <AdminCheckbox label="Require Numbers" checked={globalSettings.passwordRequiresNumber} onChange={e => setGlobalSettings(s => ({...s, passwordRequiresNumber: e.target.checked}))} />
                             <AdminCheckbox label="Require Letters" checked={globalSettings.passwordRequiresLetter} onChange={e => setGlobalSettings(s => ({...s, passwordRequiresLetter: e.target.checked}))} />
                             <AdminCheckbox label="Require Symbols" checked={globalSettings.passwordRequiresSpecialChar} onChange={e => setGlobalSettings(s => ({...s, passwordRequiresSpecialChar: e.target.checked}))} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Admission Portal Configuration */}
            <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary mb-2">Admission Portal Configuration</h3>
                <p className="text-sm text-logip-text-subtle dark:text-dark-text-secondary mb-6">Manage settings for {selectedAdmission?.title}.</p>
                
                <div className="space-y-8">
                    <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                                <span className="material-symbols-outlined text-2xl">lock</span>
                            </div>
                            <div>
                                <p className="font-bold text-red-700 dark:text-red-300">Strict Maintenance Mode</p>
                                <p className="text-xs text-red-600/80 dark:text-red-400/80">Blocks all student access immediately.</p>
                            </div>
                        </div>
                        <ToggleSwitch checked={localAdmissionSettings.adminOnlyAccess} onChange={e => setLocalAdmissionSettings(s => ({...s, adminOnlyAccess: e.target.checked}))} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AdminFormField label="Maintenance Title">
                             <AdminInput value={localAdmissionSettings.maintenanceTitle} onChange={e => setLocalAdmissionSettings(s => ({...s, maintenanceTitle: e.target.value}))} />
                        </AdminFormField>
                        <AdminFormField label="Re-opening Countdown">
                             <AdminInput type="datetime-local" value={localAdmissionSettings.maintenanceCountdownEnd || ''} onChange={e => setLocalAdmissionSettings(s => ({...s, maintenanceCountdownEnd: e.target.value || null}))} />
                        </AdminFormField>
                        <div className="md:col-span-2">
                             <AdminFormField label="Maintenance Message">
                                <AdminTextarea value={localAdmissionSettings.maintenanceMessage} onChange={e => setLocalAdmissionSettings(s => ({...s, maintenanceMessage: e.target.value}))} rows={3} />
                             </AdminFormField>
                        </div>
                    </div>

                    <hr className="border-logip-border dark:border-dark-border" />

                    {/* Automatic Approvals Section */}
                    <div>
                        <h4 className="text-sm font-bold text-logip-text-header dark:text-dark-text-primary mb-4 uppercase tracking-tight">Automatic Approvals & Placement</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-logip-text-header dark:text-dark-text-primary text-sm">Auto-Admit Prospective Students</p>
                                    <p className="text-xs text-logip-text-subtle">Automatically change status from 'Prospective' to 'Admitted' upon form submission.</p>
                                </div>
                                <ToggleSwitch checked={localAdmissionSettings.autoApproveProspective} onChange={e => setLocalAdmissionSettings(s => ({...s, autoApproveProspective: e.target.checked}))} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-logip-text-header dark:text-dark-text-primary text-sm">Auto-Approve Protocol Requests</p>
                                    <p className="text-xs text-logip-text-subtle">Automatically approve new protocol applications without manual review.</p>
                                </div>
                                <ToggleSwitch checked={localAdmissionSettings.autoApproveProtocol} onChange={e => setLocalAdmissionSettings(s => ({...s, autoApproveProtocol: e.target.checked}))} />
                            </div>
                        </div>
                    </div>

                    <hr className="border-logip-border dark:border-dark-border" />

                    {/* Credential Generation Policy - RESTORED FULL FEATURE */}
                    <div>
                        <h4 className="text-sm font-bold text-logip-text-header dark:text-dark-text-primary mb-4 uppercase tracking-tight">Credential Generation Policy</h4>
                        <p className="text-sm text-logip-text-subtle dark:text-dark-text-secondary mb-6">Configure the format and length of student login credentials (Serial Number and PIN).</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h5 className="font-bold text-sm text-logip-primary uppercase tracking-wider">Serial Number Settings</h5>
                                <AdminFormField label="Serial Number Format">
                                    <AdminSelect 
                                        value={localAdmissionSettings.serialNumberFormat} 
                                        onChange={e => setLocalAdmissionSettings(s => ({...s, serialNumberFormat: e.target.value as any}))}
                                    >
                                        <option value="numeric">Numeric (0-9)</option>
                                        <option value="alphabetic">Alphabetic (A-Z)</option>
                                        <option value="alphanumeric">Alphanumeric (A-Z, 0-9)</option>
                                    </AdminSelect>
                                </AdminFormField>
                                <AdminFormField label="Serial Number Length">
                                    <AdminInput 
                                        type="number" 
                                        min={4} 
                                        max={16} 
                                        value={localAdmissionSettings.serialNumberLength} 
                                        onChange={e => setLocalAdmissionSettings(s => ({...s, serialNumberLength: parseInt(e.target.value, 10) || 10}))}
                                    />
                                </AdminFormField>
                            </div>
                            
                            <div className="space-y-6">
                                <h5 className="font-bold text-sm text-logip-primary uppercase tracking-wider">PIN Settings</h5>
                                <AdminFormField label="PIN Format">
                                    <AdminSelect 
                                        value={localAdmissionSettings.pinFormat} 
                                        onChange={e => setLocalAdmissionSettings(s => ({...s, pinFormat: e.target.value as any}))}
                                    >
                                        <option value="numeric">Numeric (0-9)</option>
                                        <option value="alphabetic">Alphabetic (A-Z)</option>
                                        <option value="alphanumeric">Alphanumeric (A-Z, 0-9)</option>
                                    </AdminSelect>
                                </AdminFormField>
                                <AdminFormField label="PIN Length">
                                    <AdminInput 
                                        type="number" 
                                        min={4} 
                                        max={8} 
                                        value={localAdmissionSettings.pinLength} 
                                        onChange={e => setLocalAdmissionSettings(s => ({...s, pinLength: parseInt(e.target.value, 10) || 5}))}
                                    />
                                </AdminFormField>
                            </div>
                        </div>
                    </div>

                    <hr className="border-logip-border dark:border-dark-border" />

                    {/* Verification Failed Notification Message - RESTORED FULL FEATURE */}
                    <div>
                        <h4 className="text-sm font-bold text-logip-text-header dark:text-dark-text-primary mb-4 uppercase tracking-tight">Verification Failed Notification Message</h4>
                        <p className="text-sm text-logip-text-subtle dark:text-dark-text-secondary mb-4">Customize the error message shown to students when their index number or name is not found in the system.</p>
                        <AdminFormField label="Custom Error Message (Optional)">
                            <AdminTextarea 
                                value={localAdmissionSettings.verificationErrorMessage || ''} 
                                onChange={e => setLocalAdmissionSettings(s => ({...s, verificationErrorMessage: e.target.value}))} 
                                placeholder="e.g. Record not found. Please contact the school administration on..."
                                rows={4}
                            />
                            <p className="text-xs text-logip-text-subtle dark:text-dark-text-secondary mt-2 italic">If left blank, the system will show a standard error message with school contact details.</p>
                        </AdminFormField>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-logip-border dark:border-dark-border flex justify-end">
                    <button onClick={handleSaveAdmissionSettings} className="px-6 py-2.5 text-base font-bold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover shadow-md">
                        Save Configuration
                    </button>
                </div>
            </div>

            {/* Housing & Dormitory Settings */}
            <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary mb-2">Housing & Dormitory Settings</h3>
                <p className="text-sm text-logip-text-subtle dark:text-dark-text-secondary mb-6">Configure how students are assigned to residential facilities.</p>
                
                <div className="space-y-8">
                    {/* House Assignment Method */}
                    <div>
                        <label className="block text-sm font-bold text-logip-text-header dark:text-dark-text-primary mb-4 uppercase tracking-tight">House Assignment Method</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <RadioCard 
                                title="Automatic" 
                                description="System assigns houses in a balanced round-robin fashion upon submission." 
                                value="automatic" 
                                selectedValue={localAdmissionSettings.houseAssignmentMethod} 
                                onClick={(val) => setLocalAdmissionSettings(s => ({...s, houseAssignmentMethod: val as any}))} 
                            />
                            <RadioCard 
                                title="Student Choice" 
                                description="Students select their preferred house from available options during registration." 
                                value="student_choice" 
                                selectedValue={localAdmissionSettings.houseAssignmentMethod} 
                                onClick={(val) => setLocalAdmissionSettings(s => ({...s, houseAssignmentMethod: val as any}))} 
                            />
                            <RadioCard 
                                title="Manual" 
                                description="Administrators must manually assign houses to students via the dashboard." 
                                value="manual" 
                                selectedValue={localAdmissionSettings.houseAssignmentMethod} 
                                onClick={(val) => setLocalAdmissionSettings(s => ({...s, houseAssignmentMethod: val as any}))} 
                            />
                        </div>
                    </div>

                    <hr className="border-logip-border dark:border-dark-border" />

                    {/* Room Management Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-logip-text-header dark:text-dark-text-primary text-base">Enable Room (Dorm) Management</p>
                            <p className="text-sm text-logip-text-subtle">Allow assigning students to specific rooms within their houses.</p>
                        </div>
                        <ToggleSwitch 
                            checked={localAdmissionSettings.enableRoomManagement} 
                            onChange={e => setLocalAdmissionSettings(s => ({...s, enableRoomManagement: e.target.checked}))} 
                        />
                    </div>

                    {/* Dorm Assignment Method - Only if room management is enabled */}
                    {localAdmissionSettings.enableRoomManagement && (
                        <div className="animate-fadeIn pt-4">
                            <label className="block text-sm font-bold text-logip-text-header dark:text-dark-text-primary mb-4 uppercase tracking-tight">Room Assignment Method</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <RadioCard 
                                    title="Automatic" 
                                    description="System assigns rooms within the house based on available capacity." 
                                    value="automatic" 
                                    selectedValue={localAdmissionSettings.dormAssignmentMethod} 
                                    onClick={(val) => setLocalAdmissionSettings(s => ({...s, dormAssignmentMethod: val as any}))} 
                                />
                                <RadioCard 
                                    title="Student Choice" 
                                    description="Students can pick their preferred room from available ones in their house." 
                                    value="student_choice" 
                                    selectedValue={localAdmissionSettings.dormAssignmentMethod} 
                                    onClick={(val) => setLocalAdmissionSettings(s => ({...s, dormAssignmentMethod: val as any}))} 
                                />
                                <RadioCard 
                                    title="Manual" 
                                    description="Rooms must be assigned by administrators after the house is confirmed." 
                                    value="manual" 
                                    selectedValue={localAdmissionSettings.dormAssignmentMethod} 
                                    onClick={(val) => setLocalAdmissionSettings(s => ({...s, dormAssignmentMethod: val as any}))} 
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-logip-border dark:border-dark-border flex justify-end">
                    <button onClick={handleSaveAdmissionSettings} className="px-6 py-2.5 text-base font-bold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover shadow-md">
                        Save Housing Policy
                    </button>
                </div>
            </div>

            {/* Session Management */}
            <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary mb-2">Session Management</h3>
                <p className="text-sm text-logip-text-subtle dark:text-dark-text-secondary mb-6">Security actions for active user sessions.</p>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-4xl text-orange-500">logout</span>
                        <div>
                            <p className="font-bold text-orange-800 dark:text-orange-300">Force Global Logout</p>
                            <p className="text-xs text-orange-700/70 dark:text-orange-400/70">Disconnect all students currently logged into {selectedAdmission?.title}.</p>
                        </div>
                    </div>
                    <button onClick={() => setIsLogoutConfirmOpen(true)} className="px-5 py-2 text-sm font-bold rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors">
                        Force Logout
                    </button>
                </div>
            </div>

            {/* Notification System */}
            <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary mb-2">Notification System</h3>
                <p className="text-sm text-logip-text-subtle dark:text-dark-text-secondary mb-6">Manage on-screen alerts, banners, and video announcements for applicants.</p>
                
                <div className="space-y-10">
                    {/* Scrolling Banner */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-blue-500">text_rotation_none</span>
                                <h4 className="font-bold text-logip-text-header dark:text-dark-text-primary">Scrolling Announcement Banner</h4>
                            </div>
                            <ToggleSwitch checked={scrollingBanner.enabled} onChange={e => setScrollingBanner(s => ({...s, enabled: e.target.checked}))} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AdminFormField label="Banner Text"><AdminInput value={scrollingBanner.text} onChange={e => setScrollingBanner(s => ({...s, text: e.target.value}))} placeholder="Enter scrolling message..." /></AdminFormField>
                            <AdminFormField label="Display Position">
                                <AdminSelect value={scrollingBanner.position} onChange={e => setScrollingBanner(s => ({...s, position: e.target.value as any}))}>
                                    <option value="top">Fixed Top</option>
                                    <option value="bottom">Fixed Bottom</option>
                                </AdminSelect>
                            </AdminFormField>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                             <AdminFormField label="Text Color"><AdminInput type="color" value={scrollingBanner.textColor} onChange={e => setScrollingBanner(s => ({...s, textColor: e.target.value}))} /></AdminFormField>
                             <AdminFormField label="Background Color"><AdminInput type="color" value={scrollingBanner.backgroundColor} onChange={e => setScrollingBanner(s => ({...s, backgroundColor: e.target.value}))} /></AdminFormField>
                             <AdminFormField label="Scroll Speed (Seconds)"><AdminInput type="number" value={scrollingBanner.speed} onChange={e => setScrollingBanner(s => ({...s, speed: parseInt(e.target.value, 10)}))} /></AdminFormField>
                             <div className="pt-6"><button onClick={() => setIsPreviewScrollOpen(true)} className="w-full py-2 px-4 text-sm font-bold border border-logip-border dark:border-dark-border rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg">Preview Banner</button></div>
                        </div>
                        <div>
                             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Target Pages</p>
                             <PageTargetSelector selectedPages={scrollingBanner.targetPages} onChange={pages => setScrollingBanner(s => ({...s, targetPages: pages}))} />
                        </div>
                    </div>

                    <hr className="border-logip-border dark:border-dark-border" />

                    {/* Pop-up Alert */}
                    <div className="space-y-6">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-blue-500">notification_important</span>
                                <h4 className="font-bold text-logip-text-header dark:text-dark-text-primary">Important Pop-up Alert</h4>
                            </div>
                            <ToggleSwitch checked={popupBanner.enabled} onChange={e => setPopupBanner(s => ({...s, enabled: e.target.checked}))} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <AdminFormField label="Alert Title"><AdminInput value={popupBanner.title} onChange={e => setPopupBanner(s => ({...s, title: e.target.value}))} /></AdminFormField>
                             <AdminFormField label="Frequency">
                                <AdminSelect value={popupBanner.frequency} onChange={e => setPopupBanner(s => ({...s, frequency: e.target.value as any}))}>
                                    <option value="always">Always Show</option>
                                    <option value="once">Show Once per session</option>
                                </AdminSelect>
                             </AdminFormField>
                        </div>
                        <AdminFormField label="Alert Message"><AdminTextarea value={popupBanner.message} onChange={e => setPopupBanner(s => ({...s, message: e.target.value}))} rows={3}/></AdminFormField>
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                             <AdminFormField label="Icon (Material Name)"><AdminInput value={popupBanner.icon} onChange={e => setPopupBanner(s => ({...s, icon: e.target.value}))} /></AdminFormField>
                             <AdminFormField label="Icon Color"><AdminInput type="color" value={popupBanner.iconColor} onChange={e => setPopupBanner(s => ({...s, iconColor: e.target.value}))} /></AdminFormField>
                             <AdminFormField label="Pop-up Style">
                                <AdminSelect value={popupBanner.popupStyle} onChange={e => setPopupBanner(s => ({...s, popupStyle: e.target.value as any}))}>
                                    <option value="standard">Standard Box</option>
                                    <option value="modern">Split with Image</option>
                                    <option value="flyer">Full Flyer</option>
                                </AdminSelect>
                             </AdminFormField>
                             <div className="pt-6"><button onClick={() => setIsPreviewPopupOpen(true)} className="w-full py-2 px-4 text-sm font-bold border border-logip-border dark:border-dark-border rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Preview Alert</button></div>
                        </div>
                        <div>
                             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Target Pages</p>
                             <PageTargetSelector selectedPages={popupBanner.targetPages} onChange={pages => setPopupBanner(s => ({...s, targetPages: pages}))} />
                        </div>
                    </div>

                    <hr className="border-logip-border dark:border-dark-border" />

                    {/* Video Announcement */}
                    <div className="space-y-6">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-blue-500">video_library</span>
                                <h4 className="font-bold text-logip-text-header dark:text-dark-text-primary">Video Announcement (MP4)</h4>
                            </div>
                            <ToggleSwitch checked={videoNotification.enabled} onChange={e => setVideoNotification(s => ({...s, enabled: e.target.checked}))} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-2">
                                 <AdminFormField label="Video URL (Public MP4 Link)"><AdminInput value={videoNotification.url} onChange={e => setVideoNotification(s => ({...s, url: e.target.value}))} placeholder="https://..." /></AdminFormField>
                            </div>
                             <AdminFormField label="Auto-play on load">
                                <AdminSelect value={videoNotification.autoplay ? 'true' : 'false'} onChange={e => setVideoNotification(s => ({...s, autoplay: e.target.value === 'true'}))}>
                                    <option value="true">Enabled</option>
                                    <option value="false">Disabled</option>
                                </AdminSelect>
                             </AdminFormField>
                             <div className="pt-6"><button onClick={() => setIsPreviewVideoOpen(true)} className="w-full py-2 px-4 text-sm font-bold border border-logip-border dark:border-dark-border rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Preview Player</button></div>
                        </div>
                         <div>
                             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Target Pages</p>
                             <PageTargetSelector selectedPages={videoNotification.targetPages} onChange={pages => setVideoNotification(s => ({...s, targetPages: pages}))} />
                        </div>
                    </div>
                </div>
                <div className="mt-10 pt-6 border-t border-logip-border dark:border-dark-border flex justify-end gap-4">
                    <button onClick={() => { setScrollingBanner({...scrollingBanner}); setPopupBanner({...popupBanner}); setVideoNotification({...videoNotification}); showToast('Notifications updated portal-wide.', 'success'); }} className="px-6 py-2.5 text-base font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md">Update Notifications</button>
                </div>
            </div>

            {/* Cyber Security monitor */}
            <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border overflow-hidden">
                <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary mb-2">Cyber Security monitor</h3>
                <p className="text-sm text-logip-text-subtle dark:text-dark-text-secondary mb-6">Real-time tracking of failed access attempts and security risks.</p>
                <div className="overflow-x-auto no-scrollbar -mx-6 px-6">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="border-b border-logip-border dark:border-dark-border bg-gray-50 dark:bg-white/5">
                                <th className="p-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Status</th>
                                <th className="p-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Timestamp</th>
                                <th className="p-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Risk Type</th>
                                <th className="p-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Target</th>
                                <th className="p-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Action Taken</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-logip-border dark:divide-dark-border">
                            {securityLogs.length > 0 ? (
                                securityLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg/40">
                                        <td className="p-4"><div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div></td>
                                        <td className="p-4 text-sm text-logip-text-body dark:text-gray-300 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="p-4 text-sm font-bold text-red-600 dark:text-red-400">{log.riskType}</td>
                                        <td className="p-4 text-sm text-logip-text-header dark:text-gray-100 font-medium">{log.target}</td>
                                        <td className="p-4 text-sm text-logip-text-subtle dark:text-gray-400 italic">{log.action}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-logip-text-subtle italic">No recent security risks detected.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex justify-end">
                    <button onClick={() => setSecurityLogs([])} className="text-xs font-bold text-red-500 hover:underline uppercase tracking-widest">Clear Logs</button>
                </div>
            </div>

             {/* Browsing Monitor */}
            <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary">Browsing Monitor</h3>
                        <p className="text-sm text-logip-text-subtle dark:text-dark-text-secondary">Tracking visitor IP addresses and geolocation for security.</p>
                    </div>
                    <div className="relative w-full md:w-64">
                         <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                         <AdminInput value={browsingSearchTerm} onChange={e => setBrowsingSearchTerm(e.target.value)} placeholder="Filter logs..." className="pl-10 !py-1.5 !text-sm" />
                    </div>
                </div>
                <div className="overflow-x-auto no-scrollbar -mx-6 px-6">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="border-b border-logip-border dark:border-dark-border bg-gray-50 dark:bg-white/5">
                                <th className="p-4 text-xs font-bold uppercase text-gray-500 tracking-wider">IP Address</th>
                                <th className="p-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Country</th>
                                <th className="p-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Town/City</th>
                                <th className="p-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Timestamp</th>
                                <th className="p-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Device/Browser</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-logip-border dark:divide-dark-border">
                            {paginatedBrowsingLogs.length > 0 ? (
                                paginatedBrowsingLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg/40">
                                        <td className="p-4 text-sm font-mono text-logip-text-header dark:text-gray-100">{log.ipAddress}</td>
                                        <td className="p-4 text-sm text-logip-text-body dark:text-gray-300">{log.country}</td>
                                        <td className="p-4 text-sm text-logip-text-body dark:text-gray-300">{log.town}</td>
                                        <td className="p-4 text-sm text-logip-text-subtle dark:text-gray-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="p-4 text-sm text-logip-text-subtle dark:text-gray-400 truncate max-w-[200px]" title={log.device}>{log.device}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-logip-text-subtle italic">No browsing logs found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                 <div className="p-4 border-t border-logip-border dark:border-dark-border flex items-center justify-between">
                     <PaginationControls
                        currentPage={browsingPage}
                        totalPages={totalBrowsingPages}
                        onPageChange={setBrowsingPage}
                        totalItems={filteredBrowsingLogs.length}
                        itemsPerPage={browsingItemsPerPage}
                        onItemsPerPageChange={setBrowsingItemsPerPage}
                        startItem={browsingStartIndex + 1}
                        endItem={Math.min(browsingStartIndex + browsingItemsPerPage, filteredBrowsingLogs.length)}
                    />
                </div>
            </div>

            {/* Modals & Previews */}
            <ConfirmationModal isOpen={isLogoutConfirmOpen} onClose={() => setIsLogoutConfirmOpen(false)} onConfirm={handleForceLogout} title="Force Global Logout" confirmButtonClass="bg-orange-600 hover:bg-orange-700">
                Are you sure you want to <strong>force logout all active applicants</strong> for {selectedAdmission?.title}? All unsaved progress will be lost.
            </ConfirmationModal>
            
            {isPreviewScrollOpen && <ScrollingBannerPreviewModal isOpen={true} onClose={() => setIsPreviewScrollOpen(false)} settings={scrollingBanner} />}
            {isPreviewPopupOpen && <NotificationPreviewModal isOpen={true} onClose={() => setIsPreviewPopupOpen(false)} title={popupBanner.title || 'Alert Title'} message={popupBanner.message || 'This is the message students will see.'} icon={popupBanner.icon} iconColor={popupBanner.iconColor} style={popupBanner.popupStyle} />}
            {/* FIX: Corrected undefined state setter 'setIsVideoNotificationVisible' to 'setIsPreviewVideoOpen(false)' */}
            {isPreviewVideoOpen && <VideoPreviewModal isOpen={true} onClose={() => setIsPreviewVideoOpen(false)} url={videoNotification.url || ''} autoplay={videoNotification.autoplay || false} isDraggable={true} />}
        </div>
    );
};

export default SecuritySettingsTab;
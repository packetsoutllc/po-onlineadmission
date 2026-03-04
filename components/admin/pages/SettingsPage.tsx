
import React, { useState, useMemo, useEffect, useRef } from 'react';
import ConfirmationModal from '../shared/ConfirmationModal';
import SchoolFormModal from '../shared/SchoolFormModal';
import AdmissionFormModal from '../shared/AdmissionFormModal';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../shared/ToastContext';
import BackupSettingsTab from './BackupSettingsTab';
import AiFeaturesSettingsTab from './AiFeaturesSettingsTab';
import SmsSettingsTab from './SmsSettingsTab';
import FinancialsSettingsTab from './FinancialsSettingsTab';
import SecuritySettingsTab from './SecuritySettingsTab';
import AdmissionDocTab from './AdmissionDocTab';
import UserProfileSettingsTab from './UserProfileSettingsTab';
import { AdminUser } from '../AdminLayout';
import ApplicationDashboardSettings from './ApplicationDashboardSettings';
import { logActivity } from '../../../utils/storage';

// --- TYPE DEFINITIONS & MOCK DATA (CENTRALIZED) ---
export interface Admission {
  id: string;
  schoolId: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  authMethod: string;
  status: 'Active' | 'Archived';
  applicantsPlaced: number;
  studentsAdmitted: number;
  indexHint?: string;
  headOfSchoolNumber?: string;
  headOfItNumber?: string;
}

export interface School {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  status: 'Active' | 'Inactive';
  dateCreated: string;
  homeRegion?: string;
}

export const GHANA_REGIONS = [
    'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern',
    'Greater Accra', 'North East', 'Northern', 'Oti', 'Savannah',
    'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'
];

export const initialSchools: School[] = [
    { id: 's1', name: 'Peki Senior High School', slug: 'peki-senior-high', status: 'Active', logo: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=200&h=200&auto=format&fit=crop', dateCreated: '2023-05-10', homeRegion: 'Volta' },
    { id: 's2', name: 'Accra Academy', slug: 'accra-academy', status: 'Inactive', dateCreated: '2023-06-15', homeRegion: 'Greater Accra' },
    { id: 's3', name: 'Mfantsipim School', slug: 'mfantsipim-school', status: 'Active', dateCreated: '2023-07-20', homeRegion: 'Central' },
    { id: 's4', name: 'Peki Secondary Technical', slug: 'peki-sectech', status: 'Active', dateCreated: '2024-01-05', homeRegion: 'Volta' },
];

export const initialAdmissions: Admission[] = [
    { id: 'a1', schoolId: 's1', title: '2025 Admissions', slug: '2025-admissions', description: '', date: '2025-01-01', authMethod: 'Index number only', status: 'Active', applicantsPlaced: 400, studentsAdmitted: 350, indexHint: 'Add the year you completed JHS\nExample: xxxxxxxxxxxx25', headOfSchoolNumber: '0244889791', headOfItNumber: '0243339546' },
    { id: 'a2', schoolId: 's1', title: '2024 Protocol', slug: '2024-protocol', description: '', date: '2024-01-01', authMethod: 'Index number only', status: 'Archived', applicantsPlaced: 30, studentsAdmitted: 25, indexHint: 'Add the year you completed JHS\nExample: xxxxxxxxxxxx24', headOfSchoolNumber: '0244889791', headOfItNumber: '0243339546' },
    { id: 'a3', schoolId: 's2', title: '2025 Admissions', slug: '2025-admissions', description: '', date: '2025-01-01', authMethod: 'Index number only', status: 'Archived', applicantsPlaced: 450, studentsAdmitted: 410, indexHint: '', headOfSchoolNumber: '0200000000', headOfItNumber: '0201111111' },
    { id: 'a4', schoolId: 's3', title: '2025 Regular Intake', slug: '2025-regular', description: '', date: '2025-01-01', authMethod: 'Index number only', status: 'Active', applicantsPlaced: 550, studentsAdmitted: 520, indexHint: '', headOfSchoolNumber: '0550000000', headOfItNumber: '0551111111' },
    { id: 'a5', schoolId: 's3', title: '2025 Boarding Intake', slug: '2025-boarding', description: '', date: '2025-01-01', authMethod: 'Index number only', status: 'Active', applicantsPlaced: 500, studentsAdmitted: 480, indexHint: '', headOfSchoolNumber: '0550000000', headOfItNumber: '0551111111' },
    { id: 'a6', schoolId: 's4', title: '2025 Admissions', slug: '2025-admissions', description: '', date: '2025-01-01', authMethod: 'Index number only', status: 'Active', applicantsPlaced: 200, studentsAdmitted: 180, indexHint: '', headOfSchoolNumber: '0240000000', headOfItNumber: '0241111111' },
];

// --- SUB-COMPONENTS ---

const SettingsTab: React.FC<{ icon: string; label: string; active?: boolean; onClick: () => void; }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${active ? 'bg-blue-100 text-blue-700 dark:bg-blue-600/10 dark:text-blue-400' : 'text-logip-text-body dark:text-dark-text-secondary hover:bg-logip-border dark:hover:bg-dark-border/50'}`}>
    <span className="material-symbols-outlined text-xl">{icon}</span>
    <span>{label}</span>
  </button>
);

const ActionButton: React.FC<{ icon: string; onClick: (e: React.MouseEvent) => void; title: string; className?: string }> = ({ icon, onClick, title, className='' }) => (
    <button onClick={onClick} title={title} className={`w-7 h-7 flex items-center justify-center rounded-lg text-logip-text-subtle hover:bg-logip-border hover:text-logip-text-header dark:text-dark-text-secondary dark:hover:bg-dark-border dark:hover:text-dark-text-primary transition-colors ${className}`}>
        <span className="material-symbols-outlined text-lg">{icon}</span>
    </button>
);

const SelectedItemDisplay: React.FC<{
  item: { id: string, name: string, status?: string, logo?: string, icon?: string } | null;
  type: 'school' | 'admission' | 'region';
  isOpen: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddChild?: () => void;
  onToggleStatus?: () => void;
  onCopyLink?: () => void;
  disabled?: boolean;
}> = ({ item, type, isOpen, onClick, onEdit, onDelete, onAddChild, onToggleStatus, onCopyLink, disabled }) => {
    if (!item && type !== 'region') {
        return <div className="p-3 text-center text-logip-text-subtle dark:text-dark-text-secondary">No {type} selected.</div>;
    }
    
    const isActive = item?.status === 'Active';
    const statusPillClass = isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400';
    const stopPropagation = (fn?: Function) => (e: React.MouseEvent) => {
        if (!fn) return;
        e.stopPropagation();
        fn();
    };

    const mainIcon = type === 'school' ? 'apartment' : type === 'admission' ? 'assignment_ind' : 'public';

    return (
        <div 
            onClick={disabled ? undefined : onClick} 
            className={`p-3 rounded-lg border-2 transition-all ${disabled ? 'cursor-default border-logip-border bg-gray-50 dark:bg-dark-bg opacity-90' : isOpen ? 'border-logip-primary ring-2 ring-logip-primary/20' : 'border-logip-border bg-logip-white dark:border-dark-border dark:bg-dark-surface hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer'}`}
        >
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg bg-logip-border dark:bg-dark-border">
                    {item?.logo ? <img src={item.logo} alt={item.name} className="w-full h-full object-contain p-0.5" /> : <span className={`material-symbols-outlined text-xl text-logip-text-subtle dark:text-dark-text-secondary`}>{item?.icon || mainIcon}</span>}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-logip-text-header dark:text-dark-text-primary truncate">{item?.name || 'All Regions'}</p>
                </div>
                {item?.status && (
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${statusPillClass}`}>{item.status}</span>
                )}
                <div className="flex items-center gap-1">
                    {onCopyLink && <ActionButton icon="link" title="Copy Portal Link" onClick={stopPropagation(onCopyLink)} />}
                    {onToggleStatus && <ActionButton icon={isActive ? 'archive' : 'unarchive'} title={isActive ? 'Deactivate' : 'Activate'} onClick={stopPropagation(onToggleStatus)} />}
                    {onAddChild && <ActionButton icon="add" title={type === 'school' ? 'Add School' : 'Add Admission'} onClick={stopPropagation(onAddChild)} />}
                    {onEdit && <ActionButton icon="edit" title="Edit" onClick={stopPropagation(onEdit)} />}
                    {onDelete && <ActionButton icon="delete" title="Delete" onClick={stopPropagation(onDelete)} />}
                </div>
                {!disabled && (
                    <span className="material-symbols-outlined text-logip-text-subtle ml-2">expand_more</span>
                )}
                {disabled && (
                    <span className="material-symbols-outlined text-gray-400 dark:text-gray-600 ml-2 text-sm">lock</span>
                )}
            </div>
        </div>
    );
};

function useOnClickOutside(ref: React.RefObject<HTMLElement | null>, handler: (event: MouseEvent | TouchEvent) => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// --- MAIN PAGE COMPONENT ---

interface SettingsPageProps {
  selectedSchool?: School | null;
  selectedAdmission?: Admission | null;
  setSelectedSchoolId: (id: string | null) => void;
  setSelectedAdmissionId: (id: string | null) => void;
  schools: School[];
  setSchools: React.Dispatch<React.SetStateAction<School[]>>;
  admissions: Admission[];
  setAdmissions: React.Dispatch<React.SetStateAction<Admission[]>>;
  adminUser: AdminUser;
  setAdminUser: React.Dispatch<React.SetStateAction<AdminUser | null>>;
  onExitAdmin: () => void;
  permissions: Set<string>;
  isSuperAdmin: boolean;
}

const SETTINGS_TABS_PERMS: Record<string, string> = {
    'Setup': 'tab:set:setup',
    'SMS': 'tab:set:sms',
    'Financials': 'tab:set:fin',
    'Admission Doc': 'tab:set:doc',
    'AI Features': 'tab:set:ai',
    'Backup': 'tab:set:bak',
    'Security': 'tab:set:sec',
    'User Profile': 'tab:set:prof'
};

const SettingsPage: React.FC<SettingsPageProps> = ({ selectedSchool, selectedAdmission, setSelectedSchoolId, setSelectedAdmissionId, schools, setSchools, admissions, setAdmissions, adminUser, setAdminUser, onExitAdmin, permissions, isSuperAdmin }) => {
    const { showToast } = useToast();
    
    const availableTabs = useMemo(() => {
        return Object.keys(SETTINGS_TABS_PERMS).filter(tab => 
            isSuperAdmin || permissions.has(SETTINGS_TABS_PERMS[tab])
        );
    }, [isSuperAdmin, permissions]);

    const [activeTab, setActiveTab] = useState(availableTabs[0] || 'User Profile');

    useEffect(() => {
        if (!availableTabs.includes(activeTab) && availableTabs.length > 0) {
            setActiveTab(availableTabs[0]);
        }
    }, [availableTabs, activeTab]);

    const [modalState, setModalState] = useState<{
        mode: 'addSchool' | 'editSchool' | 'deleteSchool' | 'addAdmission' | 'editAdmission' | 'deleteAdmission' | null;
        item: School | Admission | { schoolId: string } | null;
    }>({ mode: null, item: null });
    
    const [selectedRegion, setSelectedRegion] = useState<string>('all');
    const [isRegionListOpen, setIsRegionListOpen] = useState(false);
    const [isSchoolListOpen, setIsSchoolListOpen] = useState(false);
    const [isAdmissionListOpen, setIsAdmissionListOpen] = useState(false);
    
    const regionListRef = useRef<HTMLDivElement>(null);
    const schoolListRef = useRef<HTMLDivElement>(null);
    const admissionListRef = useRef<HTMLDivElement>(null);
    
    useOnClickOutside(regionListRef, () => setIsRegionListOpen(false));
    useOnClickOutside(schoolListRef, () => setIsSchoolListOpen(false));
    useOnClickOutside(admissionListRef, () => setIsAdmissionListOpen(false));

    const displaySchools = useMemo(() => {
        let list = isSuperAdmin ? schools : schools.filter(s => s.status === 'Active');
        if (selectedRegion !== 'all') {
            list = list.filter(s => s.homeRegion === selectedRegion);
        }
        return list;
    }, [isSuperAdmin, schools, selectedRegion]);

    const relevantAdmissions = useMemo(() => {
        const list = admissions.filter(a => a.schoolId === selectedSchool?.id);
        return isSuperAdmin ? list : list.filter(a => a.status === 'Active');
    }, [admissions, selectedSchool, isSuperAdmin]);

    const hasGlobalAdmissionScope = isSuperAdmin || adminUser.admissionId === 'none' || !adminUser.admissionId;

    const portalUrl = useMemo(() => {
        if (!selectedSchool || !selectedAdmission) return '';
        
        // Custom domain support:
        // If a customDomain is configured on the admission, use it as the base URL.
        // Otherwise, fall back to current origin + /schoolSlug/admissionSlug.
        const anyAdmission = admissions.find(a => a.id === selectedAdmission.id);
        const customDomain = (anyAdmission as any)?.customDomain as string | undefined;
        if (customDomain && customDomain.trim()) {
            const trimmed = customDomain.trim().replace(/\/$/, '');
            return `${trimmed}`;
        }

        const url = new URL(window.location.href);
        const baseOrigin = url.origin;
        return `${baseOrigin}/${selectedSchool.slug}/${selectedAdmission.slug}`;
    }, [selectedSchool, selectedAdmission, admissions]);

    const handleCopyLink = () => {
        if (!portalUrl) return;
        navigator.clipboard.writeText(portalUrl);
        showToast('Portal link copied to clipboard!', 'success');
    };

    const handleEditPortalLink = () => {
        if (!selectedAdmission) return;
        const current = admissions.find(a => a.id === selectedAdmission.id) as any;
        const existingCustomDomain = current?.customDomain || '';
        const userInput = window.prompt(
            'Enter the full custom domain URL where this admission portal will be hosted (e.g., https://admissions.yourschool.edu/2025-intake). Leave blank to use the default Packets Out portal link.',
            existingCustomDomain
        );
        if (userInput === null) return;

        const trimmed = userInput.trim();
        const updatedAdmissions = admissions.map(a =>
            a.id === selectedAdmission.id ? ({ ...(a as any), customDomain: trimmed } as Admission) : a
        );
        setAdmissions(updatedAdmissions);
        showToast('Public portal link updated.', 'success');
    };

    const handleOpenModal = (mode: typeof modalState.mode, item: typeof modalState.item) => {
        setModalState({ mode, item });
    };

    const handleCloseModal = () => setModalState({ mode: null, item: null });
    
    const handleSaveSchool = (formData: Omit<School, 'id' | 'dateCreated'>) => {
        if (modalState.mode === 'editSchool' && modalState.item && 'dateCreated' in modalState.item) {
            const updatedSchool = { ...(modalState.item as School), ...formData };
            setSchools(schools.map(s => s.id === updatedSchool.id ? updatedSchool : s));
            showToast(`School "${formData.name}" updated successfully.`, 'success');
            logActivity(
                { name: adminUser.name, avatar: adminUser.avatar || '' },
                'updated school configuration for',
                'system_settings',
                formData.name
            );
        } else {
            const newSchool: School = { id: `s${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, dateCreated: new Date().toISOString().split('T')[0], ...formData };
            setSchools([newSchool, ...schools]);
            setSelectedSchoolId(newSchool.id);
            showToast(`School "${formData.name}" created successfully.`, 'success');
            logActivity(
                { name: adminUser.name, avatar: adminUser.avatar || '' },
                'created a new school:',
                'system_settings',
                formData.name
            );
        }
        handleCloseModal();
    };
    
    const handleSaveAdmission = (formData: Omit<Admission, 'id' | 'applicantsPlaced' | 'studentsAdmitted'>) => {
        if (modalState.mode === 'editAdmission' && modalState.item && 'applicantsPlaced' in modalState.item) {
            const updatedAdmission = { ...(modalState.item as Admission), ...formData };
            setAdmissions(admissions.map(a => a.id === updatedAdmission.id ? updatedAdmission : a));
            showToast(`Admission "${formData.title}" updated successfully.`, 'success');
            logActivity(
                { name: adminUser.name, avatar: adminUser.avatar || '' },
                'updated admission type for',
                'system_settings',
                `${formData.title} (${selectedSchool?.name})`,
                selectedSchool?.id
            );
        } else {
            const newAdmission: Admission = { id: `a${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, applicantsPlaced: 0, studentsAdmitted: 0, ...formData };
            setAdmissions([newAdmission, ...admissions]);
            setSelectedAdmissionId(newAdmission.id);
            showToast(`Admission "${formData.title}" created successfully.`, 'success');
            logActivity(
                { name: adminUser.name, avatar: adminUser.avatar || '' },
                'created a new admission period:',
                'system_settings',
                `${formData.title} for ${selectedSchool?.name}`,
                selectedSchool?.id
            );
        }
        handleCloseModal();
    };

    const handleDelete = () => {
        if (!modalState.item) return;
        if (modalState.mode === 'deleteSchool') {
            const schoolId = (modalState.item as School).id;
            const schoolName = (modalState.item as School).name;
            const remainingSchools = schools.filter(s => s.id !== schoolId);
            setSchools(remainingSchools);
            setAdmissions(admissions.filter(a => a.schoolId !== schoolId));
            if (selectedSchool?.id === schoolId) {
                setSelectedSchoolId(remainingSchools[0]?.id || null);
            }
            showToast(`School "${schoolName}" deleted.`, 'success');
            logActivity(
                { name: adminUser.name, avatar: adminUser.avatar || '' },
                'deleted school:',
                'system_settings',
                schoolName
            );
        }
        if (modalState.mode === 'deleteAdmission') {
            const admissionId = (modalState.item as Admission).id;
            const admissionTitle = (modalState.item as Admission).title;
            setAdmissions(admissions.filter(a => a.id !== admissionId));
            showToast(`Admission "${admissionTitle}" deleted.`, 'success');
            logActivity(
                { name: adminUser.name, avatar: adminUser.avatar || '' },
                'deleted admission type:',
                'system_settings',
                `${admissionTitle} (${selectedSchool?.name})`,
                selectedSchool?.id
            );
        }
        handleCloseModal();
    };

    const handleToggleAdmissionStatus = (admissionToToggle: Admission) => {
        const newStatus = admissionToToggle.status === 'Active' ? 'Archived' : 'Active';
        setAdmissions(admissions.map(a => 
            a.id === admissionToToggle.id 
            ? { ...a, status: newStatus } 
            : a
        ));
        showToast(`Admission status changed to ${newStatus}.`, 'success');
        logActivity(
            { name: adminUser.name, avatar: adminUser.avatar || '' },
            `set admission status to ${newStatus} for`,
            'system_settings',
            admissionToToggle.title,
            selectedSchool?.id
        );
    };

    const handleToggleSchoolStatus = (schoolToToggle: School) => {
        const newStatus = schoolToToggle.status === 'Active' ? 'Inactive' : 'Active';
        setSchools(schools.map(s => 
            s.id === schoolToToggle.id 
            ? { ...s, status: newStatus } 
            : s
        ));
        showToast(`School status changed to ${newStatus}.`, 'success');
        logActivity(
            { name: adminUser.name, avatar: adminUser.avatar || '' },
            `set school status to ${newStatus} for`,
            'system_settings',
            schoolToToggle.name
        );
    };

    const canAddSchool = isSuperAdmin || permissions.has('btn:sch:add');
    const canEditSchool = isSuperAdmin || permissions.has('icon:sch:edit');
    const canDeleteSchool = isSuperAdmin || permissions.has('icon:sch:delete');
    const canAddAdmission = isSuperAdmin || permissions.has('btn:adm:add');
    const canEditAdmission = isSuperAdmin || permissions.has('icon:adm:edit');
    const canDeleteAdmission = isSuperAdmin || permissions.has('icon:adm:delete');
    const canArchiveAdmission = isSuperAdmin || permissions.has('icon:adm:archive');
    const canSeePortalConfig = isSuperAdmin || permissions.has('sec:set:setup');
    const canSeeAppDashSettings = isSuperAdmin || permissions.has('sec:set:app_dash');

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
            <h2 className="text-2xl font-bold text-logip-text-header dark:text-dark-text-primary mb-4 flex-shrink-0">Settings</h2>
            <div className="flex items-center gap-2 border-b border-logip-border dark:border-dark-border pb-4 mb-6 flex-shrink-0 flex-wrap">
                {availableTabs.includes('Setup') && <SettingsTab icon="settings_b_roll" label="Setup" active={activeTab === 'Setup'} onClick={() => setActiveTab('Setup')} />}
                {availableTabs.includes('SMS') && <SettingsTab icon="sms" label="SMS" active={activeTab === 'SMS'} onClick={() => setActiveTab('SMS')} />}
                {availableTabs.includes('Financials') && <SettingsTab icon="paid" label="Financials" active={activeTab === 'Financials'} onClick={() => setActiveTab('Financials')} />}
                {availableTabs.includes('Admission Doc') && <SettingsTab icon="article" label="Admission Doc" active={activeTab === 'Admission Doc'} onClick={() => setActiveTab('Admission Doc')} />}
                {availableTabs.includes('AI Features') && <SettingsTab icon="auto_awesome" label="AI Features" active={activeTab === 'AI Features'} onClick={() => setActiveTab('AI Features')} />}
                {availableTabs.includes('Backup') && <SettingsTab icon="backup" label="Backup" active={activeTab === 'Backup'} onClick={() => setActiveTab('Backup')} />}
                {availableTabs.includes('Security') && <SettingsTab icon="security" label="Security" active={activeTab === 'Security'} onClick={() => setActiveTab('Security')} />}
                {availableTabs.includes('User Profile') && <SettingsTab icon="account_circle" label="User Profile" active={activeTab === 'User Profile'} onClick={() => setActiveTab('User Profile')} />}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                {activeTab === 'Setup' && (
                    <div className='animate-fadeIn space-y-8'>
                        {canSeePortalConfig && (
                             <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border shadow-sm">
                                <h3 className="flex items-center gap-3 text-xl font-bold text-logip-text-header dark:text-dark-text-primary">
                                    <span className="material-symbols-outlined text-2xl">list_alt</span>
                                    School & Admission Type Setup
                                </h3>
                                <div className="flex flex-col lg:flex-row gap-6 mt-6">
                                    {/* Region Selection */}
                                    <div className="relative w-full lg:w-44 flex-shrink-0" ref={regionListRef}>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-base font-semibold text-logip-text-subtle dark:text-dark-text-secondary">Region</label>
                                        </div>
                                        <SelectedItemDisplay
                                            item={selectedRegion === 'all' ? { id: 'all', name: 'All Regions' } : { id: selectedRegion, name: selectedRegion }}
                                            type="region"
                                            isOpen={isRegionListOpen}
                                            onClick={() => setIsRegionListOpen(!isRegionListOpen)}
                                            disabled={!isSuperAdmin && adminUser.schoolId !== 'none'}
                                        />
                                        {isRegionListOpen && (
                                            <div className="absolute z-[100] top-full mt-1 w-max bg-logip-white dark:bg-dark-surface border border-logip-border dark:border-dark-border rounded-xl shadow-2xl p-1.5 space-y-1 max-h-60 overflow-y-auto no-scrollbar origin-top">
                                                <div onClick={() => { setSelectedRegion('all'); setIsRegionListOpen(false); }} className="p-1.5 flex items-center justify-between rounded-lg hover:bg-logip-primary/10 hover:text-logip-primary transition-colors cursor-pointer">
                                                    <span className="font-medium text-logip-text-header dark:text-dark-text-primary text-sm">All Regions</span>
                                                </div>
                                                {GHANA_REGIONS.map(region => (
                                                    <div key={region} onClick={() => { setSelectedRegion(region); setIsRegionListOpen(false); }} className="p-1.5 flex items-center justify-between rounded-lg hover:bg-logip-primary/10 hover:text-logip-primary transition-colors cursor-pointer">
                                                        <span className="font-medium text-logip-text-header dark:text-dark-text-primary text-sm">{region}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* School Selection */}
                                    <div className="relative w-full lg:flex-1" ref={schoolListRef}>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-base font-semibold text-logip-text-subtle dark:text-dark-text-secondary">Select School</label>
                                        </div>
                                        <SelectedItemDisplay
                                            item={selectedSchool ? {id: selectedSchool.id, name: selectedSchool.name, status: selectedSchool.status, logo: selectedSchool.logo} : null}
                                            type="school"
                                            isOpen={isSchoolListOpen}
                                            onClick={() => setIsSchoolListOpen(!isSchoolListOpen)}
                                            onAddChild={canAddSchool ? () => handleOpenModal('addSchool', null) : undefined}
                                            onEdit={canEditSchool ? () => selectedSchool && handleOpenModal('editSchool', selectedSchool) : undefined}
                                            onDelete={canDeleteSchool ? () => selectedSchool && handleOpenModal('deleteSchool', selectedSchool) : undefined}
                                            onToggleStatus={canEditSchool ? () => selectedSchool && handleToggleSchoolStatus(selectedSchool) : undefined}
                                            disabled={!isSuperAdmin && adminUser.schoolId !== 'none'}
                                        />
                                        {isSchoolListOpen && (
                                            <div className="absolute z-[100] top-full mt-1 w-max bg-logip-white dark:bg-dark-surface border border-logip-border dark:border-dark-border rounded-xl shadow-2xl p-1.5 space-y-1 max-h-60 overflow-y-auto no-scrollbar origin-top">
                                                {displaySchools.length > 0 ? displaySchools.map(school => (
                                                    <div key={school.id} onClick={() => { setSelectedSchoolId(school.id); setIsSchoolListOpen(false); }} className="p-1.5 flex items-center justify-between rounded-lg hover:bg-logip-primary/10 hover:text-logip-primary transition-colors cursor-pointer">
                                                        <span className="font-medium text-logip-text-header dark:text-dark-text-primary text-sm">{school.name}</span>
                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${school.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400'}`}>{school.status}</span>
                                                    </div>
                                                )) : <div className="p-4 text-center text-sm text-logip-text-subtle">No schools found for this region.</div>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Admission Selection */}
                                    <div className="relative w-full lg:flex-1" ref={admissionListRef}>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-base font-semibold text-logip-text-subtle dark:text-dark-text-secondary">Select Admission Type</label>
                                        </div>
                                        <SelectedItemDisplay
                                            item={selectedAdmission ? {id: selectedAdmission.id, name: selectedAdmission.title, status: selectedAdmission.status} : null}
                                            type="admission"
                                            isOpen={isAdmissionListOpen}
                                            onClick={() => setIsAdmissionListOpen(!isAdmissionListOpen)}
                                            onAddChild={hasGlobalAdmissionScope && canAddAdmission && selectedSchool ? () => handleOpenModal('addAdmission', { schoolId: selectedSchool.id }) : undefined}
                                            onEdit={hasGlobalAdmissionScope && canEditAdmission && selectedAdmission ? () => handleOpenModal('editAdmission', selectedAdmission) : undefined}
                                            onDelete={hasGlobalAdmissionScope && canDeleteAdmission && selectedAdmission ? () => handleOpenModal('deleteAdmission', selectedAdmission) : undefined}
                                            onToggleStatus={hasGlobalAdmissionScope && canArchiveAdmission && selectedAdmission ? () => handleToggleAdmissionStatus(selectedAdmission) : undefined}
                                            onCopyLink={handleCopyLink}
                                            disabled={!hasGlobalAdmissionScope}
                                        />
                                        {isAdmissionListOpen && (
                                            <div className="absolute z-[100] top-full mt-1 w-max bg-logip-white dark:bg-dark-surface border border-logip-border dark:border-dark-border rounded-xl shadow-2xl p-1.5 space-y-1 max-h-60 overflow-y-auto no-scrollbar origin-top">
                                                {relevantAdmissions.length > 0 ? relevantAdmissions.map(admission => (
                                                    <div key={admission.id} onClick={() => { setSelectedAdmissionId(admission.id); setIsAdmissionListOpen(false); }} className="p-1.5 flex items-center justify-between rounded-lg hover:bg-logip-primary/10 hover:text-logip-primary transition-colors cursor-pointer">
                                                        <span className="font-medium text-logip-text-header dark:text-dark-text-primary text-sm">{admission.title}</span>
                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${admission.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400'}`}>{admission.status}</span>
                                                    </div>
                                                )) : <div className="p-4 text-center text-sm text-logip-text-subtle">No admissions for this school.</div>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Portal Link Quick Access */}
                                {selectedSchool && selectedAdmission && (
                                    <div className="mt-8 pt-6 border-t border-logip-border dark:border-dark-border animate-fadeIn">
                                        <label className="block text-sm font-bold text-logip-text-header dark:text-dark-text-primary uppercase tracking-wider mb-2">Public Portal Link</label>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 relative group bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-lg overflow-hidden flex items-center pr-3">
                                                <span className="pl-3 material-symbols-outlined text-gray-400">link</span>
                                                <input 
                                                    type="text" 
                                                    readOnly 
                                                    value={portalUrl} 
                                                    className="flex-1 px-3 py-2.5 bg-transparent text-sm text-logip-text-body dark:text-dark-text-secondary font-mono focus:outline-none overflow-x-auto no-scrollbar"
                                                    title={portalUrl}
                                                />
                                                <div className="flex items-center gap-1 ml-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleEditPortalLink}
                                                        className="p-1.5 rounded-md text-logip-text-subtle hover:text-logip-text-header hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                                                        title="Edit public portal link / custom domain"
                                                    >
                                                        <span className="material-symbols-outlined text-base">edit</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleCopyLink}
                                                        className="p-1.5 rounded-md text-logip-text-subtle hover:text-logip-text-header hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                                                        title="Copy portal link"
                                                    >
                                                        <span className="material-symbols-outlined text-base">content_copy</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs text-logip-text-subtle italic">Provide this link to applicants to access the admission portal for {selectedSchool.name}.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {canSeeAppDashSettings && (
                            <ApplicationDashboardSettings
                                selectedSchool={selectedSchool}
                                selectedAdmission={selectedAdmission}
                            />
                        )}

                    </div>
                )}
                
                {activeTab === 'SMS' && <SmsSettingsTab selectedSchool={selectedSchool} selectedAdmission={selectedAdmission} />}
                {activeTab === 'Financials' && <FinancialsSettingsTab selectedSchool={selectedSchool} selectedAdmission={selectedAdmission} />}
                {activeTab === 'Admission Doc' && <AdmissionDocTab selectedSchool={selectedSchool} selectedAdmission={selectedAdmission} />}
                {activeTab === 'AI Features' && <AiFeaturesSettingsTab selectedSchool={selectedSchool} selectedAdmission={selectedAdmission} />}
                {activeTab === 'Backup' && <BackupSettingsTab allAdmissions={admissions} selectedSchool={selectedSchool} />}
                {activeTab === 'Security' && <SecuritySettingsTab selectedSchool={selectedSchool} selectedAdmission={selectedAdmission} adminUser={adminUser} />}
                {activeTab === 'User Profile' && <UserProfileSettingsTab adminUser={adminUser} setAdminUser={setAdminUser} onExitAdmin={onExitAdmin} />}
            </div>

            {/* Modals */}
            {(modalState.mode === 'addSchool' || modalState.mode === 'editSchool') && <SchoolFormModal isOpen={true} onClose={handleCloseModal} onSave={handleSaveSchool} school={modalState.item as School | null} />}
            {(modalState.mode === 'addAdmission' || modalState.mode === 'editAdmission') && <AdmissionFormModal isOpen={true} onClose={handleCloseModal} onSave={handleSaveAdmission} admission={modalState.item as Admission | null} schoolId={(modalState.item as Admission | { schoolId: string }).schoolId} />}
            {(modalState.mode === 'deleteSchool' || modalState.mode === 'deleteAdmission') && (
                <ConfirmationModal isOpen={true} onClose={handleCloseModal} onConfirm={handleDelete} title={`Delete ${modalState.mode.includes('School') ? 'School' : 'Admission'}`}>
                    Are you sure you want to delete <strong>{(modalState.item as School)?.name || (modalState.item as Admission)?.title}</strong>? This action is irreversible.
                </ConfirmationModal>
            )}
        </div>
    );
};

export default SettingsPage;

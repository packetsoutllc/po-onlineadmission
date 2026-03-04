import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { School, Admission, initialSchools, initialAdmissions } from './SettingsPage';
import AddStudentModal from '../shared/AddStudentModal';
import ConfirmationModal from '../shared/ConfirmationModal';
import BulkUploadModal from '../shared/BulkUploadModal';
import PaginationControls from '../shared/PaginationControls';
import PrintButton from '../shared/PrintButton';
import { printTable } from '../shared/PrintService';
import { setLocalStorageAndNotify, logActivity } from '../../../utils/storage';
import { Class } from './ClassesPage';
import { initialHouses, getHouseColor, House } from '../shared/houseData';
import { getHouseCounts } from '../shared/houseAllocationService';
import { Programme } from './ProgrammesPage';
import EditLogModal from '../shared/EditLogModal';
import AdminModal from '../shared/AdminModal';
import ImagePreviewModal from '../../shared/ImagePreviewModal';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { allocateDormForStudent, allocateHouseForStudent, updateHouseCountOnManualChange } from '../shared/houseAllocationService';
import { useSortableData } from '../../hooks/useSortableData';
import SortableHeader from '../shared/SortableHeader';
import { Dormitory } from '../shared/dormitoryData';
import { AdmissionSettings } from './SecuritySettingsTab';
import { useToast } from '../shared/ToastContext';
import { PersonalInfoFormData } from '../../PersonalInfoForm';
import { AcademicInfoFormData } from '../../AcademicInfoForm';
import { ParentsInfoFormData } from '../../ParentsInfoForm';
import { FormSettings, INITIAL_FORM_SETTINGS, FormFieldConfig } from './ApplicationDashboardSettings';
import { AdminFormField, AdminInput, AdminSelect, AdminCheckbox } from '../shared/forms';
import ColumnSelectionModal from '../shared/ColumnSelectionModal';
import StatCard from '../shared/StatCard';
import StudentPhotoAlbumModal from '../shared/StudentPhotoAlbumModal';
import { AdminUser } from '../AdminLayout';

// --- TYPE DEFINITIONS ---
export type StudentStatus = 'Admitted' | 'Placed' | 'Pending' | 'Rejected' | 'Prospective';

interface StudentColumn {
    id: string;
    label: string;
    defaultVisible: boolean;
    sortKey?: string;
    noPrint?: boolean;
    conditional?: (settings: AdmissionSettings) => boolean;
}

export interface AdminStudent {
    id: string;
    name: string;
    surname?: string;
    firstName?: string;
    otherNames?: string;
    indexNumber: string;
    schoolId: string;
    admissionId: string;
    programme: string;
    gender: 'Male' | 'Female';
    aggregate: string;
    status: StudentStatus;
    classId: string;
    houseId: string;
    dormitoryId?: string;
    feeStatus: 'Paid' | 'Unpaid';
    residence: 'Boarding' | 'Day';
    admissionDate: string;
    paymentDate?: string | null;
    phoneNumber?: string;
    parentContact?: string;
    currentSchoolPlaced?: string;
    isProtocol?: boolean;
}

export interface EditLogEntry {
    editor: 'student' | 'admin';
    timestamp: string;
    changedFields: {
        field: string;
        from: any;
        to: any;
    }[];
}

// --- MOCK DATA ---
export const initialAdminStudents: AdminStudent[] = [
    { id: 'stud1', name: 'JOHN DOE', surname: 'DOE', firstName: 'JOHN', indexNumber: '12345678901225', schoolId: 's1', admissionId: 'a1', programme: 'General Science', gender: 'Male', aggregate: '08', status: 'Admitted', classId: 'c1', houseId: 'h1', dormitoryId: 'd1', feeStatus: 'Paid', residence: 'Boarding', admissionDate: new Date().toISOString(), paymentDate: new Date().toISOString() },
    { id: 'stud2', name: 'JANE SMITH', surname: 'SMITH', firstName: 'JANE', indexNumber: '98765432109825', schoolId: 's1', admissionId: 'a1', programme: 'Visual Arts', gender: 'Female', aggregate: '12', status: 'Admitted', classId: 'c3', houseId: 'h2', dormitoryId: 'd4', feeStatus: 'Paid', residence: 'Boarding', admissionDate: new Date().toISOString(), paymentDate: new Date().toISOString() },
    { id: 'stud3', name: 'ABABIO PATIENCE', surname: 'ABABIO', firstName: 'PATIENCE', indexNumber: '11', schoolId: 's1', admissionId: 'a1', programme: 'General Arts', gender: 'Female', aggregate: '10', status: 'Placed', classId: 'c2', houseId: 'h4', feeStatus: 'Unpaid', residence: 'Boarding', admissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), paymentDate: null },
    { id: 'stud4', name: 'KOFI MENSAH', surname: 'MENSAH', firstName: 'KOFI', indexNumber: '10', schoolId: 's1', admissionId: 'a1', programme: 'General Science', gender: 'Male', aggregate: '09', status: 'Placed', classId: 'c4', houseId: 'h3', dormitoryId: 'd2', feeStatus: 'Unpaid', residence: 'Boarding', admissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), paymentDate: null },
    { id: 'stud5', name: 'YAW ADDO', surname: 'ADDO', firstName: 'YAW', indexNumber: '09', schoolId: 's1', admissionId: 'a1', programme: 'Business', gender: 'Male', aggregate: '14', status: 'Pending', classId: 'c5', houseId: 'h5', feeStatus: 'Unpaid', residence: 'Day', admissionDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), paymentDate: null },
    { id: 'stud6', name: 'EMMANUEL TETTEH', surname: 'TETTEH', firstName: 'EMMANUEL', indexNumber: 'PROTO001', schoolId: 's1', admissionId: 'a2', programme: 'General Science', gender: 'Male', aggregate: '15', status: 'Admitted', classId: 'c1', houseId: 'h7', feeStatus: 'Paid', residence: 'Boarding', admissionDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), paymentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), isProtocol: true },
    { id: 'stud7', name: 'KWAME NKRUMAH', surname: 'NKRUMAH', firstName: 'KWAME', indexNumber: 'MFANTS001', schoolId: 's3', admissionId: 'a4', programme: 'General Science', gender: 'Male', aggregate: '07', status: 'Admitted', classId: '', houseId: 'h9', feeStatus: 'Paid', residence: 'Boarding', admissionDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), paymentDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'stud8', name: 'AKUA AGYEMAN', surname: 'AGYEMAN', firstName: 'AKUA', indexNumber: 'MFANTS002', schoolId: 's3', admissionId: 'a4', programme: 'General Arts', gender: 'Female', aggregate: '11', status: 'Placed', classId: '', houseId: 'h10', feeStatus: 'Unpaid', residence: 'Boarding', admissionDate: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(), paymentDate: null },
];

const StatusPill: React.FC<{ status: StudentStatus }> = ({ status }) => {
    const baseClasses = 'px-2.5 py-1 text-xs font-semibold rounded-md capitalize';
    const styles: Record<StudentStatus, string> = {
        Admitted: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
        Placed: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
        Prospective: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
        Pending: 'bg-orange-100 text-orange-800 dark:bg-orange-50/20 dark:text-orange-300',
        Rejected: 'bg-red-100 text-red-800 dark:bg-red-50/20 dark:text-red-300',
    };
    return <span className={`${baseClasses} ${styles[status]}`}>{status}</span>;
};

const FeeStatusPill: React.FC<{ status: 'Paid' | 'Unpaid' }> = ({ status }) => {
    const baseClasses = 'px-2.5 py-1 text-xs font-semibold rounded-md';
    const styles = {
        Paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
        Unpaid: 'bg-rose-100 text-rose-800 dark:bg-rose-50/20 dark:text-red-300',
    };
    return <span className={`${baseClasses} ${styles[status]}`}>{status}</span>;
};

const ActionButton: React.FC<{ icon: string, onClick: (e: React.MouseEvent) => void, title: string, colorClass?: string, disabled?: boolean, onContextMenu?: (e: React.MouseEvent) => void }> = ({ icon, onClick, title, colorClass = 'text-logip-text-subtle hover:text-logip-text-header dark:text-dark-text-secondary dark:hover:text-dark-text-primary', disabled, onContextMenu }) => (
    <button 
        onClick={onClick} 
        onContextMenu={onContextMenu}
        title={title} 
        disabled={disabled}
        className={`p-1.5 rounded-md transition-colors ${colorClass} no-print ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
        <span className="material-symbols-outlined text-xl">{icon}</span>
    </button>
);

const ResetDetailsModal: React.FC<{ isOpen: boolean; onClose: () => void; student: AdminStudent }> = ({ isOpen, onClose, student }) => {
    const resetLogKey = `edit_app_limit_reset_log_${student.schoolId}_${student.indexNumber}`;
    const retrievalLogKey = `credential_retrieval_log_${student.schoolId}_${student.indexNumber}`;
    const [resetLog, setResetLog] = useState<{ totalResets?: number; lastResetAt?: string; lastResetBy?: string; lastResetByEmail?: string }>({});
    const [retrievalLog, setRetrievalLog] = useState<{ date?: string; count?: number }>({});

    useEffect(() => {
        if (isOpen && student) {
            try {
                const storedReset = localStorage.getItem(resetLogKey);
                setResetLog(storedReset ? JSON.parse(storedReset) : {});
            } catch (e) {
                setResetLog({});
            }
            try {
                const storedRetrieval = localStorage.getItem(retrievalLogKey);
                setRetrievalLog(storedRetrieval ? JSON.parse(storedRetrieval) : {});
            } catch (e) {
                setRetrievalLog({});
            }
        }
    }, [isOpen, student, resetLogKey, retrievalLogKey]);

    const totalResets = resetLog.totalResets ?? 0;
    const lastBy = resetLog.lastResetBy || 'N/A';
    const lastByEmail = resetLog.lastResetByEmail || '';
    const lastAt = resetLog.lastResetAt ? new Date(resetLog.lastResetAt).toLocaleString() : 'N/A';
    const retrievalCount = retrievalLog.count ?? 0;
    const retrievalDate = retrievalLog.date || 'N/A';

    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title={`Reset Details: ${student.name}`} size="2xl">
            <div className="space-y-4">
                <div className="p-4 rounded-lg border border-logip-border dark:border-dark-border bg-gray-50 dark:bg-dark-bg/50">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-xl text-green-600 dark:text-green-400">history_toggle_off</span>
                            <span className="font-bold text-logip-text-header dark:text-dark-text-primary">{lastBy}</span>
                            {lastByEmail && <span className="text-sm text-logip-text-subtle dark:text-dark-text-secondary">({lastByEmail})</span>}
                        </div>
                        <div className="text-sm text-logip-text-subtle dark:text-dark-text-secondary">{lastAt}</div>
                    </div>
                    <ul className="space-y-1.5 pl-4 border-l-2 border-logip-border dark:border-dark-border">
                        <li className="text-sm text-logip-text-body dark:text-dark-text-secondary">
                            <span className="font-semibold text-logip-text-header dark:text-dark-text-primary">Times reset:</span> {totalResets}
                        </li>
                        <li className="text-sm text-logip-text-body dark:text-dark-text-secondary">
                            <span className="font-semibold text-logip-text-header dark:text-dark-text-primary">Last reset by:</span> {lastBy}{lastByEmail ? ` (${lastByEmail})` : ''}
                        </li>
                        <li className="text-sm text-logip-text-body dark:text-dark-text-secondary">
                            <span className="font-semibold text-logip-text-header dark:text-dark-text-primary">Last reset at:</span> {lastAt}
                        </li>
                        <li className="text-sm text-logip-text-body dark:text-dark-text-secondary">
                            <span className="font-semibold text-logip-text-header dark:text-dark-text-primary">Retrieve credentials (today):</span> {retrievalCount} {retrievalDate !== 'N/A' ? `(date: ${retrievalDate})` : ''}
                        </li>
                    </ul>
                </div>
            </div>
            <div className="pt-6 flex justify-end">
                <button onClick={onClose} className="px-5 py-2 text-base font-semibold rounded-lg border border-logip-border dark:border-dark-border hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Close</button>
            </div>
        </AdminModal>
    );
};

const SimpleToggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label?: string }> = ({ checked, onChange, label }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        {label && <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">{label}</span>}
    </label>
);

const getStudentAvatarUrl = (indexNumber: string, gender: 'Male' | 'Female', schoolId?: string): string => {
    // Standardize lookup keys for robust retrieval
    const keysToTry = [
        schoolId ? `applicationData_${schoolId}_${indexNumber}` : null,
        `applicationData_s1_${indexNumber}`,
        `applicationData_${indexNumber}`,
        `file_upload_${indexNumber}_Passport-Size-Photograph`
    ].filter(Boolean);

    for (const key of keysToTry) {
        try {
            const raw = localStorage.getItem(key!);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.passportPhotograph?.data) return parsed.passportPhotograph.data;
                if (parsed.data) return parsed.data;
            }
        } catch (e) {}
    }
    return `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="${gender === 'Male' ? '#dbeafe' : '#fce7f3'}" /><text x="50" y="55" font-family="Arial" font-size="50" fill="${gender === 'Male' ? '#1d4ed8' : '#be185d'}" text-anchor="middle" dominant-baseline="middle">?</text></svg>`)}`;
};

const ExpandedStudentRow: React.FC<{
    student: AdminStudent;
    formSettings: FormSettings;
    onEditStudent: (student: AdminStudent) => void;
    canEdit: boolean;
}> = ({ student, formSettings, onEditStudent, canEdit }) => {
    const [appData, setAppData] = useLocalStorage<Record<string, any>>(`applicationData_${student.schoolId}_${student.indexNumber}`, {});
    const { showToast } = useToast();

    const handleDocumentVerifyToggle = (docFieldId: string, isVerified: boolean) => {
        setAppData(prev => ({
            ...prev,
            [`doc_verified_${docFieldId}`]: isVerified
        }));
        showToast(isVerified ? 'Document marked as verified.' : 'Document marked as unverified.', 'info');
    };

    const sections = [
        { id: 'personal', title: 'Personal Information' },
        { id: 'academic', title: 'Academic Information' },
        { id: 'parents', title: 'Parents/Guardian Info' },
        { id: 'other', title: 'Other Information' },
    ];

    const documentFields = formSettings.fields.filter(f => (f.type === 'document' || f.type === 'photo') && f.id !== 'passportPhotograph' && f.visible);
    const hasDocs = documentFields.some(f => appData[f.id]);

    return (
        <div className="p-6 bg-gray-50 dark:bg-black/10 border-t border-b border-logip-border dark:border-dark-border shadow-inner">
             <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {sections.map(section => {
                    const fields = formSettings.fields.filter(f => f.section === section.id && f.visible && f.type !== 'photo' && f.type !== 'document');
                    const hasData = fields.some(f => appData[f.id]);
                    if (!hasData && section.id === 'other') return null;

                    return (
                        <div key={section.id} className="space-y-3">
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">{section.title}</h4>
                            <dl className="space-y-2 text-sm">
                                {fields.map(field => {
                                    const val = appData[field.id];
                                    if (!val && !field.required) return null;
                                    return (
                                        <div key={field.id} className="grid grid-cols-3 gap-2">
                                            <dt className="font-medium text-gray-500 dark:text-gray-400 col-span-1">{field.label}:</dt>
                                            <dd className="text-gray-900 dark:text-gray-200 col-span-2 break-words">{val || 'N/A'}</dd>
                                        </div>
                                    )
                                })}
                            </dl>
                        </div>
                    );
                })}

                {hasDocs && (
                    <div className="space-y-3">
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">Uploaded Documents</h4>
                        <div className="space-y-3">
                            {documentFields.map(field => {
                                const file = appData[field.id];
                                if (!file) return null;
                                const isVerified = !!appData[`doc_verified_${field.id}`];
                                
                                return (
                                    <div key={field.id} className="flex items-center justify-between p-3 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <span className="material-symbols-outlined text-lg">description</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-logip-text-header dark:text-gray-200 truncate max-w-[150px]" title={field.label}>{field.label}</p>
                                                <p className="text-xs text-gray-500 truncate">{file.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pl-2">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] text-gray-400 uppercase font-semibold">Verified</span>
                                                <SimpleToggle checked={isVerified} onChange={(c) => handleDocumentVerifyToggle(field.id, c)} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
             </div>
             {canEdit && (
                 <div className="mt-6 flex justify-end">
                     <button onClick={() => onEditStudent(student)} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                         <span className="material-symbols-outlined text-base">edit</span> Edit Full Profile
                     </button>
                 </div>
             )}
        </div>
    );
};

interface StudentsPageProps {
    selectedSchool?: School | null;
    selectedAdmission?: Admission | null;
    onEditStudent: (student: AdminStudent) => void;
    students: AdminStudent[];
    setStudents: React.Dispatch<React.SetStateAction<AdminStudent[]>>;
    dormitories: Dormitory[];
    classes: Class[];
    programmes: Programme[];
    permissions: Set<string>;
    isSuperAdmin: boolean;
    adminUser: AdminUser;
}

const StudentsPage: React.FC<StudentsPageProps> = ({ selectedSchool, selectedAdmission, onEditStudent, students, setStudents, dormitories, classes, programmes, permissions, isSuperAdmin, adminUser }) => {
    const { showToast } = useToast();

    // PERMANENCE: Scope settings by user email
    const userPrefix = adminUser.email;
    const [searchTerm, setSearchTerm] = useLocalStorage<string>(`${userPrefix}_admin_students_search`, '');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useLocalStorage<number>(`${userPrefix}_admin_students_items_per_page`, 10);
    const [showDashboard, setShowDashboard] = useLocalStorage<boolean>(`${userPrefix}_admin_students_show_dashboard`, false);
    
    // Quick Time Filter State
    const [timeFilter, setTimeFilter] = useState<{ type: 'day' | 'week' | 'month' | 'all', value: number | string }>({ type: 'all', value: 'all' });
    
    const [downloadColumns, setDownloadColumns] = useState<Set<string>>(new Set());

    // Fix: Memoize initial values to prevent unnecessary re-renders in useLocalStorage
    const initialFilters = useMemo(() => ({
        programme: 'all', gender: 'all', classId: 'all', houseId: 'all', feeStatus: 'all', status: 'all', appType: 'all', dormitoryId: 'all', residence: 'all',
    }), []);
    const [filters, setFilters] = useLocalStorage(`${userPrefix}_admin_students_filters`, initialFilters);

    const initialEditFilters = useMemo(() => ({ student: false, admin: false, notEdited: false }), []);
    const [editFilters, setEditFilters] = useLocalStorage(`${userPrefix}_admin_students_edit_filters`, initialEditFilters);

    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [editLogs, setEditLogs] = useState<Record<string, { student: boolean; admin: boolean }>>({});
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isQuickTimeFilterOpen, setIsQuickTimeFilterOpen] = useState(false);
    const filterButtonRef = useRef<HTMLButtonElement>(null);
    const quickTimeFilterButtonRef = useRef<HTMLDivElement>(null);
    const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
    const columnButtonRef = useRef<HTMLButtonElement>(null);
    const [imagePreview, setImagePreview] = useState<{ isOpen: boolean; url: string; alt: string }>({ isOpen: false, url: '', alt: '' });
    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
    const [isPhotoAlbumOpen, setIsPhotoAlbumOpen] = useState(false);
    const [modalState, setModalState] = useState<{ mode: 'add' | 'edit' | 'delete' | 'bulk' | 'bulkDelete' | 'logs' | null; student: AdminStudent | null; logType?: 'student' | 'admin' }>({ mode: null, student: null });
    const [resetDetailsStudent, setResetDetailsStudent] = useState<AdminStudent | null>(null);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

    const handlePrint = () => {
        printTable('students-table', 'Student List', selectedSchool, undefined, selectedAdmission?.title);
        logActivity(
            { name: adminUser.name, avatar: adminUser.avatar || '' },
            'printed the',
            'admission_process',
            `Student list for ${selectedAdmission?.title}`,
            selectedSchool?.id
        );
    };

    const admissionSettingsKey = selectedSchool && selectedAdmission ? `admissionSettings_${selectedSchool.id}_${selectedAdmission.id}` : null;
    const [storedAdmissionSettings] = useLocalStorage<AdmissionSettings | null>(admissionSettingsKey, null);

    const formSettingsKey = selectedAdmission ? `formSettings_${selectedAdmission.id}` : null;
    const [formSettings] = useLocalStorage<FormSettings>(formSettingsKey, INITIAL_FORM_SETTINGS);

    const financialsSettings = useMemo(() => {
        if (!selectedSchool || !selectedAdmission) return { gatewayStatus: true };
        const key = `financialsSettings_${selectedSchool.id}_${selectedAdmission.id}`;
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : { gatewayStatus: true };
    }, [selectedSchool, selectedAdmission]);

    const allExportableFields = useMemo(() => {
        if (!formSettings) return [];
        
        const systemFields = [
            { id: 'officialFullName', label: 'Full Name' },
            { id: 'surname', label: 'Surname' },
            { id: 'firstName', label: 'First Name' },
            { id: 'otherNames', label: 'Other Names' },
            { id: 'officialIndexNumber', label: 'Index Number' },
            { id: 'officialProgramme', label: 'Programme' },
            { id: 'officialGender', label: 'Gender' },
            { id: 'officialAggregate', label: 'Aggregate' },
            { id: 'officialResidence', label: 'Residence' },
            { id: 'officialCurrentSchool', label: 'Current School Placed' },
            { id: 'classId', label: 'Class' },
            { id: 'houseId', label: 'House' },
            { id: 'dormitoryId', label: 'Dorm/Room' },
            { id: 'feeStatus', label: 'Fee Status' },
            { id: 'status', label: 'Admission Status' },
            { id: 'admissionDate', label: 'Admission Date' },
            { id: 'paymentDate', label: 'Payment Date' },
        ];

        const systemIds = new Set(systemFields.map(f => f.id));
        const customFields = formSettings.fields
            .filter(f => !systemIds.has(f.id) && f.section !== 'official_records')
            .map(f => ({ id: f.id, label: f.label }));

        return [...systemFields, ...customFields];
    }, [formSettings]);

    const isDownloadColumnsInitialized = useRef(false);
    useEffect(() => {
        if (allExportableFields.length > 0 && !isDownloadColumnsInitialized.current) {
            setDownloadColumns(new Set(allExportableFields.map(f => f.id)));
            isDownloadColumnsInitialized.current = true;
        }
    }, [allExportableFields]);

    const admissionSettings = useMemo(() => {
        const defaults: Partial<AdmissionSettings> = { enableRoomManagement: true };
        return { ...defaults, ...storedAdmissionSettings } as AdmissionSettings;
    }, [storedAdmissionSettings]);
    
    const allColumns = useMemo<StudentColumn[]>(() => {
        const isSeparated = formSettings?.nameSystem === 'separated';
        const nameColumns: StudentColumn[] = isSeparated
            ? [
                { id: 'surname', label: 'Surname', defaultVisible: true, sortKey: 'surname' },
                { id: 'firstName', label: 'First Name', defaultVisible: true, sortKey: 'firstName' },
                { id: 'otherNames', label: 'Other Names', defaultVisible: true, sortKey: 'otherNames' }
              ]
            : [{ id: 'name', label: 'Name', defaultVisible: true, sortKey: 'name' }];

        return [
            { id: 'sn', label: 'S/N', defaultVisible: true },
            { id: 'photo', label: 'Photo', defaultVisible: true },
            ...nameColumns,
            { id: 'indexNumber', label: 'Index No.', defaultVisible: true, sortKey: 'indexNumber' },
            { id: 'gender', label: 'Gender', defaultVisible: true, sortKey: 'gender' },
            { id: 'residence', label: 'Residence', defaultVisible: true, sortKey: 'residence' },
            { id: 'programme', label: 'Programme', defaultVisible: true, sortKey: 'programme' },
            { id: 'aggregate', label: 'Agg.', defaultVisible: true, sortKey: 'aggregate' },
            { id: 'appType', label: 'App. Type', defaultVisible: true },
            { id: 'classId', label: 'Class', defaultVisible: true, sortKey: 'classId' },
            { id: 'houseId', label: 'House', defaultVisible: true, sortKey: 'houseId' },
            { id: 'dormitoryId', label: 'Dorm/Room', defaultVisible: true, sortKey: 'dormitoryId', conditional: (settings: AdmissionSettings) => settings.enableRoomManagement },
            { id: 'feeStatus', label: 'Fee', defaultVisible: true, sortKey: 'feeStatus' },
            { id: 'status', label: 'Status', defaultVisible: true, sortKey: 'status' },
            { id: 'actions', label: 'Actions', defaultVisible: true, noPrint: true },
        ];
    }, [formSettings?.nameSystem]);
    
    const visibleColumnDefs = useMemo(() => {
        return allColumns.filter(c => !c.conditional || c.conditional(admissionSettings));
    }, [admissionSettings, allColumns]);

    const [visibleColumns, setVisibleColumns] = useLocalStorage<string[]>(`${userPrefix}_admin_students_columns`, 
        visibleColumnDefs.filter(c => c.defaultVisible).map(c => c.id)
    );

    const visibleColumnsSet = useMemo(() => new Set(visibleColumns), [visibleColumns]);

    useEffect(() => {
        const checkLogs = () => {
            const logs: Record<string, { student: boolean; admin: boolean }> = {};
            students.forEach(student => {
                const logRaw = localStorage.getItem(`editHistory_${student.indexNumber}`);
                if (logRaw) {
                    try {
                        const history: EditLogEntry[] = JSON.parse(logRaw);
                        logs[student.indexNumber] = {
                            student: history.some(entry => entry.editor === 'student'),
                            admin: history.some(entry => entry.editor === 'admin')
                        };
                    } catch {}
                }
            });
            setEditLogs(logs);
        };
        checkLogs();
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key && e.key.startsWith('editHistory_')) checkLogs();
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [students]);
    
    const relevantStudents = useMemo(() => {
        if (!selectedSchool || !selectedAdmission) return [];
        return students.filter(student =>
            student.schoolId === selectedSchool.id && student.admissionId === selectedAdmission.id
        );
    }, [students, selectedSchool, selectedAdmission]);

    const dashboardStats = useMemo(() => {
        if (!selectedSchool || !selectedAdmission || !relevantStudents.length) return null;

        const totalApplicants = relevantStudents.length;
        const totalAdmitted = relevantStudents.filter(s => s.status === 'Admitted').length;
        const notAdmitted = totalApplicants - totalAdmitted;
        const totalMale = relevantStudents.filter(s => s.gender === 'Male').length;
        const totalFemale = relevantStudents.filter(s => s.gender === 'Female').length;
        const totalProtocol = relevantStudents.filter(s => s.isProtocol).length;

        const homeRegion = selectedSchool.homeRegion;
        let outsideTotal = 0;
        let outsideMale = 0;
        let outsideFemale = 0;

        if (homeRegion) {
            relevantStudents.forEach(s => {
                const appDataRaw = localStorage.getItem(`applicationData_${s.schoolId}_${s.indexNumber}`);
                if (appDataRaw) {
                    try {
                        const appData = JSON.parse(appDataRaw);
                        if (appData.region && appData.region !== homeRegion) {
                            outsideTotal++;
                            if (s.gender === 'Male') outsideMale++;
                            else if (s.gender === 'Female') outsideFemale++;
                        }
                    } catch (e) {}
                }
            });
        }

        return {
            totalApplicants,
            totalAdmitted,
            notAdmitted,
            totalMale,
            totalFemale,
            totalProtocol,
            homeRegion,
            outsideTotal,
            outsideMale,
            outsideFemale
        };
    }, [relevantStudents, selectedSchool, selectedAdmission]);

    // Selection Restriction Logic - DETERMINES IF A STUDENT IS FULLY PAID
    const isFullyPaid = useCallback((student: AdminStudent): boolean => {
        if (isSuperAdmin) return true;
        
        const financialsKey = `financialsSettings_${student.schoolId}_${student.admissionId}`;
        const financialsRaw = localStorage.getItem(financialsKey);
        const financials = financialsRaw ? JSON.parse(financialsRaw) : { gatewayStatus: true, docAccessFeeEnabled: false };
        
        // 1. App Fee Check
        if (financials.gatewayStatus && student.feeStatus !== 'Paid') return false;
        
        // 2. Doc Fee Check
        if (financials.docAccessFeeEnabled) {
            const docUnlockStatusKey = `paymentStatus_docAccess_${student.schoolId}_${student.indexNumber}`;
            const docAccessPaidRaw = localStorage.getItem(docUnlockStatusKey);
            const hasPaidDocAccess = docAccessPaidRaw ? JSON.parse(docAccessPaidRaw).paid : false;
            if (!hasPaidDocAccess) return false;
        }
        
        return true;
    }, [isSuperAdmin]);

    const filteredStudents = useMemo(() => {
        return relevantStudents.filter(student => {
            const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  student.indexNumber.toLowerCase().includes(searchTerm.toLowerCase());
                                  
            const matchesProgramme = filters.programme === 'all' || student.programme === filters.programme;
            const matchesGender = filters.gender === 'all' || student.gender === filters.gender;
            const matchesClass = filters.classId === 'all' || student.classId === filters.classId;
            const matchesHouse = filters.houseId === 'all' || student.houseId === filters.houseId;
            const matchesFeeStatus = financialsSettings.gatewayStatus ? (filters.feeStatus === 'all' || student.feeStatus === filters.feeStatus) : true;
            const matchesStatus = filters.status === 'all' || student.status === filters.status;
            const matchesAppType = filters.appType === 'all' || (filters.appType === 'Protocol' && student.isProtocol) || (filters.appType === 'Placed' && !student.isProtocol);
            const matchesResidence = filters.residence === 'all' || student.residence === filters.residence;
            
            let matchesDormitory = true;
            if (admissionSettings.enableRoomManagement && filters.dormitoryId !== 'all') {
                matchesDormitory = student.dormitoryId === filters.dormitoryId;
            }

            const { student: studentEdited, admin: adminEdited, notEdited } = editFilters;
            let matchesEditStatus = true;
            if (studentEdited || adminEdited || notEdited) {
                const log = editLogs[student.indexNumber];
                const hasNoEdits = !log || (!log.student && !log.admin);
                
                matchesEditStatus = 
                    (studentEdited && log?.student) ||
                    (adminEdited && log?.admin) ||
                    (notEdited && hasNoEdits);
            }

            let matchesTime = true;
            if (timeFilter.type !== 'all') {
                const admissionDate = new Date(student.admissionDate);
                const now = new Date();
                
                if (timeFilter.type === 'day') {
                    const dayIdx = Number(timeFilter.value);
                    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                    startOfWeek.setHours(0,0,0,0);
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(endOfWeek.getDate() + 7);
                    
                    const isWithinThisWeek = admissionDate >= startOfWeek && admissionDate < endOfWeek;
                    matchesTime = isWithinThisWeek && admissionDate.getDay() === dayIdx;
                } else if (timeFilter.type === 'week') {
                    const weekNum = Number(timeFilter.value);
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const startOfWeekOfAdmission = new Date(startOfMonth);
                    startOfWeekOfAdmission.setDate(startOfWeekOfAdmission.getDate() + (weekNum - 1) * 7);
                    const endOfWeekOfAdmission = new Date(startOfWeekOfAdmission);
                    endOfWeekOfAdmission.setDate(endOfWeekOfAdmission.getDate() + 7);
                    
                    matchesTime = admissionDate >= startOfWeekOfAdmission && admissionDate < endOfWeekOfAdmission;
                } else if (timeFilter.type === 'month') {
                    const monthIdx = Number(timeFilter.value);
                    matchesTime = admissionDate.getFullYear() === now.getFullYear() && admissionDate.getMonth() === monthIdx;
                }
            }

            return matchesSearch && matchesProgramme && matchesGender && matchesClass && matchesHouse && matchesFeeStatus && matchesStatus && matchesEditStatus && matchesAppType && matchesDormitory && matchesResidence && matchesTime;
        });
    }, [relevantStudents, searchTerm, filters, editFilters, editLogs, admissionSettings, timeFilter, financialsSettings]);
    
    const processedStudents = useMemo(() => {
        const isSeparated = formSettings?.nameSystem === 'separated';
        return filteredStudents.map(s => {
            if (isSeparated && (!s.surname || !s.firstName)) {
                const parts = s.name.split(' ');
                const surname = parts[0] || '';
                const firstName = parts[1] || '';
                const otherNames = parts.slice(2).join(' ');
                return { ...s, surname, firstName, otherNames };
            }
            return s;
        });
    }, [filteredStudents, formSettings?.nameSystem]);

    const { items: sortedStudents, requestSort, sortConfig } = useSortableData(processedStudents, { key: 'name', direction: 'ascending' });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isFilterOpen && filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)) {
                const popover = document.getElementById('filter-popover');
                if (popover && !popover.contains(event.target as Node)) setIsFilterOpen(false);
            }
            if (isColumnSelectorOpen && columnButtonRef.current && !columnButtonRef.current.contains(event.target as Node)) {
                const popover = document.getElementById('column-selector-popover');
                if (popover && !popover.contains(event.target as Node)) setIsColumnSelectorOpen(false);
            }
            if (isQuickTimeFilterOpen && quickTimeFilterButtonRef.current && !quickTimeFilterButtonRef.current.contains(event.target as Node)) {
                setIsQuickTimeFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFilterOpen, isColumnSelectorOpen, isQuickTimeFilterOpen]);

    const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedStudents = sortedStudents.slice(startIndex, startIndex + itemsPerPage);
    const startItem = startIndex + 1;
    const endItem = Math.min(startIndex + itemsPerPage, sortedStudents.length);

    useEffect(() => {
        setCurrentPage(1);
        setSelectedStudentIds([]);
    }, [searchTerm, filters, editFilters, selectedSchool, selectedAdmission, timeFilter]);

    const selectablePaginatedStudents = useMemo(() => {
        return paginatedStudents.filter(s => isFullyPaid(s));
    }, [paginatedStudents, isFullyPaid]);

    const handleOpenModal = (mode: typeof modalState.mode, student: AdminStudent | null = null, logType?: 'student' | 'admin') => {
        setModalState({ mode, student, logType });
    };

    const handleCloseModal = () => {
        setModalState({ mode: null, student: null });
    };

    const handleSaveStudent = (formData: Omit<AdminStudent, 'id'> & { surname?: string, firstName?: string, otherNames?: string }) => {
        let studentToUpdate: AdminStudent;
        if (modalState.mode === 'edit' && modalState.student) studentToUpdate = { ...modalState.student, ...formData };
        else {
            studentToUpdate = { id: `stud${Date.now()}`, admissionDate: new Date().toISOString(), ...formData } as AdminStudent;
        }
        
        if (formSettings?.nameSystem === 'separated') studentToUpdate.name = [formData.surname, formData.firstName, formData.otherNames].filter(Boolean).join(' ');
        
        const originalStudent = students.find(s => s.id === studentToUpdate.id);
        const wasAdmitted = originalStudent?.status === 'Admitted';
        const isNowAdmitted = studentToUpdate.status === 'Admitted';

        if (studentToUpdate.isProtocol && originalStudent) {
            const wasPending = originalStudent.status === 'Pending';
            const isNowPlaced = studentToUpdate.status === 'Placed';
            const isNowRejected = studentToUpdate.status === 'Rejected';

            if (wasPending && (isNowPlaced || isNowRejected)) {
                const smsNumberRaw = localStorage.getItem(`smsNotificationNumber_${studentToUpdate.schoolId}_${studentToUpdate.indexNumber}`);
                const smsNumber = smsNumberRaw ? JSON.parse(smsNumberRaw) : (studentToUpdate.phoneNumber || "");
                if (isNowPlaced) console.log(`[SIMULATED SMS] to ${smsNumber}: Protocol Approved.`);
                else if (isNowRejected) console.log(`[SIMULATED SMS] to ${smsNumber}: Protocol Declined.`);
            }
        }

        if (isNowAdmitted && !wasAdmitted) {
            // FIX: Pass schoolId and admissionId to allocateHouseForStudent as required by the service
            const finalHouseName = allocateHouseForStudent(studentToUpdate.gender as 'Male' | 'Female', studentToUpdate.schoolId, studentToUpdate.admissionId);
            const finalHouse = initialHouses.find(h => h.name === finalHouseName);
            if (finalHouse) studentToUpdate.houseId = finalHouse.id;
        }
        
        if (modalState.mode === 'edit') {
            setStudents(students.map(s => s.id === studentToUpdate.id ? studentToUpdate : s));
            logActivity({ name: adminUser.name, avatar: adminUser.avatar || '' }, 'updated student record', 'student_update', studentToUpdate.name, selectedSchool?.id);
        } else {
            setStudents([studentToUpdate, ...students]);
            logActivity({ name: adminUser.name, avatar: adminUser.avatar || '' }, 'added a new student', 'admission_process', studentToUpdate.name, selectedSchool?.id);
        }
        handleCloseModal();
    };

    const handleDeleteStudent = () => {
        if (!modalState.student) return;
        setStudents(students.filter(p => p.id !== modalState.student!.id));
        logActivity({ name: adminUser.name, avatar: adminUser.avatar || '' }, 'deleted student record', 'student_delete', modalState.student.name, selectedSchool?.id);
        handleCloseModal();
    };

    const handleResetDailyLimit = (student: AdminStudent) => {
        const logKey = `edit_app_limit_${student.schoolId}_${student.indexNumber}`;
        const retrievalLogKey = `credential_retrieval_log_${student.schoolId}_${student.indexNumber}`;
        const resetLogKey = `edit_app_limit_reset_log_${student.schoolId}_${student.indexNumber}`;
        try {
            localStorage.removeItem(logKey);
            localStorage.removeItem(retrievalLogKey);

            let resetLog: { totalResets: number; lastResetAt: string; lastResetBy: string; lastResetByEmail?: string } = {
                totalResets: 0,
                lastResetAt: '',
                lastResetBy: '',
                lastResetByEmail: ''
            };

            try {
                const stored = localStorage.getItem(resetLogKey);
                if (stored) resetLog = { ...resetLog, ...JSON.parse(stored) };
            } catch (e) {}

            resetLog.totalResets += 1;
            resetLog.lastResetAt = new Date().toISOString();
            resetLog.lastResetBy = adminUser.name;
            resetLog.lastResetByEmail = adminUser.email;
            localStorage.setItem(resetLogKey, JSON.stringify(resetLog));

            showToast(`Daily limits (edit & retrieval) reset for ${student.name} on this device.`, 'info');
            logActivity(
                { name: adminUser.name, avatar: adminUser.avatar || '' },
                'reset daily edit limit',
                'security',
                `Reset edit limit for ${student.name}`,
                student.schoolId
            );
        } catch (e) {
            showToast('Unable to reset daily limit. Please try again.', 'error');
        }
    };

    const [resetConfirmStudent, setResetConfirmStudent] = useState<AdminStudent | null>(null);

    const openResetDetailsModal = (student: AdminStudent) => {
        setResetDetailsStudent(student);
    };

    const handleSelectStudent = useCallback((studentId: string) => {
        setSelectedStudentIds(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
    }, []);

    const handleSelectAll = useCallback(() => {
        const selectableIds = selectablePaginatedStudents.map(s => s.id);
        const allOnPageSelected = selectableIds.length > 0 && selectableIds.every(id => selectedStudentIds.includes(id));
        if (allOnPageSelected) setSelectedStudentIds(prev => prev.filter(id => !selectableIds.includes(id)));
        else setSelectedStudentIds(prev => [...new Set([...prev, ...selectableIds])]);
    }, [selectablePaginatedStudents, selectedStudentIds]);

    const handleBulkDelete = () => {
        setStudents(prev => prev.filter(s => !selectedStudentIds.includes(s.id)));
        setSelectedStudentIds([]);
        handleCloseModal();
    };

    const handleFilterChange = (filterName: keyof typeof filters, value: string) => setFilters(prev => ({ ...prev, [filterName]: value }));
    const handleEditFilterChange = (filterName: keyof typeof editFilters, value: boolean) => setEditFilters(prev => ({ ...prev, [filterName]: value }));
    const resetFilters = () => { setFilters(initialFilters); setEditFilters(initialEditFilters); setSearchTerm(''); setTimeFilter({ type: 'all', value: 'all' }); };
    const isAnyFilterActive = () => Object.values(filters).some(val => val !== 'all') || Object.values(editFilters).some(val => val) || searchTerm !== '' || timeFilter.type !== 'all';

    const handleColumnVisibilityChange = (columnId: string, isVisible: boolean) => {
        const newCols = new Set(visibleColumnsSet);
        if (isVisible) newCols.add(columnId);
        else newCols.delete(columnId);
        setVisibleColumns(Array.from(newCols));
    };

    const toggleStudentExpansion = (studentId: string) => {
        setExpandedStudentId(prev => prev === studentId ? null : studentId);
    };

    const handleBulkUploadSuccess = (newStudents: Omit<AdminStudent, 'id'>[]) => {
        const processedNewStudents: AdminStudent[] = newStudents.map(s => ({
            ...s,
            id: `stud${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
        }));
        setStudents(prev => [...processedNewStudents, ...prev]);
        showToast(`${processedNewStudents.length} students uploaded successfully.`, 'success');
        logActivity({ name: adminUser.name, avatar: adminUser.avatar || '' }, 'performed bulk upload', 'admission_process', `${processedNewStudents.length} students`, selectedSchool?.id);
    };

    const handleBulkDownload = (selectedColumnIds: Set<string>) => {
        if (sortedStudents.length === 0) {
            showToast('No student data to export.', 'error');
            return;
        }

        const headers = allExportableFields
            .filter(f => selectedColumnIds.has(f.id))
            .map(f => `"${f.label.replace(/"/g, '""')}"`);

        const rows = sortedStudents.map(student => {
            const studentAppDataRaw = localStorage.getItem(`applicationData_${student.schoolId}_${student.indexNumber}`);
            const appData = studentAppDataRaw ? JSON.parse(studentAppDataRaw) : {};

            return allExportableFields
                .filter(f => selectedColumnIds.has(f.id))
                .map(f => {
                    let val = '';
                    if (f.id === 'officialFullName') val = student.name;
                    else if (f.id === 'surname') val = student.surname || '';
                    else if (f.id === 'firstName') val = student.firstName || '';
                    else if (f.id === 'otherNames') val = student.otherNames || '';
                    else if (f.id === 'officialIndexNumber') val = student.indexNumber;
                    else if (f.id === 'officialProgramme') val = student.programme;
                    else if (f.id === 'officialGender') val = student.gender;
                    else if (f.id === 'officialAggregate') val = student.aggregate;
                    else if (f.id === 'officialResidence') val = student.residence;
                    else if (f.id === 'officialCurrentSchool') val = student.currentSchoolPlaced || '';
                    else if (f.id === 'classId') val = classes.find(c => c.id === student.classId)?.name || 'N/A';
                    else if (f.id === 'houseId') val = initialHouses.find(h => h.id === student.houseId)?.name || 'N/A';
                    else if (f.id === 'dormitoryId') val = dormitories.find(d => d.id === student.dormitoryId)?.name || 'N/A';
                    else if (f.id === 'feeStatus') val = student.feeStatus;
                    else if (f.id === 'status') val = student.status;
                    else if (f.id === 'admissionDate') val = new Date(student.admissionDate).toLocaleDateString();
                    else if (f.id === 'paymentDate') val = student.paymentDate ? new Date(student.paymentDate).toLocaleDateString() : 'N/A';
                    else val = appData[f.id] || '';

                    return `"${String(val).replace(/"/g, '""')}"`;
                }).join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `student_export_${selectedAdmission?.slug || 'all'}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setIsDownloadModalOpen(false);
        showToast('Exporting student data to CSV...', 'info');
        logActivity({ name: adminUser.name, avatar: adminUser.avatar || '' }, 'exported student data', 'admission_process', `${rows.length} records`, selectedSchool?.id);
    };

    if (!selectedSchool || !selectedAdmission) {
        return (
            <div className="p-8 text-center text-logip-text-subtle">
                <span className="material-symbols-outlined text-6xl">source_environment</span>
                <p className="mt-4 text-xl font-semibold">No School or Admission Selected</p>
                <p>Please select a school and an admission period from the header to view students.</p>
            </div>
        );
    }
    
    const canAdd = isSuperAdmin || permissions.has('btn:std:add');
    const canBulkUpload = isSuperAdmin || permissions.has('btn:std:bulk_ul');
    const canBulkDownload = isSuperAdmin || permissions.has('btn:std:bulk_dl');
    const canShowAlbum = isSuperAdmin || permissions.has('icon:std:album');
    const canEditGlobal = isSuperAdmin || permissions.has('icon:std:edit');
    const canDelete = isSuperAdmin || permissions.has('icon:std:delete');
    const canPrint = isSuperAdmin || permissions.has('btn:std:print');
    const canShowDashboardPerm = isSuperAdmin || permissions.has('btn:std:dash');
    const canToggleColsPerm = isSuperAdmin || permissions.has('btn:std:cols');
    const canFilter = isSuperAdmin || permissions.has('btn:std:filters');

    const relevantDormitories = useMemo(() => {
        if (!filters.houseId || filters.houseId === 'all') return dormitories;
        return dormitories.filter(d => d.houseId === filters.houseId);
    }, [dormitories, filters.houseId]);

    const isAllOnPageSelected = selectablePaginatedStudents.length > 0 && selectablePaginatedStudents.every(s => selectedStudentIds.includes(s.id));
    const isSomeOnPageSelected = selectedStudentIds.length > 0 && selectablePaginatedStudents.some(s => selectedStudentIds.includes(s.id)) && !isAllOnPageSelected;

    const currentWeekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {showDashboard && canShowDashboardPerm && dashboardStats && (
                <section className="mb-6 animate-fadeIn space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="space-y-6">
                            <StatCard icon="groups" title="Total Applicants" value={dashboardStats.totalApplicants.toString()} />
                            <StatCard icon="male" title="Total Male" value={dashboardStats.totalMale.toString()} iconBgClass="bg-blue-100 dark:bg-blue-900/30" iconColorClass="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-6">
                            <StatCard icon="how_to_reg" title="Total Admitted" value={dashboardStats.totalAdmitted.toString()} iconBgClass="bg-green-100 dark:bg-green-900/30" iconColorClass="text-green-600 dark:text-green-400" />
                            <StatCard icon="female" title="Total Female" value={dashboardStats.totalFemale.toString()} iconBgClass="bg-pink-100 dark:bg-pink-900/30" iconColorClass="text-pink-600 dark:text-pink-400" />
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <StatCard icon="cancel" title="Not Admitted" value={dashboardStats.notAdmitted.toString()} iconBgClass="bg-red-100 dark:bg-red-900/30" iconColorClass="text-red-600 dark:text-red-400" />
                                <StatCard icon="local_police" title="Total Protocol" value={dashboardStats.totalProtocol.toString()} iconBgClass="bg-yellow-100 dark:bg-yellow-900/30" iconColorClass="text-yellow-600 dark:text-yellow-400" />
                            </div>
                            {dashboardStats.homeRegion && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-4 bg-white dark:bg-dark-surface rounded-xl border border-logip-border dark:border-dark-border">
                                    <div className="sm:col-span-3 mb-2 font-semibold text-logip-text-header dark:text-dark-text-primary flex items-center gap-2">
                                        <span className="material-symbols-outlined text-teal-500">public</span> Outside {dashboardStats.homeRegion} Region
                                    </div>
                                    <StatCard icon="travel_explore" title={`Total Outside ${dashboardStats.homeRegion}`} value={dashboardStats.outsideTotal.toString()} />
                                    <StatCard icon="male" title={`Male Outside ${dashboardStats.homeRegion}`} value={dashboardStats.outsideMale.toString()} />
                                    <StatCard icon="female" title={`Female Outside ${dashboardStats.homeRegion}`} value={dashboardStats.outsideFemale.toString()} />
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            <div className="bg-logip-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-logip-border dark:border-dark-border">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-logip-border dark:border-dark-border pb-6 no-print">
                    <div className="w-full md:w-auto">
                        <h2 className="text-2xl font-bold text-logip-text-header dark:text-dark-text-primary">Students</h2>
                        <p className="text-logip-text-subtle dark:text-dark-text-secondary mt-1">Manage all applicants and admitted students.</p>
                    </div>
                    <div className="flex w-full flex-wrap justify-start md:w-auto md:justify-end items-center gap-2">
                        {canPrint && <PrintButton onClick={handlePrint} />}
                        {canShowDashboardPerm && (
                            <button onClick={() => setShowDashboard(!showDashboard)} className="flex items-center justify-center gap-2 px-4 py-2 text-base bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
                                <span className="material-symbols-outlined text-xl">{showDashboard ? 'visibility_off' : 'monitoring'}</span>
                                {showDashboard ? 'Hide' : 'Show'} Dashboard
                            </button>
                        )}
                         {canBulkDownload && <button onClick={() => setIsDownloadModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 text-base border border-logip-border dark:border-dark-border font-semibold rounded-lg text-logip-text-body dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-border transition-colors whitespace-nowrap"><span className="material-symbols-outlined text-xl">download</span>Bulk Download</button>}
                        {canBulkUpload && <button onClick={() => handleOpenModal('bulk')} className="flex items-center justify-center gap-2 px-4 py-2 text-base bg-logip-orange-btn text-white font-semibold rounded-lg hover:bg-logip-orange-btn-hover transition-colors whitespace-nowrap"><span className="material-symbols-outlined text-xl">upload</span>Bulk Upload</button>}
                        {canAdd && <button onClick={() => handleOpenModal('add')} className="flex items-center justify-center gap-2 px-4 py-2 text-base bg-logip-primary text-white font-semibold rounded-lg hover:bg-logip-primary-hover transition-colors whitespace-nowrap"><span className="material-symbols-outlined text-xl">add</span>Add Student</button>}
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 no-print">
                    <div className="flex items-center gap-2 relative w-full sm:w-auto sm:flex-1 max-w-4xl">
                        <div className="relative flex-1">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-logip-text-subtle dark:text-dark-text-secondary">search</span>
                            <input type="text" placeholder="Search by name or index no..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-[38px] bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-lg pl-10 pr-4 py-1.5 text-base text-logip-text-header dark:text-dark-text-primary placeholder-logip-text-subtle focus:outline-none focus:border-logip-primary focus:ring-1 focus:ring-logip-primary/20 transition-colors" />
                        </div>
                        
                        <div className="relative" ref={quickTimeFilterButtonRef}>
                            <button 
                                onClick={() => setIsQuickTimeFilterOpen(!isQuickTimeFilterOpen)} 
                                className={`p-2 h-[38px] rounded-lg border transition-colors flex items-center justify-center ${isQuickTimeFilterOpen || timeFilter.type !== 'all' ? 'border-logip-primary bg-blue-50 text-logip-primary' : 'border-logip-border dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-logip-text-subtle dark:text-dark-text-secondary'}`}
                            >
                                <span className="material-symbols-outlined">more_horiz</span>
                            </button>
                            {isQuickTimeFilterOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-dark-surface border border-logip-border dark:border-dark-border rounded-lg shadow-xl z-[60] py-5 px-4 animate-scaleIn origin-top-right overflow-y-auto max-h-[450px] no-scrollbar">
                                    <div className="mb-6">
                                        <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-3 tracking-widest px-1">Daily (This Week)</h4>
                                        <div className="grid grid-cols-7 gap-1">
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                                                <button 
                                                    key={idx}
                                                    title={currentWeekDays[idx]}
                                                    onClick={() => { setTimeFilter({ type: 'day', value: idx }); setIsQuickTimeFilterOpen(false); }}
                                                    className={`h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${timeFilter.type === 'day' && timeFilter.value === idx ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 dark:bg-dark-bg text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600'}`}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="mb-6 pt-4 border-t border-gray-100 dark:border-dark-border">
                                        <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-3 tracking-widest px-1">Weekly (This Month)</h4>
                                        <div className="grid grid-cols-5 gap-1.5">
                                            {[1, 2, 3, 4, 5].map(week => (
                                                <button 
                                                    key={week}
                                                    onClick={() => { setTimeFilter({ type: 'week', value: week }); setIsQuickTimeFilterOpen(false); }}
                                                    className={`h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${timeFilter.type === 'week' && timeFilter.value === week ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 dark:bg-dark-bg text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600'}`}
                                                >
                                                    W{week}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 dark:border-dark-border">
                                        <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-3 tracking-widest px-1">Monthly (This Year)</h4>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                                                <button 
                                                    key={month}
                                                    onClick={() => { setTimeFilter({ type: 'month', value: idx }); setIsQuickTimeFilterOpen(false); }}
                                                    className={`h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${timeFilter.type === 'month' && timeFilter.value === idx ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 dark:bg-dark-bg text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600'}`}
                                                >
                                                    {month}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-dark-border">
                                        <button 
                                            onClick={() => { setTimeFilter({ type: 'all', value: 'all' }); setIsQuickTimeFilterOpen(false); }}
                                            className="w-full text-center py-2 text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-colors uppercase tracking-widest"
                                        >
                                            Clear All Time Filters
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         {canToggleColsPerm && (
                            <div className="relative">
                                <button ref={columnButtonRef} onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)} className="flex items-center gap-2 h-[38px] px-4 py-1.5 text-sm bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-lg text-logip-text-header dark:text-dark-text-primary focus:outline-none font-bold">
                                    <span className="material-symbols-outlined text-xl">view_column</span>
                                    Columns
                                </button>
                                {isColumnSelectorOpen && (
                                    <div id="column-selector-popover" className="absolute top-full right-0 mt-2 w-56 bg-logip-white dark:bg-dark-surface border border-logip-border dark:border-dark-border rounded-lg shadow-lg z-10 p-4 animate-scaleIn origin-top-right">
                                        <h4 className="font-bold mb-2 text-logip-text-header dark:text-dark-text-primary">Visible Columns</h4>
                                        <div className="max-h-60 overflow-y-auto no-scrollbar space-y-2">
                                            {visibleColumnDefs.map(col => (<AdminCheckbox key={col.id} label={col.label} checked={visibleColumnsSet.has(col.id)} onChange={e => handleColumnVisibilityChange(col.id, e.target.checked)} />))}
                                        </div>
                                    </div>
                                )}
                            </div>
                         )}
                        {canFilter && (
                            <div className="relative">
                                <button ref={filterButtonRef} onClick={() => setIsFilterOpen(!isFilterOpen)} className="relative flex items-center h-[38px] gap-2 px-4 py-1.5 text-sm bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-lg text-logip-text-header dark:text-dark-text-primary focus:outline-none font-bold">
                                    <span className="material-symbols-outlined text-xl">filter_list</span>
                                    Filters
                                    {isAnyFilterActive() && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-logip-white dark:border-dark-surface"></div>}
                                </button>
                                {isFilterOpen && (
                                    <div id="filter-popover" className="absolute top-full right-0 mt-2 w-80 max-w-[90vw] sm:w-[500px] bg-logip-white dark:bg-dark-surface border border-logip-border dark:border-dark-border rounded-lg shadow-lg z-20 p-6 animate-scaleIn origin-top-right">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <AdminFormField label="Programme"><AdminSelect value={filters.programme} onChange={e => handleFilterChange('programme', e.target.value)}><option value="all">All Programmes</option>{programmes.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</AdminSelect></AdminFormField>
                                            <AdminFormField label="Gender"><AdminSelect value={filters.gender} onChange={e => handleFilterChange('gender', e.target.value)}><option value="all">All Genders</option><option value="Male">Male</option><option value="Female">Female</option></AdminSelect></AdminFormField>
                                            <AdminFormField label="Class"><AdminSelect value={filters.classId} onChange={e => handleFilterChange('classId', e.target.value)}><option value="all">All Classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</AdminSelect></AdminFormField>
                                            <AdminFormField label="House"><AdminSelect value={filters.houseId} onChange={e => handleFilterChange('houseId', e.target.value)}><option value="all">All Houses</option>{initialHouses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</AdminSelect></AdminFormField>
                                            
                                            {admissionSettings.enableRoomManagement && (
                                                <AdminFormField label="Dorm/Room"><AdminSelect value={filters.dormitoryId} onChange={e => handleFilterChange('dormitoryId', e.target.value)}><option value="all">All Rooms</option>{relevantDormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</AdminSelect></AdminFormField>
                                            )}

                                            <AdminFormField label="Fee Status"><AdminSelect value={filters.feeStatus} onChange={e => handleFilterChange('feeStatus', e.target.value)}><option value="all">All Fee Statuses</option><option value="Paid">Paid</option><option value="Unpaid">Unpaid</option></AdminSelect></AdminFormField>
                                            <AdminFormField label="Admission Status"><AdminSelect value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}><option value="all">All Statuses</option><option value="Admitted">Admitted</option><option value="Placed">Placed</option><option value="Prospective">Prospective</option><option value="Pending">Pending</option><option value="Rejected">Rejected</option></AdminSelect></AdminFormField>
                                            <AdminFormField label="Application Type"><AdminSelect value={filters.appType} onChange={e => handleFilterChange('appType', e.target.value)}><option value="all">All Types</option><option value="Protocol">Protocol</option><option value="Placed">Placed (Regular)</option></AdminSelect></AdminFormField>
                                            <AdminFormField label="Residence"><AdminSelect value={filters.residence} onChange={e => handleFilterChange('residence', e.target.value)}><option value="all">All Residences</option><option value="Boarding">Boarding</option><option value="Day">Day</option></AdminSelect></AdminFormField>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-logip-border dark:border-dark-border">
                                            <h4 className="font-bold mb-3 text-logip-text-header dark:text-dark-text-primary text-sm uppercase tracking-wider">Edit Status</h4>
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                                <AdminCheckbox label="Edited by Student" checked={editFilters.student} onChange={e => handleEditFilterChange('student', e.target.checked)} />
                                                <AdminCheckbox label="Edited by Admin" checked={editFilters.admin} onChange={e => handleEditFilterChange('admin', e.target.checked)} />
                                                <AdminCheckbox label="Not Edited" checked={editFilters.notEdited} onChange={e => handleEditFilterChange('notEdited', e.target.checked)} />
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-logip-border dark:border-dark-border flex justify-between items-center">
                                            <button onClick={resetFilters} className="text-sm font-semibold text-red-500 hover:underline">Clear All Filters</button>
                                            <button onClick={() => setIsFilterOpen(false)} className="px-6 py-2 text-sm font-bold rounded-lg bg-logip-primary text-white shadow-md hover:bg-logip-primary-hover">Apply Filters</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {canShowAlbum && (
                            <button 
                                onClick={() => setIsPhotoAlbumOpen(true)} 
                                className="flex items-center justify-center p-2 h-[38px] w-[38px] rounded-lg bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border text-logip-text-header dark:text-dark-text-primary hover:bg-gray-100 transition-colors" 
                                title="Student Photo Album"
                            >
                                <span className="material-symbols-outlined text-xl">photo_library</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 bg-logip-white dark:bg-dark-surface rounded-lg border border-logip-border dark:border-dark-border overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full min-w-[1200px]" id="students-table">
                        <thead className="border-b border-logip-border dark:border-dark-border bg-gray-50 dark:bg-white/5">
                            <tr>
                                <th className="p-4 w-12 text-left text-sm font-semibold uppercase text-gray-500 no-print">
                                    <AdminCheckbox 
                                        onChange={handleSelectAll} 
                                        checked={isAllOnPageSelected} 
                                        indeterminate={isSomeOnPageSelected} 
                                    />
                                </th>
                                {visibleColumnDefs.map(col => {
                                    if (!visibleColumnsSet.has(col.id)) return null;
                                    return col.sortKey ? <SortableHeader key={col.id} sortKey={col.sortKey} sortConfig={sortConfig} requestSort={requestSort}>{col.label}</SortableHeader> : <th key={col.id} className={`p-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${col.noPrint ? 'no-print' : ''}`}>{col.label}</th>
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedStudents.map((student, index) => {
                                const studentHouse = initialHouses.find(h => h.id === student.houseId) as (House & { studentCount: number; }) | undefined;
                                const studentClass = classes.find(c => c.id === student.classId);
                                const houseColors = getHouseColor(studentHouse);
                                const avatarUrl = getStudentAvatarUrl(student.indexNumber, student.gender, student.schoolId);
                                const isExpanded = expandedStudentId === student.id;

                                const isSelectable = isFullyPaid(student);
                                const canEditThisStudent = isSuperAdmin || (canEditGlobal && student.feeStatus === 'Paid');

                                return (
                                <React.Fragment key={student.id}>
                                <tr className={`border-b border-logip-border dark:border-dark-border last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors ${isExpanded ? 'bg-gray-50 dark:bg-white/5' : ''} ${!isSelectable ? 'bg-gray-100/30 dark:bg-gray-900/10' : ''}`}>
                                    <td className="p-4 no-print">
                                        <AdminCheckbox 
                                            checked={selectedStudentIds.includes(student.id)} 
                                            onChange={() => handleSelectStudent(student.id)} 
                                            disabled={!isSelectable}
                                            title={!isSelectable ? "Selection restricted: Applicant has pending fees" : ""}
                                        />
                                    </td>
                                    {visibleColumnsSet.has('sn') && <td className={`p-4 text-base ${isSelectable ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>{startIndex + index + 1}</td>}
                                    {visibleColumnsSet.has('photo') && <td className={`p-4 ${!isSelectable ? 'grayscale opacity-50' : ''}`}><img src={avatarUrl} alt={student.name} className="w-10 h-10 rounded-full object-cover cursor-pointer" onClick={() => setImagePreview({ isOpen: true, url: avatarUrl, alt: student.name })} /></td>}
                                    
                                    {visibleColumnsSet.has('name') && <td className={`p-4 font-bold text-base max-w-[250px] ${isSelectable ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                                        <div 
                                            onClick={() => isSelectable && onEditStudent(student)} 
                                            onContextMenu={(e) => { e.preventDefault(); if(isSelectable && canEditThisStudent) handleOpenModal('edit', student); }}
                                            className={`text-left group w-full ${isSelectable ? (canEditThisStudent ? 'hover:underline cursor-pointer' : 'cursor-default') : 'cursor-not-allowed opacity-60'}`}
                                            title={isSelectable ? (canEditThisStudent ? "Left-click: Open Application | Right-click: Quick Edit" : "Left-click: Open Application") : "Action restricted: Pending fees"}
                                        >
                                            <div className="flex items-center gap-2">
                                                <p className="truncate" title={student.name}>{student.name}</p>
                                                {editLogs[student.indexNumber]?.student && <button onClick={(e) => { e.stopPropagation(); handleOpenModal('logs', student, 'student'); }} title="Edited by Student"><span className="material-symbols-outlined text-base text-blue-500">person</span></button>}
                                                {editLogs[student.indexNumber]?.admin && <button onClick={(e) => { e.stopPropagation(); handleOpenModal('logs', student, 'admin'); }} title="Edited by Admin"><span className="material-symbols-outlined text-base text-blue-500">shield_person</span></button>}
                                            </div>
                                        </div>
                                    </td>}
                                    {visibleColumnsSet.has('surname') && <td className={`p-4 text-base font-bold ${isSelectable ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                                        <button 
                                            onClick={() => isSelectable && onEditStudent(student)} 
                                            className={`text-left w-full ${isSelectable ? (canEditThisStudent ? 'hover:underline' : 'cursor-default') : 'cursor-not-allowed opacity-60'}`}
                                        >
                                            {student.surname || ''}
                                        </button>
                                    </td>}
                                    {visibleColumnsSet.has('firstName') && <td className={`p-4 text-base ${isSelectable ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                                        <button 
                                            onClick={() => isSelectable && onEditStudent(student)} 
                                            className={`text-left w-full ${isSelectable ? (canEditThisStudent ? 'hover:underline' : 'cursor-default') : 'cursor-not-allowed opacity-60'}`}
                                        >
                                            {student.firstName || ''}
                                        </button>
                                    </td>}
                                    {visibleColumnsSet.has('otherNames') && <td className={`p-4 text-base ${isSelectable ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                                        <button 
                                            onClick={() => isSelectable && onEditStudent(student)} 
                                            className={`text-left w-full ${isSelectable ? (canEditThisStudent ? 'hover:underline' : 'cursor-default') : 'cursor-not-allowed opacity-60'}`}
                                        >
                                            {student.otherNames || ''}
                                        </button>
                                    </td>}

                                    {visibleColumnsSet.has('indexNumber') && <td className={`p-4 text-base font-mono whitespace-nowrap ${isSelectable ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>{student.indexNumber}</td>}
                                    {visibleColumnsSet.has('gender') && (
                                        <td className={`p-4 text-base ${isSelectable ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg text-logip-text-subtle">
                                                    {student.gender === 'Male' ? 'male' : 'female'}
                                                </span>
                                                {student.gender}
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumnsSet.has('residence') && <td className={`p-4 text-base ${isSelectable ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>{student.residence}</td>}
                                    {visibleColumnsSet.has('programme') && <td title={student.programme} className={`p-4 text-base truncate max-w-[200px] ${isSelectable ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>{student.programme}</td>}
                                    {visibleColumnsSet.has('aggregate') && <td className={`p-4 text-base ${isSelectable ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>{student.aggregate}</td>}
                                    {visibleColumnsSet.has('appType') && <td className={`p-4 text-base ${!isSelectable ? 'opacity-50' : ''}`}><span className={`px-2 py-1 rounded-md text-xs font-semibold ${student.isProtocol ? 'bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'}`}>{student.isProtocol ? 'Protocol' : 'Placed'}</span></td>}
                                    {visibleColumnsSet.has('classId') && <td className={`p-4 text-base ${isSelectable ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>{studentClass?.name || 'N/A'}</td>}
                                    {visibleColumnsSet.has('houseId') && <td className={`p-4 ${!isSelectable ? 'opacity-50 grayscale' : ''}`}>{studentHouse ? <span title={studentHouse.name} className={`inline-block truncate max-w-[150px] px-2 py-1 text-xs font-semibold rounded-md ${houseColors.pillBg} ${houseColors.pillText}`}>{studentHouse.name}</span> : 'N/A'}</td>}
                                    {visibleColumnsSet.has('dormitoryId') && <td className={`p-4 text-base ${isSelectable ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>{dormitories.find(d => d.id === student.dormitoryId)?.name || 'N/A'}</td>}
                                    {visibleColumnsSet.has('feeStatus') && <td className={`p-4 ${!isSelectable ? 'opacity-50' : ''}`}><FeeStatusPill status={student.feeStatus} /></td>}
                                    {visibleColumnsSet.has('status') && <td className={`p-4 ${!isSelectable ? 'opacity-50' : ''}`}><StatusPill status={student.status} /></td>}
                                    
                                    {visibleColumnsSet.has('actions') && <td className="p-4 no-print"><div className="flex items-center gap-1">
                                        <ActionButton 
                                            icon="edit" 
                                            disabled={!isSelectable || !canEditThisStudent} 
                                            onClick={(e) => { e.stopPropagation(); isSelectable && canEditThisStudent && handleOpenModal('edit', student); }} 
                                            title={!isSelectable ? "Action restricted: Pending fees" : (canEditThisStudent ? "Edit Student" : "Editing restricted to paid students")} 
                                            colorClass="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                        />
                                        {(() => {
                                            const resetLogKey = `edit_app_limit_reset_log_${student.schoolId}_${student.indexNumber}`;
                                            let hasReset = false;
                                            try {
                                                const stored = localStorage.getItem(resetLogKey);
                                                if (stored) {
                                                    const parsed = JSON.parse(stored);
                                                    hasReset = !!parsed && (parsed.totalResets ?? 0) > 0;
                                                }
                                            } catch (e) {}
                                            
                                            return (
                                                <ActionButton 
                                                    icon="history_toggle_off" 
                                                    onClick={(e) => { e.stopPropagation(); setResetConfirmStudent(student); }} 
                                                    onContextMenu={hasReset ? (e) => { e.preventDefault(); e.stopPropagation(); openResetDetailsModal(student); } : undefined}
                                                    title={hasReset ? "Reset Daily Limit (right-click for details)" : "Reset Daily Limit"}
                                                    colorClass={hasReset ? 'text-green-500 hover:text-green-600 dark:text-green-300 dark:hover:text-green-200' : undefined}
                                                />
                                            );
                                        })()}
                                        {canDelete && <ActionButton icon="delete" onClick={(e) => { e.stopPropagation(); handleOpenModal('delete', student); }} title="Delete" colorClass="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"/>}
                                        <button 
                                            onClick={() => isSelectable && toggleStudentExpansion(student.id)} 
                                            disabled={!isSelectable && !isSuperAdmin}
                                            className={`p-1.5 rounded-md transition-colors ${!isSelectable && !isSuperAdmin ? 'opacity-30 cursor-not-allowed text-gray-400' : 'text-logip-text-subtle hover:text-logip-text-header dark:text-dark-text-secondary dark:hover:text-dark-text-primary'}`} 
                                            title={!isSelectable && !isSuperAdmin ? "Action restricted: Pending fees" : (isExpanded ? "Collapse Details" : "Expand Details")}
                                        >
                                            <span className="material-symbols-outlined text-xl">{isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>
                                        </button>
                                    </div></td>}
                                </tr>
                                {isExpanded && isSelectable && (
                                    <tr>
                                        <td colSpan={100} className="p-0 animate-fadeIn">
                                            <ExpandedStudentRow student={student} formSettings={formSettings} onEditStudent={onEditStudent} canEdit={canEditThisStudent} />
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                            )})}
                        </tbody>
                    </table>
                </div>
                 <div className="p-4 border-t border-logip-border dark:border-dark-border flex flex-col sm:flex-row items-center justify-between no-print gap-4">
                     <div className="flex items-center gap-4">{canDelete && selectedStudentIds.length > 0 && (<button onClick={() => handleOpenModal('bulkDelete')} className="text-sm font-semibold text-red-600 dark:text-red-400 hover:underline animate-fadeIn">Delete Selected ({selectedStudentIds.length})</button>)}</div>
                     <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={sortedStudents.length} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} startItem={startItem} endItem={endItem} />
                </div>
            </div>

            <AddStudentModal isOpen={modalState.mode === 'add' || modalState.mode === 'edit'} onClose={handleCloseModal} onSave={handleSaveStudent} student={modalState.student} selectedSchool={selectedSchool} selectedAdmission={selectedAdmission} allStudents={students} dormitories={dormitories} formSettings={formSettings} classes={classes} programmes={programmes} permissions={permissions} isSuperAdmin={isSuperAdmin} />
            {modalState.mode === 'delete' && <ConfirmationModal isOpen={true} onClose={handleCloseModal} onConfirm={handleDeleteStudent} title="Delete Student">Are you sure you want to delete <strong>{modalState.student?.name}</strong>? This action is irreversible.</ConfirmationModal>}
            {modalState.mode === 'bulkDelete' && <ConfirmationModal isOpen={true} onClose={handleCloseModal} onConfirm={handleBulkDelete} title={`Delete ${selectedStudentIds.length} Students`}>Are you sure you want to delete these {selectedStudentIds.length} students? This action is irreversible.</ConfirmationModal>}
            {modalState.mode === 'bulk' && <BulkUploadModal isOpen={true} onClose={handleCloseModal} formSettings={formSettings} allStudents={students} onUploadSuccess={handleBulkUploadSuccess} selectedAdmission={selectedAdmission} />}
            {modalState.mode === 'logs' && modalState.student && modalState.logType && <EditLogModal isOpen={true} onClose={handleCloseModal} student={modalState.student} logType={modalState.logType} />}
            {resetConfirmStudent && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setResetConfirmStudent(null)}
                    onConfirm={() => {
                        if (resetConfirmStudent) {
                            handleResetDailyLimit(resetConfirmStudent);
                        }
                        setResetConfirmStudent(null);
                    }}
                    title="Reset Daily Limit"
                >
                    Are you sure you want to reset the daily edit limit for <strong>{resetConfirmStudent?.name}</strong> ({resetConfirmStudent?.indexNumber})?
                </ConfirmationModal>
            )}
            {resetDetailsStudent && (
                <ResetDetailsModal
                    isOpen={!!resetDetailsStudent}
                    onClose={() => setResetDetailsStudent(null)}
                    student={resetDetailsStudent}
                />
            )}
            <ImagePreviewModal isOpen={imagePreview.isOpen} onClose={() => setImagePreview({ isOpen: false, url: '', alt: '' })} imageUrl={imagePreview.url} altText={imagePreview.alt} />
            <ColumnSelectionModal isOpen={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} columns={allExportableFields} visibleColumns={downloadColumns} onVisibleColumnsChange={setDownloadColumns} onConfirm={handleBulkDownload} title="Select Columns to Download" confirmButtonText="Download CSV" />
            <StudentPhotoAlbumModal 
                isOpen={isPhotoAlbumOpen} 
                onClose={() => setIsPhotoAlbumOpen(false)} 
                students={relevantStudents} 
                classes={classes} 
                houses={initialHouses} 
                dormitories={dormitories} 
                programs={programmes} 
                selectedSchool={selectedSchool}
                selectedAdmission={selectedAdmission}
            />
        </div>
    );
};

export default StudentsPage;
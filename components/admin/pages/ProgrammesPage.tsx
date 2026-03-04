import React, { useState, useMemo, useEffect, useRef } from 'react';
import AdminModal from '../shared/AdminModal';
import ConfirmationModal from '../shared/ConfirmationModal';
import { AdminInput, AdminSelect, AdminFormField, AdminTextarea } from '../shared/forms';
import PaginationControls from '../shared/PaginationControls';
import PrintButton from '../shared/PrintButton';
import { School } from './SettingsPage';
import { printTable } from '../shared/PrintService';
import { AdminStudent } from './StudentsPage';
import MemberListModal from '../shared/MemberListModal';
import { Class } from './ClassesPage';
import { useSortableData } from '../../hooks/useSortableData';
import SortableHeader from '../shared/SortableHeader';
import { Admission } from './SettingsPage';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { AdminUser } from '../AdminLayout';

// --- TYPE DEFINITIONS ---
type ProgrammeStatus = 'Active' | 'Phased Out';

export interface Programme {
    id: string;
    name: string;
    code: string;
    status: ProgrammeStatus;
    coreSubjects: string[];
    electiveSubjects: string[];
    schoolId: string;
}

// --- MOCK DATA ---
export const initialProgrammes: Programme[] = [
    { id: 'p1', name: 'General Science', code: 'SCI', status: 'Active', coreSubjects: ['English Language', 'Mathematics', 'Integrated Science', 'Social Studies'], electiveSubjects: ['Physics', 'Chemistry', 'Biology', 'Elective Mathematics'], schoolId: 's1' },
    { id: 'p2', name: 'General Arts', code: 'ART', status: 'Active', coreSubjects: ['English Language', 'Mathematics', 'Integrated Science', 'Social Studies'], electiveSubjects: ['Literature', 'French', 'History', 'Government', 'CRS'], schoolId: 's1' },
    { id: 'p3', name: 'Visual Arts', code: 'VA', status: 'Active', coreSubjects: ['English Language', 'Mathematics', 'Integrated Science', 'Social Studies', 'General Knowledge in Art'], electiveSubjects: ['Graphic Design', 'Picture Making', 'Ceramics', 'Sculpture'], schoolId: 's1' },
    { id: 'p4', name: 'Business', code: 'BUS', status: 'Active', coreSubjects: ['English Language', 'Mathematics', 'Integrated Science', 'Social Studies'], electiveSubjects: ['Accounting', 'Business Management', 'Economics', 'Principles of Costing'], schoolId: 's1' },
    { id: 'p5', name: 'Home Economics', code: 'HE', status: 'Active', coreSubjects: ['English Language', 'Mathematics', 'Integrated Science', 'Social Studies'], electiveSubjects: ['Management in Living', 'Food and Nutrition', 'General Knowledge in Art', 'Textiles'], schoolId: 's1' },
    { id: 'p6', name: 'Agricultural Science', code: 'AGR', status: 'Phased Out', coreSubjects: ['English Language', 'Mathematics', 'Integrated Science', 'Social Studies'], electiveSubjects: ['General Agriculture', 'Animal Husbandry', 'Crop Husbandry', 'Chemistry'], schoolId: 's1' },
    { id: 'p7', name: 'General Science', code: 'SCI', status: 'Active', coreSubjects: ['English Language', 'Mathematics', 'Integrated Science', 'Social Studies'], electiveSubjects: ['Physics', 'Chemistry', 'Biology'], schoolId: 's3' },
];

// --- HELPER COMPONENTS ---
const StatusPill: React.FC<{ status: ProgrammeStatus }> = ({ status }) => {
    const baseClasses = 'px-3 py-1 text-sm font-semibold rounded-full capitalize';
    const styles = {
        'Active': 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
        'Phased Out': 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400',
    };
    return <span className={`${baseClasses} ${styles[status]}`}>{status}</span>;
};

const ActionButton: React.FC<{ icon: string, onClick: () => void, title: string, colorClass?: string }> = ({ icon, onClick, title, colorClass = 'text-logip-text-subtle hover:text-logip-text-header dark:text-dark-text-secondary dark:hover:text-dark-text-primary' }) => (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-md transition-colors ${colorClass} no-print`}>
        <span className="material-symbols-outlined text-xl">{icon}</span>
    </button>
);

interface ProgrammesPageProps {
    selectedSchool?: School | null;
    selectedAdmission?: Admission | null;
    students: AdminStudent[];
    programmes: Programme[];
    setProgrammes: React.Dispatch<React.SetStateAction<Programme[]>>;
    classes: Class[];
    permissions: Set<string>;
    isSuperAdmin: boolean;
    adminUser: AdminUser;
}

const ProgrammesPage: React.FC<ProgrammesPageProps> = ({ selectedSchool, selectedAdmission, students, programmes, setProgrammes, classes, permissions, isSuperAdmin, adminUser }) => {
    const userPrefix = adminUser.email;
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const [itemsPerPage, setItemsPerPage] = useLocalStorage<number>(`${userPrefix}_admin_programmes_items_per_page`, 10);
    const [showDashboard, setShowDashboard] = useLocalStorage<boolean>(`${userPrefix}_admin_programmes_show_dashboard`, false);
    
    const [modalState, setModalState] = useState<{ mode: 'add' | 'edit' | 'delete' | null; programme: (Programme & { studentCount: number; classCount: number; }) | null }>({ mode: null, programme: null });
    const [memberListModal, setMemberListModal] = useState<{ isOpen: boolean; programme: (Programme & { studentCount: number; classCount: number; }) | null; members: AdminStudent[]; }>({ isOpen: false, programme: null, members: [] });
    const [classListModal, setClassListModal] = useState<{ isOpen: boolean; programmeName: string; classes: Class[] }>({ isOpen: false, programmeName: '', classes: [] });

    const programmesWithStats = useMemo(() => {
        if (!selectedSchool) return [];
        
        return programmes
            .filter(prog => prog.schoolId === selectedSchool.id)
            .map(prog => {
                const progStudents = students.filter(s => 
                    s.schoolId === selectedSchool.id && 
                    s.programme === prog.name &&
                    (s.status === 'Admitted' || s.status === 'Placed') &&
                    (!selectedAdmission || s.admissionId === selectedAdmission.id)
                );
                
                const studentCount = progStudents.length;
                const maleCount = progStudents.filter(s => s.gender === 'Male').length;
                const femaleCount = progStudents.filter(s => s.gender === 'Female').length;

                const classCount = classes.filter(c => c.schoolId === selectedSchool.id && c.programme === prog.name).length;
                return { ...prog, studentCount, classCount, maleCount, femaleCount };
            });
    }, [programmes, selectedSchool, students, classes, selectedAdmission]);

    const filteredProgrammes = useMemo(() => {
        return programmesWithStats.filter(prog => {
            const matchesSearch = prog.name.toLowerCase().includes(searchTerm.toLowerCase()) || prog.code.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || prog.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [programmesWithStats, searchTerm, statusFilter]);
    
    const { items: sortedProgrammes, requestSort, sortConfig } = useSortableData(filteredProgrammes, { key: 'name', direction: 'ascending' });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, itemsPerPage, selectedSchool, selectedAdmission]);

    const totalPages = Math.ceil(sortedProgrammes.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProgrammes = sortedProgrammes.slice(startIndex, startIndex + itemsPerPage);
    const startItem = startIndex + 1;
    const endItem = Math.min(startIndex + itemsPerPage, sortedProgrammes.length);

    const handleOpenModal = (mode: 'add' | 'edit' | 'delete', programme: (Programme & { studentCount: number; classCount: number; }) | null = null) => {
        setModalState({ mode, programme });
    };

    const handleCloseModal = () => {
        setModalState({ mode: null, programme: null });
    };

    const handleShowMembers = (programme: Programme & { studentCount: number; classCount: number; }) => {
        const members = students.filter(student => 
            student.programme === programme.name && 
            student.schoolId === programme.schoolId &&
            (!selectedAdmission || student.admissionId === selectedAdmission.id)
        );
        setMemberListModal({ isOpen: true, programme, members });
    };
    
    const handleShowClasses = (programme: Programme) => {
       if (!selectedSchool) return;
       const relevantClasses = classes.filter(c => c.programme === programme.name && c.schoolId === selectedSchool.id);
       setClassListModal({ isOpen: true, programmeName: programme.name, classes: relevantClasses });
    };

    const handleSaveProgramme = (formData: Omit<Programme, 'id'>) => {
        if (modalState.mode === 'edit' && modalState.programme) {
            setProgrammes(programmes.map(p => p.id === modalState.programme!.id ? { ...(p as Programme), ...formData } : p));
        } else {
            const newProgramme: Programme = { id: `p${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, ...formData };
            setProgrammes([newProgramme, ...programmes]);
        }
        handleCloseModal();
    };

    const handleDeleteProgramme = () => {
        if (!modalState.programme) return;
        setProgrammes(programmes.filter(p => p.id !== modalState.programme!.id));
        handleCloseModal();
    };

    const handlePrint = () => {
        printTable('programmes-table', 'Programme List', selectedSchool, undefined, selectedAdmission?.title);
    };

    if (!selectedSchool) {
        return (
            <div className="p-8 text-center text-logip-text-subtle">
                <span className="material-symbols-outlined text-6xl">source_environment</span>
                <p className="mt-4 text-xl font-semibold">No School Selected</p>
                <p>Please select a school from the header to view its programmes.</p>
            </div>
        );
    }
    
    const canAdd = isSuperAdmin || permissions.has('btn:prog:add');
    const canEdit = isSuperAdmin || permissions.has('icon:prog:edit');
    const canDelete = isSuperAdmin || permissions.has('icon:prog:delete');
    const canPrint = isSuperAdmin || permissions.has('btn:prog:print');
    const canShowDashboardPerm = isSuperAdmin || permissions.has('btn:prog:dash');

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {showDashboard && canShowDashboardPerm && (
                <div className="mb-6 animate-fadeIn">
                    <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary mb-4">Programme Enrollment Overview</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {programmesWithStats.map(prog => (
                            <div key={prog.id} className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-gray-200 dark:border-dark-border flex flex-col shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate flex-1 pr-2" title={prog.name}>{prog.name}</h4>
                                    <span className="text-xs font-mono bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 px-2 py-1 rounded">{prog.code}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center flex-1">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded flex flex-col justify-center">
                                        <span className="block text-xs text-blue-600 dark:text-blue-400 font-medium">Male</span>
                                        <span className="font-bold text-xl text-gray-800 dark:text-gray-200">{prog.maleCount}</span>
                                    </div>
                                    <div className="bg-pink-50 dark:bg-pink-900/20 p-2 rounded flex flex-col justify-center">
                                        <span className="block text-xs text-pink-600 dark:text-pink-400 font-medium">Female</span>
                                        <span className="font-bold text-xl text-gray-800 dark:text-gray-200">{prog.femaleCount}</span>
                                    </div>
                                    <div className="bg-gray-100 dark:bg-gray-700/50 p-2 rounded flex flex-col justify-center">
                                        <span className="block text-xs text-gray-600 dark:text-gray-400 font-medium">Total</span>
                                        <span className="font-bold text-xl text-gray-900 dark:text-white">{prog.studentCount}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-logip-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-logip-border dark:border-dark-border">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-logip-border dark:border-dark-border pb-6 no-print">
                    <div className="w-full md:w-auto">
                        <h2 className="text-2xl font-bold text-logip-text-header dark:text-dark-text-primary">Programmes</h2>
                        <p className="text-logip-text-subtle dark:text-dark-text-secondary mt-1">Manage academic programmes for <span className="font-bold">{selectedAdmission?.title || 'this context'}</span>.</p>
                    </div>
                    <div className="flex w-full md:w-auto items-center gap-2">
                        {canPrint && <PrintButton onClick={handlePrint} />}
                        {canShowDashboardPerm && (
                            <button 
                                onClick={() => setShowDashboard(!showDashboard)}
                                className="flex items-center justify-center gap-2 px-4 py-2 text-base bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                            >
                                <span className="material-symbols-outlined text-xl">{showDashboard ? 'visibility_off' : 'monitoring'}</span>
                                {showDashboard ? 'Hide' : 'Show'} Dashboard
                            </button>
                        )}
                        {canAdd && (
                            <button onClick={() => handleOpenModal('add')} className="flex items-center justify-center gap-2 px-4 py-2 text-base bg-logip-primary text-white font-semibold rounded-lg hover:bg-logip-primary-hover transition-colors whitespace-nowrap">
                                <span className="material-symbols-outlined text-xl">add</span>
                                Add Programme
                            </button>
                        )}
                    </div>
                </div>
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 no-print">
                    <div className="relative w-full sm:w-auto sm:flex-1 max-sm-sm">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-logip-text-subtle dark:text-dark-text-secondary">search</span>
                        <input
                            type="text"
                            placeholder="Search by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-base text-logip-text-header dark:text-dark-text-primary placeholder-logip-text-subtle dark:placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-logip-primary dark:focus:ring-dark-accent-blue transition-colors"
                        />
                    </div>
                    <div className="w-full sm:w-auto">
                        <AdminSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="all">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Phased Out">Phased Out</option>
                        </AdminSelect>
                    </div>
                </div>
            </div>

            <div className="mt-6 bg-logip-white dark:bg-dark-surface rounded-lg border border-logip-border dark:border-dark-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]" id="programmes-table">
                        <thead className="border-b border-logip-border dark:border-dark-border bg-gray-50 dark:bg-white/5">
                            <tr>
                                <th className="p-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">S/N</th>
                                <SortableHeader sortKey="name" sortConfig={sortConfig} requestSort={requestSort}>Name</SortableHeader>
                                <SortableHeader sortKey="code" sortConfig={sortConfig} requestSort={requestSort}>Code</SortableHeader>
                                <SortableHeader sortKey="studentCount" sortConfig={sortConfig} requestSort={requestSort}>Applicants</SortableHeader>
                                <SortableHeader sortKey="classCount" sortConfig={sortConfig} requestSort={requestSort}>Classes</SortableHeader>
                                <SortableHeader sortKey="status" sortConfig={sortConfig} requestSort={requestSort}>Status</SortableHeader>
                                <th className="p-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider no-print">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProgrammes.map((prog, index) => (
                                <tr key={prog.id} className="border-b border-logip-border dark:border-dark-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-base text-gray-600 dark:text-gray-400">{startIndex + index + 1}</td>
                                    <td className="p-4">
                                        <button onClick={() => handleShowMembers(prog)} className="font-bold text-base text-gray-900 dark:text-gray-100 hover:underline hover:text-blue-600 text-left">{prog.name}</button>
                                    </td>
                                    <td className="p-4 text-base font-mono text-gray-600 dark:text-gray-400">{prog.code}</td>
                                    <td className="p-4 text-base text-gray-600 dark:text-gray-400">{prog.studentCount}</td>
                                    <td className="p-4">
                                        <button onClick={() => handleShowClasses(prog)} className="text-base text-blue-600 dark:text-blue-400 hover:underline">{prog.classCount} Classes</button>
                                    </td>
                                    <td className="p-4"><StatusPill status={prog.status} /></td>
                                    <td className="p-4 no-print">
                                        <div className="flex items-center gap-1">
                                            {canEdit && <ActionButton icon="edit" onClick={() => handleOpenModal('edit', prog)} title="Edit Programme" colorClass="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"/>}
                                            {canDelete && <ActionButton icon="delete" onClick={() => handleOpenModal('delete', prog)} title="Delete Programme" colorClass="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"/>}
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
                        totalItems={sortedProgrammes.length}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={setItemsPerPage}
                        startItem={startItem}
                        endItem={endItem}
                    />
                </div>
            </div>

            {/* Modals */}
            {memberListModal.isOpen && (
                <MemberListModal 
                    isOpen={true} 
                    onClose={() => setMemberListModal({ isOpen: false, programme: null, members: [] })} 
                    title={`${memberListModal.programme?.name} Students`} 
                    members={memberListModal.members} 
                    icon="school" 
                    headerColor="from-blue-600 to-indigo-600" 
                    selectedSchool={selectedSchool}
                    listMeta={selectedAdmission?.title}
                />
            )}
            
            {classListModal.isOpen && (
                <AdminModal isOpen={true} onClose={() => setClassListModal({ isOpen: false, programmeName: '', classes: [] })} title={`${classListModal.programmeName} Classes`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead className="border-b border-logip-border dark:border-dark-border bg-gray-50 dark:bg-white/5">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-500 dark:text-gray-400">S/N</th>
                                    <th className="p-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Class Name</th>
                                    <th className="p-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Capacity</th>
                                    <th className="p-4 text-sm font-semibold text-gray-500 dark:text-gray-400">Class Teacher</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-logip-border dark:divide-dark-border">
                                {classListModal.classes.length > 0 ? (
                                    classListModal.classes.map((cls, index) => {
                                        const studentCount = students.filter(s => s.classId === cls.id && (s.status === 'Admitted' || s.status === 'Placed')).length;
                                        return (
                                            <tr key={cls.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                                <td className="p-4 text-base text-gray-600 dark:text-gray-400">{index + 1}</td>
                                                <td className="p-4 font-medium text-base text-gray-900 dark:text-gray-100">{cls.name}</td>
                                                <td className="p-4 text-base text-gray-600 dark:text-gray-400">
                                                    {studentCount} / {cls.capacity}
                                                </td>
                                                <td className="p-4 text-base text-gray-600 dark:text-gray-400">{cls.classTeacher || 'N/A'}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            No classes found for this programme.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="pt-6 flex justify-end">
                        <button onClick={() => setClassListModal({ isOpen: false, programmeName: '', classes: [] })} className="px-5 py-2 text-base font-semibold rounded-lg border border-logip-border dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Close</button>
                    </div>
                </AdminModal>
            )}
            
            {(modalState.mode === 'add' || modalState.mode === 'edit') && (
                <ProgrammeFormModal 
                    isOpen={true} 
                    onClose={handleCloseModal} 
                    onSave={handleSaveProgramme} 
                    programme={modalState.programme} 
                    selectedSchoolId={selectedSchool.id} 
                />
            )}

            {modalState.mode === 'delete' && (
                <ConfirmationModal 
                    isOpen={true} 
                    onClose={handleCloseModal} 
                    onConfirm={handleDeleteProgramme} 
                    title="Delete Programme"
                >
                    Are you sure you want to delete <strong>{modalState.programme?.name}</strong>? This action cannot be undone.
                </ConfirmationModal>
            )}
        </div>
    );
};

// Sub-component: ProgrammeFormModal
const ProgrammeFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Programme, 'id'>) => void;
    programme: Programme | null;
    selectedSchoolId: string;
}> = ({ isOpen, onClose, onSave, programme, selectedSchoolId }) => {
    const [formData, setFormData] = useState({
        name: programme?.name || '',
        code: programme?.code || '',
        status: programme?.status || 'Active' as ProgrammeStatus,
        schoolId: programme?.schoolId || selectedSchoolId,
        coreSubjects: programme?.coreSubjects || [],
        electiveSubjects: programme?.electiveSubjects || []
    });
    
    const [coreSubjectInput, setCoreSubjectInput] = useState('');
    const [electiveSubjectInput, setElectiveSubjectInput] = useState('');
    const [editingSubject, setEditingSubject] = useState<{ type: 'coreSubjects' | 'electiveSubjects'; index: number } | null>(null);
    const [editingText, setEditingText] = useState('');
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingSubject && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingSubject]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubjectKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, subjectType: 'coreSubjects' | 'electiveSubjects') => {
        const input = subjectType === 'coreSubjects' ? coreSubjectInput : electiveSubjectInput;
        const setInput = subjectType === 'coreSubjects' ? setCoreSubjectInput : setElectiveSubjectInput;
        if (e.key === 'Enter' && input.trim()) {
            e.preventDefault();
            const newSubject = input.trim();
            if (!formData[subjectType].find(s => s.toLowerCase() === newSubject.toLowerCase())) {
                setFormData(prev => ({...prev, [subjectType]: [...prev[subjectType], newSubject]}));
            }
            setInput('');
        }
    };
    
    const handleRemoveSubject = (subjectToRemove: string, subjectType: 'coreSubjects' | 'electiveSubjects') => {
        setFormData(prev => ({...prev, [subjectType]: prev[subjectType].filter(s => s !== subjectToRemove)}));
    };

    const handleStartEdit = (type: 'coreSubjects' | 'electiveSubjects', index: number, text: string) => {
        setEditingSubject({ type, index });
        setEditingText(text);
    };

    const handleSaveEdit = () => {
        if (!editingSubject) return;
        const { type, index } = editingSubject;
        const newText = editingText.trim();
        
        if (newText && !formData[type].some((s, i) => s.toLowerCase() === newText.toLowerCase() && i !== index)) {
            setFormData(prev => {
                const newSubjects = [...prev[type]];
                newSubjects[index] = newText;
                return { ...prev, [type]: newSubjects };
            });
        }
        setEditingSubject(null);
        setEditingText('');
    };

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            setEditingSubject(null);
            setEditingText('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const renderTagInput = (
        label: string, 
        description: string,
        subjectType: 'coreSubjects' | 'electiveSubjects', 
        inputValue: string, 
        setInputValue: React.Dispatch<React.SetStateAction<string>>
    ) => (
        <div>
            <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">{label}</label>
            <div className="flex flex-wrap items-center gap-2 p-2 border border-logip-border dark:border-dark-border rounded-lg bg-logip-white dark:bg-dark-bg focus-within:ring-2 focus-within:ring-logip-primary dark:focus-within:ring-blue-500">
                {formData[subjectType].map((subject, index) => {
                     const isEditing = editingSubject?.type === subjectType && editingSubject.index === index;
                     return isEditing ? (
                         <input
                             key={`editing-${index}`}
                             ref={editInputRef}
                             type="text"
                             value={editingText}
                             onChange={(e) => setEditingText(e.target.value)}
                             onBlur={handleSaveEdit}
                             onKeyDown={handleEditKeyDown}
                             className="bg-transparent border border-logip-primary rounded px-2 py-1 text-sm font-semibold text-logip-text-header dark:text-dark-text-primary focus:outline-none"
                         />
                     ) : (
                         <span
                             key={subject}
                             onDoubleClick={() => handleStartEdit(subjectType, index, subject)}
                             className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 font-semibold text-sm px-2 py-1 rounded cursor-pointer"
                         >
                             {subject}
                             <button
                                 type="button"
                                 onClick={() => handleRemoveSubject(subject, subjectType)}
                                 className="text-blue-600/70 hover:text-blue-800 dark:text-blue-400/70 dark:hover:text-blue-400"
                             >
                                 <span className="material-symbols-outlined text-base">close</span>
                             </button>
                         </span>
                     );
                })}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => handleSubjectKeyDown(e, subjectType)}
                    placeholder={`Add ${subjectType === 'coreSubjects' ? 'core' : 'elective'} & press Enter...`}
                    className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none min-w-[200px] p-1 text-logip-text-header dark:text-dark-text-primary placeholder:text-logip-text-subtle dark:placeholder:text-gray-500"
                />
            </div>
             <p className="text-xs text-logip-text-subtle dark:text-dark-text-secondary mt-1">{description}</p>
        </div>
    );

    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title={programme ? 'Edit Programme' : 'Add New Programme'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AdminFormField label="Programme Name"><AdminInput name="name" value={formData.name} onChange={handleChange} required /></AdminFormField>
                    <AdminFormField label="Programme Code"><AdminInput name="code" value={formData.code} onChange={handleChange} required /></AdminFormField>
                </div>
                <div>
                    <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">Status</label>
                    <AdminSelect name="status" value={formData.status} onChange={handleChange}>
                        <option value="Active">Active</option>
                        <option value="Phased Out">Phased Out</option>
                    </AdminSelect>
                </div>
                
                {renderTagInput('Core Subjects', 'Standard subjects for this programme.', 'coreSubjects', coreSubjectInput, setCoreSubjectInput)}
                {renderTagInput('Elective Subjects', 'Optional subjects available.', 'electiveSubjects', electiveSubjectInput, setElectiveSubjectInput)}

                <div className="pt-4 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-base font-semibold rounded-lg border border-logip-border dark:border-dark-border text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Cancel</button>
                    <button type="submit" className="px-5 py-2 text-base font-semibold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover transition-colors">{programme ? 'Save Changes' : 'Create Programme'}</button>
                </div>
            </form>
        </AdminModal>
    );
};

export default ProgrammesPage;

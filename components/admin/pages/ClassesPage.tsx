import React, { useState, useMemo, useEffect } from 'react';
import AdminModal from '../shared/AdminModal';
import ConfirmationModal from '../shared/ConfirmationModal';
import { AdminInput, AdminSelect, AdminFormField } from '../shared/forms';
import PaginationControls from '../shared/PaginationControls';
import PrintButton from '../shared/PrintButton';
import { School } from './SettingsPage';
import { printTable } from '../shared/PrintService';
import { AdminStudent } from './StudentsPage';
import MemberListModal from '../shared/MemberListModal';
import AssignSubjectsModal from '../shared/AssignSubjectsModal';
import { Programme } from './ProgrammesPage';
import { useSortableData } from '../../hooks/useSortableData';
import SortableHeader from '../shared/SortableHeader';
import { Admission } from './SettingsPage';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { AdminUser } from '../AdminLayout';

// --- TYPE DEFINITIONS ---
export interface Class {
    id: string;
    name: string;
    capacity: number;
    classTeacher: string;
    programme: string;
    schoolId: string;
    coreSubjects: string[];
    electiveSubjects: string[];
}

// --- MOCK DATA ---
export const initialClasses: Class[] = [
    { id: 'c1', name: 'Science 1', capacity: 50, classTeacher: 'Mr. Amoah', programme: 'General Science', schoolId: 's1', coreSubjects: ['English', 'Maths', 'Science', 'Social'], electiveSubjects: ['Physics', 'Chemistry', 'Biology', 'Elective Maths'] },
    { id: 'c2', name: 'Arts 1', capacity: 50, classTeacher: 'Ms. Beatrice', programme: 'General Arts', schoolId: 's1', coreSubjects: ['English', 'Maths', 'Science', 'Social'], electiveSubjects: ['Literature', 'History', 'Government', 'French'] },
    { id: 'c3', name: 'Visual Arts 1', capacity: 45, classTeacher: 'Mr. Charles', programme: 'Visual Arts', schoolId: 's1', coreSubjects: ['English', 'Maths', 'Science', 'Social'], electiveSubjects: ['GKA', 'Graphic Design', 'Picture Making'] },
    { id: 'c4', name: 'Science 2', capacity: 50, classTeacher: 'Mrs. David', programme: 'General Science', schoolId: 's1', coreSubjects: ['English', 'Maths', 'Science', 'Social'], electiveSubjects: ['Physics', 'Chemistry', 'Biology', 'Elective Maths'] },
    { id: 'c5', name: 'Business 1', capacity: 55, classTeacher: 'Mr. Edward', programme: 'Business', schoolId: 's1', coreSubjects: ['English', 'Maths', 'Science', 'Social'], electiveSubjects: ['Accounting', 'Business Management', 'Economics', 'Costing'] },
    { id: 'c6', name: 'Science A', capacity: 40, classTeacher: 'Mr. Foster', programme: 'General Science', schoolId: 's3', coreSubjects: ['English', 'Maths', 'Science', 'Social'], electiveSubjects: ['Physics', 'Chemistry', 'Biology', 'Elective Maths'] },
];

const ActionButton: React.FC<{ icon: string, onClick: () => void, title: string, colorClass?: string }> = ({ icon, onClick, title, colorClass = 'text-logip-text-subtle hover:text-logip-text-header dark:text-dark-text-secondary dark:hover:text-dark-text-primary' }) => (
    <button onClick={icon === 'edit' || icon === 'delete' ? (e) => { e.stopPropagation(); onClick(); } : onClick} title={title} className={`p-1.5 rounded-md transition-colors ${colorClass} no-print`}>
        <span className="material-symbols-outlined text-xl">{icon}</span>
    </button>
);

interface ClassesPageProps {
    selectedSchool?: School | null;
    selectedAdmission?: Admission | null;
    students: AdminStudent[];
    classes: Class[];
    setClasses: React.Dispatch<React.SetStateAction<Class[]>>;
    programmes: Programme[];
    permissions: Set<string>;
    isSuperAdmin: boolean;
    adminUser: AdminUser;
}

const ClassesPage: React.FC<ClassesPageProps> = ({ selectedSchool, selectedAdmission, students, classes, setClasses, programmes, permissions, isSuperAdmin, adminUser }) => {
    const userPrefix = adminUser.email;
    const [searchTerm, setSearchTerm] = useState('');
    const [programmeFilter, setProgrammeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const [itemsPerPage, setItemsPerPage] = useLocalStorage<number>(`${userPrefix}_admin_classes_items_per_page`, 10);
    const [showDashboard, setShowDashboard] = useLocalStorage<boolean>(`${userPrefix}_admin_classes_show_dashboard`, false);
    
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

    const [modalState, setModalState] = useState<{ mode: 'add' | 'edit' | 'delete' | null; classItem: Class | null }>({ mode: null, classItem: null });
    const [memberListModal, setMemberListModal] = useState<{ isOpen: boolean; classItem: Class | null; members: AdminStudent[]; }>({ isOpen: false, classItem: null, members: [] });
    const [assignSubjectsModal, setAssignSubjectsModal] = useState<{ isOpen: boolean; classes: Class[] }>({ isOpen: false, classes: [] });

    const toggleCard = (id: string) => {
        setExpandedCards(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const classesWithStats = useMemo(() => {
        if (!selectedSchool) return [];
        return classes
            .filter(c => c.schoolId === selectedSchool.id)
            .map(c => {
                const classStudents = students.filter(s => 
                    s.classId === c.id && 
                    (s.status === 'Admitted' || s.status === 'Placed') &&
                    (!selectedAdmission || s.admissionId === selectedAdmission.id)
                );
                const studentCount = classStudents.length;
                const maleCount = classStudents.filter(s => s.gender === 'Male').length;
                const femaleCount = classStudents.filter(s => s.gender === 'Female').length;
                return { ...c, studentCount, maleCount, femaleCount };
            });
    }, [classes, selectedSchool, students, selectedAdmission]);

    const filteredClasses = useMemo(() => {
        return classesWithStats.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.classTeacher.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesProgramme = programmeFilter === 'all' || c.programme === programmeFilter;
            return matchesSearch && matchesProgramme;
        });
    }, [classesWithStats, searchTerm, programmeFilter]);

    const { items: sortedClasses, requestSort, sortConfig } = useSortableData(filteredClasses, { key: 'name', direction: 'ascending' });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, programmeFilter, itemsPerPage, selectedSchool, selectedAdmission]);

    const totalPages = Math.ceil(sortedClasses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedClasses = sortedClasses.slice(startIndex, startIndex + itemsPerPage);
    const startItem = startIndex + 1;
    const endItem = Math.min(startIndex + itemsPerPage, sortedClasses.length);

    const handleOpenModal = (mode: 'add' | 'edit' | 'delete', classItem: Class | null = null) => {
        setModalState({ mode, classItem });
    };

    const handleCloseModal = () => {
        setModalState({ mode: null, classItem: null });
    };

    const handleShowMembers = (classItem: Class) => {
        const members = students.filter(s => 
            s.classId === classItem.id &&
            (!selectedAdmission || s.admissionId === selectedAdmission.id)
        );
        setMemberListModal({ isOpen: true, classItem, members });
    };

    const handleSaveClass = (formData: Omit<Class, 'id'>) => {
        if (modalState.mode === 'edit' && modalState.classItem) {
            setClasses(classes.map(c => c.id === modalState.classItem!.id ? { ...c, ...formData } : c));
        } else {
            const newClass: Class = { id: `c${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, ...formData };
            setClasses([...classes, newClass]);
        }
        handleCloseModal();
    };

    const handleDeleteClass = () => {
        if (!modalState.classItem) return;
        setClasses(classes.filter(c => c.id !== modalState.classItem!.id));
        handleCloseModal();
    };

    const handleAssignSubjects = (classIds: string[], coreSubjects: string[], electiveSubjects: string[], mode: 'replace' | 'append') => {
        setClasses(prev => prev.map(c => {
            if (classIds.includes(c.id)) {
                let newCore = [...c.coreSubjects];
                let newElective = [...c.electiveSubjects];

                if (mode === 'replace') {
                    newCore = coreSubjects;
                    newElective = electiveSubjects;
                } else {
                    coreSubjects.forEach(s => { if (!newCore.includes(s)) newCore.push(s); });
                    electiveSubjects.forEach(s => { if (!newElective.includes(s)) newElective.push(s); });
                }

                return { ...c, coreSubjects: newCore, electiveSubjects: newElective };
            }
            return c;
        }));
    };

    const handlePrint = () => {
        printTable('classes-table', 'Class List', selectedSchool, undefined, selectedAdmission?.title);
    };

    if (!selectedSchool) {
        return (
            <div className="p-8 text-center text-logip-text-subtle">
                <span className="material-symbols-outlined text-6xl">source_environment</span>
                <p className="mt-4 text-xl font-semibold">No School Selected</p>
                <p>Please select a school from the header to view its classes.</p>
            </div>
        );
    }
    
    const canAdd = isSuperAdmin || permissions.has('btn:cls:add');
    const canEdit = isSuperAdmin || permissions.has('icon:cls:edit');
    const canDelete = isSuperAdmin || permissions.has('icon:cls:delete');
    const canPrint = isSuperAdmin || permissions.has('btn:cls:print');
    const canAssign = isSuperAdmin || permissions.has('btn:cls:subjects');
    const canShowDashboardPerm = isSuperAdmin || permissions.has('btn:cls:dash');

    const availableProgrammes = programmes.filter(p => p.schoolId === selectedSchool.id);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {showDashboard && canShowDashboardPerm && (
                 <div className="mb-6 animate-fadeIn">
                    <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary mb-4">Class Enrollment Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 xl:gap-6">
                        {classesWithStats.map(cls => {
                            const isExpanded = expandedCards.has(cls.id);
                            const percentage = Math.min((cls.studentCount / cls.capacity) * 100, 100);
                            const malePct = cls.studentCount > 0 ? (cls.maleCount / cls.studentCount) * 100 : 0;
                            const femalePct = cls.studentCount > 0 ? (cls.femaleCount / cls.studentCount) * 100 : 0;

                            let pillClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                            if (percentage > 85) pillClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
                            if (percentage >= 100) pillClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';

                            return (
                                <div key={cls.id} className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full group">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate mb-1" title={cls.name}>{cls.name}</h4>
                                             <div className="flex items-center gap-2 mb-2">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{cls.programme}</p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${pillClass}`}>
                                                    {cls.studentCount}/{cls.capacity}
                                                </span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => toggleCard(cls.id)}
                                            className="p-1 rounded-full text-logip-text-subtle hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-xl">
                                                {isExpanded ? 'expand_less' : 'expand_more'}
                                            </span>
                                        </button>
                                    </div>

                                    <div className={`space-y-4 overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                                        <div>
                                            <div className="flex justify-between text-xs font-medium mb-1.5">
                                                <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Male ({cls.maleCount})</span>
                                                <span className="text-pink-600 dark:text-pink-400 flex items-center gap-1">Female ({cls.femaleCount}) <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span></span>
                                            </div>
                                            <div className="flex h-2 rounded-full overflow-hidden w-full">
                                                <div className="bg-blue-500 h-full" style={{ width: `${malePct}%` }}></div>
                                                <div className="bg-pink-500 h-full" style={{ width: `${femalePct}%` }}></div>
                                                {cls.studentCount === 0 && <div className="bg-gray-200 dark:bg-gray-700 h-full w-full"></div>}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 pt-4 border-t border-gray-100 dark:border-dark-border">
                                            {cls.electiveSubjects.slice(0, 5).map((subj, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-gray-50 dark:bg-dark-border text-gray-600 dark:text-gray-400 text-[10px] rounded-md border border-gray-100 dark:border-gray-700 truncate max-w-[100px]">
                                                    {subj}
                                                </span>
                                            ))}
                                            {cls.electiveSubjects.length > 5 && (
                                                <span className="px-2 py-0.5 bg-gray-50 dark:bg-dark-border text-gray-500 dark:text-gray-400 text-[10px] rounded-md">
                                                    +{cls.electiveSubjects.length - 5}
                                                </span>
                                            )}
                                             {cls.electiveSubjects.length === 0 && <span className="text-[10px] text-gray-400 italic">No electives</span>}
                                        </div>
                                    </div>
                                    
                                    {!isExpanded && (
                                        <div className="mt-2 text-center">
                                            <button 
                                                onClick={() => toggleCard(cls.id)}
                                                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline"
                                            >
                                                Show Details
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="bg-logip-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-logip-border dark:border-dark-border">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-logip-border dark:border-dark-border pb-6 no-print">
                    <div className="w-full md:w-auto">
                        <h2 className="text-2xl font-bold text-logip-text-header dark:text-dark-text-primary">Classes</h2>
                        <p className="text-logip-text-subtle dark:text-dark-text-secondary mt-1">Manage class assignments for <span className="font-bold">{selectedAdmission?.title || 'this context'}</span>.</p>
                    </div>
                    <div className="flex w-full md:w-auto items-center gap-2 flex-wrap">
                        {canPrint && <PrintButton onClick={handlePrint} />}
                         {canAssign && (
                            <button 
                                onClick={() => setAssignSubjectsModal({ isOpen: true, classes: filteredClasses })}
                                className="flex items-center justify-center gap-2 px-4 py-2 text-base border border-blue-500 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors whitespace-nowrap"
                            >
                                <span className="material-symbols-outlined text-xl">library_books</span>
                                Assign Subjects
                            </button>
                         )}
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
                                Add Class
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
                            placeholder="Search classes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-base text-logip-text-header dark:text-dark-text-primary placeholder-logip-text-subtle dark:placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-logip-primary dark:focus:ring-blue-500 transition-colors"
                        />
                    </div>
                    <div className="w-full sm:w-auto">
                        <AdminSelect value={programmeFilter} onChange={e => setProgrammeFilter(e.target.value)}>
                            <option value="all">All Programmes</option>
                            {availableProgrammes.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </AdminSelect>
                    </div>
                </div>
            </div>

            <div className="mt-6 bg-logip-white dark:bg-dark-surface rounded-lg border border-logip-border dark:border-dark-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]" id="classes-table">
                        <thead className="border-b border-logip-border dark:border-dark-border bg-gray-50 dark:bg-white/5">
                            <tr>
                                <th className="p-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">S/N</th>
                                <SortableHeader sortKey="name" sortConfig={sortConfig} requestSort={requestSort}>Class Name</SortableHeader>
                                <SortableHeader sortKey="programme" sortConfig={sortConfig} requestSort={requestSort}>Programme</SortableHeader>
                                <SortableHeader sortKey="studentCount" sortConfig={sortConfig} requestSort={requestSort}>Enrollment</SortableHeader>
                                <SortableHeader sortKey="capacity" sortConfig={sortConfig} requestSort={requestSort}>Capacity</SortableHeader>
                                <SortableHeader sortKey="classTeacher" sortConfig={sortConfig} requestSort={requestSort}>Class Teacher</SortableHeader>
                                <th className="p-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider no-print">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedClasses.map((cls, index) => (
                                <tr key={cls.id} className="border-b border-logip-border dark:border-dark-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-base text-gray-600 dark:text-gray-400">{startIndex + index + 1}</td>
                                    <td className="p-4">
                                        <button onClick={() => handleShowMembers(cls)} className="font-bold text-base text-gray-900 dark:text-gray-100 hover:underline hover:text-blue-600 text-left">{cls.name}</button>
                                    </td>
                                    <td className="p-4 text-base text-gray-600 dark:text-gray-400">{cls.programme}</td>
                                    <td className="p-4 text-base text-gray-600 dark:text-gray-400">{cls.studentCount}</td>
                                    <td className="p-4 text-base text-gray-600 dark:text-gray-400">{cls.capacity}</td>
                                    <td className="p-4 text-base text-gray-600 dark:text-gray-400">{cls.classTeacher}</td>
                                    <td className="p-4 no-print">
                                        <div className="flex items-center gap-1">
                                            {canEdit && <ActionButton icon="edit" onClick={() => handleOpenModal('edit', cls)} title="Edit Class" colorClass="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"/>}
                                            {canDelete && <ActionButton icon="delete" onClick={() => handleOpenModal('delete', cls)} title="Delete Class" colorClass="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"/>}
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
                        totalItems={sortedClasses.length}
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
                    onClose={() => setMemberListModal({ isOpen: false, classItem: null, members: [] })} 
                    title={`${memberListModal.classItem?.name} Students`} 
                    members={memberListModal.members} 
                    icon="class" 
                    headerColor="from-blue-600 to-indigo-600" 
                    selectedSchool={selectedSchool}
                    listMeta={selectedAdmission?.title}
                />
            )}
            
            {assignSubjectsModal.isOpen && (
                <AssignSubjectsModal 
                    isOpen={true} 
                    onClose={() => setAssignSubjectsModal({ isOpen: false, classes: [] })} 
                    selectedClasses={assignSubjectsModal.classes} 
                    allClasses={classes.filter(c => c.schoolId === selectedSchool.id)}
                    onAssign={handleAssignSubjects} 
                />
            )}

            {(modalState.mode === 'add' || modalState.mode === 'edit') && (
                <ClassFormModal 
                    isOpen={true} 
                    onClose={handleCloseModal} 
                    onSave={handleSaveClass} 
                    classItem={modalState.classItem} 
                    programmes={availableProgrammes}
                    selectedSchoolId={selectedSchool.id}
                />
            )}

            {modalState.mode === 'delete' && (
                <ConfirmationModal 
                    isOpen={true} 
                    onClose={handleCloseModal} 
                    onConfirm={handleDeleteClass} 
                    title="Delete Class"
                >
                    Are you sure you want to delete <strong>{modalState.classItem?.name}</strong>? This action cannot be undone.
                </ConfirmationModal>
            )}
        </div>
    );
};

// Sub-component: ClassFormModal
const ClassFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Class, 'id'>) => void;
    classItem: Class | null;
    programmes: Programme[];
    selectedSchoolId: string;
}> = ({ isOpen, onClose, onSave, classItem, programmes, selectedSchoolId }) => {
    const [formData, setFormData] = useState<Omit<Class, 'id'>>({
        name: classItem?.name || '',
        capacity: classItem?.capacity || 50,
        classTeacher: classItem?.classTeacher || '',
        programme: classItem?.programme || '',
        schoolId: classItem?.schoolId || selectedSchoolId,
        coreSubjects: classItem?.coreSubjects || [],
        electiveSubjects: classItem?.electiveSubjects || []
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title={classItem ? 'Edit Class' : 'Add New Class'}>
            <form onSubmit={handleSubmit} className="space-y-6 flex flex-col justify-between min-h-[350px]">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AdminFormField label="Class Name"><AdminInput name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Science 1" /></AdminFormField>
                        <AdminFormField label="Programme">
                            <AdminSelect name="programme" value={formData.programme} onChange={handleChange} required>
                                <option value="">Select Programme</option>
                                {programmes.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </AdminSelect>
                        </AdminFormField>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AdminFormField label="Capacity"><AdminInput name="capacity" type="number" value={formData.capacity} onChange={handleChange} required /></AdminFormField>
                        <AdminFormField label="Class Teacher"><AdminInput name="classTeacher" value={formData.classTeacher} onChange={handleChange} /></AdminFormField>
                    </div>
                </div>
                <div className="pt-6 flex justify-end gap-4 border-t border-gray-100 dark:border-dark-border mt-12">
                    <button type="button" onClick={onClose} className="px-6 py-2 text-base font-semibold rounded-lg border border-logip-border dark:border-dark-border text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 text-base font-semibold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover transition-colors">{classItem ? 'Save Changes' : 'Create Class'}</button>
                </div>
            </form>
        </AdminModal>
    );
};

export default ClassesPage;

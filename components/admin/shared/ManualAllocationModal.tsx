
import React, { useState, useMemo, useEffect } from 'react';
import AdminModal from './AdminModal';
import { AdminStudent } from '../pages/StudentsPage';
import { House } from './houseData';
import { Dormitory } from './dormitoryData';
import { useToast } from './ToastContext';
import PaginationControls from './PaginationControls';

interface ManualAllocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    students: AdminStudent[];
    setStudents: React.Dispatch<React.SetStateAction<AdminStudent[]>>;
    houses: House[];
    dormitories: Dormitory[];
    selectedSchoolId: string;
    admissionId: string;
    enableRoomManagement: boolean;
    houseAssignmentMethod: string;
    dormAssignmentMethod: string;
}

const StatWidget = ({ label, value, color }: { label: string; value: string | number; color: 'blue' | 'orange' | 'green' | 'teal' }) => {
    const colors = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
        orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400',
        green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
        teal: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400',
    };
    const textColors = {
        blue: 'text-blue-800 dark:text-blue-200',
        orange: 'text-orange-800 dark:text-orange-200',
        green: 'text-green-800 dark:text-green-200',
        teal: 'text-teal-800 dark:text-teal-200',
    };
    return (
        <div className={`${colors[color]} p-3 rounded-xl border flex flex-col justify-center items-center text-center`}>
            <p className="text-[10px] uppercase font-bold tracking-wider opacity-80 mb-1">{label}</p>
            <p className={`text-xl font-black ${textColors[color]}`}>{value}</p>
        </div>
    );
};

const ManualAllocationModal: React.FC<ManualAllocationModalProps> = ({ isOpen, onClose, students, setStudents, houses, dormitories, selectedSchoolId, admissionId, enableRoomManagement, houseAssignmentMethod, dormAssignmentMethod }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterUnassigned, setFilterUnassigned] = useState(true);
    const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
    const [residenceFilter, setResidenceFilter] = useState<'All' | 'Boarding' | 'Day'>('All');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const isHouseManual = houseAssignmentMethod === 'manual';
    const isDormManual = enableRoomManagement && dormAssignmentMethod === 'manual';

    const relevantStudents = useMemo(() => students.filter(s => s.schoolId === selectedSchoolId && s.admissionId === admissionId && (s.status === 'Admitted' || s.status === 'Placed' || s.status === 'Pending')), [students, selectedSchoolId, admissionId]);
    
    const filteredList = useMemo(() => relevantStudents.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.indexNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const needsHouse = isHouseManual && !s.houseId;
        const needsDorm = isDormManual && s.residence === 'Boarding' && !s.dormitoryId;
        const isUnassigned = needsHouse || needsDorm;
        const matchesUnassigned = filterUnassigned ? isUnassigned : true;
        const matchesGender = genderFilter === 'All' || s.gender === genderFilter;
        const matchesResidence = residenceFilter === 'All' || s.residence === residenceFilter;
        return matchesSearch && matchesUnassigned && matchesGender && matchesResidence;
    }), [relevantStudents, searchTerm, filterUnassigned, genderFilter, residenceFilter, isHouseManual, isDormManual]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterUnassigned, genderFilter, residenceFilter]);

    const totalPages = Math.ceil(filteredList.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedList = useMemo(() => filteredList.slice(startIndex, startIndex + itemsPerPage), [filteredList, startIndex, itemsPerPage]);
    const startItem = startIndex + 1;
    const endItem = Math.min(startIndex + itemsPerPage, filteredList.length);

    const handleHouseChange = (studentId: string, houseId: string) => {
        setStudents(prev => prev.map(s => {
            if (s.id === studentId) {
                const currentDorm = dormitories.find(d => d.id === s.dormitoryId);
                const dormIsValid = currentDorm && currentDorm.houseId === houseId;
                return { ...s, houseId, dormitoryId: dormIsValid ? s.dormitoryId : '' };
            }
            return s;
        }));
    };

    const handleDormChange = (studentId: string, dormitoryId: string) => {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, dormitoryId } : s));
    };

    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title="Manual House & Room Allocation" size="6xl">
            <div className="flex flex-col h-[80vh]">
                <div className="flex flex-wrap gap-3 mb-6">
                    <div className="flex-1 min-w-[120px]"><StatWidget label="Total Students" value={relevantStudents.length} color="blue" /></div>
                    <div className="flex-1 min-w-[120px]"><StatWidget label="Assigned" value={relevantStudents.filter(s => s.houseId).length} color="green" /></div>
                    <div className="flex-1 min-w-[120px]"><StatWidget label="Unassigned" value={relevantStudents.length - relevantStudents.filter(s => s.houseId).length} color="orange" /></div>
                    <div className="flex-1 min-w-[120px]"><StatWidget label="Houses" value={houses.length} color="teal" /></div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="relative flex-1 min-w-[250px]">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value as any)} className="bg-white dark:bg-dark-surface border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="All">Genders</option><option value="Male">Male</option><option value="Female">Female</option>
                        </select>
                        <button onClick={() => setFilterUnassigned(!filterUnassigned)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border transition-all ${filterUnassigned ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300'}`}>
                            <span className="material-symbols-outlined text-lg">{filterUnassigned ? 'check_box' : 'check_box_outline_blank'}</span> Unassigned
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-visible pr-2 no-scrollbar space-y-3 pb-48">
                    {paginatedList.length > 0 ? (
                        paginatedList.map(student => (
                            <div key={student.id} className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl shadow-sm hover:shadow-md transition-all relative z-[1]">
                                <div className="flex items-center gap-4 mb-4 md:mb-0 w-full md:w-[35%]">
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate">{student.name}</h4>
                                        <p className="text-[10px] text-gray-500 font-mono">{student.indexNumber}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-[65%] items-center">
                                    <select value={student.houseId || ''} onChange={(e) => handleHouseChange(student.id, e.target.value)} disabled={!isHouseManual} className={`flex-1 w-full px-3 py-2 rounded-lg border text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${!isHouseManual ? 'bg-gray-100 cursor-not-allowed' : 'bg-white dark:bg-dark-surface'}`}>
                                        <option value="">Select House...</option>
                                        {houses.filter(h => h.gender === student.gender || h.gender === 'Mixed').map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                    </select>
                                    {enableRoomManagement && (
                                        <select value={student.dormitoryId || ''} onChange={(e) => handleDormChange(student.id, e.target.value)} disabled={!isDormManual || !student.houseId || student.residence === 'Day'} className={`flex-1 w-full px-3 py-2 rounded-lg border text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${(!isDormManual || student.residence === 'Day') ? 'bg-gray-100 cursor-not-allowed' : 'bg-white dark:bg-dark-surface'}`}>
                                            <option value="">Select Room...</option>
                                            {dormitories.filter(d => d.houseId === student.houseId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                             <span className="material-symbols-outlined text-6xl opacity-20">person_off</span>
                             <p className="mt-4 text-lg font-bold uppercase tracking-widest">No matching students found</p>
                        </div>
                    )}
                </div>
                {/* Footer with Pagination */}
                <div className="pt-4 border-t border-logip-border dark:border-dark-border mt-auto bg-logip-white dark:bg-dark-surface z-[10]">
                    <PaginationControls 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={filteredList.length}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={setItemsPerPage}
                        startItem={startItem}
                        endItem={endItem}
                    />
                </div>
            </div>
        </AdminModal>
    );
};

export default ManualAllocationModal;

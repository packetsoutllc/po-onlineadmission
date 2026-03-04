import React, { useState, useMemo, useEffect, useRef } from 'react';
import AdminModal from '../shared/AdminModal';
import ConfirmationModal from '../shared/ConfirmationModal';
import { AdminInput, AdminSelect, AdminFormField } from '../shared/forms';
import PaginationControls from '../shared/PaginationControls';
import PrintButton from '../shared/PrintButton';
import { School, Admission } from './SettingsPage'; 
import { printTable } from '../shared/PrintService';
import { AdminStudent } from './StudentsPage';
import MemberListModal from '../shared/MemberListModal';
import { House, initialHouses, getHouseColor } from '../shared/houseData';
import CapacityBar from '../shared/CapacityBar';
import StatCard from '../shared/StatCard';
import BarChart from '../charts/BarChart';
import DoughnutChart from '../charts/DoughnutChart';
import DatePicker from '../../DatePicker';
import ChartDataModal from '../shared/ChartDataModal';
import { useSortableData } from '../../hooks/useSortableData';
import SortableHeader from '../shared/SortableHeader';
import { Dormitory } from '../shared/dormitoryData';
import DormitoryManagementModal from '../shared/DormitoryManagementModal';
import { AdmissionSettings } from './SecuritySettingsTab';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../shared/ToastContext';
import ManualAllocationModal from '../shared/ManualAllocationModal';
import { AdminUser } from '../AdminLayout';

// Hook for handling clicks outside a referenced element
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

// --- HELPER COMPONENTS ---
const ActionButton: React.FC<{ icon: string, onClick: (e: React.MouseEvent) => void, title: string, colorClass?: string }> = ({ icon, onClick, title, colorClass = 'text-logip-text-subtle hover:text-logip-text-header dark:text-dark-text-secondary dark:hover:text-dark-text-primary' }) => (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-md transition-colors ${colorClass} no-print`}>
        <span className="material-symbols-outlined text-xl">{icon}</span>
    </button>
);

// --- MAIN COMPONENT ---
interface HousesPageProps {
    selectedSchool?: School | null;
    selectedAdmission?: Admission | null;
    students: AdminStudent[];
    dormitories: Dormitory[];
    setDormitories: React.Dispatch<React.SetStateAction<Dormitory[]>>;
    permissions: Set<string>;
    isSuperAdmin: boolean;
    adminUser: AdminUser; 
}

const HousesPage: React.FC<HousesPageProps> = ({ selectedSchool, selectedAdmission, students, dormitories, setDormitories, permissions, isSuperAdmin, adminUser }) => {
    const userPrefix = adminUser.email;
    const { showToast } = useToast();
    const [houses, setHouses] = useState(initialHouses);
    const [searchTerm, setSearchTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    // PERMANENCE: Scope houses page settings by user email
    const [itemsPerPage, setItemsPerPage] = useLocalStorage<number>(`${userPrefix}_admin_houses_items_per_page`, 10);
    const [showDashboard, setShowDashboard] = useLocalStorage<boolean>(`${userPrefix}_admin_houses_show_dashboard`, false);

    const [selectedHouseId, setSelectedHouseId] = useState('all');
    const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
    const [chartDate, setChartDate] = useState(new Date().toISOString().split('T')[0]);
    const [isTimeframeDropdownOpen, setIsTimeframeDropdownOpen] = useState(false);
    const timeframeDropdownRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(timeframeDropdownRef, () => setIsTimeframeDropdownOpen(false));
    
    const [, setStudents] = useLocalStorage<AdminStudent[]>('admin_students', []);

    const [modalState, setModalState] = useState<{ mode: 'add' | 'edit' | 'delete' | 'chart' | 'dorms' | 'allocate' | null; house: (House & { studentCount: number; }) | null; data?: AdminStudent[] }>({ mode: null, house: null });
    const [memberListModal, setMemberListModal] = useState<{ isOpen: boolean; house: (House & { studentCount: number; }) | null; members: AdminStudent[]; }>({ isOpen: false, house: null, members: [] });

    const admissionSettingsKey = selectedSchool && selectedAdmission ? `admissionSettings_${selectedSchool.id}_${selectedAdmission.id}` : null;
    const [storedAdmissionSettings] = useLocalStorage<AdmissionSettings | null>(admissionSettingsKey, null);

    const admissionSettings = useMemo(() => {
        const defaults: Partial<AdmissionSettings> = { enableRoomManagement: true, houseAssignmentMethod: 'automatic', dormAssignmentMethod: 'automatic' };
        return { ...defaults, ...storedAdmissionSettings } as AdmissionSettings;
    }, [storedAdmissionSettings]);

    const isManualAllocationActive = useMemo(() => {
        return admissionSettings.houseAssignmentMethod === 'manual' || (admissionSettings.enableRoomManagement && admissionSettings.dormAssignmentMethod === 'manual');
    }, [admissionSettings]);

    // This computes stats for ALL houses in the selected context, regardless of table search filters
    const housesWithStats = useMemo(() => {
        if (!selectedSchool) return [];
        return houses
            .filter(house => house.schoolId === selectedSchool.id)
            .map(house => {
                const houseStudents = students.filter(s => 
                    s.houseId === house.id &&
                    (s.status === 'Admitted' || s.status === 'Placed') &&
                    (!selectedAdmission || s.admissionId === selectedAdmission.id)
                );
                const studentCount = houseStudents.length;
                const dormCount = dormitories.filter(d => d.houseId === house.id).length;
                return { ...house, studentCount, dormCount };
            });
    }, [houses, selectedSchool, students, dormitories, selectedAdmission]);

    const filteredHouses = useMemo(() => {
        return housesWithStats.filter(house => {
            const matchesSearch = house.name.toLowerCase().includes(searchTerm.toLowerCase()) || house.houseMaster.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesGender = genderFilter === 'all' || house.gender === genderFilter;
            return matchesSearch && matchesGender;
        });
    }, [housesWithStats, searchTerm, genderFilter]);
    
    const { items: sortedHouses, requestSort, sortConfig } = useSortableData(filteredHouses, { key: 'name', direction: 'ascending' });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, genderFilter, itemsPerPage, selectedSchool, selectedAdmission]);

    const dashboardStats = useMemo(() => {
        // Stats should be calculated on the base context (school/admission), NOT on table-filtered houses
        const relevantStudents = students.filter(student => 
            student.schoolId === selectedSchool?.id &&
            (!selectedAdmission || student.admissionId === selectedAdmission.id) &&
            (student.status === 'Admitted' || student.status === 'Placed')
        );

        const now = new Date(chartDate + 'T23:59:59');
        const oneDay = 24 * 60 * 60 * 1000;
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const dailyAdmissions = relevantStudents.filter(s => s.admissionDate && new Date(s.admissionDate).toDateString() === todayStart.toDateString()).length;
        const startOfWeek = new Date(todayStart.getTime() - todayStart.getDay() * oneDay);
        const weeklyAdmissions = relevantStudents.filter(s => s.admissionDate && new Date(s.admissionDate) >= startOfWeek).length;
        const startOfMonth = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
        const monthlyAdmissions = relevantStudents.filter(s => s.admissionDate && new Date(s.admissionDate) >= startOfMonth).length;
        
        const totalAdmitted = relevantStudents.length;
        // Corrected: Use housesWithStats (all houses in school) for total capacity calculation
        const totalCapacity = housesWithStats.reduce((acc, h) => acc + h.capacity, 0);
        const occupancy = totalCapacity > 0 ? (totalAdmitted / totalCapacity) * 100 : 0;
        
        let chartData: { label: string, value: number, students: AdminStudent[] }[] = [];
        const studentsToChart = relevantStudents.filter(s => selectedHouseId === 'all' || s.houseId === selectedHouseId);

        if (timeframe === 'daily') {
            for (let i = 6; i >= 0; i--) {
                const day = new Date(todayStart.getTime() - i * oneDay);
                const dayStudents = studentsToChart.filter(s => s.admissionDate && new Date(s.admissionDate).toDateString() === day.toDateString());
                chartData.push({ label: day.toLocaleDateString('en-US', { weekday: 'short' }), value: dayStudents.length, students: dayStudents });
            }
        } else if (timeframe === 'weekly') {
            for (let i = 3; i >= 0; i--) {
                const weekEnd = new Date(todayStart.getTime() - (i * 7 * oneDay));
                const weekStart = new Date(weekEnd.getTime() - (6 * oneDay));
                weekStart.setHours(0,0,0,0);

                const count = studentsToChart.filter(s => { 
                    if (!s.admissionDate) return false;
                    const d = new Date(s.admissionDate); 
                    return d >= weekStart && d <= weekEnd; 
                });
                chartData.push({ label: `Wk ${4-i}`, value: count.length, students: count });
            }
        } else {
             // Updated: Show 12 months instead of 6
             for (let i = 11; i >= 0; i--) {
                const month = new Date(todayStart.getFullYear(), todayStart.getMonth() - i, 1);
                const monthStudents = studentsToChart.filter(s => { 
                    if (!s.admissionDate) return false;
                    const d = new Date(s.admissionDate); 
                    return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth(); 
                });
                chartData.push({ label: month.toLocaleDateString('en-US', { month: 'short' }), value: monthStudents.length, students: monthStudents });
            }
        }

        return {
            totalHouses: housesWithStats.length, totalCapacity, totalAdmitted, occupancy,
            dailyAdmissions, weeklyAdmissions, monthlyAdmissions,
            placementsChartData: chartData,
        };
    }, [housesWithStats, selectedHouseId, timeframe, chartDate, students, selectedSchool, selectedAdmission]);


    const totalPages = Math.ceil(sortedHouses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedHouses = sortedHouses.slice(startIndex, startIndex + itemsPerPage);
    const startItem = startIndex + 1;
    const endItem = Math.min(startIndex + itemsPerPage, sortedHouses.length);

    const handleOpenModal = (mode: 'add' | 'edit' | 'delete' | 'dorms' | 'allocate' | null, house: (House & { studentCount: number; }) | null = null) => setModalState({ mode, house });
    const handleCloseModal = () => setModalState({ mode: null, house: null });
    
    const handleShowMembers = (house: House & { studentCount: number; }) => {
        const members = students.filter(s => 
            s.houseId === house.id && 
            s.schoolId === house.schoolId &&
            (!selectedAdmission || s.admissionId === selectedAdmission.id)
        );
        setMemberListModal({ isOpen: true, house, members });
    };

    const handleSaveHouse = (formData: Omit<House, 'id' | 'dateCreated'>) => {
        if (modalState.mode === 'edit' && modalState.house) {
            setHouses(houses.map(h => h.id === modalState.house!.id ? { ...(h as House), ...formData } : h));
        } else {
            const newHouse: House = { id: `h${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, dateCreated: new Date().toISOString().split('T')[0], ...formData };
            setHouses([newHouse, ...houses]);
        }
        handleCloseModal();
    };

    const handleDeleteHouse = () => {
        if (!modalState.house) return;
        setHouses(houses.filter(h => h.id !== modalState.house!.id));
        handleCloseModal();
    };
    
    const handlePrint = () => printTable('houses-table', 'House List', selectedSchool, undefined, selectedAdmission?.title);
    const handleBarClick = (data: { students: AdminStudent[] }) => setModalState({ mode: 'chart', house: null, data: data.students });

    if (!selectedSchool) {
        return <div className="p-8 text-center text-logip-text-subtle"><span className="material-symbols-outlined text-6xl">source_environment</span><p className="mt-4 text-xl font-semibold">No School Selected</p><p>Please select a school to view its houses.</p></div>;
    }
    
    const canAdd = isSuperAdmin || permissions.has('btn:house:add');
    const canEdit = isSuperAdmin || permissions.has('icon:house:edit');
    const canDelete = isSuperAdmin || permissions.has('icon:house:delete');
    const canPrint = isSuperAdmin || permissions.has('btn:house:print');
    const canShowDashboardPerm = isSuperAdmin || permissions.has('btn:house:dash');
    const canAllocate = isSuperAdmin || permissions.has('icon:house:edit') || permissions.has('icon:std:edit');

    return (
        <div className="p-4 sm:p-6 lg:p-8">
             {showDashboard && canShowDashboardPerm && (
                <section className="mb-6 space-y-6 animate-fadeIn">
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard icon="today" title="Daily Admissions" value={dashboardStats.dailyAdmissions.toString()} />
                        <StatCard icon="calendar_view_week" title="Weekly Admissions" value={dashboardStats.weeklyAdmissions.toString()} />
                        <StatCard icon="calendar_month" title="Monthly Admissions" value={dashboardStats.monthlyAdmissions.toString()} />
                        <StatCard icon="groups" title="Total Enrolled" value={dashboardStats.totalAdmitted.toLocaleString()} />
                    </div>
                    {/* Fixed Height Container for the Bar Chart */}
                    <div className="w-full h-[300px]">
                         <BarChart title="Placements Over Time" data={dashboardStats.placementsChartData} onBarClick={handleBarClick}>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                <DatePicker value={chartDate} onChange={setChartDate} variant="display" />
                                <AdminSelect value={selectedHouseId} onChange={e => setSelectedHouseId(e.target.value)} className="w-32 py-1 text-sm !bg-gray-100 dark:!bg-dark-border"><option value="all">All Houses</option>{housesWithStats.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</AdminSelect>
                                 <div className="relative" ref={timeframeDropdownRef}>
                                    <button onClick={() => setIsTimeframeDropdownOpen(prev => !prev)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gray-100 dark:bg-dark-border text-logip-text-body dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700/50">
                                        <span className="capitalize">{timeframe}</span>
                                        <span className="material-symbols-outlined text-base">expand_more</span>
                                    </button>
                                    {isTimeframeDropdownOpen && (
                                        <div className="absolute top-full right-0 mt-1 w-32 bg-logip-white dark:bg-dark-surface border border-logip-border dark:border-dark-border rounded-lg shadow-lg z-10 py-1">
                                            {['daily', 'weekly', 'monthly'].map(tf => (
                                                <button
                                                    key={tf}
                                                    onClick={() => { setTimeframe(tf as any); setIsTimeframeDropdownOpen(false); }}
                                                    className="w-full text-left px-3 py-1.5 text-sm capitalize hover:bg-gray-100 dark:hover:bg-dark-border"
                                                >
                                                    {tf}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </BarChart>
                    </div>
                </section>
            )}
            <div className="bg-logip-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-logip-border dark:border-dark-border">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-logip-border dark:border-dark-border pb-6 no-print">
                    <div>
                        <h2 className="text-2xl font-bold text-logip-text-header dark:text-dark-text-primary">Houses</h2>
                        <p className="text-logip-text-subtle dark:text-dark-text-secondary mt-1">Manage residential houses for <span className="font-bold">{selectedAdmission?.title || 'this context'}</span>.</p>
                    </div>
                    <div className="flex w-full md:w-auto items-center gap-2 flex-wrap">
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
                                Add House
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
                            placeholder="Search houses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-base text-logip-text-header dark:text-dark-text-primary placeholder-logip-text-subtle dark:placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-logip-primary dark:focus:ring-dark-accent-blue transition-colors"
                        />
                    </div>
                    <div className="w-full sm:w-auto flex items-center gap-4">
                        {isManualAllocationActive && canAllocate && (
                            <button 
                                onClick={() => handleOpenModal('allocate')}
                                className="flex items-center justify-center gap-2 px-4 py-2 text-base bg-logip-orange-btn text-white font-semibold rounded-lg hover:bg-logip-orange-btn-hover transition-colors whitespace-nowrap"
                            >
                                <span className="material-symbols-outlined text-xl">bedroom_parent</span>
                                Manual Allocation
                            </button>
                        )}
                        <AdminSelect value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
                            <option value="all">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Mixed">Mixed</option>
                        </AdminSelect>
                    </div>
                </div>
            </div>

            <div className="mt-6 bg-logip-white dark:bg-dark-surface rounded-lg border border-logip-border dark:border-dark-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]" id="houses-table">
                        <thead className="border-b border-logip-border dark:border-dark-border bg-gray-50 dark:bg-white/5">
                            <tr>
                                <th className="p-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">S/N</th>
                                <SortableHeader sortKey="name" sortConfig={sortConfig} requestSort={requestSort}>House Name</SortableHeader>
                                <SortableHeader sortKey="gender" sortConfig={sortConfig} requestSort={requestSort}>Gender</SortableHeader>
                                <SortableHeader sortKey="studentCount" sortConfig={sortConfig} requestSort={requestSort}>Occupancy</SortableHeader>
                                <SortableHeader sortKey="houseMaster" sortConfig={sortConfig} requestSort={requestSort}>House Master/Mistress</SortableHeader>
                                {admissionSettings.enableRoomManagement && <th className="p-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dorms</th>}
                                <th className="p-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider no-print">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedHouses.map((house, index) => {
                                const houseColors = getHouseColor(house);
                                return (
                                    <tr key={house.id} className="border-b border-logip-border dark:border-dark-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-base text-gray-600 dark:text-gray-400">{startIndex + index + 1}</td>
                                        <td className="p-4">
                                            <button onClick={() => handleShowMembers(house)} className="font-bold text-base text-gray-900 dark:text-gray-100 hover:underline hover:text-blue-600 text-left">{house.name}</button>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${house.gender === 'Male' ? 'bg-blue-100 text-blue-800' : house.gender === 'Female' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'}`}>{house.gender}</span>
                                        </td>
                                        <td className="p-4">
                                            <CapacityBar current={house.studentCount} capacity={house.capacity} barColorClass={houseColors.bar} textColorClass={houseColors.text} />
                                        </td>
                                        <td className="p-4 text-base text-gray-600 dark:text-gray-400">{house.houseMaster}</td>
                                        {admissionSettings.enableRoomManagement && (
                                            <td className="p-4">
                                                <button onClick={() => handleOpenModal('dorms', house)} className="text-base text-blue-600 dark:text-blue-400 hover:underline">{house.dormCount} Rooms</button>
                                            </td>
                                        )}
                                        <td className="p-4 no-print">
                                            <div className="flex items-center gap-1">
                                                {canEdit && <ActionButton icon="edit" onClick={() => handleOpenModal('edit', house)} title="Edit House" colorClass="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"/>}
                                                {canDelete && <ActionButton icon="delete" onClick={() => handleOpenModal('delete', house)} title="Delete House" colorClass="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"/>}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-logip-border dark:border-dark-border flex items-center justify-between no-print">
                    <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={sortedHouses.length} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} startItem={startItem} endItem={endItem} />
                </div>
            </div>
            {/* Modals */}
            {(modalState.mode === 'add' || modalState.mode === 'edit') && (
                <HouseFormModal isOpen={true} onClose={handleCloseModal} onSave={handleSaveHouse} house={modalState.house} selectedSchoolId={selectedSchool.id} />
            )}
            {modalState.mode === 'delete' && (
                <ConfirmationModal isOpen={true} onClose={handleCloseModal} onConfirm={handleDeleteHouse} title="Delete House">
                    Are you sure you want to delete <strong>{modalState.house?.name}</strong>? This action cannot be undone.
                </ConfirmationModal>
            )}
            {memberListModal.isOpen && (
                <MemberListModal 
                    isOpen={true} 
                    onClose={() => setMemberListModal({ isOpen: false, house: null, members: [] })} 
                    title={`${memberListModal.house?.name} Residents`} 
                    members={memberListModal.members} 
                    icon="home" 
                    headerColor={getHouseColor(memberListModal.house!).gradient} 
                    selectedSchool={selectedSchool}
                    groupGender={memberListModal.house?.gender}
                />
            )}
            {modalState.mode === 'chart' && modalState.data && (
                <ChartDataModal isOpen={true} onClose={handleCloseModal} title="Admissions Data" students={modalState.data} />
            )}
            {modalState.mode === 'dorms' && modalState.house && (
                <DormitoryManagementModal isOpen={true} onClose={handleCloseModal} house={modalState.house} dormitories={dormitories} setDormitories={setDormitories} allStudents={students} permissions={permissions} isSuperAdmin={isSuperAdmin} />
            )}
            {modalState.mode === 'allocate' && (
                <ManualAllocationModal 
                    isOpen={true} 
                    onClose={handleCloseModal} 
                    students={students} 
                    setStudents={setStudents} 
                    houses={housesWithStats} 
                    dormitories={dormitories} 
                    selectedSchoolId={selectedSchool.id} 
                    admissionId={selectedAdmission?.id || ''} 
                    enableRoomManagement={admissionSettings.enableRoomManagement} 
                    houseAssignmentMethod={admissionSettings.houseAssignmentMethod} 
                    dormAssignmentMethod={admissionSettings.dormAssignmentMethod} 
                />
            )}
        </div>
    );
};

// Sub-component: HouseFormModal
const HouseFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<House, 'id' | 'dateCreated'>) => void;
    house: House | null;
    selectedSchoolId: string;
}> = ({ isOpen, onClose, onSave, house, selectedSchoolId }) => {
    const [formData, setFormData] = useState<Omit<House, 'id' | 'dateCreated'>>({
        name: house?.name || '',
        gender: house?.gender || 'Male',
        capacity: house?.capacity || 100,
        houseMaster: house?.houseMaster || '',
        houseMasterContact: house?.houseMasterContact || '',
        schoolId: house?.schoolId || selectedSchoolId,
        color: house?.color || 'blue'
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
        <AdminModal isOpen={isOpen} onClose={onClose} title={house ? 'Edit House' : 'Add New House'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AdminFormField label="House Name"><AdminInput name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Ansa-Sasraku House" /></AdminFormField>
                    <AdminFormField label="Gender Scope">
                        <AdminSelect name="gender" value={formData.gender} onChange={handleChange} required>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Mixed">Mixed</option>
                        </AdminSelect>
                    </AdminFormField>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AdminFormField label="Capacity"><AdminInput name="capacity" type="number" value={formData.capacity} onChange={handleChange} required /></AdminFormField>
                    <AdminFormField label="House Color Theme">
                         <AdminSelect name="color" value={formData.color} onChange={handleChange}>
                            <option value="blue">Blue</option>
                            <option value="green">Green</option>
                            <option value="red">Red</option>
                            <option value="yellow">Yellow</option>
                            <option value="navy">Navy</option>
                        </AdminSelect>
                    </AdminFormField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AdminFormField label="House Master/Mistress"><AdminInput name="houseMaster" value={formData.houseMaster} onChange={handleChange} required placeholder="e.g. Mr. Alex Tetteh" /></AdminFormField>
                    <AdminFormField label="Contact Number"><AdminInput name="houseMasterContact" value={formData.houseMasterContact} onChange={handleChange} placeholder="024..." /></AdminFormField>
                </div>
                <div className="pt-4 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 text-base font-semibold rounded-lg border border-logip-border dark:border-dark-border text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 text-base font-semibold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover transition-colors">{house ? 'Save Changes' : 'Create House'}</button>
                </div>
            </form>
        </AdminModal>
    );
};

export default HousesPage;
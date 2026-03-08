import React, { useMemo, useState, useRef, useEffect } from 'react';
import { AdminStudent, StudentStatus } from './StudentsPage';
import { School, Admission } from './SettingsPage';
import { Class } from './ClassesPage';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { AdminUser } from '../AdminLayout';
import { Role, INITIAL_ROLES } from './RolesAndPermissionsPage';
import { getHouseColor, initialHouses, House } from '../shared/houseData';
import DatePicker from '../../DatePicker';
import Icon from '../shared/Icons';
import { safeJsonParse } from '../../../utils/security';
import { formatDateTime } from '../../../utils/date';

const StatCard: React.FC<{
    icon: string;
    title: string;
    value: string;
    change?: string;
    changeColor?: string;
    iconBgClass?: string;
    iconColorClass?: string;
}> = ({ icon, title, value, change, changeColor, iconBgClass = 'bg-gray-100 dark:bg-gray-800', iconColorClass = 'text-logip-text-header dark:text-gray-200' }) => {
    const isPercentage = change && change.endsWith('%');

    return (
        <div className="bg-white dark:bg-report-dark p-3 sm:p-4 rounded-2xl border border-logip-border dark:border-report-border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center gap-3 lg:flex-row">
                <div className={`w-11 h-11 lg:w-10 lg:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBgClass}`}>
                    <Icon name={icon} className={`w-5 h-5 lg:w-5 lg:h-5 ${iconColorClass}`} />
                </div>
                <h3 className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</h3>
            </div>
            <div className="flex items-baseline justify-start gap-2 mt-2 lg:mt-1.5 pl-0 lg:pl-1">
                <p className="text-2xl sm:text-3xl font-bold text-logip-text-header dark:text-gray-100 tracking-tight">{value}</p>
                {isPercentage && (
                    <p className={`text-sm font-medium ${changeColor || 'text-gray-500 dark:text-gray-300'}`}>{change}</p>
                )}
            </div>
        </div>
    );
};

/** Only use application data for the given school+index to avoid cross-school data. */
const getStudentAvatarUrl = (indexNumber: string, gender: 'Male' | 'Female', schoolId?: string): string => {
    if (!schoolId) return placeholderAvatar(gender);
    const key = `applicationData_${schoolId}_${indexNumber}`;
    const raw = localStorage.getItem(key);
    if (raw) {
        const parsed = safeJsonParse<{ passportPhotograph?: { data?: string }; data?: string }>(raw, {});
        if (parsed.passportPhotograph?.data) return parsed.passportPhotograph.data;
        if (parsed.data) return parsed.data;
    }
    return placeholderAvatar(gender);
};
const placeholderAvatar = (gender: 'Male' | 'Female') => `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="${gender === 'Male' ? '#dbeafe' : '#fce7f3'}" /><text x="50" y="55" font-family="Arial" font-size="50" fill="${gender === 'Male' ? '#1d4ed8' : '#be185d'}" text-anchor="middle" dominant-baseline="middle">?</text></svg>`)}`;

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

const RecentAdmissionsTable: React.FC<{ students: AdminStudent[], onEditStudent: (student: AdminStudent) => void, classes: Class[] }> = ({ students, onEditStudent, classes }) => {
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const prevStudentsRef = useRef<AdminStudent[] | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        if (prevStudentsRef.current && students.length > prevStudentsRef.current.length) {
            const oldIds = new Set(prevStudentsRef.current.map(s => s.id));
            const newStudent = students.find(s => !oldIds.has(s.id));
            if (newStudent) {
                setHighlightedId(newStudent.id);
                setTimeout(() => setHighlightedId(null), 4000);
            }
        }
        prevStudentsRef.current = students;
    }, [students]);

    const filteredStudents = useMemo(() => {
        return students.filter(student => 
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.indexNumber.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime());
    }, [students, searchTerm]);

    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredStudents.slice(start, start + itemsPerPage);
    }, [filteredStudents, currentPage, itemsPerPage]);

    return (
        <div className="bg-white dark:bg-report-dark p-4 sm:p-6 rounded-2xl border border-logip-border dark:border-report-border shadow-sm h-full flex flex-col overflow-hidden relative">
            {/* Accent bar on mobile/tablet */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-logip-primary to-blue-400 lg:hidden" aria-hidden />
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mb-4 flex-shrink-0">
                <h3 className="text-lg sm:text-xl font-bold text-logip-text-header dark:text-gray-100">Recent Applications</h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                     <div className="relative flex-grow sm:flex-grow-0 min-w-0">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-logip-text-subtle pointer-events-none"><Icon name="search" className="w-5 h-5" /></span>
                        <input
                            type="text"
                            placeholder="Search name or index..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full h-10 bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-xl pl-10 pr-4 py-2 text-sm text-logip-text-header dark:text-dark-text-primary placeholder-logip-text-subtle focus:outline-none focus:ring-2 focus:ring-logip-primary transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Mobile/tablet: card list */}
            <div className="flex-1 overflow-auto md:hidden -mx-4 sm:-mx-6 no-scrollbar space-y-3">
                {filteredStudents.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <Icon name="search_off" className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
                        <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">No students found</p>
                    </div>
                ) : (
                    paginatedStudents.map((student) => {
                        const studentHouse = initialHouses.find(h => h.id === student.houseId) as (House & { studentCount: number }) | undefined;
                        const studentClass = classes.find(c => c.id === student.classId);
                        const houseColors = getHouseColor(studentHouse);
                        const isHighlighted = student.id === highlightedId;
                        return (
                            <button
                                key={student.id}
                                type="button"
                                onClick={() => onEditStudent(student)}
                                className={`w-full text-left p-4 rounded-xl border bg-gray-50/50 dark:bg-dark-bg/50 transition-colors ${isHighlighted ? 'border-blue-300 dark:border-blue-600 ring-2 ring-blue-200 dark:ring-blue-800' : 'border-gray-100 dark:border-report-border hover:border-gray-200 dark:hover:border-report-border'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <img src={getStudentAvatarUrl(student.indexNumber, student.gender, student.schoolId)} alt={student.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-logip-text-header dark:text-gray-100 truncate">{student.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{student.indexNumber}</p>
                                    </div>
                                    <StatusPill status={student.status} />
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-report-border">
                                    {studentClass && <span className="text-xs text-gray-500 dark:text-gray-400">{studentClass.name}</span>}
                                    {studentHouse && <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${houseColors.pillBg} ${houseColors.pillText}`}>{studentHouse.name}</span>}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
            
            {/* Desktop: table */}
            <div className="flex-1 overflow-auto -mx-6 no-scrollbar hidden md:block">
                <table className="w-full text-left min-w-[1200px]">
                    <thead className="border-b border-logip-border dark:border-dark-border">
                        <tr>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">S/N</th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Index No.</th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gender</th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class</th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Agg.</th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">House</th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-logip-border dark:divide-dark-border">
                        {paginatedStudents.map((student, index) => {
                            const studentHouse = initialHouses.find(h => h.id === student.houseId) as (House & { studentCount: number; }) | undefined;
                            const studentClass = classes.find(c => c.id === student.classId);
                            const houseColors = getHouseColor(studentHouse);
                            const isHighlighted = student.id === highlightedId;
                            
                            return (
                                <tr key={student.id} className={`transition-colors duration-1000 ${isHighlighted ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-base text-logip-text-body dark:text-gray-300">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <img src={getStudentAvatarUrl(student.indexNumber, student.gender, student.schoolId)} alt={student.name} className="w-10 h-10 rounded-full object-cover" />
                                            <div title={student.name} className="font-semibold text-base text-logip-text-header dark:text-gray-100 text-left truncate max-w-[200px]">
                                                {student.name}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-base text-logip-text-body dark:text-gray-300 font-mono">{student.indexNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-base text-logip-text-body dark:text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">{student.gender === 'Male' ? 'male' : 'female'}</span>
                                            {student.gender}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-base text-logip-text-body dark:text-gray-300">{studentClass?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-base text-logip-text-body dark:text-gray-300">{student.aggregate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {studentHouse ? <span title={studentHouse.name} className={`inline-block truncate max-w-[150px] px-2 py-1 text-xs font-semibold rounded-md ${houseColors.pillBg} ${houseColors.pillText}`}>{studentHouse.name}</span> : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {student.isProtocol && <span className="px-2 py-1 text-xs font-bold text-red-700 bg-pink-200 dark:text-pink-300 dark:bg-pink-800/50 rounded-md">P</span>}
                                            <StatusPill status={student.status} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {filteredStudents.length === 0 && (
                    <div className="text-center py-16 text-logip-text-subtle">
                        <Icon name="search_off" className="w-12 h-12 text-logip-text-subtle" />
                        <p className="mt-2 font-medium">No students found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

interface DashboardPageProps {
    selectedSchool?: School | null;
    selectedAdmission?: Admission | null;
    adminUser: AdminUser;
    setActivePage: (page: string) => void;
    onEditStudent: (student: AdminStudent) => void;
    students: AdminStudent[];
    classes: Class[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({ selectedSchool, selectedAdmission, adminUser, setActivePage, onEditStudent, students, classes }) => {
    const [roles] = useLocalStorage<Role[]>('admin_roles', INITIAL_ROLES, (value: any) => {
        if (Array.isArray(value)) {
            return value.map(role => ({
                ...role,
                permissionIds: new Set(role.permissionIds._values || role.permissionIds)
            }));
        }
        return value;
    });

    const userRole = useMemo(() => roles.find(r => r.id === adminUser.roleId), [adminUser.roleId, roles]);
    
    const { stats, activityFeedStudents } = useMemo(() => {
        const relevantStudents = students.filter(s =>
            s.schoolId === selectedSchool?.id && s.admissionId === selectedAdmission?.id
        );
        
        const sortedForActivity = [...relevantStudents].sort((a, b) => new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime());

        const totalApplicants = relevantStudents.length;
        const admittedStudents = relevantStudents.filter(s => s.status === 'Admitted' || s.status === 'Placed');
        const totalAdmitted = admittedStudents.length;

        const totalMale = admittedStudents.filter(s => s.gender === 'Male').length;
        const totalFemale = admittedStudents.filter(s => s.gender === 'Female').length;
        const boarders = admittedStudents.filter(s => s.residence === 'Boarding').length;
        const day = admittedStudents.filter(s => s.residence === 'Day').length;
        const notAdmitted = relevantStudents.filter(s => s.status !== 'Admitted' && s.status !== 'Placed').length;
        const totalProtocol = relevantStudents.filter(s => s.isProtocol).length;

        const formatPercent = (value: number, total: number) => total > 0 ? `${Math.round((value / total) * 100)}%` : '0%';

        return { 
            stats: {
                totalApplicants: totalApplicants.toString(),
                totalAdmitted: totalAdmitted.toString(),
                totalMale: totalMale.toString(),
                totalFemale: totalFemale.toString(),
                notAdmitted: notAdmitted.toString(),
                protocol: totalProtocol.toString(),
                boarders: boarders.toString(),
                day: day.toString(),
                admittedPercent: formatPercent(totalAdmitted, relevantStudents.length),
                malePercent: formatPercent(totalMale, totalAdmitted),
                femalePercent: formatPercent(totalFemale, totalAdmitted),
                boardersPercent: formatPercent(boarders, totalAdmitted),
                dayPercent: formatPercent(day, totalAdmitted),
                notAdmittedPercent: formatPercent(notAdmitted, relevantStudents.length),
            },
            activityFeedStudents: sortedForActivity 
        };
    }, [selectedSchool, selectedAdmission, students]);

    const avatarUrl = adminUser.avatar || `https://i.pravatar.cc/80?u=${adminUser.email}`;
    const [lastLogin, setLastLogin] = useState<string | null>(null);

    useEffect(() => {
        const lastLoginTimestamp = localStorage.getItem('admin_last_login_timestamp');
        if (lastLoginTimestamp) {
            const date = new Date(parseInt(lastLoginTimestamp, 10));
            setLastLogin(formatDateTime(date));
        }
    }, []);

    return (
        <div className="p-4 sm:p-5 lg:p-8 h-full flex flex-col gap-4 sm:gap-6 overflow-auto">
            {/* Mobile/tablet: 2x2 primary stats then 2x2 secondary; desktop: full grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
                <div className="xl:col-span-3 flex flex-col gap-4 sm:gap-6">
                    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                        <StatCard icon="groups" title="Total Applicants" value={stats.totalApplicants} iconBgClass="bg-indigo-100 dark:bg-indigo-900/30" iconColorClass="text-indigo-600 dark:text-indigo-400" />
                        <StatCard icon="how_to_reg" title="Total Enrolled" value={stats.totalAdmitted} change={stats.admittedPercent} changeColor="text-green-500 dark:text-green-400" iconBgClass="bg-emerald-100 dark:bg-emerald-900/30" iconColorClass="text-emerald-600 dark:text-emerald-400" />
                        <StatCard icon="pending" title="Pending Status" value={stats.notAdmitted} change={stats.notAdmittedPercent} changeColor="text-red-500 dark:text-red-400" iconBgClass="bg-red-100 dark:bg-red-900/30" iconColorClass="text-red-600 dark:text-red-400" />
                        <StatCard icon="admin_panel_settings" title="Total Protocol" value={stats.protocol} iconBgClass="bg-gray-100 dark:bg-gray-700/50" iconColorClass="text-gray-600 dark:text-gray-300" />
                        <StatCard icon="night_shelter" title="Total Boarders" value={stats.boarders} change={stats.boardersPercent} iconBgClass="bg-sky-100 dark:bg-sky-900/30" iconColorClass="text-sky-600 dark:text-sky-400" />
                        <StatCard icon="wb_sunny" title="Total Day" value={stats.day} change={stats.dayPercent} iconBgClass="bg-amber-100 dark:bg-amber-900/30" iconColorClass="text-amber-600 dark:text-amber-400" />
                        <StatCard icon="male" title="Total Male" value={stats.totalMale} change={stats.malePercent} changeColor="text-blue-500 dark:text-blue-400" iconBgClass="bg-blue-100 dark:bg-blue-900/30" iconColorClass="text-blue-600 dark:text-blue-400" />
                        <StatCard icon="female" title="Total Female" value={stats.totalFemale} change={stats.femalePercent} changeColor="text-pink-500 dark:text-pink-400" iconBgClass="bg-pink-100 dark:bg-pink-900/30" iconColorClass="text-pink-600 dark:text-pink-400" />
                    </section>
                </div>
                <aside className="hidden xl:flex flex-col gap-6">
                    <div className="bg-white dark:bg-report-dark border border-logip-border dark:border-report-border rounded-2xl p-4 text-center shadow-sm h-full flex flex-col">
                        <img src={avatarUrl} alt={adminUser.name} className="w-20 h-20 rounded-full mx-auto object-cover" />
                        <h3 className="font-semibold text-lg text-logip-text-header dark:text-gray-100 mt-3">{adminUser.name}</h3>
                        <p className="text-sm text-logip-text-subtle">{userRole?.name || 'User'}</p>
                        <div className="mt-3 pt-3 border-t border-logip-border dark:border-report-border text-left mt-auto">
                            <p className="text-xs text-logip-text-subtle dark:text-gray-400">Last logged in:</p>
                            <p className="text-sm font-semibold text-logip-text-header dark:text-gray-200">{lastLogin || 'First time login'}</p>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Profile card — mobile/tablet only, compact */}
            <div className="flex xl:hidden items-center gap-4 p-4 bg-white dark:bg-report-dark rounded-2xl border border-gray-100 dark:border-report-border shadow-sm">
                <img src={avatarUrl} alt={adminUser.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base text-logip-text-header dark:text-gray-100 truncate">{adminUser.name}</h3>
                    <p className="text-xs text-logip-text-subtle dark:text-gray-400">{userRole?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{lastLogin || 'First time login'}</p>
                </div>
            </div>

            <section className="flex-1 min-h-0 flex flex-col">
                <RecentAdmissionsTable students={activityFeedStudents} onEditStudent={onEditStudent} classes={classes} />
            </section>
        </div>
    );
};

export default DashboardPage;
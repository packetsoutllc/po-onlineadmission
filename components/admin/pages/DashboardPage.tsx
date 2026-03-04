import React, { useMemo, useState, useRef, useEffect } from 'react';
import { AdminStudent, StudentStatus } from './StudentsPage';
import { School, Admission } from './SettingsPage';
// FIX: Added missing Class type import from ClassesPage
import { Class } from './ClassesPage';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { AdminUser } from '../AdminLayout';
import { Role, INITIAL_ROLES } from './RolesAndPermissionsPage';
import { getHouseColor, initialHouses, House } from '../shared/houseData';
import DatePicker from '../../DatePicker';

const StatCard: React.FC<{
    icon: string;
    title: string;
    value: string;
    change?: string;
    changeColor?: string;
    iconBgClass?: string;
    iconColorClass?: string;
}> = ({ icon, title, value, change, changeColor, iconBgClass = 'bg-logip-border dark:bg-gray-800', iconColorClass = 'text-logip-text-header dark:text-gray-200' }) => {
    const isPercentage = change && change.endsWith('%');

    return (
        <div className="bg-logip-white dark:bg-report-dark p-4 rounded-xl border border-logip-border dark:border-report-border flex flex-col justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-logip-border dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-xl text-logip-text-header dark:text-gray-200">{icon}</span>
                </div>
                <h3 className="text-sm text-gray-500 dark:text-gray-400">{title}</h3>
            </div>
            <div className="flex items-baseline justify-start gap-4 mt-2 pl-1">
                <p className="text-3xl font-bold text-logip-text-header dark:text-gray-100">{value}</p>
                {isPercentage && (
                    <p className={`text-base font-medium ${changeColor || 'text-gray-500 dark:text-gray-300'}`}>{change}</p>
                )}
            </div>
        </div>
    );
};

const getStudentAvatarUrl = (indexNumber: string, gender: 'Male' | 'Female', schoolId?: string): string => {
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
        <div className="bg-logip-white dark:bg-report-dark p-6 rounded-xl border border-logip-border dark:border-report-border h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 flex-shrink-0">
                <h3 className="text-xl font-bold text-logip-text-header dark:text-gray-100">Recent Applications</h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                     <div className="relative flex-grow sm:flex-grow-0">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-logip-text-subtle">search</span>
                        <input
                            type="text"
                            placeholder="Search name or index..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2 text-sm text-logip-text-header dark:text-dark-text-primary placeholder-logip-text-subtle focus:outline-none focus:ring-2 focus:ring-logip-primary transition-colors"
                        />
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-auto -mx-6 no-scrollbar">
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
                        <span className="material-symbols-outlined text-5xl">search_off</span>
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
            setLastLogin(date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }));
        }
    }, []);

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col gap-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 flex flex-col gap-6">
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard icon="groups" title="Total Applicants" value={stats.totalApplicants} />
                        <StatCard icon="how_to_reg" title="Total Enrolled" value={stats.totalAdmitted} change={stats.admittedPercent} changeColor="text-green-500 dark:text-green-400" />
                        <StatCard icon="pending" title="Pending Status" value={stats.notAdmitted} change={stats.notAdmittedPercent} changeColor="text-red-500 dark:text-red-400" />
                        <StatCard icon="admin_panel_settings" title="Total Protocol" value={stats.protocol} />
                        <StatCard icon="night_shelter" title="Total Boarders" value={stats.boarders} change={stats.boardersPercent} />
                        <StatCard icon="wb_sunny" title="Total Day" value={stats.day} change={stats.dayPercent} />
                        <StatCard icon="male" title="Total Male" value={stats.totalMale} change={stats.malePercent} changeColor="text-blue-500 dark:text-blue-400" />
                        <StatCard icon="female" title="Total Female" value={stats.totalFemale} change={stats.femalePercent} changeColor="text-pink-500 dark:text-pink-400" />
                    </section>
                </div>
                <aside className="flex-col gap-6 xl:flex">
                    <div className="bg-logip-white dark:bg-report-dark border border-logip-border dark:border-report-border rounded-2xl p-6 text-center">
                        <img src={avatarUrl} alt={adminUser.name} className="w-20 h-20 rounded-full mx-auto" />
                        <h3 className="font-semibold text-lg text-logip-text-header dark:text-gray-100 mt-4">{adminUser.name}</h3>
                        {/* FIX: Corrected variable name from 'role' to 'userRole?.name' */}
                        <p className="text-sm text-logip-text-subtle">{userRole?.name || 'User'}</p>
                        <div className="mt-4 pt-4 border-t border-logip-border dark:border-report-border text-left">
                            <p className="text-xs text-logip-text-subtle dark:text-gray-400">Last logged in:</p>
                            <p className="text-sm font-semibold text-logip-text-header dark:text-gray-200">{lastLogin || 'First time login'}</p>
                        </div>
                    </div>
                </aside>
            </div>
            <section className="flex-1 min-h-0">
                <RecentAdmissionsTable students={activityFeedStudents} onEditStudent={onEditStudent} classes={classes} />
            </section>
        </div>
    );
};

export default DashboardPage;
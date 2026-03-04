
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './Sidebar';
import PageContent from './PageContent';
import Header from './Header';
import { initialSchools, School, initialAdmissions, Admission } from './pages/SettingsPage';
import StudentDetails, { Student, ApplicationStatus } from '../StudentDetails';
import { AdminStudent, initialAdminStudents, StudentStatus } from './pages/StudentsPage';
import { ToastProvider, useToast } from './shared/ToastContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { INITIAL_ROLES, Role } from './pages/RolesAndPermissionsPage';
import { initialClasses, Class } from './pages/ClassesPage';
import { initialProgrammes, Programme } from './pages/ProgrammesPage';
import { Dormitory, initialDormitories } from './shared/dormitoryData';
import { Conversation, initialConversations } from './pages/MessagesPage';
import { logActivity } from '../../utils/storage';

export interface AdminUser {
    email: string;
    roleId: string;
    name: string;
    avatar?: string;
    phoneNumber?: string;
    schoolId?: string; 
    admissionId?: string; 
    expiryDate?: string; 
}

const mapAdminStudentToStudent = (adminStudent: AdminStudent, allStudents: AdminStudent[]): Student => {
    const freshStudent = allStudents.find(s => s.id === adminStudent.id) || adminStudent;
    return {
        name: freshStudent.name,
        indexNumber: freshStudent.indexNumber,
        programme: freshStudent.programme,
        gender: freshStudent.gender,
        residence: freshStudent.residence,
        aggregate: freshStudent.aggregate,
        schoolId: freshStudent.schoolId,
        admissionId: freshStudent.admissionId,
        isProtocol: !!freshStudent.isProtocol,
        currentSchoolPlaced: freshStudent.currentSchoolPlaced,
        phoneNumber: freshStudent.phoneNumber,
    };
};

const PAGE_PERMISSIONS_MAP: Record<string, string> = {
    'Dashboard': 'page:dashboard',
    'Students': 'page:students',
    'Transactions': 'page:transactions',
    'Messages': 'page:messages',
    'Programmes': 'page:programmes',
    'Classes': 'page:classes',
    'Houses': 'page:houses',
    'Logs': 'page:logs',
    'Roles and Permissions': 'page:roles',
    'Users': 'page:users',
    'Settings': 'page:settings'
};

const AdminLayoutContent: React.FC<AdminLayoutProps> = ({ adminUser, setAdminUser, toggleTheme, isDarkMode, onExitAdmin }) => {
    const { showToast } = useToast();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activePage, setActivePage] = useState('Dashboard');
    const [allSchools, setAllSchools] = useLocalStorage<School[]>('admin_schools', initialSchools);
    const [allAdmissions, setAllAdmissions] = useLocalStorage<Admission[]>('admin_admissions', initialAdmissions);
    const [students, setStudents] = useLocalStorage<AdminStudent[]>('admin_students', initialAdminStudents);
    const [classes] = useLocalStorage<Class[]>('admin_classes', initialClasses);
    const [programmes] = useLocalStorage<Programme[]>('admin_programmes', initialProgrammes);
    const [dormitories] = useLocalStorage<Dormitory[]>('admin_dormitories', initialDormitories);
    const [conversations, setConversations] = useLocalStorage<Conversation[]>('admin_conversations', initialConversations);
    
    const [allRoles] = useLocalStorage<Role[]>('admin_roles', INITIAL_ROLES);

    const isSuperAdmin = adminUser.roleId === 'role_super_admin';

    // Automatic Midnight Logout Logic (UTC)
    useEffect(() => {
        const checkMidnightLogout = () => {
            const now = new Date();
            // Check if it's 12 AM UTC (Hour 0, Minute 0)
            if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
                // Logout all roles except Super Admin
                if (adminUser.roleId !== 'role_super_admin') {
                    console.log('Midnight UTC reached. Automatically logging out standard user account.');
                    onExitAdmin();
                }
            }
        };

        const timerId = setInterval(checkMidnightLogout, 30000); // Check every 30 seconds
        return () => clearInterval(timerId);
    }, [adminUser.roleId, onExitAdmin]);

    // --- ACTIVITY LOGGING: Navigation ---
    useEffect(() => {
        logActivity(
            { name: adminUser.name, avatar: adminUser.avatar || '', type: 'admin' },
            'navigated to',
            'navigation',
            `${activePage} Page`,
            adminUser.schoolId
        );
    }, [activePage, adminUser.name, adminUser.avatar, adminUser.schoolId]);

    const permissions: Set<string> = useMemo(() => {
        const role = allRoles.find(r => r.id === adminUser.roleId);
        const pIds = Array.isArray(role?.permissionIds) ? role.permissionIds : [];
        return new Set(pIds);
    }, [adminUser.roleId, allRoles]);

    const visiblePageIds = useMemo(() => {
        return Object.keys(PAGE_PERMISSIONS_MAP).filter(id => 
            isSuperAdmin || permissions.has(PAGE_PERMISSIONS_MAP[id])
        );
    }, [isSuperAdmin, permissions]);

    useEffect(() => {
        if (visiblePageIds.length > 0 && !visiblePageIds.includes(activePage)) {
            setActivePage(visiblePageIds[0]);
        }
    }, [visiblePageIds, activePage]);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'admin_users') {
                try {
                    const users = JSON.parse(e.newValue || '[]');
                    const me = users.find((u: any) => u.email === adminUser.email);
                    if (me && me.roleId !== adminUser.roleId) {
                        setAdminUser(prev => prev ? ({ ...prev, roleId: me.roleId }) : null);
                        showToast('Your security profile has been updated.', 'info');
                    }
                } catch(e) {}
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [adminUser.email, adminUser.roleId, setAdminUser, showToast]);

    const schools = useMemo(() => {
        let list = isSuperAdmin ? allSchools : allSchools.filter(s => s.id === adminUser.schoolId);
        if (!isSuperAdmin) {
            list = list.filter(s => s.status === 'Active');
        }
        return list;
    }, [allSchools, isSuperAdmin, adminUser.schoolId]);
    
    const admissions = useMemo(() => {
        let list = allAdmissions;
        if (!isSuperAdmin) {
            if (adminUser.admissionId && adminUser.admissionId !== 'none') {
                list = allAdmissions.filter(a => a.id === adminUser.admissionId);
            } else {
                list = allAdmissions.filter(a => a.schoolId === adminUser.schoolId);
            }
            list = list.filter(a => a.status === 'Active');
        }
        return list;
    }, [allAdmissions, isSuperAdmin, adminUser.admissionId, adminUser.schoolId]);

    const [selectedSchoolId, setSelectedSchoolId] = useLocalStorage<string | null>(`${adminUser.email}_admin_selected_school_id`, schools[0]?.id || null);
    
    const initialAdmissionValue = useMemo(() => {
        if (!isSuperAdmin && adminUser.admissionId && adminUser.admissionId !== 'none') {
            return adminUser.admissionId;
        }
        return admissions.find(a => a.schoolId === selectedSchoolId)?.id || admissions[0]?.id || null;
    }, [isSuperAdmin, adminUser.admissionId, admissions, selectedSchoolId]);

    const [selectedAdmissionId, setSelectedAdmissionId] = useLocalStorage<string | null>(`${adminUser.email}_admin_selected_admission_id`, initialAdmissionValue);

    useEffect(() => {
        if (!selectedSchoolId) return;

        if (!isSuperAdmin && adminUser.admissionId && adminUser.admissionId !== 'none') {
            return;
        }

        const validAdmissionsForSchool = admissions.filter(a => a.schoolId === selectedSchoolId);
        const currentIsStillValid = validAdmissionsForSchool.some(a => a.id === selectedAdmissionId);

        if (!currentIsStillValid) {
            setSelectedAdmissionId(validAdmissionsForSchool[0]?.id || null);
        }
    }, [selectedSchoolId, admissions, isSuperAdmin, adminUser.admissionId, selectedAdmissionId, setSelectedAdmissionId]);

    const [studentToEdit, setStudentToEdit] = useState<AdminStudent | null>(null);

    const onEditStudent = (student: AdminStudent) => {
        setStudentToEdit(student);
    };

    if (studentToEdit) {
        return (
            <div className="absolute inset-0 z-[100] bg-logip-bg dark:bg-background-dark">
                 <StudentDetails student={mapAdminStudentToStudent(studentToEdit, students)} onReturn={() => setStudentToEdit(null)} applicationStatus={studentToEdit.status} isAdminEditMode={true} allStudents={students} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full items-center justify-center p-0 sm:p-4 bg-logip-bg dark:bg-background-dark">
            <div className="w-full h-full sm:max-w-[1600px] bg-logip-white dark:bg-report-dark sm:rounded-2xl sm:border sm:border-gray-200/80 dark:border-transparent flex overflow-hidden relative shadow-2xl">
                {/* Mobile Sidebar Backdrop */}
                {isSidebarOpen && (
                    <div 
                        onClick={() => setIsSidebarOpen(false)} 
                        className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-fadeIn backdrop-blur-[2px]"
                    ></div>
                )}
                
                <Sidebar 
                    activePage={activePage} 
                    setActivePage={(page) => {
                        setActivePage(page);
                        setIsSidebarOpen(false);
                    }} 
                    onExitAdmin={onExitAdmin} 
                    permissions={permissions} 
                    conversations={conversations} 
                    isOpen={isSidebarOpen} 
                    isSuperAdmin={isSuperAdmin} 
                />
                
                <main className="flex-1 flex flex-col overflow-hidden">
                    <Header 
                        adminUser={adminUser} 
                        userRole={allRoles.find(r => r.id === adminUser.roleId)} 
                        toggleTheme={toggleTheme} 
                        isDarkMode={isDarkMode} 
                        schools={schools} 
                        selectedSchool={schools.find(s => s.id === selectedSchoolId)} 
                        setSelectedSchoolId={setSelectedSchoolId} 
                        admissions={admissions} 
                        selectedAdmission={admissions.find(a => a.id === selectedAdmissionId)} 
                        setSelectedAdmissionId={setSelectedAdmissionId} 
                        setActivePage={setActivePage} 
                        onExitAdmin={onExitAdmin} 
                        onMenuClick={() => setIsSidebarOpen(true)} 
                    />
                    <div className="flex-1 overflow-x-hidden overflow-y-auto no-scrollbar">
                        <PageContent 
                            activePage={activePage} 
                            setActivePage={setActivePage} 
                            selectedSchool={schools.find(s => s.id === selectedSchoolId)} 
                            selectedAdmission={admissions.find(a => a.id === selectedAdmissionId)} 
                            setSelectedSchoolId={setSelectedSchoolId} 
                            setSelectedAdmissionId={setSelectedAdmissionId} 
                            onEditStudent={onEditStudent} 
                            schools={allSchools} 
                            setSchools={setAllSchools} 
                            admissions={allAdmissions} 
                            setAdmissions={setAllAdmissions} 
                            students={students} 
                            setStudents={setStudents} 
                            classes={classes} 
                            setClasses={() => {}} 
                            programmes={programmes} 
                            setProgrammes={() => {}} 
                            dormitories={dormitories} 
                            setDormitories={() => {}} 
                            conversations={conversations} 
                            setConversations={setConversations} 
                            adminUser={adminUser} 
                            setAdminUser={setAdminUser} 
                            onExitAdmin={onExitAdmin} 
                            permissions={permissions}
                            isSuperAdmin={isSuperAdmin}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

interface AdminLayoutProps {
    adminUser: AdminUser;
    setAdminUser: React.Dispatch<React.SetStateAction<AdminUser | null>>;
    toggleTheme: () => void;
    isDarkMode: boolean;
    onExitAdmin: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = (props) => <ToastProvider><AdminLayoutContent {...props} /></ToastProvider>;
export default AdminLayout;

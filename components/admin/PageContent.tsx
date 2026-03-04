
import React from 'react';
import DashboardPage from './pages/DashboardPage';
import StudentsPage, { AdminStudent } from './pages/StudentsPage';
import ProgrammesPage, { Programme } from './pages/ProgrammesPage';
import ClassesPage, { Class } from './pages/ClassesPage';
import HousesPage from './pages/HousesPage';
import LogsPage from './pages/LogsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage, { School, Admission } from './pages/SettingsPage';
import RolesAndPermissionsPage from './pages/RolesAndPermissionsPage';
import MessagesPage, { Conversation } from './pages/MessagesPage';
import TransactionsPage from './pages/TransactionsPage';
import { Dormitory } from './shared/dormitoryData';
import { AdminUser } from './AdminLayout';
import UserProfileSettingsTab from './pages/UserProfileSettingsTab';

interface PageContentProps {
    activePage: string;
    setActivePage: (page: string) => void;
    selectedSchool?: School | null;
    selectedAdmission?: Admission | null;
    setSelectedSchoolId: (id: string | null) => void;
    setSelectedAdmissionId: (id: string | null) => void;
    onEditStudent: (student: AdminStudent) => void;
    schools: School[];
    setSchools: React.Dispatch<React.SetStateAction<School[]>>;
    admissions: Admission[];
    setAdmissions: React.Dispatch<React.SetStateAction<Admission[]>>;
    students: AdminStudent[];
    setStudents: React.Dispatch<React.SetStateAction<AdminStudent[]>>;
    classes: Class[];
    setClasses: React.Dispatch<React.SetStateAction<Class[]>>;
    programmes: Programme[];
    setProgrammes: React.Dispatch<React.SetStateAction<Programme[]>>;
    dormitories: Dormitory[];
    setDormitories: React.Dispatch<React.SetStateAction<Dormitory[]>>;
    conversations: Conversation[];
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    adminUser: AdminUser;
    setAdminUser: React.Dispatch<React.SetStateAction<AdminUser | null>>;
    onExitAdmin: () => void;
    permissions: Set<string>;
    isSuperAdmin: boolean;
}

const PageContent: React.FC<PageContentProps> = ({ 
    activePage, setActivePage, selectedSchool, selectedAdmission, setSelectedSchoolId, setSelectedAdmissionId, onEditStudent, 
    schools, setSchools, admissions, setAdmissions, students, setStudents,
    classes, setClasses, programmes, setProgrammes,
    dormitories, setDormitories, conversations, setConversations,
    adminUser, setAdminUser, onExitAdmin,
    permissions,
    isSuperAdmin
}) => {
    switch (activePage) {
        case 'Dashboard':
            return <DashboardPage 
                selectedSchool={selectedSchool} 
                selectedAdmission={selectedAdmission}
                adminUser={adminUser}
                setActivePage={setActivePage}
                onEditStudent={onEditStudent}
                students={students}
                classes={classes}
            />;
        case 'Students':
            return <StudentsPage 
                selectedSchool={selectedSchool} 
                selectedAdmission={selectedAdmission} 
                onEditStudent={onEditStudent}
                students={students}
                setStudents={setStudents}
                dormitories={dormitories}
                classes={classes}
                programmes={programmes}
                permissions={permissions}
                isSuperAdmin={isSuperAdmin}
                // FIX: Pass adminUser to StudentsPage
                adminUser={adminUser}
            />;
        case 'Transactions':
            return <TransactionsPage 
                selectedSchool={selectedSchool} 
                selectedAdmission={selectedAdmission} 
                students={students} 
                setStudents={setStudents}
                permissions={permissions}
                isSuperAdmin={isSuperAdmin}
                // FIX: Pass adminUser to TransactionsPage
                adminUser={adminUser}
            />;
        case 'Messages':
            return <MessagesPage conversations={conversations} setConversations={setConversations} />;
        case 'Programmes':
            return <ProgrammesPage 
                selectedSchool={selectedSchool} 
                students={students} 
                programmes={programmes}
                setProgrammes={setProgrammes}
                classes={classes}
                permissions={permissions}
                isSuperAdmin={isSuperAdmin}
                // FIX: Pass adminUser to ProgrammesPage
                adminUser={adminUser}
            />;
        case 'Classes':
            return <ClassesPage 
                selectedSchool={selectedSchool} 
                students={students} 
                classes={classes}
                setClasses={setClasses}
                programmes={programmes}
                permissions={permissions}
                isSuperAdmin={isSuperAdmin}
                // FIX: Pass adminUser to ClassesPage
                adminUser={adminUser}
            />;
        case 'Houses':
            return <HousesPage 
                selectedSchool={selectedSchool}
                selectedAdmission={selectedAdmission}
                students={students} 
                dormitories={dormitories}
                setDormitories={setDormitories}
                permissions={permissions}
                isSuperAdmin={isSuperAdmin}
                // FIX: Pass adminUser to HousesPage
                adminUser={adminUser}
            />;
        case 'Logs':
            return <LogsPage adminUser={adminUser} />;
        case 'Roles and Permissions':
            return <RolesAndPermissionsPage 
                permissions={permissions}
                isSuperAdmin={isSuperAdmin}
            />;
        case 'Users':
            return <UsersPage 
                selectedSchool={selectedSchool} 
                permissions={permissions}
                isSuperAdmin={isSuperAdmin}
            />;
        case 'Settings':
            return <SettingsPage 
                selectedSchool={selectedSchool}
                selectedAdmission={selectedAdmission}
                setSelectedSchoolId={setSelectedSchoolId}
                setSelectedAdmissionId={setSelectedAdmissionId}
                schools={schools}
                setSchools={setSchools}
                admissions={admissions}
                setAdmissions={setAdmissions}
                adminUser={adminUser}
                setAdminUser={setAdminUser}
                onExitAdmin={onExitAdmin}
                permissions={permissions}
                isSuperAdmin={isSuperAdmin}
            />;
        default:
            return <div className="p-8 text-center text-logip-text-subtle"><span className="material-symbols-outlined text-5xl">error</span><p className="mt-2">Page not found: {activePage}</p></div>;
    }
};

export default PageContent;

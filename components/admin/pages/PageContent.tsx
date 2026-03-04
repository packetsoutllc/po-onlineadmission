
import React from 'react';
import DashboardPage from './DashboardPage';
import StudentsPage, { AdminStudent } from './StudentsPage';
import ProgrammesPage, { Programme } from './ProgrammesPage';
import ClassesPage, { Class } from './ClassesPage';
import HousesPage from './HousesPage';
import LogsPage from './LogsPage';
import UsersPage from './UsersPage';
import SettingsPage, { School, Admission } from './SettingsPage';
import RolesAndPermissionsPage from './RolesAndPermissionsPage';
import MessagesPage, { Conversation } from './MessagesPage';
import TransactionsPage from './TransactionsPage';
import { Dormitory } from '../shared/dormitoryData';
import { AdminUser } from '../AdminLayout';
import UserProfileSettingsTab from './UserProfileSettingsTab';

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
                adminUser={adminUser}
            />;
        case 'Messages':
            return <MessagesPage 
                conversations={conversations} 
                setConversations={setConversations} 
                selectedSchool={selectedSchool}
            />;
        case 'Programmes':
            return <ProgrammesPage 
                selectedSchool={selectedSchool} 
                students={students} 
                programmes={programmes}
                setProgrammes={setProgrammes}
                classes={classes}
                permissions={permissions}
                isSuperAdmin={isSuperAdmin}
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
                adminUser={adminUser}
            />;
        case 'Logs':
            return <LogsPage 
                adminUser={adminUser} 
                selectedSchool={selectedSchool} 
            />;
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
        case 'Profile':
            return <div className="p-4 sm:p-6 lg:p-8 h-full"><UserProfileSettingsTab adminUser={adminUser} setAdminUser={setAdminUser} onExitAdmin={onExitAdmin} /></div>;
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
            return <div className="p-4">Page not found: {activePage}</div>;
    }
};

export default PageContent;

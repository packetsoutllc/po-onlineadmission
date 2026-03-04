
import { Staff, Role } from './types';

export const APP_VERSION = '2.1.0';
export const PORTAL_NAME = 'Logip Admission Portal';
export const POWERED_BY = 'Packets Out LLC';

export const ADMISSION_STATUS_COLORS = {
    'Admitted': 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
    'Placed': 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
    'Prospective': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
    'Pending': 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
    'Rejected': 'bg-red-100 text-red-800 dark:bg-red-50/20 dark:text-red-300',
};

export const FEE_STATUS_COLORS = {
    'Paid': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
    'Unpaid': 'bg-rose-100 text-rose-800 dark:bg-rose-50/20 dark:text-rose-300',
};

// FIX: Added missing exports for Mediroster and EduGate
export const INITIAL_STAFF: Staff[] = [
  { id: '1', name: 'Dr. John Doe', role: Role.DOCTOR, email: 'john@hospital.com', color: '#3b82f6', qualifications: ['MD'], maxHoursPerWeek: 40 },
  { id: '2', name: 'Nurse Jane', role: Role.NURSE, email: 'jane@hospital.com', color: '#10b981', qualifications: ['RN'], maxHoursPerWeek: 36 }
];

export const ROLE_COLORS: Record<string, string> = {
  [Role.ADMIN]: 'border-gray-200 bg-gray-50 text-gray-700',
  [Role.DOCTOR]: 'border-blue-200 bg-blue-50 text-blue-700',
  [Role.NURSE]: 'border-green-200 bg-green-50 text-green-700',
  [Role.RECEPTIONIST]: 'border-orange-200 bg-orange-50 text-orange-700',
};

export const SHIFT_COLORS: Record<string, string> = {
  'Morning': 'bg-sky-50 text-sky-700 border-sky-100',
  'Afternoon': 'bg-orange-50 text-orange-700 border-orange-100',
  'Night': 'bg-indigo-50 text-indigo-700 border-indigo-100',
  'On Call': 'bg-rose-50 text-rose-700 border-rose-100',
};

export const MOCK_USERS = [
  { id: 'u1', email: 'admin@hospital.com', name: 'Admin User', role: Role.ADMIN }
];

export const MOCK_SCHOOLS = [
  {
    id: 's1',
    name: 'Future Leaders Prep',
    type: 'Private',
    location: 'Accra',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=400&h=300&auto=format&fit=crop',
    description: 'A leading private school focusing on STEM and innovation.',
    features: ['Robotics Lab', 'Swimming Pool', 'Music Room'],
    grades: 'K-12',
    curriculum: 'IB',
    tuition: 25000
  },
  {
    id: 's2',
    name: 'Evergreen International',
    type: 'Private',
    location: 'Kumasi',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=400&h=300&auto=format&fit=crop',
    description: 'Focused on environmental sustainability and global citizenship.',
    features: ['Eco-Garden', 'Solar Power', 'Art Studio'],
    grades: 'Grade 1-9',
    curriculum: 'Cambridge',
    tuition: 18000
  }
];

export const SCHOOLS = MOCK_SCHOOLS;

export const MOCK_APPLICATIONS = [
  { id: 1, studentName: 'Kwame Mensah', schoolId: 's1', status: 'Accepted', submittedAt: '2023-10-15', gpa: '3.9' },
  { id: 2, studentName: 'Ama Serwaa', schoolId: 's2', status: 'Under Review', submittedAt: '2023-11-02', gpa: '3.7' }
];

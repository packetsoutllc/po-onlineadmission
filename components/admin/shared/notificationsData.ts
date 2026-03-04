
export interface Notification {
    id: string;
    user: {
        name: string;
        avatar: string;
    };
    icon: string;
    color: string;
    text: string;
    details?: string;
    time: string;
    read: boolean;
    type: 'student' | 'system' | 'payment' | 'security';
    schoolId?: string;
    admissionId?: string;
}

export const mockNotifications: Notification[] = [
    {
        id: 'notif1',
        user: { name: 'Margaret', avatar: 'https://i.pravatar.cc/32?u=megan' },
        icon: 'group_add',
        color: 'bg-blue-500',
        text: 'New student application received',
        details: 'Kwame Nkrumah (Gen. Science)',
        time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        read: false,
        type: 'student',
        schoolId: 's3',
        admissionId: 'a4'
    },
    {
        id: 'notif2',
        user: { name: 'System', avatar: '' },
        icon: 'upload_file',
        color: 'bg-green-500',
        text: 'Bulk upload completed successfully',
        details: '150 new student records imported.',
        time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        read: false,
        type: 'system',
        schoolId: 's1',
        admissionId: 'a1'
    },
    {
        id: 'notif3',
        user: { name: 'System', avatar: '' },
        icon: 'security',
        color: 'bg-yellow-500',
        text: 'Admin password policy was updated',
        details: 'Minimum length set to 10 characters.',
        time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        read: false,
        type: 'security',
        schoolId: 's1',
        admissionId: 'a1'
    },
    {
        id: 'notif4',
        user: { name: 'Gameli Axame', avatar: 'https://i.pravatar.cc/32?u=gameli' },
        icon: 'payments',
        color: 'bg-emerald-500',
        text: 'New payment received',
        details: 'GHS 50.00 from Abena Koomson',
        time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        read: true,
        type: 'payment',
        schoolId: 's1',
        admissionId: 'a1'
    },
    {
        id: 'notif5',
        user: { name: 'Registration Officer', avatar: 'https://i.pravatar.cc/32?u=regofficer' },
        icon: 'how_to_reg',
        color: 'bg-purple-500',
        text: 'Student status updated',
        details: 'John Doe manually admitted.',
        time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        type: 'student',
        schoolId: 's1',
        admissionId: 'a1'
    },
    {
        id: 'notif6',
        user: { name: 'System', avatar: '' },
        icon: 'error',
        color: 'bg-red-500',
        text: 'Failed login attempt detected',
        details: 'IP: 192.168.1.1, User: unknown@test.com',
        time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        type: 'security',
        schoolId: 's1',
        admissionId: 'a1'
    },
    // Add more for pagination
    { id: 'notif7', user: { name: 'Margaret', avatar: 'https://i.pravatar.cc/32?u=megan' }, icon: 'edit', color: 'bg-indigo-500', text: 'Admission settings changed', details: '2025 Admissions auto-approve enabled.', time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), read: true, type: 'system', schoolId: 's1', admissionId: 'a1' },
    { id: 'notif8', user: { name: 'Gameli Axame', avatar: 'https://i.pravatar.cc/32?u=gameli' }, icon: 'payments', color: 'bg-emerald-500', text: 'New payment received', details: 'GHS 50.00 from Kofi Annan', time: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), read: true, type: 'payment', schoolId: 's1', admissionId: 'a1' },
    { id: 'notif9', user: { name: 'System', avatar: '' }, icon: 'backup', color: 'bg-sky-500', text: 'System backup completed', details: 'Daily backup successful.', time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), read: true, type: 'system', schoolId: 's1', admissionId: 'a1' },
    { id: 'notif10', user: { name: 'Registration Officer', avatar: 'https://i.pravatar.cc/32?u=regofficer' }, icon: 'group_add', color: 'bg-blue-500', text: 'New protocol application', details: 'From Ama Serwaa.', time: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), read: true, type: 'student', schoolId: 's1', admissionId: 'a1' },
    { id: 'notif11', user: { name: 'System', avatar: '' }, icon: 'sms', color: 'bg-teal-500', text: 'Bulk SMS sent', details: 'Sent to 350 applicants.', time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), read: true, type: 'system', schoolId: 's1', admissionId: 'a1' },
];

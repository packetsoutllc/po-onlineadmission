
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

/** No demo data: notifications come from real activity or start empty. */
export const mockNotifications: Notification[] = [];

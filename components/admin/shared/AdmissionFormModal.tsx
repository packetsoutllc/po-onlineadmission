import React, { useState, useEffect } from 'react';
import AdminModal from './AdminModal';
import { AdminInput, AdminTextarea, AdminSelect } from './forms';
import { Admission } from '../pages/SettingsPage';

interface AdmissionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Admission, 'id'|'applicantsPlaced'|'studentsAdmitted'>) => void;
    admission: Admission | null;
    schoolId: string;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-logip-primary"></div>
    </label>
);

const AdmissionFormModal: React.FC<AdmissionFormModalProps> = ({ isOpen, onClose, onSave, admission, schoolId }) => {
    const [title, setTitle] = useState(admission?.title || '');
    const [slug, setSlug] = useState(admission?.slug || '');
    const [date, setDate] = useState(admission?.date || '');
    const [authMethod, setAuthMethod] = useState(admission?.authMethod || 'Index number only');
    const [status, setStatus] = useState<Admission['status']>(admission?.status || 'Active');
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(!!admission?.slug);
    const [indexHint, setIndexHint] = useState(admission?.indexHint || '');
    const [headOfSchoolNumber, setHeadOfSchoolNumber] = useState(admission?.headOfSchoolNumber || '');
    const [headOfItNumber, setHeadOfItNumber] = useState(admission?.headOfItNumber || '');

    useEffect(() => {
        if (!isSlugManuallyEdited) {
            const newSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            setSlug(newSlug);
        }
    }, [title, isSlugManuallyEdited]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ title, slug, description: '', date, authMethod, status, schoolId, indexHint, headOfSchoolNumber, headOfItNumber });
    };

    const handleToggleAuthMethod = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isNowNameAuth = e.target.checked;
        const newMethod = isNowNameAuth ? 'Full name only' : 'Index number only';
        setAuthMethod(newMethod);
        
        // Requirement: If switched to Verify by Full Name, set specific hint with specific wrap
        if (isNowNameAuth) {
            setIndexHint('Enter your full name exactly as it appears on\nthe placement form. Example: Doe John');
        } else {
            setIndexHint('Add the year you completed JHS\nExample: xxxxxxxxxxxx25');
        }
    };

    const isNameAuth = authMethod === 'Full name only';

    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title={admission ? 'Edit Admission' : 'Add New Admission'}>
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
                <div>
                    <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">Admission Title <span className="text-red-500">*</span></label>
                    <AdminInput name="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g., 2026 Admissions" />
                </div>
                <div>
                    <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">Slug (URL Identifier)</label>
                    <AdminInput name="slug" value={slug} onChange={e => { setSlug(e.target.value); setIsSlugManuallyEdited(true); }} placeholder="e.g., 2026-admissions" />
                     <p className="text-xs text-logip-text-subtle dark:text-dark-text-secondary mt-1">Used for the admission's unique URL. Auto-generated but can be edited.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">School Phone Number</label>
                        <AdminInput name="headOfSchoolNumber" value={headOfSchoolNumber} onChange={e => setHeadOfSchoolNumber(e.target.value)} placeholder="024..." />
                    </div>
                    <div>
                        <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">IT Department Phone Number</label>
                        <AdminInput name="headOfItNumber" value={headOfItNumber} onChange={e => setHeadOfItNumber(e.target.value)} placeholder="024..." />
                    </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div>
                        <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">Admission Date</label>
                        <AdminInput name="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-logip-border dark:border-dark-border bg-gray-50 dark:bg-dark-bg/30">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-logip-text-subtle">
                                    {isNameAuth ? 'person' : 'pin'}
                                </span>
                                <div>
                                    <p className="font-semibold text-xs text-logip-text-header dark:text-dark-text-primary uppercase tracking-wider">
                                        Verify by {isNameAuth ? 'Full Name' : 'Index Number'}
                                    </p>
                                    <p className="text-[10px] text-logip-text-subtle">
                                        Students use {isNameAuth ? 'full name' : 'index number'}
                                    </p>
                                </div>
                            </div>
                            <ToggleSwitch 
                                checked={isNameAuth} 
                                onChange={handleToggleAuthMethod} 
                            />
                        </div>
                    </div>
                </div>
                 <div>
                    <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">Index Field Hint</label>
                    <AdminTextarea name="indexHint" value={indexHint} onChange={e => setIndexHint(e.target.value)} placeholder="e.g., Add the year you completed JHS..." rows={3} />
                    <p className="text-xs text-logip-text-subtle dark:text-dark-text-secondary mt-1">This message will be shown below the input field on the verification page. Use line breaks for new lines.</p>
                </div>
                <div>
                    <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-2">Admission Status</label>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={status === 'Active'} onChange={() => setStatus(s => s === 'Active' ? 'Archived' : 'Active')} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-medium text-logip-text-body dark:text-dark-text-secondary">Active admissions are open and visible to applicants.</span>
                    </label>
                </div>
                <div className="pt-4 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 text-base font-semibold rounded-lg border border-logip-border dark:border-dark-border text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 text-base font-semibold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover transition-colors">{admission ? 'Save Changes' : 'Add Admission'}</button>
                </div>
            </form>
        </AdminModal>
    );
};

export default AdmissionFormModal;

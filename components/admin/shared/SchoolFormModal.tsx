
import React, { useState, useEffect } from 'react';
import AdminModal from './AdminModal';
import { AdminInput, AdminSelect } from './forms';
import { School } from '../pages/SettingsPage';

interface SchoolFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<School, 'id' | 'dateCreated'>) => void;
    school: School | null;
}

const GHANA_REGIONS = [
    'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern',
    'Greater Accra', 'North East', 'Northern', 'Oti', 'Savannah',
    'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'
];

const SchoolFormModal: React.FC<SchoolFormModalProps> = ({ isOpen, onClose, onSave, school }) => {
    const [name, setName] = useState(school?.name || '');
    const [slug, setSlug] = useState(school?.slug || '');
    const [status, setStatus] = useState(school?.status || 'Active');
    const [logo, setLogo] = useState<string | undefined>(school?.logo);
    const [homeRegion, setHomeRegion] = useState(school?.homeRegion || '');
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(!!school?.slug);

    useEffect(() => {
        if (!isSlugManuallyEdited) {
            const newSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            setSlug(newSlug);
        }
    }, [name, isSlugManuallyEdited]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const reader = new FileReader();
            reader.onloadend = () => setLogo(reader.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, slug, status, logo, homeRegion });
    };

    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title={school ? 'Edit School' : 'Add New School'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-shrink-0">
                        <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">School Logo</label>
                        <div className="w-48 h-48 border-2 border-dashed border-logip-border dark:border-dark-border rounded-lg flex flex-col items-center justify-center text-center p-4">
                           {logo ? (
                               <img src={logo} alt="School Logo" className="w-full h-full object-contain rounded-md" />
                           ) : (
                                <>
                                    <span className="material-symbols-outlined text-4xl text-logip-text-subtle">image</span>
                                    <p className="text-xs text-logip-text-subtle dark:text-dark-text-secondary mt-1">Square image (1:1 ratio) up to 5MB</p>
                                </>
                           )}
                        </div>
                         <label htmlFor="logo-upload" className="mt-2 w-full inline-block text-center px-4 py-2 text-sm font-semibold rounded-lg border border-logip-border dark:border-dark-border hover:bg-gray-100 dark:hover:bg-dark-border transition-colors cursor-pointer">
                            Choose Photo
                        </label>
                        <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                    <div className="flex-1 space-y-6">
                        <div>
                            <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">School Name <span className="text-red-500">*</span></label>
                            <AdminInput name="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Enter school name" />
                        </div>
                        <div>
                            <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">Slug (URL Identifier)</label>
                            <AdminInput name="slug" value={slug} onChange={e => { setSlug(e.target.value); setIsSlugManuallyEdited(true); }} placeholder="e.g., my-school" />
                            <p className="text-xs text-logip-text-subtle dark:text-dark-text-secondary mt-1">Used for the school's unique URL. Auto-generated but can be edited.</p>
                        </div>
                        <div>
                            <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">Home Region</label>
                            <AdminSelect name="homeRegion" value={homeRegion} onChange={e => setHomeRegion(e.target.value)}>
                                <option value="">Select Region</option>
                                {GHANA_REGIONS.map(region => (
                                    <option key={region} value={region}>{region}</option>
                                ))}
                            </AdminSelect>
                             <p className="text-xs text-logip-text-subtle dark:text-dark-text-secondary mt-1">Used for demographic analysis (e.g. Students from outside the region).</p>
                        </div>
                         <div>
                            <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-2">School Status</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={status === 'Active'} onChange={() => setStatus(s => s === 'Active' ? 'Inactive' : 'Active')} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                <span className="ml-3 text-sm font-medium text-logip-text-body dark:text-dark-text-secondary">Active schools are visible to applicants.</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="pt-4 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 text-base font-semibold rounded-lg border border-logip-border dark:border-dark-border text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">{school ? 'Save Changes' : 'Add School'}</button>
                </div>
            </form>
        </AdminModal>
    );
};

export default SchoolFormModal;

import React, { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../shared/ToastContext';
import { School, Admission } from './SettingsPage';
import FieldEditorModal from '../shared/FieldEditorModal';
import ConfirmationModal from '../shared/ConfirmationModal';
import { AdminCheckbox } from '../shared/forms';

export type FormFieldType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'email' | 'tel' | 'photo' | 'document';

export interface FormFieldConfig {
    id: string;
    label: string;
    type: FormFieldType;
    required: boolean;
    placeholder?: string;
    options?: string[];
    default: boolean;
    section: 'personal' | 'academic' | 'parents' | 'other' | 'official_records' | 'documents';
    visible: boolean;
    readOnly?: boolean; // New property to control student editability
    prefill?: boolean;  // New property to control auto-population
    condition?: {
        fieldId: string;
        operator: 'equals';
        value: string;
    } | null;
    accept?: string;
    maxSizeMB?: number;
    enableAiEditing?: boolean;
    startNewRow?: boolean;
}

export interface FormSettings {
    nameSystem: 'full' | 'separated';
    fields: FormFieldConfig[];
}

const DEFAULT_FORM_FIELDS: FormFieldConfig[] = [
    // Official Records
    { id: 'officialFullName', label: 'Full Name', type: 'text', required: true, default: true, section: 'official_records', visible: true, readOnly: true, prefill: true },
    { id: 'officialIndexNumber', label: 'Index Number', type: 'text', required: true, default: true, section: 'official_records', visible: true, readOnly: true, prefill: true },
    { id: 'officialGender', label: 'Gender', type: 'text', required: true, default: true, section: 'official_records', visible: true, readOnly: true, prefill: true },
    { id: 'officialAggregate', label: 'Aggregate', type: 'text', required: true, default: true, section: 'official_records', visible: true, readOnly: true, prefill: true },
    { id: 'officialResidence', label: 'Residence', type: 'text', required: true, default: true, section: 'official_records', visible: true, readOnly: true, prefill: true },
    { id: 'officialProgramme', label: 'Programme', type: 'text', required: true, default: true, section: 'official_records', visible: true, readOnly: true, prefill: true },
    { id: 'officialCurrentSchool', label: 'Current School Placed', type: 'text', required: true, default: true, section: 'official_records', visible: true, readOnly: true, prefill: true },
    
    // Personal Info
    { id: 'passportPhotograph', label: 'Passport Size Photograph', type: 'photo', section: 'personal', required: true, default: true, visible: true, accept: 'image/png,image/jpeg', maxSizeMB: 2, enableAiEditing: true },
    { id: 'enrollmentCode', label: 'Enrollment Code', type: 'text', required: false, default: true, section: 'personal', visible: true, placeholder: 'Enter your code' },
    { id: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, default: true, section: 'personal', visible: true },
    { id: 'nationality', label: 'Nationality', type: 'select', required: true, default: true, section: 'personal', visible: true, options: ['', 'Ghanaian', 'Nigerian', 'Togolese', 'Other'] },
    { id: 'hometown', label: 'Hometown', type: 'text', required: true, default: true, section: 'personal', visible: true, placeholder: 'e.g., Your Home Town' },
    { id: 'region', label: 'Region', type: 'select', required: true, default: true, section: 'personal', visible: true, options: ['', 'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra', 'North East', 'Northern', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'] },
    { id: 'religion', label: 'Religion', type: 'select', required: false, default: true, section: 'personal', visible: true, options: ['', 'Christianity', 'Islam', 'Traditional', 'Other'] },
    { id: 'contactNumber', label: 'Contact Number', type: 'tel', required: true, default: true, section: 'personal', visible: true, placeholder: '0240000000' },
    { id: 'emailAddress', label: 'Email Address', type: 'email', required: false, default: true, section: 'personal', visible: true, placeholder: 'e.g., student@email.com' },
    { id: 'residentialAddress', label: 'Current Residential Address', type: 'text', required: false, default: true, section: 'personal', visible: true, placeholder: 'Enter your house number and street name' },
    { id: 'hasDisability', label: 'Do you have any disability or special medical needs?', type: 'select', required: true, default: true, section: 'personal', visible: true, options: ['', 'No', 'Yes'] },
    { id: 'medicalReport', label: 'Medical Report', type: 'document', required: true, default: true, section: 'personal', visible: true, condition: { fieldId: 'hasDisability', operator: 'equals', value: 'Yes' }, accept: 'application/pdf,image/png,image/jpeg', maxSizeMB: 5 },
    
    // Academic Info
    { id: 'previousBasicSchool', label: 'Previous Basic School', type: 'text', required: true, default: true, section: 'academic', visible: true, placeholder: 'e.g., Enter JHS Completed' },
    { id: 'yearCompleted', label: 'Year Completed', type: 'select', required: true, default: true, section: 'academic', visible: true, options: ['', '2025', '2024', '2023'] },

    // Parents Info
    { id: 'primaryFullName', label: 'Full Name', type: 'text', required: true, default: true, section: 'parents', visible: true },
    { id: 'primaryRelationship', label: 'Relationship', type: 'select', required: true, default: true, section: 'parents', visible: true, options: ['', 'Father', 'Mother', 'Uncle', 'Aunt', 'Sibling', 'Guardian'] },
    { id: 'primaryOccupation', label: 'Occupation', type: 'text', required: true, default: true, section: 'parents', visible: true },
    { id: 'primaryContact', label: 'Contact Number', type: 'tel', required: true, default: true, section: 'parents', visible: true, placeholder: '0240000000' },
    { id: 'primaryWhatsapp', label: 'Whatsapp Number', type: 'tel', required: false, default: true, section: 'parents', visible: true, placeholder: '0240000000' },
    { id: 'primaryEmail', label: 'Email Address', type: 'email', required: false, default: true, section: 'parents', visible: true },
    { id: 'secondaryFullName', label: 'Full Name (Secondary)', type: 'text', required: false, default: true, section: 'parents', visible: true },
    { id: 'secondaryRelationship', label: 'Relationship (Secondary)', type: 'select', required: false, default: true, section: 'parents', visible: true, options: ['', 'Father', 'Mother', 'Uncle', 'Aunt', 'Sibling', 'Guardian'] },
    { id: 'secondaryOccupation', label: 'Occupation (Secondary)', type: 'text', required: false, default: true, section: 'parents', visible: true },
    { id: 'secondaryContact', label: 'Contact Number (Secondary)', type: 'tel', required: false, default: true, section: 'parents', visible: true, placeholder: '0240000000' },
    { id: 'secondaryWhatsapp', label: 'Whatsapp Number (Secondary)', type: 'tel', required: false, default: true, section: 'parents', visible: true, placeholder: '0240000000' },
    { id: 'secondaryEmail', label: 'Email Address (Secondary)', type: 'email', required: false, default: true, section: 'parents', visible: true },
    
    // Other Info - Updated for Clubs & Associations spec
    { id: 'nsmqClub', label: 'NSMQ Club', type: 'text', required: false, default: true, section: 'other', visible: true },
    { id: 'stemNovationClub', label: 'STEM Novation Club', type: 'text', required: false, default: true, section: 'other', visible: true },
    { id: 'otherClubs', label: 'Other Clubs', type: 'text', required: false, default: true, section: 'other', visible: true },
    { id: 'otherClubsDetails', label: 'Other Clubs Details', type: 'textarea', required: false, default: true, section: 'other', visible: true },
    { id: 'specialInterest', label: 'Other Special Interest or Hobby', type: 'text', required: false, default: true, section: 'other', visible: true },
    { id: 'specialInterestDetails', label: 'Special Interest or Hobby Details', type: 'textarea', required: false, default: true, section: 'other', visible: true },
];

export const INITIAL_FORM_SETTINGS: FormSettings = {
    nameSystem: 'full',
    fields: DEFAULT_FORM_FIELDS,
};

const ApplicationDashboardSettings: React.FC<{
    selectedSchool: School | null;
    selectedAdmission: Admission | null;
}> = ({ selectedSchool, selectedAdmission }) => {
    const { showToast } = useToast();
    const storageKey = selectedAdmission ? `formSettings_${selectedAdmission.id}` : null;
    const [savedSettings, setSavedSettings] = useLocalStorage<FormSettings>(storageKey || 'nullFormSettingsKey', INITIAL_FORM_SETTINGS);

    const [localSettings, setLocalSettings] = useState<FormSettings>(savedSettings);
    const [isExpanded, setIsExpanded] = useState(false);
    
    const [draggedItem, setDraggedItem] = useState<FormFieldConfig | null>(null);

    useEffect(() => {
        setLocalSettings(savedSettings);
    }, [savedSettings]);

    const [modalState, setModalState] = useState<{ mode: 'add' | 'edit', section: FormFieldConfig['section'] | null, field?: FormFieldConfig }>({ mode: 'add', section: null });
    const [fieldToDelete, setFieldToDelete] = useState<FormFieldConfig | null>(null);

    const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(savedSettings);

    if (!selectedSchool || !selectedAdmission) {
        return null;
    }

    const handleLocalSettingsChange = (update: Partial<FormSettings>) => {
        setLocalSettings(prev => ({ ...prev, ...update }));
    };
    
    const handleFieldUpdate = (fieldId: string, update: Partial<FormFieldConfig>) => {
        handleLocalSettingsChange({
            fields: localSettings.fields.map(f => f.id === fieldId ? { ...f, ...update } : f)
        });
    };

    const handleSaveField = (fieldData: Omit<FormFieldConfig, 'id' | 'default'>) => {
        if (modalState.mode === 'add' && modalState.section) {
            const newField: FormFieldConfig = {
                ...fieldData,
                id: `custom_${Date.now()}`,
                default: false,
            };
            handleLocalSettingsChange({ fields: [...localSettings.fields, newField] });
        } else if (modalState.mode === 'edit' && modalState.field) {
            handleLocalSettingsChange({
                fields: localSettings.fields.map(f => f.id === modalState.field!.id ? { ...f, ...fieldData } : f)
            });
        }
        setModalState({ mode: 'add', section: null });
    };
    
    const handleDeleteField = () => {
        if (!fieldToDelete) return;
        handleLocalSettingsChange({
            fields: localSettings.fields.filter(f => f.id !== fieldToDelete.id)
        });
        setFieldToDelete(null);
    };

    const handleSaveChanges = () => {
        setSavedSettings(localSettings);
        showToast('Application settings have been saved.', 'success');
    };
    
    const handleDiscardChanges = () => {
        setLocalSettings(savedSettings);
        showToast('Changes have been discarded.', 'info');
    };
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, field: FormFieldConfig) => {
        setDraggedItem(field);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', field.id);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetField: FormFieldConfig) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.id === targetField.id) {
            return;
        }

        const currentFields = localSettings.fields;
        const draggedIndex = currentFields.findIndex(f => f.id === draggedItem.id);
        const targetIndex = currentFields.findIndex(f => f.id === targetField.id);

        if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
            return;
        }

        const newFields = [...currentFields];
        const [removed] = newFields.splice(draggedIndex, 1);
        newFields.splice(targetIndex, 0, removed);
        
        handleLocalSettingsChange({ fields: newFields });
    };
    
    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    const FieldRow: React.FC<{ field: FormFieldConfig }> = ({ field }) => {
        const isChild = !!field.condition?.fieldId;
        const parentField = isChild ? localSettings.fields.find(f => f.id === field.condition!.fieldId) : null;

        return (
            <div className="relative group">
                <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, field)}
                    onDragOver={(e) => handleDragOver(e, field)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 p-2 rounded-md transition-all ${isChild ? 'ml-6' : ''} ${draggedItem?.id === field.id ? 'opacity-30 bg-blue-100 dark:bg-blue-900/40' : 'hover:bg-gray-100 dark:hover:bg-dark-border/30'}`}
                >
                    {isChild && (
                        <div className="absolute left-0 top-0 h-full flex items-center" title={`Depends on "${parentField?.label}"`}>
                             <div className="w-4 h-1/2 border-l-2 border-b-2 border-gray-300 dark:border-gray-600 rounded-bl-md"></div>
                        </div>
                    )}
                    <div className="cursor-grab text-logip-text-subtle" title="Drag to reorder">
                        <span className="material-symbols-outlined">drag_indicator</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                             <span className="font-medium text-logip-text-header dark:text-dark-text-primary text-sm truncate">{field.label}</span>
                             {field.type === 'select' && <span className="material-symbols-outlined text-[14px] text-blue-500" title="Has Dropdown Options">list</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] flex-shrink-0">
                         <AdminCheckbox label="Req." checked={field.required} onChange={e => handleFieldUpdate(field.id, { required: e.target.checked })} />
                         <AdminCheckbox label="Vis." checked={field.visible} onChange={e => handleFieldUpdate(field.id, { visible: e.target.checked })} />
                         {field.section === 'official_records' && (
                             <>
                                <AdminCheckbox 
                                    label="Pref." 
                                    checked={field.prefill !== false} 
                                    onChange={e => handleFieldUpdate(field.id, { prefill: e.target.checked })} 
                                    title="Auto-populate with student data"
                                />
                                <AdminCheckbox 
                                    label="Lock" 
                                    checked={field.readOnly !== false} 
                                    onChange={e => handleFieldUpdate(field.id, { readOnly: e.target.checked })} 
                                    title="If locked, student cannot edit this prefilled field"
                                />
                             </>
                         )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => setModalState({ mode: 'edit', field: field, section: field.section })} className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-dark-border text-logip-text-subtle hover:text-logip-text-header transition-colors">
                            <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        {!field.default && <button onClick={() => setFieldToDelete(field)} className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 transition-colors"><span className="material-symbols-outlined text-sm">delete</span></button>}
                    </div>
                </div>
            </div>
        );
    };

    const SECTIONS: { id: FormFieldConfig['section']; title: string }[] = [
        { id: 'personal', title: 'Personal Information Section' },
        { id: 'academic', title: 'Academic Information Section' },
        { id: 'parents', title: 'Parents/Guardian Section' },
        { id: 'other', title: 'Other Information Section' },
        { id: 'documents', title: 'Documents Section' },
    ];

    return (
        <>
            <div className="bg-logip-white dark:bg-dark-surface rounded-lg border border-logip-border dark:border-dark-border">
                <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center p-6 text-left">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-2xl text-logip-text-header dark:text-dark-text-primary">edit_square</span>
                         <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary">Application Dashboard Settings</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        {hasChanges && <span className="px-2 py-0.5 text-xs font-semibold rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300">Unsaved Changes</span>}
                        <span className={`material-symbols-outlined text-3xl text-logip-text-subtle transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                    </div>
                </button>

                {isExpanded && (
                    <div className="p-6 pt-0 animate-fadeIn">
                        <div className="space-y-8">
                            {/* Name System */}
                            <div className="p-4 rounded-lg bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border">
                                <h4 className="font-semibold text-logip-text-header dark:text-dark-text-primary mb-2">Name System</h4>
                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer text-logip-text-body dark:text-dark-text-secondary"><input type="radio" name="nameSystem" value="full" checked={localSettings.nameSystem === 'full'} onChange={() => handleLocalSettingsChange({ nameSystem: 'full' })} /> Full Name (Single Field)</label>
                                    <label className="flex items-center gap-2 cursor-pointer text-logip-text-body dark:text-dark-text-secondary"><input type="radio" name="nameSystem" value="separated" checked={localSettings.nameSystem === 'separated'} onChange={() => handleLocalSettingsChange({ nameSystem: 'separated' })} /> Separated (Surname, First, Other)</label>
                                </div>
                            </div>
                            {/* Field Management */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-semibold text-logip-text-header dark:text-dark-text-primary">Official School Records Section</h4>
                                        <button onClick={() => setModalState({ mode: 'add', section: 'official_records' })} className="flex items-center gap-1 text-sm font-semibold text-logip-primary hover:text-logip-primary-hover dark:text-blue-400 dark:hover:text-blue-300">
                                            <span className="material-symbols-outlined text-base">add</span> Add Field
                                        </button>
                                    </div>
                                    <div 
                                        className="space-y-1 p-2 border border-logip-border dark:border-dark-border rounded-lg min-h-[200px]"
                                    >
                                        {localSettings.fields.filter(f => f.section === 'official_records').map((field) => (
                                            <FieldRow key={field.id} field={field} />
                                        ))}
                                    </div>
                                </div>
                                {SECTIONS.map(section => (
                                    <div key={section.id}>
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-semibold text-logip-text-header dark:text-dark-text-primary">{section.title}</h4>
                                            <button onClick={() => setModalState({ mode: 'add', section: section.id })} className="flex items-center gap-1 text-sm font-semibold text-logip-primary hover:text-logip-primary-hover dark:text-blue-400 dark:hover:text-blue-300">
                                                <span className="material-symbols-outlined text-base">add</span> Add Field
                                            </button>
                                        </div>
                                        <div 
                                            className="space-y-1 p-2 border border-logip-border dark:border-dark-border rounded-lg min-h-[200px]"
                                        >
                                            {localSettings.fields.filter(f => f.section === section.id).map((field) => (
                                                <FieldRow key={field.id} field={field} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-logip-border dark:border-dark-border flex justify-end items-center gap-4">
                            {hasChanges && <button onClick={handleDiscardChanges} className="px-5 py-2.5 text-base font-semibold rounded-lg text-logip-text-body dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Discard Changes</button>}
                            <button onClick={handleSaveChanges} disabled={!hasChanges} className="px-5 py-2.5 text-base font-semibold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                Save Settings
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <FieldEditorModal 
                isOpen={!!modalState.section}
                onClose={() => setModalState({ mode: 'add', section: null })}
                onSave={handleSaveField}
                fieldToEdit={modalState.field}
                section={modalState.section}
                potentialParents={localSettings.fields.filter(f => f.section === modalState.section && f.id !== modalState.field?.id)}
            />

            <ConfirmationModal 
                isOpen={!!fieldToDelete}
                onClose={() => setFieldToDelete(null)}
                onConfirm={handleDeleteField}
                title="Delete Field"
            >
                Are you sure you want to delete the field "<strong>{fieldToDelete?.label}</strong>"? This action cannot be undone.
            </ConfirmationModal>
        </>
    );
};

export default ApplicationDashboardSettings;
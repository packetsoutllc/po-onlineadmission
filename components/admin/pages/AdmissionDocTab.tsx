import React, { useState, useEffect, useMemo } from 'react';
import { School, Admission } from './SettingsPage';
import { useToast } from '../shared/ToastContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import AdminModal from '../shared/AdminModal';
import { AdminInput, AdminSelect, AdminTextarea, AdminCheckbox } from '../shared/forms';
import DocumentLayoutEditor from '../shared/DocumentLayoutEditor';
import { AdmissionSettings, ToggleSwitch } from './SecuritySettingsTab';
import ConfirmationModal from '../shared/ConfirmationModal';

const PlaceholderTab: React.FC<{ title: string, icon: string, iconColor?: string, message: string }> = ({ title, icon, iconColor, message }) => (
    <div className="flex flex-col items-center justify-center text-center h-full min-h-[300px] animate-fadeIn text-logip-text-subtle">
        <div className="w-16 h-16 rounded-full bg-logip-border dark:bg-dark-border flex items-center justify-center mb-5">
            <span className={`material-symbols-outlined text-4xl ${iconColor || ''}`}>{icon}</span>
        </div>
        <h2 className="text-2xl font-bold text-logip-text-header dark:text-dark-text-primary">{title}</h2>
        <p className="mt-2 text-base max-w-md">{message}</p>
    </div>
);

interface Template {
  id: string;
  label: string;
  acceptedFileTypes: string;
  fileTypeLabel: string;
  visible: boolean;
}

interface AccessSetting {
    prospective: boolean;
    prospectiveReason?: string;
    admitted: boolean; 
    admittedReason?: string;
}

interface DocumentAccessSettings {
    [key: string]: AccessSetting;
}

interface ClassHouseDormAccessSettings {
    class: AccessSetting;
    house: AccessSetting;
    dorm: AccessSetting;
}

const TemplateFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; fileType: { value: string; label: string } }) => void;
    templateToEdit: Template | null;
}> = ({ isOpen, onClose, onSave, templateToEdit }) => {
    const [name, setName] = useState('');
    const [fileType, setFileType] = useState('pdf');

    const fileTypeOptions = [
        { key: 'pdf', value: 'application/pdf', label: 'PDF only' },
        { key: 'word', value: '.doc,.docx', label: 'Word Doc only (doc, docx)' },
    ];

    useEffect(() => {
        if (isOpen) {
            if (templateToEdit) {
                setName(templateToEdit.label);
                const currentOption = fileTypeOptions.find(opt => opt.value === templateToEdit.acceptedFileTypes);
                setFileType(currentOption?.key || 'pdf');
            } else {
                setName('');
                setFileType('pdf');
            }
        }
    }, [isOpen, templateToEdit]);
    
    const handleSave = () => {
        if (!name.trim()) return;
        const selectedOption = fileTypeOptions.find(opt => opt.key === fileType)!;
        onSave({ name: name.trim(), fileType: { value: selectedOption.value, label: selectedOption.label } });
    };

    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title={templateToEdit ? 'Edit Document Template' : 'Add Document Template'}>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Document Name</label>
                    <AdminInput 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="e.g., Admission Brochure" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Accepted File Type(s)</label>
                    <AdminSelect value={fileType} onChange={(e) => setFileType(e.target.value)}>
                        {fileTypeOptions.map(opt => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                    </AdminSelect>
                </div>
            </div>
            <div className="pt-8 flex justify-end gap-4">
                <button type="button" onClick={onClose} className="px-5 py-2 text-base font-semibold rounded-lg border border-logip-border dark:border-dark-border text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Cancel</button>
                <button type="button" onClick={handleSave} className="px-5 py-2 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">{templateToEdit ? 'Save Changes' : 'Create Document'}</button>
            </div>
        </AdminModal>
    );
};

interface FileUploadAreaProps {
    template: Template;
    storagePrefix: string;
    onRequestDeleteTemplate: (template: Template) => void;
    onRequestEditTemplate: (template: Template) => void;
    onRequestConfigureLayout: (template: Template, file: { name: string, data: string }) => void;
    onToggleVisibility: (id: string, visible: boolean) => void;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({ template, storagePrefix, onRequestDeleteTemplate, onRequestEditTemplate, onRequestConfigureLayout, onToggleVisibility }) => {
    const { showToast } = useToast();
    const fileKey = `${storagePrefix}_${template.id}`;
    const [file, setFile] = useLocalStorage<{ name: string; data: string } | null>(fileKey, null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const uploadedFile = e.target.files[0];
            if (uploadedFile.size > 5 * 1024 * 1024) {
                 showToast('File size must be less than 5MB.', 'error');
                 return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setFile({ name: uploadedFile.name, data: reader.result as string });
                showToast('Document template uploaded successfully.', 'success');
            };
            reader.readAsDataURL(uploadedFile);
        }
    };

    const isPdf = file?.data?.startsWith('data:application/pdf') || file?.name?.toLowerCase().endsWith('.pdf');

    return (
        <div className="mb-8 last:mb-0">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <h4 className={`font-bold text-base transition-opacity ${template.visible ? 'text-logip-text-header dark:text-dark-text-primary' : 'text-gray-400 dark:text-gray-600'}`}>{template.label}</h4>
                    <span className="text-xs text-logip-text-subtle dark:text-dark-text-secondary font-medium bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">{template.fileTypeLabel}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Enabled</span>
                        <ToggleSwitch checked={template.visible} onChange={(e) => onToggleVisibility(template.id, e.target.checked)} />
                    </div>
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => onRequestEditTemplate(template)} className="p-1.5 rounded-full text-logip-text-subtle hover:text-logip-primary hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors" title="Edit Template Name">
                            <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        {!['admissionLetter', 'prospectus', 'personalRecordForm'].includes(template.id) && (
                            <button onClick={() => onRequestDeleteTemplate(template)} className="p-1.5 rounded-full text-logip-text-subtle hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete Template">
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {file ? (
                <div className={`flex items-center justify-between p-4 bg-white dark:bg-dark-surface rounded-lg border transition-colors shadow-sm ${template.visible ? 'border-logip-border dark:border-dark-border group hover:border-logip-primary/50 dark:hover:border-logip-primary/50' : 'border-gray-200 dark:border-gray-800 opacity-60'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${template.visible ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                             <span className="material-symbols-outlined text-2xl">description</span>
                        </div>
                         <div>
                            <p className="font-semibold text-logip-text-header dark:text-dark-text-primary text-sm">{file.name}</p>
                            <p className={`text-xs font-medium ${template.visible ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>Uploaded Successfully</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isPdf && (
                             <button 
                                onClick={() => onRequestConfigureLayout(template, file)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-md transition-colors shadow-sm uppercase tracking-wide ${template.visible ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
                                disabled={!template.visible}
                            >
                                <span className="material-symbols-outlined text-sm">view_quilt</span> Configure Layout
                            </button>
                        )}
                        <button 
                            onClick={() => setFile(null)} 
                            className="p-1.5 rounded-lg text-logip-text-subtle hover:text-red-500 hover:bg-gray-100 dark:hover:bg-dark-bg border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition-all ml-1"
                            title="Remove File"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer relative group ${template.visible ? 'border-gray-300 dark:border-gray-600 hover:border-logip-primary hover:bg-gray-50 dark:hover:bg-dark-bg/20' : 'border-gray-200 dark:border-gray-800 opacity-50'}`}>
                    <input 
                        type="file" 
                        accept={template.acceptedFileTypes} 
                        onChange={handleFileSelect} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                    <div className="flex flex-col items-center justify-center">
                        <span className={`material-symbols-outlined text-3xl mb-2 transition-colors ${template.visible ? 'text-gray-400 group-hover:text-logip-primary' : 'text-gray-300'}`}>cloud_upload</span>
                        <p className={`text-sm font-medium transition-colors ${template.visible ? 'text-gray-500 dark:text-gray-400 group-hover:text-logip-primary' : 'text-gray-300'}`}>Click to upload {template.fileTypeLabel}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

interface AdmissionDocTabProps {
    selectedSchool?: School | null;
    selectedAdmission?: Admission | null;
}

const AdmissionDocTab: React.FC<AdmissionDocTabProps> = ({ selectedSchool, selectedAdmission }) => {
    const { showToast } = useToast();
    
    // --- STORAGE KEYS ---
    const templatesKey = selectedSchool && selectedAdmission ? `admissionDocTemplatesList_${selectedSchool.id}_${selectedAdmission.id}` : 'nullTemplates';
    const docVisibilityKey = selectedSchool && selectedAdmission ? `docVisibilitySettings_${selectedSchool.id}_${selectedAdmission.id}` : 'nullDocVis';
    const sectionAccessKey = selectedSchool && selectedAdmission ? `classHouseDormAccessSettings_${selectedSchool.id}_${selectedAdmission.id}` : 'nullSecAccess';
    const settingsKey = selectedSchool && selectedAdmission ? `admissionSettings_${selectedSchool.id}_${selectedAdmission.id}` : 'nullSettings';

    // --- STATE ---
    const defaultTemplates: Template[] = [
        { id: 'admissionLetter', label: 'Admission Letter', acceptedFileTypes: 'application/pdf', fileTypeLabel: 'PDF only', visible: true },
        { id: 'personalRecordForm', label: 'Personal Record Form', acceptedFileTypes: 'application/pdf', fileTypeLabel: 'PDF only', visible: true },
        { id: 'prospectus', label: 'Prospectus', acceptedFileTypes: 'application/pdf', fileTypeLabel: 'PDF only', visible: true },
    ];
    const [templates, setTemplates] = useLocalStorage<Template[]>(templatesKey, defaultTemplates, (val) => {
        if (Array.isArray(val)) {
            return val.map(t => ({ ...t, visible: t.visible ?? true }));
        }
        return val;
    });

    const [docVisibility, setDocVisibility] = useLocalStorage<DocumentAccessSettings>(docVisibilityKey, {
        admissionLetter: { prospective: true, admitted: true },
        personalRecordForm: { prospective: true, admitted: true },
        prospectus: { prospective: true, admitted: true }
    });

    const [sectionAccess, setSectionAccess] = useLocalStorage<ClassHouseDormAccessSettings>(sectionAccessKey, {
        class: { prospective: false, admitted: true },
        house: { prospective: false, admitted: true },
        dorm: { prospective: false, admitted: true }
    });

    const [admissionSettings, setAdmissionSettings] = useLocalStorage<AdmissionSettings | null>(settingsKey, null);
    
    // UI Local state
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<Template | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
    const [layoutEditorState, setLayoutEditorState] = useState<{ isOpen: boolean; template: Template | null; fileData: string }>({ isOpen: false, template: null, fileData: '' });
    
    // Reason Modal state
    const [disableModal, setDisableModal] = useState<{ isOpen: boolean; type: 'doc' | 'section'; id: string; target: 'prospective' | 'admitted'; label: string } | null>(null);
    const [disableReason, setDisableReason] = useState('');

    if (!selectedSchool || !selectedAdmission) {
        return <PlaceholderTab title="Select an Admission" icon="article" iconColor="text-blue-500" message="Please select a school and an active admission group from the 'Setup' tab to configure admission documents." />;
    }
    
    const storagePrefix = `admissionDocTemplate_${selectedSchool.id}_${selectedAdmission.id}`;

    // --- HANDLERS ---
    
    const handleSaveTemplate = (data: { name: string; fileType: { value: string; label: string } }) => {
        if (templateToEdit) {
            setTemplates(prev => prev.map(t => t.id === templateToEdit.id ? { ...t, label: data.name, acceptedFileTypes: data.fileType.value, fileTypeLabel: data.fileType.label } : t));
            showToast(`Template "${data.name}" updated.`, 'success');
        } else {
            const newTemplate: Template = {
                id: `custom_${Date.now()}`,
                label: data.name,
                acceptedFileTypes: data.fileType.value,
                fileTypeLabel: data.fileType.label,
                visible: true
            };
            setTemplates(prev => [...prev, newTemplate]);
            showToast(`Template "${data.name}" created.`, 'success');
        }
        setIsTemplateModalOpen(false);
        setTemplateToEdit(null);
    };

    const handleToggleVisibility = (id: string, visible: boolean) => {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, visible } : t));
        showToast(`Template global status updated.`, 'info');
    };

    const handleDeleteTemplate = () => {
        if (!templateToDelete || !selectedSchool || !selectedAdmission) return;
        setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
        localStorage.removeItem(`${storagePrefix}_${templateToDelete.id}`);
        localStorage.removeItem(`docLayout_${selectedSchool.id}_${selectedAdmission.id}_${templateToDelete.id}`);
        showToast(`Template "${templateToDelete.label}" deleted.`, 'info');
        setTemplateToDelete(null);
    };

    const handleToggleDoc = (docId: string, target: 'prospective' | 'admitted', label: string) => {
        const current = docVisibility[docId]?.[target];
        if (current) {
            setDisableModal({ isOpen: true, type: 'doc', id: docId, target, label });
            setDisableReason('');
        } else {
            setDocVisibility(prev => ({
                ...prev,
                [docId]: { ...prev[docId], [target]: true, [`${target}Reason`]: undefined }
            }));
        }
    };

    const handleToggleSection = (secId: string, target: 'prospective' | 'admitted', label: string) => {
        const key = secId as keyof ClassHouseDormAccessSettings;
        const current = sectionAccess[key]?.[target];
        if (current) {
            setDisableModal({ isOpen: true, type: 'section', id: secId, target, label });
            setDisableReason('');
        } else {
            setSectionAccess(prev => ({
                ...prev,
                [key]: { ...prev[key], [target]: true, [`${target}Reason`]: undefined }
            }));
        }
    };

    const confirmDisable = () => {
        if (!disableModal) return;
        const { type, id, target } = disableModal;
        if (type === 'doc') {
            setDocVisibility(prev => ({
                ...prev,
                [id]: { ...prev[id], [target]: false, [`${target}Reason`]: disableReason || 'Access Restricted' }
            }));
        } else {
            const key = id as keyof ClassHouseDormAccessSettings;
            setSectionAccess(prev => ({
                ...prev,
                [key]: { ...prev[key], [target]: false, [`${target}Reason`]: disableReason || 'Access Restricted' }
            }));
        }
        setDisableModal(null);
    };

    const handleToggleEditApp = (checked: boolean) => {
        setAdmissionSettings((prev: AdmissionSettings | null) => {
            const base: AdmissionSettings = prev || { 
                adminOnlyAccess: false, 
                autoApproveProspective: false, 
                autoAdmitPolicy: 'all',
                autoAdmitStudents: [],
                autoApproveProtocol: false, 
                autoPlacePolicy: 'all',
                autoPlaceStudents: [],
                houseAssignmentMethod: 'automatic' as const, 
                enableRoomManagement: true, 
                dormAssignmentMethod: 'automatic' as const, 
                activateWhatsappId: false, 
                enableProtocolApplication: true, 
                allowStudentEdit: true, 
                serialNumberFormat: 'numeric' as const, 
                serialNumberLength: 10, 
                pinFormat: 'numeric' as const, 
                pinLength: 5, 
                maintenanceTitle: 'Site under maintenance', 
                maintenanceMessage: 'The student admission portal is currently undergoing maintenance. We apologize for any inconvenience.',
                maintenanceCountdownEnd: null,
                verificationErrorMessage: ''
            };
            return { ...base, allowStudentEdit: checked };
        });
    };

    const sortedTemplates = useMemo(() => {
        const order = ['admissionLetter', 'personalRecordForm', 'prospectus'];
        return [...templates].sort((a, b) => {
            const indexA = order.indexOf(a.id);
            const indexB = order.indexOf(b.id);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return 0;
        });
    }, [templates]);

    return (
        <div className="animate-fadeIn space-y-8 pb-10">
            {/* 1. Admission Document Templates Section */}
            <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary">Admission Document Templates</h3>
                        <p className="text-logip-text-subtle dark:text-dark-text-secondary mt-1">Global toggle for enabling/disabling document links portal-wide.</p>
                    </div>
                    <button 
                        onClick={() => { setTemplateToEdit(null); setIsTemplateModalOpen(true); }} 
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm shadow-sm"
                    >
                        <span className="material-symbols-outlined text-lg">add</span> Add Document Template
                    </button>
                </div>
                <div className="space-y-6">
                    {sortedTemplates.map(template => (
                        <FileUploadArea 
                            key={template.id}
                            template={template} 
                            storagePrefix={storagePrefix}
                            onToggleVisibility={handleToggleVisibility}
                            onRequestDeleteTemplate={setTemplateToDelete}
                            onRequestEditTemplate={(t) => { setTemplateToEdit(t); setIsTemplateModalOpen(true); }}
                            onRequestConfigureLayout={(t, f) => setLayoutEditorState({ isOpen: true, template: t, fileData: f.data })}
                        />
                    ))}
                </div>
            </div>

            {/* 2 & 3 Combined Access Control & Visibility Section */}
            <div className="bg-logip-white dark:bg-report-dark p-6 rounded-xl border border-logip-border dark:border-report-border shadow-md">
                <h3 className="text-xl font-bold text-logip-text-header dark:text-gray-100 mb-1">Access Control & Visibility</h3>
                <p className="text-sm text-logip-text-subtle dark:text-gray-400 mb-8">Control whether documents and data points are visible to students based on their current status. Payment requirement is configured in 'Financials'.</p>
                
                <div className="space-y-10">
                    {/* Document Visibility Block */}
                    <div>
                        <div className="grid grid-cols-[1fr_120px_120px] items-center mb-4 px-4">
                            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">Document Link Visibility</h4>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Prospective</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Admitted</span>
                        </div>
                        <div className="space-y-1.5">
                            {sortedTemplates.map(doc => (
                                <div key={doc.id} className="grid grid-cols-[1fr_120px_120px] items-center py-1.5 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-logip-text-subtle dark:text-gray-400">
                                            <span className="material-symbols-outlined text-lg">description</span>
                                        </div>
                                        <span className={`text-sm font-semibold ${doc.visible ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 italic'}`}>{doc.label} {!doc.visible && '(Global Disabled)'}</span>
                                    </div>
                                    <div className="flex justify-center">
                                        <AdminCheckbox 
                                            checked={docVisibility[doc.id]?.prospective ?? true} 
                                            onChange={() => handleToggleDoc(doc.id, 'prospective', doc.label)}
                                            disabled={!doc.visible}
                                            title="Ticked = Link is visible to student"
                                        />
                                    </div>
                                    <div className="flex justify-center">
                                        <AdminCheckbox 
                                            checked={docVisibility[doc.id]?.admitted ?? true} 
                                            onChange={() => handleToggleDoc(doc.id, 'admitted', doc.label)}
                                            disabled={!doc.visible}
                                            title="Ticked = Link is visible to student"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <hr className="border-logip-border dark:border-report-border" />

                    {/* Core Data Visibility Block */}
                    <div>
                        <div className="grid grid-cols-[1fr_120px_120px] items-center mb-4 px-4">
                            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">Core Data Visibility</h4>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Prospective</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">Admitted</span>
                        </div>
                        <div className="space-y-1.5">
                            <div className="grid grid-cols-[1fr_120px_120px] items-center py-1.5 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-logip-text-subtle dark:text-gray-400">
                                        <span className="material-symbols-outlined text-lg">class</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Assigned Class</span>
                                </div>
                                <div className="flex justify-center">
                                    <AdminCheckbox 
                                        checked={sectionAccess.class.prospective} 
                                        onChange={() => handleToggleSection('class', 'prospective', 'Assigned Class')}
                                    />
                                </div>
                                <div className="flex justify-center">
                                    <AdminCheckbox 
                                        checked={sectionAccess.class.admitted} 
                                        onChange={() => handleToggleSection('class', 'admitted', 'Assigned Class')}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-[1fr_120px_120px] items-center py-1.5 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-logip-text-subtle dark:text-gray-400">
                                        <span className="material-symbols-outlined text-lg">house</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Assigned House</span>
                                </div>
                                <div className="flex justify-center">
                                    <AdminCheckbox 
                                        checked={sectionAccess.house.prospective} 
                                        onChange={() => handleToggleSection('house', 'prospective', 'Assigned House')}
                                    />
                                </div>
                                <div className="flex justify-center">
                                    <AdminCheckbox 
                                        checked={sectionAccess.house.admitted} 
                                        onChange={() => handleToggleSection('house', 'admitted', 'Assigned House')}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-[1fr_120px_120px] items-center py-1.5 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-logip-text-subtle dark:text-gray-400">
                                        <span className="material-symbols-outlined text-lg">king_bed</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Assigned Dorm/Room</span>
                                </div>
                                <div className="flex justify-center">
                                    <AdminCheckbox 
                                        checked={sectionAccess.dorm.prospective} 
                                        onChange={() => handleToggleSection('dorm', 'prospective', 'Assigned Dorm/Room')}
                                    />
                                </div>
                                <div className="flex justify-center">
                                    <AdminCheckbox 
                                        checked={sectionAccess.dorm.admitted} 
                                        onChange={() => handleToggleSection('dorm', 'admitted', 'Assigned Dorm/Room')}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                     <hr className="border-logip-border dark:border-report-border" />

                    {/* Edit Rights Block */}
                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-6 border border-logip-border dark:border-white/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm">
                                    <span className="material-symbols-outlined text-2xl">edit_note</span>
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">Post-Submission Edit Rights</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Allow students to request an unlock of their application form via OTP for minor corrections after submission.</p>
                                </div>
                            </div>
                            <ToggleSwitch checked={admissionSettings?.allowStudentEdit ?? true} onChange={(e) => handleToggleEditApp(e.target.checked)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <TemplateFormModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} onSave={handleSaveTemplate} templateToEdit={templateToEdit} />
            
            <ConfirmationModal isOpen={!!templateToDelete} onClose={() => setTemplateToDelete(null)} onConfirm={handleDeleteTemplate} title="Delete Template">
                Are you sure you want to delete the template <strong>{templateToDelete?.label}</strong>? This will remove any uploaded file associated with it.
            </ConfirmationModal>

            {layoutEditorState.isOpen && (
                <DocumentLayoutEditor 
                    isOpen={true} 
                    onClose={() => setLayoutEditorState({ isOpen: false, template: null, fileData: '' })} 
                    pdfData={layoutEditorState.fileData} 
                    docId={layoutEditorState.template?.id || ''} 
                    storageKey={`docLayout_${selectedSchool.id}_${selectedAdmission.id}_${layoutEditorState.template?.id}`}
                    admissionId={selectedAdmission.id}
                />
            )}

            <AdminModal isOpen={!!disableModal} onClose={() => setDisableModal(null)} title={`Restrict Access: ${disableModal?.label}`}>
                 <div className="space-y-6">
                    <p className="text-base text-logip-text-body dark:text-dark-text-secondary">Provide a reason for restricting access to this {disableModal?.type === 'doc' ? 'document' : 'data point'} for <strong>{disableModal?.target}</strong> students. This reason will be displayed to the students.</p>
                    <AdminTextarea 
                        value={disableReason} 
                        onChange={(e) => setDisableReason(e.target.value)} 
                        placeholder="e.g., This document is being updated. Please check back in 24 hours." 
                        rows={3} 
                    />
                </div>
                <div className="pt-8 flex justify-end gap-4">
                    <button type="button" onClick={() => setDisableModal(null)} className="px-5 py-2 text-base font-semibold rounded-lg border border-logip-border dark:border-dark-border text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Cancel</button>
                    <button type="button" onClick={confirmDisable} className="px-5 py-2 text-base font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm">Confirm Restriction</button>
                </div>
            </AdminModal>
        </div>
    );
};

export default AdmissionDocTab;
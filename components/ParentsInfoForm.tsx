import React, { useState, useEffect, useMemo } from 'react';
import { Student, AiSettings } from './StudentDetails';
import { Input } from './FormControls';
import { appendToLocalStorageArray, getChangedFields, usePrevious } from '../utils/storage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { AdmissionSettings } from './admin/pages/SecuritySettingsTab';
import { FormSettings, FormFieldConfig } from './admin/pages/ApplicationDashboardSettings';
import DynamicFormField from './DynamicFormField';

// FIX: Exporting ParentsInfoFormData to be used in other components.
export interface ParentsInfoFormData {
    primaryFullName?: string;
    primaryRelationship?: string;
    primaryOccupation?: string;
    primaryContact?: string;
    primaryWhatsapp?: string;
    primaryEmail?: string;
    showSecondaryGuardian?: boolean;
    secondaryFullName?: string;
    secondaryRelationship?: string;
    secondaryOccupation?: string;
    secondaryContact?: string;
    secondaryWhatsapp?: string;
    secondaryEmail?: string;
}

interface WhatsappInputProps {
    guardianType: 'primary' | 'secondary';
    applicationData: Record<string, any>;
    handleFieldChange: (name: string, value: any) => void;
    handleCheckboxChange: (guardianType: 'primary' | 'secondary', isChecked: boolean) => void;
    isSameAsContact: boolean;
    isEffectivelyDisabled: boolean;
    showToggle: boolean;
}

const WhatsappInput: React.FC<WhatsappInputProps> = ({ guardianType, applicationData, handleFieldChange, handleCheckboxChange, isSameAsContact, isEffectivelyDisabled, showToggle }) => {
    const [mode, setMode] = useState<'number' | 'id'>('number');
    const whatsappValue = guardianType === 'primary' ? applicationData.primaryWhatsapp : applicationData.secondaryWhatsapp;
    const contactValue = guardianType === 'primary' ? applicationData.primaryContact : applicationData.secondaryContact;
    const inputName = guardianType === 'primary' ? 'primaryWhatsapp' : 'secondaryWhatsapp';

    const handleModeChange = () => {
        const newMode = mode === 'number' ? 'id' : 'number';
        setMode(newMode);
        // If we switch to 'id' mode and the checkbox is checked, uncheck it.
        if (newMode === 'id' && isSameAsContact) {
            handleCheckboxChange(guardianType, false);
        }
    };
    
    const inputType = !showToggle || mode === 'number' ? 'tel' : 'text';
    const placeholderText = !showToggle || mode === 'number' ? '0240000000' : 'Enter WhatsApp ID';
    const labelText = "Whatsapp Number";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        if (inputType === 'tel') {
             if (val.length > 10) return;
             if (val.length === 1 && val !== '0') val = '0' + val;
        }
        handleFieldChange(inputName, val);
    };

    const isInvalid = inputType === 'tel' && whatsappValue && !/^0\d{9}$/.test(whatsappValue);


    return (
        <div>
            <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-black dark:text-gray-300">{labelText}</label>
                {showToggle && (
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${mode === 'number' ? 'text-blue-500' : 'text-gray-500'}`}>Number</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={mode === 'id'} onChange={handleModeChange} className="sr-only peer" disabled={isEffectivelyDisabled} />
                            <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <span className={`text-sm font-medium ${mode === 'id' ? 'text-blue-500' : 'text-gray-500'}`}>ID</span>
                    </div>
                )}
            </div>
            <Input
                name={inputName}
                type={inputType}
                placeholder={placeholderText}
                value={isSameAsContact ? contactValue : whatsappValue}
                onChange={handleChange}
                disabled={isEffectivelyDisabled || isSameAsContact}
            />
             {isInvalid && !isSameAsContact && (
                <p className="text-xs text-red-500 mt-1 animate-fadeIn">Must be 10 digits starting with 0</p>
            )}
            <div className="mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative flex items-center">
                        <input
                            type="checkbox"
                            checked={isSameAsContact}
                            onChange={(e) => handleCheckboxChange(guardianType, e.target.checked)}
                            disabled={isEffectivelyDisabled || mode === 'id'}
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 dark:border-gray-600 transition-all checked:bg-logip-primary checked:border-logip-primary dark:checked:bg-logip-primary disabled:opacity-50"
                        />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                            </svg>
                        </span>
                    </div>
                    <span className="text-sm text-gray-400">Same as contact number</span>
                </label>
            </div>
        </div>
    );
};


interface ParentsInfoFormProps {
    student: Student;
    showToast: (message: string, type?: 'info' | 'error') => void;
    isSubmitted: boolean;
    formSettings: FormSettings;
    applicationData: Record<string, any>;
    setApplicationData: (value: Record<string, any> | ((val: Record<string, any>) => Record<string, any>)) => void;
    isAdminEditMode?: boolean;
    aiSettings: AiSettings | null;
}

const ParentsInfoForm: React.FC<ParentsInfoFormProps> = ({ student, showToast, isSubmitted, formSettings, applicationData, setApplicationData, isAdminEditMode = false, aiSettings }) => {
    
    const isEffectivelyDisabled = isSubmitted && !isAdminEditMode;
    const prevApplicationData = usePrevious(applicationData);
    
    const [isPrimaryWhatsappSameAsContact, setIsPrimaryWhatsappSameAsContact] = useState(false);
    const [isSecondaryWhatsappSameAsContact, setIsSecondaryWhatsappSameAsContact] = useState(false);
    const [isPrimaryContactSameAsStudent, setIsPrimaryContactSameAsStudent] = useState(false);
    
    const admissionSettingsKey = `admissionSettings_${student.schoolId}_${student.admissionId}`;
    const [admissionSettings] = useLocalStorage<AdmissionSettings | null>(admissionSettingsKey, null);


    useEffect(() => {
        const changedFields = getChangedFields(prevApplicationData, applicationData);
        if (changedFields.length > 0 && !isEffectivelyDisabled) {
             const logEntry = {
                editor: isAdminEditMode ? 'admin' : 'student',
                timestamp: new Date().toISOString(),
                changedFields: changedFields,
            };
            appendToLocalStorageArray(`editHistory_${student.indexNumber}`, logEntry);
        }
    }, [applicationData, prevApplicationData, student.indexNumber, isEffectivelyDisabled, isAdminEditMode]);


    const handleFieldChange = (name: string, value: any) => {
        if (name === 'primaryContact' && isPrimaryContactSameAsStudent && value !== applicationData.contactNumber) {
            setIsPrimaryContactSameAsStudent(false);
        }
        setApplicationData(prev => ({ ...prev, [name]: value }));
    };

    const handleSameAsStudentContactChange = (isChecked: boolean) => {
        setIsPrimaryContactSameAsStudent(isChecked);
        if (isChecked) {
            handleFieldChange('primaryContact', applicationData.contactNumber || '');
        }
    };
    
    // Sync primary contact if checkbox is checked and student contact changes
    useEffect(() => {
        if (isPrimaryContactSameAsStudent) {
            handleFieldChange('primaryContact', applicationData.contactNumber || '');
        }
    }, [applicationData.contactNumber, isPrimaryContactSameAsStudent]);
    
    const parentFields = useMemo(() => {
        return formSettings.fields.filter(field => {
            if (field.section !== 'parents' || !field.visible) {
                return false;
            }
            if (field.condition?.fieldId) {
                const parentValue = applicationData[field.condition.fieldId];
                if (field.condition.operator === 'equals') {
                    return String(parentValue).toLowerCase() === String(field.condition.value).toLowerCase();
                }
                return false;
            }
            return true;
        });
    }, [formSettings.fields, applicationData]);

    const handleToggleSecondary = (show: boolean) => {
        setApplicationData(prev => {
            const newState = { ...prev, showSecondaryGuardian: show };
            if (!show) {
                // If hiding, clear the secondary guardian fields
                const secondaryFieldIds = parentFields.filter(f => f.id.startsWith('secondary')).map(f => f.id);
                for (const id of secondaryFieldIds) {
                    delete newState[id];
                }
            }
            return newState;
        });
    
        if (!show) {
            // Also reset local state related to secondary guardian
            setIsSecondaryWhatsappSameAsContact(false);
        }
    };
    
    const handleSameAsContactChange = (guardianType: 'primary' | 'secondary', isChecked: boolean) => {
        if (guardianType === 'primary') {
            setIsPrimaryWhatsappSameAsContact(isChecked);
            if (isChecked) {
                handleFieldChange('primaryWhatsapp', applicationData.primaryContact);
            }
        } else {
            setIsSecondaryWhatsappSameAsContact(isChecked);
            if (isChecked) {
                handleFieldChange('secondaryWhatsapp', applicationData.secondaryContact);
            }
        }
    };
    
    useEffect(() => {
        if (isPrimaryWhatsappSameAsContact) {
            handleFieldChange('primaryWhatsapp', applicationData.primaryContact);
        }
    }, [isPrimaryWhatsappSameAsContact, applicationData.primaryContact]);

    useEffect(() => {
        if (isSecondaryWhatsappSameAsContact) {
            handleFieldChange('secondaryWhatsapp', applicationData.secondaryContact);
        }
    }, [isSecondaryWhatsappSameAsContact, applicationData.secondaryContact]);

    const primaryFields = parentFields.filter(f => f.id.startsWith('primary'));
    const secondaryFields = parentFields.filter(f => f.id.startsWith('secondary'));

    const isSecondarySectionVisible = applicationData.showSecondaryGuardian || (isSubmitted && applicationData.secondaryFullName);

    const buildRows = (fields: FormFieldConfig[]) => {
        const rows: FormFieldConfig[][] = [];
        let currentRow: FormFieldConfig[] = [];
        const isFullWidth = (field: FormFieldConfig) => field.type === 'textarea' || field.type === 'photo';

        fields.forEach(field => {
            const fieldIsFullWidth = isFullWidth(field);
            if (field.startNewRow || fieldIsFullWidth || (currentRow.length > 0 && isFullWidth(currentRow[0])) || currentRow.length === 3) {
                if (currentRow.length > 0) rows.push(currentRow);
                currentRow = [];
            }
            currentRow.push(field);
        });
        if (currentRow.length > 0) rows.push(currentRow);
        return rows;
    };

    const primaryRows = useMemo(() => buildRows(primaryFields), [primaryFields, applicationData]);
    const secondaryRows = useMemo(() => buildRows(secondaryFields), [secondaryFields, applicationData]);

    const renderRow = (row: FormFieldConfig[], rowIndex: number) => {
        let gridClass = 'grid-cols-1';
        if (row.length === 2) gridClass += ' md:grid-cols-2';
        else if (row.length >= 3) gridClass += ' md:grid-cols-2 lg:grid-cols-3';

        return (
            <div key={rowIndex} className={`grid ${gridClass} gap-x-6 gap-y-6 items-start`}>
                {row.map(field => {
                    if (field.id === 'primaryWhatsapp') {
                        return <WhatsappInput key={field.id} guardianType="primary" applicationData={applicationData} handleFieldChange={handleFieldChange} handleCheckboxChange={handleSameAsContactChange} isSameAsContact={isPrimaryWhatsappSameAsContact} isEffectivelyDisabled={isEffectivelyDisabled} showToggle={admissionSettings?.activateWhatsappId ?? false} />;
                    }
                     if (field.id === 'secondaryWhatsapp') {
                        return <WhatsappInput key={field.id} guardianType="secondary" applicationData={applicationData} handleFieldChange={handleFieldChange} handleCheckboxChange={handleSameAsContactChange} isSameAsContact={isSecondaryWhatsappSameAsContact} isEffectivelyDisabled={isEffectivelyDisabled} showToggle={admissionSettings?.activateWhatsappId ?? false} />;
                    }
                    
                    // Inject checkbox for primaryContact
                    if (field.id === 'primaryContact') {
                        return (
                            <div key={field.id}>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-sm font-medium text-black dark:text-gray-300">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                </div>
                                <DynamicFormField 
                                    field={{...field, label: '', required: false}} // Hide default label and asterisk inside DynamicFormField
                                    value={applicationData[field.id] || ''} 
                                    onChange={handleFieldChange} 
                                    disabled={isEffectivelyDisabled} 
                                    student={student}
                                    aiSettings={aiSettings}
                                    isAdminEditMode={isAdminEditMode}
                                />
                                <div className="mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={isPrimaryContactSameAsStudent}
                                                onChange={(e) => handleSameAsStudentContactChange(e.target.checked)}
                                                disabled={isEffectivelyDisabled}
                                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 dark:border-gray-600 transition-all checked:bg-logip-primary checked:border-logip-primary dark:checked:bg-logip-primary disabled:opacity-50"
                                            />
                                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                                </svg>
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-400">Same as student contact number</span>
                                    </label>
                                </div>
                            </div>
                        );
                    }

                    return <DynamicFormField 
                                key={field.id} 
                                field={field} 
                                value={applicationData[field.id] || ''} 
                                onChange={handleFieldChange} 
                                disabled={isEffectivelyDisabled} 
                                student={student}
                                aiSettings={aiSettings}
                                isAdminEditMode={isAdminEditMode}
                            />;
                })}
            </div>
        );
    };

    return (
        <>
            {/* Primary Guardian */}
            <h3 className="text-lg font-semibold text-black dark:text-gray-100 mb-4">Primary Parent/Guardian Details</h3>
            <div className="space-y-6 mb-8">
                {primaryRows.map(renderRow)}
            </div>

            {/* Secondary Guardian */}
            <div className="border-t border-logip-border dark:border-report-border pt-6 mt-2">
                 {!isSecondarySectionVisible && !isEffectivelyDisabled && (
                    <div className="flex justify-start">
                        <button
                            onClick={() => handleToggleSecondary(true)}
                            type="button"
                            className="inline-flex items-center gap-2 px-4 py-2 text-base font-semibold rounded-lg text-logip-primary bg-logip-primary/10 hover:bg-logip-primary/20 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Add Secondary Guardian
                        </button>
                    </div>
                )}

                {isSecondarySectionVisible && (
                     <div>
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-lg font-semibold text-black dark:text-gray-100">Secondary Parent/Guardian Details</h3>
                             {!isEffectivelyDisabled && (
                                <button
                                    onClick={() => handleToggleSecondary(false)}
                                    type="button"
                                    className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold rounded-lg text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-base">delete</span>
                                    Remove
                                </button>
                             )}
                        </div>
                         <div className="space-y-6">
                           {secondaryRows.map(renderRow)}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default React.memo(ParentsInfoForm);
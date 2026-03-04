
import React, { useState, useEffect, useMemo } from 'react';
import { Student, AiSettings } from './StudentDetails';
import { FormField } from './FormControls';
import { appendToLocalStorageArray, getChangedFields, usePrevious } from '../utils/storage';
import { FormSettings, FormFieldConfig } from './admin/pages/ApplicationDashboardSettings';
import DynamicFormField from './DynamicFormField';
import FileUploadInput from './FileUploadInput';

// FIX: Exporting PersonalInfoFormData to be used in other components.
export interface PersonalInfoFormData {
    surname?: string;
    firstName?: string;
    otherNames?: string;
    enrollmentCode?: string;
    dateOfBirth?: string;
    nationality?: string;
    hometown?: string;
    region?: string;
    religion?: string;
    contactNumber?: string;
    emailAddress?: string;
    residentialAddress?: string;
    hasDisability?: 'Yes' | 'No';
    disabilityDetails?: string;
}

interface PersonalInfoFormProps {
    student: Student;
    showToast: (message: string, type?: 'info' | 'error') => void;
    isSubmitted: boolean;
    formSettings: FormSettings;
    applicationData: Record<string, any>;
    setApplicationData: (value: Record<string, any> | ((val: Record<string, any>) => Record<string, any>)) => void;
    isAdminEditMode?: boolean;
    aiSettings: AiSettings | null;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ student, showToast, isSubmitted, formSettings, applicationData, setApplicationData, isAdminEditMode = false, aiSettings }) => {

    const isEffectivelyDisabled = isSubmitted && !isAdminEditMode;
    const prevApplicationData = usePrevious(applicationData);
    
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
        setApplicationData((prev) => ({ ...prev, [name]: value }));
    };

    const personalFields = useMemo(() => {
        return formSettings.fields.filter(field => {
            if (field.section !== 'personal' || !field.visible) {
                return false;
            }

            if (field.condition?.fieldId) {
                const parentValue = applicationData[field.condition.fieldId];
                if (field.condition.operator === 'equals') {
                    // Case-insensitive comparison for robustness
                    return String(parentValue).toLowerCase() === String(field.condition.value).toLowerCase();
                }
                // Future operators (e.g., 'not_equals') could be handled here
                return false;
            }

            return true;
        });
    }, [formSettings.fields, applicationData]);

    const formRows = useMemo(() => {
        const rows: FormFieldConfig[][] = [];
        let currentRow: FormFieldConfig[] = [];

        const isFullWidth = (field: FormFieldConfig) => 
            field.type === 'textarea' || field.type === 'photo' || field.type === 'document';

        personalFields.forEach(field => {
            const fieldIsFullWidth = isFullWidth(field);

            // Start a new row if...
            if (
                field.startNewRow ||                               // field is marked to start a new line
                fieldIsFullWidth ||                                // field is a full-width type
                (currentRow.length > 0 && isFullWidth(currentRow[0])) || // current row has a full-width field
                currentRow.length === 3                            // current row is full
            ) {
                if (currentRow.length > 0) {
                    rows.push(currentRow);
                }
                currentRow = [];
            }
            
            currentRow.push(field);
        });

        if (currentRow.length > 0) {
            rows.push(currentRow);
        }

        return rows;
    }, [personalFields]);

    const officialFields = formSettings.fields.filter(f => f.section === 'official_records' && f.visible);
    
    const officialNameParts = {
        surname: student.name.split(' ')[0] || '',
        firstName: student.name.split(' ').slice(1, 2).join(' ') || '',
        otherNames: student.name.split(' ').slice(2).join(' ') || '',
    };
    
    const disabledInputClass = "w-full px-3 py-2 bg-logip-white dark:bg-report-dark border border-logip-border dark:border-report-border rounded-lg text-sm text-black dark:text-gray-100 placeholder-logip-text-subtle focus:outline-none focus:ring-2 focus:ring-logip-primary dark:focus:border-logip-primary transition-shadow duration-200 disabled:bg-gray-100 dark:disabled:bg-gray-800/50 disabled:cursor-not-allowed";

    // FIX: Corrected typo 'key0f' to 'keyof' to properly type the official data mapping and avoid cascading syntax errors.
    const officialDataMap: Record<string, keyof Student> = {
        officialFullName: 'name',
        officialIndexNumber: 'indexNumber',
        officialGender: 'gender',
        officialAggregate: 'aggregate',
        officialResidence: 'residence',
        officialProgramme: 'programme',
        officialCurrentSchool: 'currentSchoolPlaced',
    };
    
    return (
        <>
            <div className="border border-logip-border dark:border-report-border rounded-lg p-6 mb-8 bg-gray-50 dark:bg-gray-800/20">
                <h3 className="text-lg font-semibold text-black dark:text-gray-100 mb-4">Official School Records</h3>
                <p className="text-sm text-black dark:text-gray-400 mb-6 -mt-2">This information is pre-filled from your placement form.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
                    {officialFields.map(field => {
                        // REQ: current school placed should only show for protocol students
                        if (field.id === 'officialCurrentSchool' && !student.isProtocol) {
                            return null;
                        }
                        
                        // Handle Full Name with Name System logic
                        if (field.id === 'officialFullName' && formSettings.nameSystem === 'separated') {
                             const isLocked = field.readOnly !== false;
                             const isRequired = field.required;
                             const shouldPrefill = field.prefill !== false;
                             
                             // Use 'in' operator or check against undefined to allow empty string values
                             const surname = 'surname' in applicationData ? applicationData.surname : (shouldPrefill ? officialNameParts.surname : '');
                             const firstName = 'firstName' in applicationData ? applicationData.firstName : (shouldPrefill ? officialNameParts.firstName : '');
                             const otherNames = 'otherNames' in applicationData ? applicationData.otherNames : (shouldPrefill ? officialNameParts.otherNames : '');

                             return (
                                <React.Fragment key="official-name-parts">
                                    <FormField label={<>Surname {isRequired && <span className="text-red-500">*</span>}</>}><input type="text" value={surname} disabled={isEffectivelyDisabled || isLocked} onChange={e => handleFieldChange('surname', e.target.value.toUpperCase())} className={disabledInputClass} /></FormField>
                                    <FormField label={<>First Name {isRequired && <span className="text-red-500">*</span>}</>}><input type="text" value={firstName} disabled={isEffectivelyDisabled || isLocked} onChange={e => handleFieldChange('firstName', e.target.value.toUpperCase())} className={disabledInputClass} /></FormField>
                                    <FormField label="Other Names"><input type="text" value={otherNames} disabled={isEffectivelyDisabled || isLocked} onChange={e => handleFieldChange('otherNames', e.target.value.toUpperCase())} className={disabledInputClass} /></FormField>
                                </React.Fragment>
                            );
                        }

                        // Handle all other official fields (default and custom)
                        const dataKey = officialDataMap[field.id];
                        const shouldPrefill = field.prefill !== false;
                        const prefilledValue = (shouldPrefill && dataKey) ? student[dataKey as keyof Student] : '';
                        
                        // FIX: Allow completely clearing the field by checking if the ID exists in applicationData
                        const value = field.id in applicationData ? applicationData[field.id] : prefilledValue;
                        const isLocked = field.readOnly !== false;
                        
                        // REQ: current school placed is mandatory for protocol students
                        const isCurrentSchoolForProtocol = field.id === 'officialCurrentSchool' && student.isProtocol;
                        const finalField = isCurrentSchoolForProtocol ? { ...field, required: true } : field;

                        return (
                             <DynamicFormField 
                                key={finalField.id}
                                field={finalField}
                                value={value || ''}
                                onChange={handleFieldChange}
                                disabled={isEffectivelyDisabled || isLocked}
                                student={student}
                                aiSettings={aiSettings}
                                isAdminEditMode={isAdminEditMode}
                            />
                        );
                    })}
                </div>
            </div>

            <h3 className="text-lg font-semibold text-black dark:text-gray-100 mb-4">Your Personal Details</h3>
             <div className="space-y-6">
                {formRows.map((row, rowIndex) => {
                    let gridClass = 'grid-cols-1';
                    const isFullWidthRow = row.length === 1 && (row[0].type === 'textarea' || row[0].type === 'photo' || row[0].type === 'document');

                    if (!isFullWidthRow) {
                        if (row.length === 2) {
                            gridClass += ' md:grid-cols-2';
                        } else if (row.length >= 3) {
                            gridClass += ' md:grid-cols-2 lg:grid-cols-3';
                        }
                    }

                    return (
                        <div key={rowIndex} className={`grid ${gridClass} gap-x-6 gap-y-6 items-start`}>
                            {row.map(field => (
                                <DynamicFormField 
                                    key={field.id}
                                    field={field}
                                    value={applicationData[field.id] || ''}
                                    onChange={handleFieldChange}
                                    disabled={isEffectivelyDisabled}
                                    student={student}
                                    aiSettings={aiSettings}
                                    isAdminEditMode={isAdminEditMode}
                                />
                            ))}
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default React.memo(PersonalInfoForm);

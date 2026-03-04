
import React, { useMemo } from 'react';
import { Student, AiSettings } from './StudentDetails';
import { FormSettings, FormFieldConfig } from './admin/pages/ApplicationDashboardSettings';
import FileUploadInput from './FileUploadInput';
import DynamicFormField from './DynamicFormField';

interface DocumentsSectionProps {
    student: Student;
    isSubmitted: boolean;
    formSettings: FormSettings;
    applicationData: Record<string, any>;
    setApplicationData: (value: Record<string, any> | ((val: Record<string, any>) => Record<string, any>)) => void;
    isAdminEditMode?: boolean;
    aiSettings: AiSettings | null;
    onCloseMedicalSection: () => void;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ student, isSubmitted, formSettings, applicationData, setApplicationData, isAdminEditMode = false, aiSettings, onCloseMedicalSection }) => {
    
    const handleFieldChange = (name: string, value: any) => {
        setApplicationData(prev => ({ ...prev, [name]: value }));
    };

    const isEffectivelyDisabled = isSubmitted && !isAdminEditMode;
    
    const documentFields = useMemo(() => {
        return formSettings.fields.filter(field => {
            if (field.section !== 'documents' || !field.visible) {
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
    
    const formRows = useMemo(() => {
        const rows: FormFieldConfig[][] = [];
        let currentRow: FormFieldConfig[] = [];

        const isFullWidth = (field: FormFieldConfig) => 
            field.type === 'textarea' || field.type === 'photo';

        documentFields.forEach(field => {
            const fieldIsFullWidth = isFullWidth(field);
            if (field.startNewRow || fieldIsFullWidth || (currentRow.length > 0 && isFullWidth(currentRow[0])) || currentRow.length === 3) {
                if (currentRow.length > 0) rows.push(currentRow);
                currentRow = [];
            }
            currentRow.push(field);
        });

        if (currentRow.length > 0) rows.push(currentRow);
        return rows;
    }, [documentFields]);
    
    if (documentFields.length === 0) {
        return null;
    }

    return (
        <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-black dark:text-gray-100">Upload Required Documents</h3>
                {!isEffectivelyDisabled && (
                    <button
                        onClick={onCloseMedicalSection}
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-semibold rounded-lg text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                        aria-label="Remove this section"
                    >
                        <span className="material-symbols-outlined text-base">close</span>
                        <span>Remove</span>
                    </button>
                )}
            </div>
            <p className="text-base text-black dark:text-gray-400 mb-6">Please upload clear and legible copies of any required documents.</p>
            
            <div className="space-y-6">
                {formRows.map((row, rowIndex) => {
                    let gridClass = 'grid-cols-1';
                    const isFullWidthRow = row.length === 1 && (row[0].type === 'textarea' || row[0].type === 'photo');

                    if (!isFullWidthRow) {
                        if (row.length === 2) gridClass += ' md:grid-cols-2';
                        else if (row.length >= 3) gridClass += ' md:grid-cols-2 lg:grid-cols-3';
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
        </div>
    );
};

export default React.memo(DocumentsSection);
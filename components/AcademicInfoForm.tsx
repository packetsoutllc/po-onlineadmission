import React, { useEffect, useMemo } from 'react';
import { Student, AiSettings } from './StudentDetails';
import { FormField, Input } from './FormControls';
import CapacityDisplay from './CapacityDisplay';
import { appendToLocalStorageArray, getChangedFields, usePrevious } from '../utils/storage';
import { Class } from './admin/pages/ClassesPage';
import { AdminStudent } from './admin/pages/StudentsPage';
import { FormSettings, FormFieldConfig } from './admin/pages/ApplicationDashboardSettings';
import DynamicFormField from './DynamicFormField';

export interface AcademicInfoFormData {
    studentClass?: string;
    previousBasicSchool?: string;
    yearCompleted?: string;
}

interface AcademicInfoFormProps {
    student: Student;
    showToast: (message: string, type?: 'info' | 'error') => void;
    isSubmitted: boolean;
    formSettings: FormSettings;
    applicationData: Record<string, any>;
    setApplicationData: (value: Record<string, any> | ((val: Record<string, any>) => Record<string, any>)) => void;
    isAdminEditMode?: boolean;
    allStudents?: AdminStudent[];
    aiSettings: AiSettings | null;
    classes: Class[]; // NEW PROP
}

const AcademicInfoForm: React.FC<AcademicInfoFormProps> = ({ student, showToast, isSubmitted, formSettings, applicationData, setApplicationData, isAdminEditMode = false, allStudents, aiSettings, classes }) => {
    
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
        setApplicationData(prev => ({ ...prev, [name]: value }));
    };
    
    const classOptions = useMemo(() => {
        // Filter classes based on the student's programme
        return classes
            .filter(c => c.programme === student.programme && c.schoolId === student.schoolId)
            .map(c => c.name);
    }, [student.programme, student.schoolId, classes]);

    const selectedClass = applicationData.studentClass;

    const selectedClassData = useMemo(() => {
        if (!selectedClass) return null;
        return classes.find(c => c.name === selectedClass && c.schoolId === student.schoolId);
    }, [selectedClass, student.schoolId, classes]);
    
    const capacityInfo = useMemo(() => {
        if (!selectedClassData || !allStudents) return null;
    
        const currentStudentsInClass = allStudents.filter(s => 
            s.classId === selectedClassData.id &&
            (s.status === 'Admitted' || s.status === 'Placed')
        ).length;
    
        return {
            capacity: selectedClassData.capacity,
            current: currentStudentsInClass
        };
    }, [selectedClassData, allStudents]);

    const academicFields = useMemo(() => {
        return formSettings.fields.filter(field => {
            if (field.section !== 'academic' || !field.visible || field.id === 'studentClass') {
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

        academicFields.forEach(field => {
            const fieldIsFullWidth = isFullWidth(field);
            if (field.startNewRow || fieldIsFullWidth || (currentRow.length > 0 && isFullWidth(currentRow[0])) || currentRow.length === 3) {
                if (currentRow.length > 0) rows.push(currentRow);
                currentRow = [];
            }
            currentRow.push(field);
        });

        if (currentRow.length > 0) rows.push(currentRow);
        return rows;
    }, [academicFields]);

    return (
        <>
            <h3 className="text-lg font-semibold text-black dark:text-gray-100 mb-4">Academic Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-8">
                <FormField label="Programme">
                    <Input type="text" value={student.programme} disabled />
                </FormField>

                <DynamicFormField 
                    field={{ id: 'studentClass', label: 'Class', type: 'select', required: true, default: true, section: 'academic', visible: true, options: ['', ...classOptions], placeholder: 'Select a Class' }}
                    value={applicationData.studentClass || ''}
                    onChange={handleFieldChange}
                    disabled={isEffectivelyDisabled}
                    student={student}
                    aiSettings={aiSettings}
                    isAdminEditMode={isAdminEditMode}
                />

                {selectedClass && <CapacityDisplay label="Class Capacity" info={capacityInfo} />}
            </div>

            {selectedClassData && (
                <div className="space-y-6 mb-8 animate-fadeIn border-t border-b border-logip-border dark:border-report-border py-6">
                    <div>
                        <h4 className="text-sm font-semibold uppercase text-black dark:text-gray-400 mb-3 tracking-wider">
                            Core Subjects
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedClassData.coreSubjects.map(subject => (
                                <span key={subject} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                                    <span className="material-symbols-outlined text-base">check_circle</span>
                                    {subject}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold uppercase text-black dark:text-gray-400 mb-3 tracking-wider">
                            Elective Subjects
                        </h4>
                        <div className="flex flex-wrap gap-2">
                             {selectedClassData.electiveSubjects.map(subject => (
                                <span key={subject} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                    <span className="material-symbols-outlined text-base">check_circle</span>
                                    {subject}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            <div className="space-y-6">
                {formRows.map((row, rowIndex) => {
                    let gridClass = 'grid-cols-1';
                     if (row.length === 2) gridClass += ' md:grid-cols-2';
                     else if (row.length >= 3) gridClass += ' md:grid-cols-2 lg:grid-cols-3';

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

export default React.memo(AcademicInfoForm);
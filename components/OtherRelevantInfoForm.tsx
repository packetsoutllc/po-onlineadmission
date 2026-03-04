
import React, { useState, useEffect, useMemo } from 'react';
import { Student, AiSettings } from './StudentDetails';
import { appendToLocalStorageArray, getChangedFields, usePrevious } from '../utils/storage';
import { FormSettings } from './admin/pages/ApplicationDashboardSettings';
import { Textarea } from './FormControls';

interface OtherRelevantInfoFormProps {
    student: Student;
    showToast: (message: string, type?: 'info' | 'error') => void;
    isSubmitted: boolean;
    formSettings: FormSettings;
    applicationData: Record<string, any>;
    setApplicationData: (value: Record<string, any> | ((val: Record<string, any>) => Record<string, any>)) => void;
    isAdminEditMode?: boolean;
    aiSettings: AiSettings | null;
}

const CheckboxItem: React.FC<{ label: string; checked: boolean; onChange: (val: boolean) => void; disabled?: boolean }> = ({ label, checked, onChange, disabled }) => (
    <label className={`flex items-center gap-3 cursor-pointer select-none ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        <div className="relative flex items-center justify-center w-5 h-5">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => !disabled && onChange(e.target.checked)}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 dark:border-gray-600 transition-all checked:bg-logip-primary checked:border-logip-primary dark:checked:bg-logip-primary"
                disabled={disabled}
            />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
            </span>
        </div>
        <span className="font-bold text-gray-900 dark:text-gray-100">{label}</span>
    </label>
);

const OtherRelevantInfoForm: React.FC<OtherRelevantInfoFormProps> = ({ student, showToast, isSubmitted, formSettings, applicationData, setApplicationData, isAdminEditMode = false, aiSettings }) => {
    
    const isEffectivelyDisabled = isSubmitted && !isAdminEditMode;
    const prevApplicationData = usePrevious(applicationData);
    
    // We determine if the section is "active" if the user clicked the add button OR if there is data
    const [isFormActive, setIsFormActive] = useState(false);

    const otherFieldKeys = ['nsmqClub', 'stemNovationClub', 'otherClubs', 'otherClubsDetails', 'specialInterest', 'specialInterestDetails'];

    useEffect(() => {
        const changedFields = getChangedFields(prevApplicationData, applicationData);
        if (changedFields.length > 0 && !isEffectivelyDisabled) {
             const logEntry = {
                editor: isAdminEditMode ? 'admin' : 'student',
                timestamp: new Date().toISOString(),
                changedFields: changedFields.filter(c => otherFieldKeys.includes(c.field.toLowerCase().replace(/\s/g, ''))),
            };
            if(logEntry.changedFields.length > 0) {
                appendToLocalStorageArray(`editHistory_${student.indexNumber}`, logEntry);
            }
        }
    }, [applicationData, prevApplicationData, student.indexNumber, isEffectivelyDisabled, isAdminEditMode]);

    const handleFieldChange = (name: string, value: any) => {
        setApplicationData(prev => ({ ...prev, [name]: value }));
    };

    const handleRemove = () => {
        const clearedData = { ...applicationData };
        otherFieldKeys.forEach(key => {
            delete clearedData[key];
        });
        setApplicationData(clearedData);
        setIsFormActive(false);
    };

    const hasAnyData = otherFieldKeys.some(key => {
        const val = applicationData[key];
        return val === true || (typeof val === 'string' && val.trim() !== '');
    });

    const shouldShowForm = isFormActive || hasAnyData || isSubmitted;

    return (
        <div className="animate-fadeIn">
            {!shouldShowForm ? (
                <div className="flex justify-start">
                    <button
                        onClick={() => setIsFormActive(true)}
                        type="button"
                        className="inline-flex items-center gap-2 px-4 py-2 text-base font-semibold rounded-lg text-logip-primary bg-logip-primary/10 hover:bg-logip-primary/20 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Add Clubs, Associations and Others
                    </button>
                </div>
            ) : (
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Clubs, Associations and Others (Optional)</h3>
                        {!isEffectivelyDisabled && (
                            <button
                                onClick={handleRemove}
                                type="button"
                                className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-lg text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-900/30"
                            >
                                <span className="material-symbols-outlined text-lg">delete</span>
                                Remove Section
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">Select your area of interest and hobbies. Write if your area is not stated here.</p>

                    <div className="space-y-8">
                        {/* Club Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <CheckboxItem 
                                label="NSMQ Club" 
                                checked={!!applicationData.nsmqClub} 
                                onChange={(val) => handleFieldChange('nsmqClub', val)} 
                                disabled={isEffectivelyDisabled}
                            />
                            <CheckboxItem 
                                label="STEM Novation Club" 
                                checked={!!applicationData.stemNovationClub} 
                                onChange={(val) => handleFieldChange('stemNovationClub', val)} 
                                disabled={isEffectivelyDisabled}
                            />
                            <CheckboxItem 
                                label="Other Clubs" 
                                checked={!!applicationData.otherClubs} 
                                onChange={(val) => handleFieldChange('otherClubs', val)} 
                                disabled={isEffectivelyDisabled}
                            />
                        </div>

                        {/* Other Clubs Details */}
                        {applicationData.otherClubs && (
                            <div className="animate-fadeIn">
                                <label className="block text-base font-bold text-gray-900 dark:text-gray-100 mb-2">Other Clubs Details</label>
                                <Textarea 
                                    value={applicationData.otherClubsDetails || ''} 
                                    onChange={(e) => handleFieldChange('otherClubsDetails', e.target.value)}
                                    placeholder="Enter details of other clubs you belong to..."
                                    disabled={isEffectivelyDisabled}
                                />
                            </div>
                        )}

                        {/* Special Interest Row */}
                        <div>
                            <CheckboxItem 
                                label="Other Special Interest or Hobby" 
                                checked={!!applicationData.specialInterest} 
                                onChange={(val) => handleFieldChange('specialInterest', val)} 
                                disabled={isEffectivelyDisabled}
                            />
                        </div>

                        {/* Special Interest Details */}
                        {applicationData.specialInterest && (
                            <div className="animate-fadeIn">
                                <label className="block text-base font-bold text-gray-900 dark:text-gray-100 mb-2">Special Interest or Hobby Details</label>
                                <Textarea 
                                    value={applicationData.specialInterestDetails || ''} 
                                    onChange={(e) => handleFieldChange('specialInterestDetails', e.target.value)}
                                    placeholder="Share your interests or hobbies..."
                                    disabled={isEffectivelyDisabled}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(OtherRelevantInfoForm);

import React, { useState, useEffect, useMemo } from 'react';
import { Student } from './StudentDetails';
import Modal from './Modal';
import { StudentStatus } from './admin/pages/StudentsPage';
import { FormSettings, FormFieldConfig } from './admin/pages/ApplicationDashboardSettings';

interface DisplayStatus {
    visible: boolean;
    value: string;
    isRestricted: boolean;
}

const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    return `${day}-${month}-${year}, ${timeStr}`;
};

interface SubmitApplicationFormProps {
    student: Student;
    onSubmissionSuccess: () => void;
    isSubmitted: boolean;
    submissionDate: string | null;
    admissionNumber: string | null;
    onEdit: () => void;
    onUnlockForEditing: () => void;
    formSettings: FormSettings;
    applicationData: Record<string, any>;
    isAdminEditMode?: boolean;
    applicationStatus: 'not_submitted' | 'submitted' | StudentStatus;
    // Added for validation navigation
    showToast: (message: string, type?: 'info' | 'error') => void;
    handleNavClick: (pageId: string, fieldId?: string) => void;
    
    // Accommodation Props
    assignedHouse: string;
    assignedDorm: string;
    enableRoomManagement: boolean;
    houseAssignmentMethod: string;
    dormAssignmentMethod: string;
    studentHouseChoice: string;
    studentDormChoice: string;
    residence: string;

    // Display Status Props (for restrictions)
    classDisplay: DisplayStatus;
    houseDisplay: DisplayStatus;
    dormDisplay: DisplayStatus;

    // Parent Controlled State for Blur consistency
    isConfirmModalOpen: boolean;
    setIsConfirmModalOpen: (val: boolean) => void;
}

const SummarySection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-black dark:text-gray-100 border-b border-logip-border dark:border-report-border pb-2 mb-4">{title}</h3>
        <div className="space-y-3 text-sm">
            {children}
        </div>
    </div>
);

const SummaryItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between">
        <span className="text-black dark:text-gray-400">{label}</span>
        <span className="font-semibold text-black dark:text-gray-200 text-right">{value || 'Not Provided'}</span>
    </div>
);

const DocumentStatus: React.FC<{ name: string }> = ({ name }) => (
    <div className="flex items-center gap-1.5 text-logip-green">
        <span className="material-symbols-outlined text-base">check_circle</span>
        <span className="font-medium text-sm">Uploaded</span>
    </div>
);

const isFieldVisible = (field: FormFieldConfig, applicationData: Record<string, any>, isProtocol: boolean): boolean => {
    if (!field.visible) return false;
    
    // Custom logic for Official Records in summary
    if (field.section === 'official_records') {
        if (field.id === 'officialCurrentSchool') return isProtocol;
    }

    if (field.condition) {
        const parentValue = applicationData[field.condition.fieldId];
        if (field.condition.operator === 'equals') {
            return String(parentValue).toLowerCase() === String(field.condition.value).toLowerCase();
        }
        return false;
    }
    return true;
};

const SubmitApplicationForm: React.FC<SubmitApplicationFormProps> = ({ 
    student, 
    onSubmissionSuccess, 
    isSubmitted, 
    submissionDate, 
    admissionNumber, 
    onEdit, 
    onUnlockForEditing, 
    formSettings, 
    applicationData, 
    isAdminEditMode = false, 
    applicationStatus, 
    showToast, 
    handleNavClick, 
    assignedHouse, 
    assignedDorm, 
    enableRoomManagement, 
    houseAssignmentMethod, 
    dormAssignmentMethod, 
    studentHouseChoice, 
    studentDormChoice, 
    residence,
    classDisplay,
    houseDisplay,
    dormDisplay,
    isConfirmModalOpen,
    setIsConfirmModalOpen
}) => {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    const handleSubmit = () => {
        if (!isConfirmed) {
            showToast("Please confirm that all information is accurate before submitting.", 'error');
            return;
        }

        // --- MANDATORY FIELD VALIDATION ---
        const visibleRequiredFields = formSettings.fields.filter(f => {
            const isReq = f.required || (f.id === 'officialCurrentSchool' && student.isProtocol);
            return isReq && isFieldVisible(f, applicationData, !!student.isProtocol);
        });

        for (const field of visibleRequiredFields) {
            // Check for separated names if the system is enabled
            if (field.id === 'officialFullName' && formSettings.nameSystem === 'separated') {
                const surname = 'surname' in applicationData ? applicationData.surname : (student.name.split(' ')[0] || '');
                const firstName = 'firstName' in applicationData ? applicationData.firstName : (student.name.split(' ')[1] || '');
                
                if (!surname || !surname.trim()) {
                    showToast('"Surname" is a required field.', 'error');
                    handleNavClick('personal_info');
                    return;
                }
                if (!firstName || !firstName.trim()) {
                    showToast('"First Name" is a required field.', 'error');
                    handleNavClick('personal_info');
                    return;
                }
                continue;
            }

            // Check both student record (for official pre-filled data) and applicationData (for user input)
            const officialDataMap: Record<string, keyof Student> = {
                officialFullName: 'name',
                officialIndexNumber: 'indexNumber',
                officialGender: 'gender',
                officialAggregate: 'aggregate',
                officialResidence: 'residence',
                officialProgramme: 'programme',
                officialCurrentSchool: 'currentSchoolPlaced',
            };
            const studentKey = officialDataMap[field.id];
            
            // PRIORITY: Check if the user has touched the field. If so, use their value even if empty string.
            const value = field.id in applicationData 
                ? applicationData[field.id] 
                : (studentKey ? student[studentKey as keyof Student] : '');
            
            if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
                 // Special case for secondary guardian fields, only required if the section is shown
                if (field.id.startsWith('secondary') && !applicationData.showSecondaryGuardian) {
                    continue;
                }
                showToast(`"${field.label}" is a required field.`, 'error');
                
                // Map section name to the correct Page ID literal
                let targetPage: string = field.section;
                if (field.section === 'official_records' || field.section === 'personal') targetPage = 'personal_info';
                else if (field.section === 'academic') targetPage = 'academic_info';
                else if (field.section === 'parents') targetPage = 'parents_info';
                else if (field.section === 'other') targetPage = 'other_info';
                
                handleNavClick(targetPage, field.id);
                return;
            }
        }

        setIsConfirmModalOpen(true);
    }
    
    const handleFinalSubmit = () => {
        setIsConfirmModalOpen(false);
        setIsSuccessModalOpen(true);
    }

    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false);
    }

    const closeSuccessModal = () => {
        setIsSuccessModalOpen(false);
        onSubmissionSuccess();
    }
    
    const officialFields = formSettings.fields.filter(f => f.section === 'official_records' && f.visible);
    const personalFields = formSettings.fields.filter(f => f.section === 'personal' && isFieldVisible(f, applicationData, !!student.isProtocol) && f.type !== 'photo' && f.type !== 'document');
    const academicFields = formSettings.fields.filter(f => f.section === 'academic' && isFieldVisible(f, applicationData, !!student.isProtocol));
    const parentFields = formSettings.fields.filter(f => f.section === 'parents' && isFieldVisible(f, applicationData, !!student.isProtocol));
    const otherFields = formSettings.fields.filter(f => f.section === 'other' && isFieldVisible(f, applicationData, !!student.isProtocol));
    const documentFields = formSettings.fields.filter(f => (f.type === 'photo' || f.type === 'document') && isFieldVisible(f, applicationData, !!student.isProtocol));

    const hasOtherInfo = otherFields.some(f => {
        const val = applicationData[f.id];
        return val === true || (val && String(val).trim().length > 0);
    });

    const renderSummaryValue = (value: any) => {
        if (value === true) return 'Yes';
        if (value === false) return 'No';
        if (typeof value === 'object' && value !== null && value.name && value.data) {
            return `[File: ${value.name}]`;
        }
        return value;
    };
    
    if (isSubmitted && isAdminEditMode) {
        // In admin edit mode we no longer show a special submitted page.
        // Admins will see the regular review form with fields unlocked.
    }

    if (isSubmitted) {
        // For students, avoid rendering a full "Application Submitted" page here.
        // The parent component (StudentDetails) will handle navigation to Admission Documents.
    }

    const showAccommodation = residence === 'Boarding';

    return (
        <>
            <div>
                <h2 className="text-xl font-bold text-black dark:text-gray-100 mb-2">Review Your Application</h2>
                <p className="text-base text-black dark:text-gray-400 mb-6">Please carefully review all the information below before final submission. This information cannot be changed after submission.</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
                    <div>
                        <SummarySection title="Official School Records">
                            {officialFields.map(field => {
                                if (field.id === 'officialCurrentSchool' && !student.isProtocol) return null;

                                const officialDataMap: Record<string, string | undefined> = {
                                    officialFullName: student.name,
                                    officialIndexNumber: student.indexNumber,
                                    officialGender: student.gender,
                                    officialAggregate: student.aggregate,
                                    officialResidence: student.residence,
                                    officialProgramme: student.programme,
                                    officialCurrentSchool: student.currentSchoolPlaced,
                                };
                                
                                const value = field.id in applicationData 
                                    ? applicationData[field.id] 
                                    : officialDataMap[field.id];

                                if (field.id === 'officialFullName' && formSettings.nameSystem === 'separated') return null;
                                return <SummaryItem key={field.id} label={field.label} value={value} />;
                            })}
                        </SummarySection>

                        <SummarySection title="Personal Details">
                             {formSettings.nameSystem === 'separated' && (
                                <>
                                    <SummaryItem label="Surname" value={'surname' in applicationData ? applicationData.surname : (student.name.split(' ')[0] || 'Not Set')} />
                                    <SummaryItem label="First Name" value={'firstName' in applicationData ? applicationData.firstName : (student.name.split(' ')[1] || 'Not Set')} />
                                    <SummaryItem label="Other Names" value={'otherNames' in applicationData ? applicationData.otherNames : (student.name.split(' ').slice(2).join(' ') || 'N/A')} />
                                </>
                             )}
                            {personalFields.map(field => <SummaryItem key={field.id} label={field.label} value={renderSummaryValue(applicationData[field.id])} />)}
                        </SummarySection>

                        <SummarySection title="Academic Information">
                            {academicFields.map(field => {
                                if (field.id === 'studentClass' && classDisplay.isRestricted) {
                                     return <SummaryItem key={field.id} label={field.label} value={<span className="text-red-500 italic text-sm">{classDisplay.value}</span>} />;
                                }
                                return <SummaryItem key={field.id} label={field.label} value={renderSummaryValue(applicationData[field.id])} />
                            })}
                        </SummarySection>
                    </div>

                    <div>
                         <SummarySection title="Parent/Guardian Information">
                             {parentFields.map(field => {
                                 if (field.id.startsWith('secondary') && !applicationData.showSecondaryGuardian) return null;
                                 return <SummaryItem key={field.id} label={field.label} value={renderSummaryValue(applicationData[field.id])} />;
                             })}
                        </SummarySection>

                        {showAccommodation && (
                            <SummarySection title="Accommodation Details">
                                <SummaryItem 
                                    label="House" 
                                    value={
                                        houseDisplay.isRestricted ? 
                                        <span className="text-red-500 italic text-sm">{houseDisplay.value}</span> :
                                        (assignedHouse || 
                                        (houseAssignmentMethod === 'student_choice' ? (studentHouseChoice ? `${studentHouseChoice} (Preferred)` : 'Not Selected') : 
                                        (houseAssignmentMethod === 'automatic' ? 'To be assigned (Auto)' : 'To be assigned (Reporting)')))
                                    } 
                                />
                                {enableRoomManagement && (
                                     <SummaryItem 
                                        label="Dorm/Room" 
                                        value={
                                            dormDisplay.isRestricted ?
                                            <span className="text-red-500 italic text-sm">{dormDisplay.value}</span> :
                                            (assignedDorm || 
                                            (dormAssignmentMethod === 'student_choice' ? (studentDormChoice ? `${studentDormChoice} (Preferred)` : 'Not Selected') : 
                                            (dormAssignmentMethod === 'automatic' ? 'To be assigned (Auto)' : 'To be assigned (Reporting)')))
                                        } 
                                    />
                                )}
                            </SummarySection>
                        )}
                        
                        {hasOtherInfo && (
                            <SummarySection title="Clubs, Associations and Others">
                                {otherFields.map(field => {
                                    const val = applicationData[field.id];
                                    if (val === undefined || val === null || val === '') return null;
                                    return <SummaryItem key={field.id} label={field.label} value={renderSummaryValue(val)} />;
                                })}
                            </SummarySection>
                        )}
                        
                        <SummarySection title="Documents Uploaded">
                             {documentFields.map(field => {
                                const file = applicationData[field.id];
                                if (file) {
                                    return <div key={field.id} className="flex justify-between items-center"><span className="text-black dark:text-gray-200">{field.label}</span><DocumentStatus name={field.label} /></div>;
                                }
                                return null;
                            })}
                        </SummarySection>
                    </div>
                </div>

                <div className="mt-6 bg-logip-upgrade-bg dark:bg-logip-primary/10 rounded-lg p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                         <div className="relative flex items-center mt-1">
                            <input
                                type="checkbox"
                                checked={isConfirmed}
                                onChange={() => setIsConfirmed(!isConfirmed)}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-black dark:border-gray-600 transition-all checked:bg-logip-primary checked:border-logip-primary dark:checked:bg-logip-primary"
                            />
                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                            </span>
                        </div>
                        <span className="text-base text-black dark:text-gray-200">
                            I hereby confirm that all the information provided in this application is true and accurate to the best of my knowledge. I understand that any false information may lead to the cancellation of my admission.
                        </span>
                    </label>
                </div>

                <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-logip-border dark:border-report-border">
                    <button
                        onClick={handleSubmit}
                        disabled={!isConfirmed}
                        className="w-full max-w-md py-2 text-base font-semibold rounded-lg text-white bg-logip-primary hover:bg-logip-primary-hover transition-colors dark:shadow-sm dark:hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-logip-primary"
                    >
                        Submit Application
                    </button>
                </div>
            </div>
            
            <Modal isOpen={isConfirmModalOpen} onClose={closeConfirmModal}>
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-[#FEF9C3] dark:bg-yellow-500/10 flex items-center justify-center mb-5">
                        <span className="material-symbols-outlined text-4xl text-[#EAB308]">
                            warning
                        </span>
                    </div>
                    <h2 id="modal-title" className="text-2xl font-bold text-[#111827] dark:text-gray-100">
                        Confirm Submission
                    </h2>
                    <p className="mt-4 text-base text-[#4B5563] dark:text-gray-300 leading-relaxed text-center">
                        Are you sure you want to submit? You will not be able to make any changes after this point.
                    </p>
                    <div className="mt-8 w-full flex items-center gap-4">
                        <button
                            onClick={closeConfirmModal}
                            type="button"
                            className="w-full py-2.5 px-4 text-sm font-bold rounded-lg text-[#111827] dark:text-gray-300 bg-[#F3F4F6] dark:bg-gray-700 hover:bg-[#E5E7EB] dark:hover:bg-gray-600 transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleFinalSubmit}
                            type="button"
                            className="w-full py-2.5 px-4 text-sm font-bold rounded-lg text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all duration-200 shadow-sm"
                        >
                            Yes, Submit
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isSuccessModalOpen} onClose={closeSuccessModal}>
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-5">
                        <span className="material-symbols-outlined text-4xl text-green-500">
                            task_alt
                        </span>
                    </div>
                    <h2 id="modal-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        Application Submitted!
                    </h2>
                    <p className="mt-4 text-base text-gray-600 dark:text-gray-300 leading-relaxed text-center">
                        Congratulations! Your application has been successfully submitted. You can now proceed to download your admission documents.
                    </p>
                    <button
                        onClick={closeSuccessModal}
                        className="mt-8 w-full py-2 px-4 text-base font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700 transform transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900 focus:ring-green-500"
                    >
                        View Admission Documents
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default React.memo(SubmitApplicationForm);
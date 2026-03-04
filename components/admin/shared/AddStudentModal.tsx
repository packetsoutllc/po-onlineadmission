import React, { useState, useMemo, useEffect } from 'react';
import AdminModal from './AdminModal';
import { AdminInput, AdminSelect } from './forms';
import { AdminStudent, StudentStatus } from '../pages/StudentsPage';
import { School, Admission } from '../pages/SettingsPage';
import { initialHouses } from './houseData';
import { Class } from '../pages/ClassesPage';
import { Programme } from '../pages/ProgrammesPage';
import { Dormitory } from './dormitoryData';
import { AdmissionSettings } from '../pages/SecuritySettingsTab';
import { FormSettings } from '../pages/ApplicationDashboardSettings';
import DynamicFormField from '../../DynamicFormField';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Student, AiSettings } from '../../StudentDetails';
import { PersonalInfoFormData } from '../../PersonalInfoForm';
import { AcademicInfoFormData } from '../../AcademicInfoForm';
import { ParentsInfoFormData } from '../../ParentsInfoForm';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (studentData: Omit<AdminStudent, 'id'> & { surname?: string, firstName?: string, otherNames?: string }) => void;
    student: AdminStudent | null; // For editing
    selectedSchool?: School | null;
    selectedAdmission?: Admission | null;
    allStudents: AdminStudent[];
    dormitories: Dormitory[];
    formSettings: FormSettings | null;
    classes: Class[];
    programmes?: Programme[];
    permissions: Set<string>;
    isSuperAdmin: boolean;
}

const getInitialState = (student: AdminStudent | null, selectedSchool: School | null, selectedAdmission: Admission | null, formSettings: FormSettings | null, applicationData: Record<string, any>): Omit<AdminStudent, 'id'> & Record<string, any> => {
    const defaultState = {
        name: '',
        surname: '',
        firstName: '',
        otherNames: '',
        indexNumber: '',
        schoolId: selectedSchool?.id || '',
        admissionId: selectedAdmission?.id || '',
        programme: '',
        gender: 'Male' as 'Male' | 'Female',
        aggregate: '',
        status: 'Placed' as StudentStatus,
        classId: '',
        houseId: '',
        dormitoryId: '',
        feeStatus: 'Unpaid' as 'Paid' | 'Unpaid',
        residence: 'Boarding' as 'Boarding' | 'Day',
        admissionDate: new Date().toISOString(),
        paymentDate: null,
        phoneNumber: '',
        currentSchoolPlaced: '',
        isProtocol: false
    };

    let mergedData = { ...defaultState, ...applicationData };

    if (student) {
        mergedData = { ...mergedData, ...student };
        if (formSettings?.nameSystem === 'separated' && (!student.surname || !student.firstName)) {
            const nameParts = student.name.split(' ');
            mergedData.surname = nameParts.shift() || '';
            mergedData.firstName = nameParts.shift() || '';
            mergedData.otherNames = nameParts.join(' ');
        }
    }
    
    return mergedData;
};

const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose, onSave, student, selectedSchool, selectedAdmission, allStudents, dormitories, formSettings, classes, programmes, permissions, isSuperAdmin }) => {
    
    const applicationDataKey = student ? `applicationData_${student.schoolId}_${student.indexNumber}` : null;
    const [, setApplicationData] = useLocalStorage<Record<string, any>>(applicationDataKey || 'tempApplicationData', {});

    const [formData, setFormData] = useState(() => getInitialState(student, selectedSchool, selectedAdmission, formSettings, {}));
    const [formError, setFormError] = useState('');
    const [admissionSettings, setAdmissionSettings] = useState<AdmissionSettings | null>(null);
    const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);

    useEffect(() => {
        if (isOpen) {
            const settingsKey = selectedSchool && selectedAdmission ? `admissionSettings_${selectedSchool.id}_${selectedAdmission.id}` : null;
            if (settingsKey) {
                const settingsRaw = localStorage.getItem(settingsKey);
                setAdmissionSettings(settingsRaw ? JSON.parse(settingsRaw) : { enableRoomManagement: true });
            }

            const aiSettingsKey = selectedSchool && selectedAdmission ? `aiFeaturesSettings_${selectedSchool.id}_${selectedAdmission.id}` : null;
            if (aiSettingsKey) {
                const aiRaw = localStorage.getItem(aiSettingsKey);
                if (aiRaw) setAiSettings(JSON.parse(aiRaw));
            }
            
            const studentAppDataKey = student ? `applicationData_${student.schoolId}_${student.indexNumber}` : null;
            const studentAppData = studentAppDataKey ? JSON.parse(localStorage.getItem(studentAppDataKey) || '{}') : {};
    
            let initialData = getInitialState(student, selectedSchool, selectedAdmission, formSettings, studentAppData);
            
            if (student) {
                initialData = {
                    ...initialData,
                    officialProgramme: student.programme,
                    officialResidence: student.residence,
                    officialAggregate: student.aggregate,
                    officialGender: student.gender,
                    officialIndexNumber: student.indexNumber,
                    officialCurrentSchool: student.currentSchoolPlaced || studentAppData.currentSchoolPlaced || studentAppData.officialCurrentSchool || '',
                    currentSchoolPlaced: student.currentSchoolPlaced || studentAppData.currentSchoolPlaced || studentAppData.officialCurrentSchool || '', 
                };
                if (formSettings?.nameSystem !== 'separated') {
                    initialData.officialFullName = student.name;
                }

                if (student.classId) {
                    const cls = classes.find(c => c.id === student.classId);
                    if (cls) initialData.studentClass = cls.name;
                }
                if (student.houseId) {
                    const house = initialHouses.find(h => h.id === student.houseId);
                    if (house) initialData.studentHouseChoice = house.name;
                }
                if (student.dormitoryId) {
                    const dorm = dormitories.find(d => d.id === student.dormitoryId);
                    if (dorm) initialData.studentDormChoice = dorm.name;
                }
            }
    
            setFormData(initialData);
            setFormError('');
        }
    }, [student, isOpen, selectedSchool, selectedAdmission, formSettings, classes, dormitories]);

    const relevantHouses = useMemo(() => {
        const gender = formData.officialGender || formData.gender;
        if (!gender) return [];
        return initialHouses.filter(h => (h.gender === gender || h.gender === 'Mixed') && h.schoolId === (selectedSchool?.id || formData.schoolId));
    }, [formData.gender, formData.officialGender, formData.schoolId, selectedSchool]);

    const relevantClasses = useMemo(() => {
        const programme = formData.officialProgramme || formData.programme;
        if (!programme) return [];
        return classes.filter(c => (c.programme === programme) && c.schoolId === (selectedSchool?.id || formData.schoolId));
    }, [formData.programme, formData.officialProgramme, formData.schoolId, classes, selectedSchool]);

    const relevantDormitories = useMemo(() => {
        if (!admissionSettings?.enableRoomManagement || !formData.houseId) return [];
        return dormitories
            .filter(d => d.houseId === formData.houseId)
            .map(d => {
                const studentCount = allStudents.filter(s => s.dormitoryId === d.id).length;
                return { ...d, studentCount };
            });
    }, [admissionSettings?.enableRoomManagement, formData.houseId, dormitories, allStudents]);

    const handleChange = (name: string, value: any) => {
        const isUpperCaseField = ['name', 'surname', 'firstName', 'otherNames', 'officialFullName'].includes(name);
        
        let finalValue = value;
        if (isUpperCaseField && typeof value === 'string') {
            finalValue = value.toUpperCase();
        }

        if (name === 'currentSchoolPlaced' && typeof value === 'string') {
            finalValue = value.replace(/(^|\s)\S/g, (char) => char.toUpperCase());
        }

        if (name === 'phoneNumber' && typeof value === 'string') {
             if (value.length === 1 && value !== '0') {
                 finalValue = '0' + value;
             }
        }

        setFormData(prev => {
            const newData = { ...prev, [name]: finalValue };
            if (name === 'classId') {
                const cls = classes.find(c => c.id === value);
                newData.studentClass = cls ? cls.name : '';
            }
            if (name === 'houseId') {
                const house = initialHouses.find(h => h.id === value);
                newData.studentHouseChoice = house ? house.name : '';
                if (prev.houseId !== value) {
                    newData.dormitoryId = '';
                    newData.studentDormChoice = '';
                }
            }
            if (name === 'dormitoryId') {
                const dorm = dormitories.find(d => d.id === value);
                newData.studentDormChoice = dorm ? dorm.name : '';
            }
            return newData;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        const indexNumber = formData.officialIndexNumber || formData.indexNumber;
        
        // Context-aware duplicate check
        const isDuplicate = allStudents.some(s => 
            s.indexNumber === indexNumber && 
            s.schoolId === (selectedSchool?.id || formData.schoolId) && 
            s.id !== student?.id
        );

        if (isDuplicate) {
            setFormError(`A student with index number ${indexNumber} already exists in this school.`);
            return;
        }

        const coreDataForSave: Record<string, any> = {};
        const applicationDataToSave: Record<string, any> = {};
        const adminStudentKeys = new Set(['name', 'surname', 'firstName', 'otherNames', 'indexNumber', 'schoolId', 'admissionId', 'programme', 'gender', 'aggregate', 'status', 'classId', 'houseId', 'dormitoryId', 'feeStatus', 'residence', 'admissionDate', 'paymentDate', 'phoneNumber', 'parentContact', 'currentSchoolPlaced', 'isProtocol']);
        
        const mappedData = { ...formData };
        // Ensure strictly forced IDs
        if (selectedSchool) mappedData.schoolId = selectedSchool.id;
        if (selectedAdmission) mappedData.admissionId = selectedAdmission.id;

        mappedData.programme = formData.officialProgramme || formData.programme;
        mappedData.residence = formData.officialResidence || formData.residence;
        mappedData.aggregate = formData.officialAggregate || formData.aggregate;
        mappedData.gender = formData.officialGender || formData.gender;
        mappedData.indexNumber = formData.officialIndexNumber || formData.indexNumber;
        mappedData.currentSchoolPlaced = formData.officialCurrentSchool || formData.currentSchoolPlaced;
        
        if (formSettings?.nameSystem !== 'separated') {
            mappedData.name = formData.officialFullName || formData.name;
        } else {
            mappedData.name = [formData.surname, formData.firstName, formData.otherNames].filter(Boolean).join(' ');
        }

        Object.entries(mappedData).forEach(([key, value]) => {
            if (adminStudentKeys.has(key)) coreDataForSave[key] = value;
            else applicationDataToSave[key] = value;
        });

        const targetIndexNumber = mappedData.indexNumber; 
        if (targetIndexNumber) {
            const targetKey = `applicationData_${mappedData.schoolId}_${targetIndexNumber}`;
            let existingAppData = {};
            try {
                const raw = localStorage.getItem(targetKey);
                if (raw) existingAppData = JSON.parse(raw);
            } catch(e) {}
            const finalAppData = { ...existingAppData, ...applicationDataToSave };
            localStorage.setItem(targetKey, JSON.stringify(finalAppData));
            window.dispatchEvent(new StorageEvent('storage', { key: targetKey, newValue: JSON.stringify(finalAppData) }));
        }
        onSave(coreDataForSave as Omit<AdminStudent, 'id'> & { surname?: string, firstName?: string, otherNames?: string });
    };
    
    const officialRecordFields = formSettings?.fields.filter(f => f.section === 'official_records' && f.visible && f.id !== 'officialCurrentSchool') || [];
    const dummyStudentForField: Student = { name: formData.name || '', indexNumber: formData.indexNumber || '', gender: formData.gender || 'Male', programme: formData.programme || '', residence: formData.residence || 'Boarding', aggregate: formData.aggregate || '', schoolId: formData.schoolId, admissionId: formData.admissionId, isProtocol: formData.isProtocol };

    const showOfficialRecords = isSuperAdmin || permissions.has('field:add_std:official');
    const canEditOfficial = isSuperAdmin || permissions.has('field:std:edit_official');
    const showAssignments = isSuperAdmin || permissions.has('field:add_std:assignments');
    const showStatus = isSuperAdmin || permissions.has('field:add_std:status');
    const showPhone = isSuperAdmin || permissions.has('field:add_std:phone');

    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title={student ? 'Edit Student' : 'Add New Student'} size="4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {showOfficialRecords && (
                    <>
                        <h3 className="text-lg font-semibold text-logip-text-header dark:text-dark-text-primary border-b border-logip-border dark:border-dark-border pb-2">Official School Records</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {officialRecordFields.map(field => {
                                if (field.id === 'officialFullName' && formSettings?.nameSystem === 'separated') {
                                    return (
                                        <React.Fragment key="name-split-fields">
                                            <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="col-span-1">
                                                    <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Surname <span className="text-red-500">*</span></label>
                                                    <AdminInput name="surname" value={formData.surname} onChange={e => handleChange('surname', e.target.value)} required placeholder="e.g. Doe" disabled={!canEditOfficial} />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">First Name <span className="text-red-500">*</span></label>
                                                    <AdminInput name="firstName" value={formData.firstName} onChange={e => handleChange('firstName', e.target.value)} required placeholder="e.g. John" disabled={!canEditOfficial} />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Other Names</label>
                                                    <AdminInput name="otherNames" value={formData.otherNames} onChange={e => handleChange('otherNames', e.target.value)} placeholder="e.g. Kofi" disabled={!canEditOfficial} />
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                }
                                let modifiedField = { ...field };
                                if (field.id === 'officialGender') { modifiedField.type = 'select'; modifiedField.options = ['', 'Male', 'Female']; }
                                else if (field.id === 'officialResidence') { modifiedField.type = 'select'; modifiedField.options = ['', 'Boarding', 'Day']; }
                                else if (field.id === 'officialProgramme') { modifiedField.type = 'select'; modifiedField.options = ['', 'General Science', 'General Arts', 'Visual Arts', 'Business', 'Home Economics', 'Agricultural Science']; }
                                
                                return (
                                    <DynamicFormField 
                                        key={modifiedField.id} 
                                        field={modifiedField} 
                                        value={formData[modifiedField.id] || ''} 
                                        onChange={handleChange} 
                                        student={dummyStudentForField} 
                                        aiSettings={aiSettings} 
                                        isAdminEditMode={canEditOfficial} 
                                        disabled={!canEditOfficial || (field.readOnly !== false && !isSuperAdmin)} 
                                    />
                                );
                            })}
                        </div>
                    </>
                )}

                {showAssignments && (
                    <>
                        <h3 className="text-lg font-semibold text-logip-text-header dark:text-dark-text-primary border-b border-logip-border dark:border-dark-border pb-2 pt-4">School Assignments</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">Class (Optional)</label>
                                <AdminSelect name="classId" value={formData.classId} onChange={e => handleChange('classId', e.target.value)} disabled={!(formData.programme || formData.officialProgramme)}>
                                    <option value="">Select a class</option>
                                    {relevantClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </AdminSelect>
                            </div>
                            <div>
                                <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">House (Optional)</label>
                                <AdminSelect name="houseId" value={formData.houseId} onChange={e => handleChange('houseId', e.target.value)}>
                                    <option value="">Select a house</option>
                                    {relevantHouses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </AdminSelect>
                            </div>
                        </div>

                        {admissionSettings?.enableRoomManagement && (
                            <div>
                                <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">Dorm/Room (Optional)</label>
                                <AdminSelect name="dormitoryId" value={formData.dormitoryId} onChange={e => handleChange('dormitoryId', e.target.value)} disabled={!formData.houseId}>
                                    <option value="">{formData.houseId ? 'Select a room' : 'Select a house first'}</option>
                                    {relevantDormitories.map(d => (
                                        <option key={d.id} value={d.id} disabled={d.studentCount >= d.capacity}>
                                            {d.name} ({d.studentCount}/{d.capacity} {d.studentCount >= d.capacity ? ' - Full' : ''})
                                        </option>
                                    ))}
                                </AdminSelect>
                            </div>
                        )}
                    </>
                )}
                
                {(showStatus || showPhone) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {showStatus && (
                            <div>
                                <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">Status</label>
                                <AdminSelect name="status" value={formData.status} onChange={e => handleChange('status', e.target.value)} required>
                                    <option value="Placed">Placed</option><option value="Prospective">Prospective</option><option value="Admitted">Admitted</option><option value="Pending">Pending</option><option value="Rejected">Rejected</option>
                                </AdminSelect>
                            </div>
                        )}
                        {showPhone && (
                            <div>
                                <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">Phone Number</label>
                                <AdminInput name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={e => handleChange('phoneNumber', e.target.value)} placeholder="024..." maxLength={10} />
                            </div>
                        )}
                    </div>
                )}

                 {formError && (
                    <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded-r flex items-start space-x-3 animate-fadeIn">
                        <span className="material-symbols-outlined text-xl mt-0.5">error</span>
                        <p>{formError}</p>
                    </div>
                )}
                <div className="pt-2 border-t border-gray-100 dark:border-dark-border flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-base font-semibold rounded-lg border border-logip-border dark:border-dark-border text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-base font-semibold rounded-lg bg-logip-primary dark:bg-dark-accent-purple text-white hover:opacity-90 transition-opacity">{student ? 'Save Changes' : 'Add Student'}</button>
                </div>
            </form>
        </AdminModal>
    );
};

export default AddStudentModal;
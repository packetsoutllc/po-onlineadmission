import React, { useState, useEffect, useMemo } from 'react';
import AdminModal from './AdminModal';
import ImagePreviewModal from '../../shared/ImagePreviewModal';
import PDFPreviewModal from '../../PDFPreviewModal';
import { AdminStudent, initialAdminStudents } from '../pages/StudentsPage';
import { initialClasses } from '../pages/ClassesPage';
import { initialHouses } from './houseData';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { School, Admission } from '../pages/SettingsPage';
import { FormSettings, INITIAL_FORM_SETTINGS } from '../pages/ApplicationDashboardSettings';

// Helper to check for medical report
const getMedicalReport = (indexNumber: string, schoolId?: string) => {
    const key = schoolId ? `applicationData_${schoolId}_${indexNumber}` : `applicationData_${indexNumber}`;
    try {
        const data = localStorage.getItem(key);
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed.hasDisability === 'Yes' && parsed.medicalReport) {
                return parsed.medicalReport;
            }
        }
    } catch (e) {}
    return null;
};

// Re-using avatar logic
const getStudentAvatarUrl = (indexNumber: string, gender: 'Male' | 'Female', schoolId?: string): string => {
    const keysToTry = [
        schoolId ? `applicationData_${schoolId}_${indexNumber}` : null,
        `applicationData_s1_${indexNumber}`,
        `applicationData_${indexNumber}`,
        `file_upload_${indexNumber}_Passport-Size-Photograph`
    ].filter(Boolean);

    for (const key of keysToTry) {
        try {
            const raw = localStorage.getItem(key!);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.passportPhotograph?.data) return parsed.passportPhotograph.data;
                if (parsed.data) return parsed.data;
            }
        } catch (e) {}
    }
    return `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="${gender === 'Male' ? '#dbeafe' : '#fce7f3'}" /><text x="50" y="55" font-family="Arial" font-size="50" fill="${gender === 'Male' ? '#1d4ed8' : '#be185d'}" text-anchor="middle" dominant-baseline="middle">?</text></svg>`)}`;
};

interface StudentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: AdminStudent;
    selectedSchool?: School | null;
}

// Sub-component for structured data rows
const DataRow: React.FC<{ label: string; value: React.ReactNode; isAlternate?: boolean }> = ({ label, value, isAlternate }) => (
    <div className={`grid grid-cols-2 py-3 px-4 ${isAlternate ? 'bg-gray-50/50 dark:bg-white/5' : ''}`}>
        <dt className="text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="text-sm font-bold text-gray-900 dark:text-gray-100">{value || '---'}</dd>
    </div>
);

// Sub-component for Guardian Cards
const GuardianCard: React.FC<{ 
    name: string; 
    relation: string; 
    contact: string; 
    occupation?: string; 
    colorClass: string; 
    initial: string 
}> = ({ name, relation, contact, occupation, colorClass, initial }) => (
    <div className="flex items-start gap-4 mb-6">
        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold ${colorClass}`}>
            {initial}
        </div>
        <div className="min-w-0">
            <h5 className="font-bold text-gray-900 dark:text-white text-sm truncate">{name || 'Not Provided'}</h5>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{relation}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">{contact}</p>
            {occupation && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{occupation}</p>}
        </div>
    </div>
);

const StudentPreviewModal: React.FC<StudentPreviewModalProps> = ({ isOpen, onClose, student, selectedSchool }) => {
    const [appData, setAppData] = useState<any>({});
    const [admissions] = useLocalStorage<Admission[]>('admin_admissions', []);
    const [formSettings] = useLocalStorage<FormSettings>(`formSettings_${student.admissionId}`, INITIAL_FORM_SETTINGS);

    // States for internal previews
    const [previewImage, setPreviewImage] = useState<{ isOpen: boolean; url: string; title: string }>({
        isOpen: false, url: '', title: ''
    });
    const [medicalPreview, setMedicalPreview] = useState<{ isOpen: boolean; data: string; name: string; type: string }>({
        isOpen: false, data: '', name: '', type: ''
    });

    useEffect(() => {
        if (isOpen && student) {
            const mainAppDataKey = `applicationData_${student.schoolId}_${student.indexNumber}`;
            try {
                const raw = localStorage.getItem(mainAppDataKey);
                if (raw) setAppData(JSON.parse(raw));
            } catch(e) {}
        }
    }, [isOpen, student]);

    const avatarUrl = getStudentAvatarUrl(student.indexNumber, student.gender, student.schoolId);

    if (!isOpen) return null;

    return (
        <>
            <AdminModal isOpen={isOpen} onClose={onClose} title="Student Profile" size="6xl">
                <div className="bg-[#f8fafc] dark:bg-dark-bg -m-8 font-display">
                    
                    {/* TOP HEADER BAR */}
                    <div className="bg-white dark:bg-report-dark border-b border-gray-200 dark:border-report-border px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">STUDENT PROFILE</h1>
                        <div className="flex items-center gap-2">
                            {/* Actions removed as requested */}
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-12 gap-8 items-start">
                        
                        {/* LEFT COLUMN: PRIMARY PROFILE */}
                        <div className="col-span-12 lg:col-span-3 space-y-8 flex flex-col items-center">
                            <div className="relative group">
                                <img 
                                    src={avatarUrl} 
                                    alt={student.name} 
                                    className="w-48 h-56 rounded-xl object-cover shadow-2xl border-4 border-white dark:border-dark-surface"
                                />
                                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-white dark:border-dark-surface rounded-full shadow-md"></div>
                            </div>
                            
                            <div className="text-center w-full">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{student.name}</h2>
                                <p className="text-gray-400 font-bold mt-1 text-sm tracking-widest">#{student.indexNumber.slice(-4)}</p>
                                <p className="text-xs font-semibold text-gray-500 uppercase mt-1">{student.gender}</p>
                            </div>

                            {/* CORE STATS GRID */}
                            <div className="grid grid-cols-3 w-full gap-2 text-center border-t border-b border-gray-200 dark:border-dark-border py-4">
                                <div>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">122</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Roll No</p>
                                </div>
                                <div>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">{student.aggregate}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Aggregate</p>
                                </div>
                                <div>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">{student.residence.charAt(0)}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Scope</p>
                                </div>
                            </div>

                            {/* VERTICAL ACTIONS */}
                            <div className="w-full space-y-3">
                                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-md">
                                    Send Student Password
                                </button>
                                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-md">
                                    Send Parent Password
                                </button>
                                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-md">
                                    Login Information
                                </button>
                            </div>
                        </div>

                        {/* CENTER COLUMN: DATA BLOCKS */}
                        <div className="col-span-12 lg:col-span-6 space-y-10">
                            
                            {/* PROFILE TABLE */}
                            <div className="bg-white dark:bg-report-dark rounded-xl shadow-sm border border-gray-100 dark:border-report-border overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-50 dark:border-dark-border flex justify-between items-center">
                                    <h3 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-widest">PROFILE</h3>
                                </div>
                                <dl className="divide-y divide-gray-100 dark:divide-dark-border">
                                    <DataRow label="Admission Date" value={new Date(student.admissionDate).toLocaleDateString()} />
                                    <DataRow label="Date of Birth" value={appData.dateOfBirth || 'Not Set'} isAlternate />
                                    <DataRow label="Programme" value={student.programme} />
                                    <DataRow label="Mobile Number" value={student.phoneNumber} isAlternate />
                                    <DataRow label="Region" value={appData.region} />
                                    <DataRow label="Religion" value={appData.religion} isAlternate />
                                    <DataRow label="Email" value={appData.emailAddress} />
                                    <DataRow label="Current Address" value={appData.residentialAddress} isAlternate />
                                    <DataRow label="Nationality" value={appData.nationality} />
                                </dl>
                            </div>

                            {/* MISC DETAILS TABLE */}
                            <div className="bg-white dark:bg-report-dark rounded-xl shadow-sm border border-gray-100 dark:border-report-border overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-50 dark:border-dark-border flex justify-between items-center">
                                    <h3 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-widest">MISCELLANEOUS DETAILS</h3>
                                </div>
                                <dl className="divide-y divide-gray-100 dark:divide-dark-border">
                                    <DataRow label="Blood Group" value={appData.bloodGroup || 'Not Specified'} />
                                    <DataRow label="Student House" value={initialHouses.find(h => h.id === student.houseId)?.name} isAlternate />
                                    <DataRow label="Enrollment Code" value={appData.enrollmentCode} />
                                    <DataRow label="Special Needs" value={appData.disabilityDetails} isAlternate />
                                    <DataRow label="Aggregate" value={student.aggregate} />
                                </dl>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: GUARDIANS */}
                        <div className="col-span-12 lg:col-span-3 space-y-10">
                            
                            <div>
                                <h3 className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-[0.2em] mb-6">PARENT DETAILS</h3>
                                <GuardianCard 
                                    name={appData.primaryFullName} 
                                    relation={appData.primaryRelationship || 'Parent'} 
                                    contact={appData.primaryContact} 
                                    occupation={appData.primaryOccupation}
                                    colorClass="bg-slate-700"
                                    initial="S"
                                />
                                {appData.secondaryFullName && (
                                    <GuardianCard 
                                        name={appData.secondaryFullName} 
                                        relation={appData.secondaryRelationship || 'Guardian'} 
                                        contact={appData.secondaryContact} 
                                        occupation={appData.secondaryOccupation}
                                        colorClass="bg-blue-600"
                                        initial="I"
                                    />
                                )}
                            </div>

                            <hr className="border-gray-100 dark:border-dark-border" />

                            <div>
                                <h3 className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-[0.2em] mb-6">GUARDIAN DETAILS</h3>
                                <GuardianCard 
                                    name={appData.primaryFullName} 
                                    relation="Primary" 
                                    contact={appData.primaryWhatsapp || appData.primaryContact}
                                    occupation={appData.primaryOccupation}
                                    colorClass="bg-slate-800"
                                    initial="S"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </AdminModal>

            <ImagePreviewModal
                isOpen={previewImage.isOpen}
                onClose={() => setPreviewImage(p => ({ ...p, isOpen: false }))}
                imageUrl={previewImage.url}
                altText={previewImage.title}
            />

            {medicalPreview.isOpen && (
                medicalPreview.type === 'application/pdf' ? (
                    <PDFPreviewModal 
                        isOpen={true} 
                        onClose={() => setMedicalPreview(p => ({ ...p, isOpen: false }))} 
                        pdfData={medicalPreview.data} 
                        fileName={medicalPreview.name} 
                    />
                ) : (
                    <ImagePreviewModal 
                        isOpen={true} 
                        onClose={() => setMedicalPreview(p => ({ ...p, isOpen: false }))} 
                        imageUrl={medicalPreview.data} 
                        altText={medicalPreview.name} 
                    />
                )
            )}
        </>
    );
};

export default StudentPreviewModal;
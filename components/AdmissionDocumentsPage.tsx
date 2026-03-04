import React, { useState, useEffect, useMemo } from 'react';
import { Student, ApplicationStatus } from './StudentDetails';
import PDFPreviewModal from './PDFPreviewModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { StudentStatus, AdminStudent, initialAdminStudents } from './admin/pages/StudentsPage';
import { Admission } from './admin/pages/SettingsPage';
import { FormSettings } from './admin/pages/ApplicationDashboardSettings';
import { generateFilledPdf } from '../utils/pdfGenerator';
import { initialClasses } from './admin/pages/ClassesPage';
import { initialHouses } from './admin/shared/houseData';
import { logActivity, setLocalStorageAndNotify } from '../utils/storage';
import Modal from './Modal';
import PaymentGateway from './PaymentGateway';
import { AdmissionSettings } from './admin/pages/SecuritySettingsTab';

interface DocumentAccessSettings {
  [key: string]: { 
      prospective: boolean; 
      prospectiveReason?: string;
      admitted: boolean; 
      admittedReason?: string;
  };
}

interface Template {
  id: string;
  label: string;
  acceptedFileTypes: string;
  fileTypeLabel: string;
  visible: boolean;
}

interface AdmissionDocumentsPageProps {
    student: Student;
    applicationStatus: ApplicationStatus | StudentStatus;
    admission?: Admission;
    formSettings?: FormSettings;
    applicationData?: Record<string, any>;
    showToast: (message: string, type?: 'info' | 'error') => void;
}

const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const dataURIToBlob = (dataURI: string) => {
    if (!dataURI) return null;
    try {
        let mimeString = 'application/pdf';
        let base64Data = dataURI;
        if (dataURI.includes(',')) {
            const parts = dataURI.split(',');
            const mimeMatch = parts[0].match(/:(.*?);/);
            if (mimeMatch) mimeString = mimeMatch[1];
            base64Data = parts[1];
        }
        const cleanBase64 = base64Data.trim().replace(/\s/g, '');
        const byteString = atob(cleanBase64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        return new Blob([ab], { type: mimeString });
    } catch (e) {
        return null;
    }
}

const DocumentItem: React.FC<{ 
    icon: string; 
    name: string; 
    size: string; 
    hasFile: boolean;
    isLockedByPayment: boolean;
    lockPrice: string;
    onPrint: () => void; 
    onDownload: () => void; 
    onPayToUnlock: () => void;
    loading?: boolean 
}> = ({ icon, name, size, hasFile, isLockedByPayment, lockPrice, onPrint, onDownload, onPayToUnlock, loading }) => (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white dark:bg-[#1C1A27] border border-logip-border dark:border-white/10 rounded-xl transition-colors ${hasFile ? 'hover:border-gray-300 dark:hover:border-white/20' : 'opacity-75'} shadow-sm dark:shadow-none gap-4 font-display`}>
        <div className="flex items-center gap-4 min-w-0">
            <div className={`w-12 h-12 rounded-lg ${hasFile ? 'bg-gray-100 dark:bg-white/5' : 'bg-gray-50 dark:bg-white/5'} flex items-center justify-center text-gray-500 dark:text-gray-400 flex-shrink-0`}>
                 <span className="material-symbols-outlined text-2xl">{isLockedByPayment ? 'lock_person' : icon}</span>
            </div>
            <div className='min-w-0'>
                <p className="text-base text-gray-900 dark:text-gray-100 font-bold truncate tracking-tight">{name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{hasFile ? (isLockedByPayment ? 'Unlock required for access' : size) : 'File not yet uploaded'}</p>
            </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
            {isLockedByPayment ? (
                <div 
                    className="flex-1 sm:flex-none justify-center px-6 py-2.5 text-sm font-normal rounded-lg text-white bg-emerald-600 shadow-md flex items-center gap-2 uppercase tracking-wide cursor-default select-none"
                >
                    <span className="material-symbols-outlined text-lg">lock</span>
                    Locked
                </div>
            ) : (
                <>
                    <button 
                        onClick={onPrint}
                        disabled={loading || !hasFile}
                        className="flex-1 sm:flex-none justify-center px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">print</span>
                        Print
                    </button>
                    <button 
                        onClick={onDownload}
                        disabled={loading || !hasFile}
                        className="flex-1 sm:flex-none justify-center px-4 py-2 text-sm font-bold rounded-lg text-white bg-logip-primary hover:bg-logip-primary-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <span className="material-symbols-outlined text-lg">download</span>
                        )}
                        Download
                    </button>
                </>
            )}
        </div>
    </div>
);

const RestrictedDocumentItem: React.FC<{ icon: string; name: string; reason?: string }> = ({ icon, name, reason }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-xl transition-colors font-display">
        <div className="flex items-center gap-4 min-w-0 opacity-60">
            <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-gray-500">
                 <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <div className='min-w-0'>
                <p className="text-base text-gray-500 dark:text-gray-400 font-bold truncate tracking-tight">{name}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-sm">lock</span> Access Restricted
                </p>
            </div>
        </div>
        {reason && (
            <div className="mt-3 sm:mt-0 sm:ml-4 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg">
                <p className="text-xs text-red-600 dark:text-red-300 font-bold max-w-xs uppercase tracking-wider">
                    {reason}
                </p>
            </div>
        )}
    </div>
);

const AdmissionDocumentsPage: React.FC<AdmissionDocumentsPageProps> = ({ student, applicationStatus, admission, formSettings, applicationData, showToast }) => {
    const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
    const [storageVersion, setStorageVersion] = useState(0);
    const [isPaymentActive, setIsPaymentActive] = useState(false);
    
    // STRICT CONTEXT: Isolate by school and admission IDs
    const contextSuffix = `${student.schoolId}_${student.admissionId}`;
    const docVisibilityKey = `docVisibilitySettings_${contextSuffix}`;
    const [visibilitySettings] = useLocalStorage<DocumentAccessSettings | null>(docVisibilityKey, null);
    
    const docAccessKey = `docAccessSettings_${contextSuffix}`;
    const [paymentRequirementSettings] = useLocalStorage<DocumentAccessSettings | null>(docAccessKey, null);
    
    const [adminStudents] = useLocalStorage<AdminStudent[]>('admin_students', initialAdminStudents);

    const docUnlockStatusKey = `paymentStatus_docAccess_${student.schoolId}_${student.indexNumber}`;
    const [docAccessPaid, setDocAccessPaid] = useLocalStorage<{ paid: boolean }>(docUnlockStatusKey, { paid: false });

    const financialsKey = `financialsSettings_${contextSuffix}`;
    const financialsRaw = localStorage.getItem(financialsKey);
    const financials = useMemo(() => {
        return financialsRaw ? JSON.parse(financialsRaw) : { 
            docAccessFeeEnabled: false, 
            docAccessFeePrice: '100', 
            docAccessFeeTarget: 'both',
            exemptedStudents: [],
            docApplicationList: ["Admission Letter", "Prospectus", "Personal Record Form"]
        };
    }, [financialsRaw]);

    const defaultTemplates: Template[] = [
        { id: 'admissionLetter', label: 'Admission Letter', acceptedFileTypes: 'application/pdf', fileTypeLabel: 'PDF only', visible: true },
        { id: 'personalRecordForm', label: 'Personal Record Form', acceptedFileTypes: 'application/pdf', fileTypeLabel: 'PDF only', visible: true },
        { id: 'prospectus', label: 'Prospectus', acceptedFileTypes: 'application/pdf', fileTypeLabel: 'PDF only', visible: true },
    ];

    const templatesKey = admission && student.schoolId ? `admissionDocTemplatesList_${student.schoolId}_${admission.id}` : 'temp_template_list_key';
    const [dynamicTemplates] = useLocalStorage<Template[]>(templatesKey, defaultTemplates, (val) => {
        if (Array.isArray(val)) return val.map(t => ({ ...t, visible: t.visible ?? true }));
        return val;
    });

    const dummyPdfData = 'data:application/pdf;base64,JVBERi0xLjQKJdP0zOekCjEgMCBvYmoKPDwvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlIC9QYWdlcyAvQ291bnQgMSAvS2lkcyBbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9SZXNvdXJjZXMgPDwvRm9udCA8PC9GMSA0IDAgUj4+Pj4gL01lZGlhQm94IFswIDAgNTk1IDg0Ml0gL0NvbnRlbnRzIDUgMCBSID4+CmVuZG9iago0IDAgb2JqCjw8L1R5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhPj4KZW5kb2JqCjUgMCBvYmoKPDwvTGVuZ3RoIDQ0Pj4Kc3RyZWFtCkJUL0YxIDEyIFRmIDcwIDgwMCBUZCAoRG9jdW1lbnQgUHJldmlldykgVGogRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTggMDAwMDAgbiAKMDAwMDAwMDA2NyAwMDAwMCBuIAowMDAwMDAwMTE4IDAwMDAwIG4gCjAwMDAwMDAyNDEgMDAwMDAgbiAKMDAwMDAwMDMxMSAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNiAvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgowCiUlRU9G';

    useEffect(() => {
        const handleStorageUpdate = (e: StorageEvent) => {
            if (e.key && (e.key.startsWith('admissionDocTemplate_') || e.key.includes('admissionDocTemplatesList_'))) {
                setStorageVersion(v => v + 1);
            }
        };
        window.addEventListener('storage', handleStorageUpdate);
        return () => window.removeEventListener('storage', handleStorageUpdate);
    }, []);

    const storagePrefix = admission && student.schoolId ? `admissionDocTemplate_${student.schoolId}_${admission.id}` : null;

    const processedDocuments = useMemo(() => {
        const order = ['admissionLetter', 'personalRecordForm', 'prospectus'];
        const visibleTemplates = dynamicTemplates.filter(t => t.visible !== false);
        const sortedTemplates = [...visibleTemplates].sort((a, b) => {
            const indexA = order.indexOf(a.id);
            const indexB = order.indexOf(b.id);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return 0;
        });
        const isAdmitted = applicationStatus === 'Admitted';
        const isProspective = ['submitted', 'Prospective', 'Pending'].includes(applicationStatus as string);

        return sortedTemplates.map(doc => {
            let finalData = (doc.id === 'prospectus' || doc.id === 'personalRecordForm' || doc.id === 'admissionLetter') ? dummyPdfData : ''; 
            let finalName = `${doc.label}.pdf`;
            let size = "Unknown";
            let icon = doc.acceptedFileTypes.includes('pdf') ? 'description' : 'article';
            let hasFile = false;
            if (storagePrefix) {
                try {
                    const storedFileRaw = localStorage.getItem(`${storagePrefix}_${doc.id}`);
                    if (storedFileRaw) {
                        const storedFile = JSON.parse(storedFileRaw);
                        finalData = storedFile.data;
                        finalName = storedFile.name;
                        size = formatBytes((finalData.length * 3) / 4);
                        hasFile = true;
                    }
                } catch(e) {}
            }
            if (['prospectus', 'personalRecordForm', 'admissionLetter'].includes(doc.id)) hasFile = true;
            
            let isRestrictedByAdmin = false;
            let restrictionReason: string | undefined = undefined;
            if (visibilitySettings) {
                const visForDoc = visibilitySettings[doc.id as keyof DocumentAccessSettings];
                if (visForDoc) {
                    if (isAdmitted && !visForDoc.admitted) {
                        isRestrictedByAdmin = true;
                        restrictionReason = visForDoc.admittedReason;
                    } else if (isProspective && !visForDoc.prospective) {
                        isRestrictedByAdmin = true;
                        restrictionReason = visForDoc.prospectiveReason;
                    }
                }
            }
            
            let isLockedByPayment = false;
            if (financials.docAccessFeeEnabled && !docAccessPaid.paid && !isRestrictedByAdmin) {
                if (paymentRequirementSettings) {
                    const payReqForDoc = paymentRequirementSettings[doc.id as keyof DocumentAccessSettings];
                    if (payReqForDoc) {
                        if (isAdmitted && payReqForDoc.admitted) isLockedByPayment = true;
                        else if (isProspective && payReqForDoc.prospective) isLockedByPayment = true;
                    }
                } else {
                    if (financials.docAccessFeeTarget === 'both') isLockedByPayment = true;
                    else if (financials.docAccessFeeTarget === 'prospective' && isProspective) isLockedByPayment = true;
                    else if (financials.docAccessFeeTarget === 'admitted' && isAdmitted) isLockedByPayment = true;
                }
            }
            
            return { id: doc.id, name: finalName, label: doc.label, data: finalData, size, icon, hasFile, isRestrictedByAdmin, restrictionReason, isLockedByPayment };
        });
    }, [dynamicTemplates, storagePrefix, visibilitySettings, paymentRequirementSettings, applicationStatus, storageVersion, financials, docAccessPaid.paid]);

    const isGlobalLockActive = useMemo(() => processedDocuments.some(d => d.isLockedByPayment), [processedDocuments]);

    if (['Placed', 'Pending', 'Rejected', 'not_submitted'].includes(applicationStatus as string)) {
        return (
            <div className="text-center py-10 text-black font-display">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-5 mx-auto">
                    <span className="material-symbols-outlined text-4xl text-gray-500 dark:text-gray-400">lock</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Documents Not Available</h2>
                <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                    {applicationStatus === 'Rejected' 
                        ? "Your application was not successful, so you do not have access to admission documents."
                        : "Admission documents are currently not available. They will be accessible once your admission is confirmed."}
                </p>
            </div>
        );
    }

    const generateDocument = async (docId: string, name: string, templateData: string) => {
        setLoadingDocId(docId);
        let finalFileName = name;
        let finalData = templateData;
        try {
            const formattedName = student.name.toLowerCase().split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
            const baseName = name.replace(/\.pdf$/i, '');
            finalFileName = `${formattedName} - ${baseName}.pdf`;
            const freshAdminRecord = adminStudents.find(s => s.indexNumber === student.indexNumber && s.schoolId === student.schoolId);
            const submissionStatusRaw = localStorage.getItem(`submissionStatus_${student.schoolId}_${student.indexNumber}`);
            const submissionStatus = submissionStatusRaw ? JSON.parse(submissionStatusRaw) : {};
            const freshAppDataRaw = localStorage.getItem(`applicationData_${student.schoolId}_${student.indexNumber}`);
            const freshAppData = freshAppDataRaw ? JSON.parse(freshAppDataRaw) : (applicationData || {});
            const className = freshAdminRecord?.classId ? (initialClasses.find(c => c.id === freshAdminRecord.classId)?.name || 'N/A') : (freshAppData?.studentClass || 'N/A');
            const houseName = freshAdminRecord?.houseId ? (initialHouses.find(h => h.id === freshAdminRecord.houseId)?.name || 'N/A') : (freshAppData?.studentHouseChoice || 'N/A');
            let photoData = freshAppData?.passportPhotograph?.data;
            if (!photoData) {
                try {
                    const legacyKey = `file_upload_${student.indexNumber}_Passport-Size-Photograph`;
                    const legacyItem = localStorage.getItem(legacyKey);
                    if (legacyItem) photoData = JSON.parse(legacyItem).data;
                } catch(e) {}
            }
            const layoutKey = `docLayout_${student.schoolId}_${student.admissionId}_${docId}`;
            let layoutConfig = [];
            try { const savedLayout = localStorage.getItem(layoutKey); if (savedLayout) layoutConfig = JSON.parse(savedLayout); } catch(e) {}
            if (layoutConfig && layoutConfig.length > 0) {
                 finalData = await generateFilledPdf(templateData, docId, { name: student.name, indexNumber: student.indexNumber, programme: student.programme, className: className, gender: student.gender, residence: student.residence, house: houseName, aggregate: student.aggregate, admissionNumber: submissionStatus.admissionNumber || 'PENDING', photoBase64: photoData, dateOfBirth: freshAppData?.dateOfBirth, enrollmentCode: freshAppData?.enrollmentCode, phoneNumber: freshAppData?.contactNumber, presentAddress: freshAppData?.residentialAddress, nationality: freshAppData?.nationality, hometown: freshAppData?.hometown, religion: freshAppData?.religion, previousSchool: freshAppData?.previousBasicSchool, beceYear: freshAppData?.yearCompleted, parentName: freshAppData?.primaryFullName, parentRelationship: freshAppData?.primaryRelationship, parentContact: freshAppData?.primaryContact, parentWhatsapp: freshAppData?.primaryWhatsapp, parentOccupation: freshAppData?.primaryOccupation, admissionDate: freshAdminRecord?.admissionDate ? new Date(freshAdminRecord.admissionDate).toLocaleDateString() : '', }, layoutConfig);
            }
        } catch (error) { finalData = templateData; } finally { setLoadingDocId(null); }
        return { data: finalData, name: finalFileName };
    };

    const handlePrint = async (docId: string, name: string, templateData: string) => {
        const { data } = await generateDocument(docId, name, templateData);
        logActivity({ name: student.name, avatar: '', type: 'student' }, 'printed document:', 'document_access', `${name}`, student.schoolId);
        let urlToPrint = data;
        if (data.startsWith('data:')) {
            const blob = dataURIToBlob(data);
            if (blob) urlToPrint = URL.createObjectURL(blob);
        }
        window.open(urlToPrint, '_blank');
    };

    const handleDownload = async (docId: string, name: string, templateData: string) => {
        const { data, name: fileName } = await generateDocument(docId, name, templateData);
        logActivity({ name: student.name, avatar: '', type: 'student' }, 'downloaded document:', 'document_access', `${fileName}`, student.schoolId);
        let urlToDownload = data;
        if (data.startsWith('data:')) {
            const blob = dataURIToBlob(data);
            if (blob) urlToDownload = URL.createObjectURL(blob);
        }
        const link = document.createElement('a');
        link.href = urlToDownload;
        const studentName = student.name.toLowerCase().split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
        const baseName = fileName.replace(/\.pdf$/i, '');
        link.download = `${studentName} - ${baseName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const uploadedDocuments = React.useMemo(() => {
        if (!formSettings || !applicationData) return [];
        const docFields = formSettings.fields.filter(f => (f.type === 'document' || f.type === 'photo') && f.visible && f.id !== 'passportPhotograph');
        const docs = [];
        for (const field of docFields) {
            const fileData = applicationData[field.id];
            if (fileData && fileData.name && fileData.data) {
                docs.push({ id: field.id, name: field.label, fileName: fileData.name, size: typeof fileData.size === 'number' ? formatBytes(fileData.size) : 'Unknown Size', data: fileData.data, icon: field.type === 'photo' ? 'image' : 'description' });
            }
        }
        return docs;
    }, [formSettings, applicationData]);

    const reopeningDateDisplay = React.useMemo(() => {
        if (!admission || !admission.date) return null;
        const d = new Date(admission.date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = d.toLocaleString('default', { month: 'short' });
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    }, [admission]);

    const handlePaymentSuccess = () => {
        setDocAccessPaid({ paid: true });
        setIsPaymentActive(false);
        showToast('Documents successfully unlocked!');
        logActivity({ name: student.name, avatar: '', type: 'student' }, 'paid document access fee', 'payment', `Amount: GHS ${financials.docAccessFeePrice}.00`, student.schoolId);
    };

    return (
        <div className="font-display">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Your Admission Documents</h3>
                    <p className="hidden sm:block text-sm text-gray-600 dark:text-gray-400 font-medium">Download your admission letter, prospectus, and other required documents from this section.</p>
                </div>
                {reopeningDateDisplay && (
                    <div className="flex flex-row items-center gap-3 self-start sm:self-auto justify-start sm:justify-end">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">Admission/Reporting Date</span>
                        <span className="text-sm font-black text-white bg-red-600 px-4 py-2 rounded-xl shadow-md whitespace-nowrap leading-none flex items-center h-fit transform hover:scale-105 transition-transform">{reopeningDateDisplay}</span>
                    </div>
                )}
            </div>

            {isGlobalLockActive && (
                <div className="mb-6 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn shadow-sm">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                             <span className="material-symbols-outlined text-3xl">lock_open</span>
                        </div>
                        <div>
                            <h4 className="font-extrabold text-lg text-emerald-900 dark:text-emerald-300 tracking-tight">Unlock Master Documents</h4>
                            <p className="text-sm text-emerald-700 dark:text-emerald-400/80 font-medium leading-relaxed">System charge of GHS {financials.docAccessFeePrice}.00 is required to print or download your documents.</p>
                        </div>
                    </div>
                    {/* Rotating Light Outline Button */}
                    <div className="relative p-[2.5px] overflow-hidden rounded-xl shadow-lg transition-transform active:scale-95 group">
                        <div className="absolute inset-[-1000%] animate-border-spin bg-[conic-gradient(from_90deg_at_50%_50%,#fbbf24_0%,#d97706_25%,#f59e0b_50%,#d97706_75%,#fbbf24_100%)] opacity-100"></div>
                        <button 
                            onClick={() => setIsPaymentActive(true)}
                            className="relative z-10 px-8 py-3.5 text-sm font-black rounded-[10px] text-black bg-yellow-400 hover:bg-yellow-500 transition-colors uppercase tracking-widest whitespace-nowrap flex items-center gap-3"
                        >
                            <span className="material-symbols-outlined text-xl">payments</span>
                            Click here to pay to unlock your documents
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                 {processedDocuments.map(doc => (
                    doc.isRestrictedByAdmin ? (
                        <RestrictedDocumentItem key={doc.id} icon={doc.icon} name={doc.label} reason={doc.restrictionReason} />
                    ) : (
                        <DocumentItem 
                            key={doc.id}
                            icon={doc.icon} 
                            name={doc.label} 
                            size={doc.size} 
                            hasFile={doc.hasFile}
                            isLockedByPayment={doc.isLockedByPayment}
                            lockPrice={financials.docAccessFeePrice}
                            loading={loadingDocId === doc.id}
                            onPrint={() => handlePrint(doc.id, doc.name, doc.data)}
                            onDownload={() => handleDownload(doc.id, doc.name, doc.data)}
                            onPayToUnlock={() => setIsPaymentActive(true)}
                        />
                    )
                ))}
                {processedDocuments.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400 italic font-medium">No admission documents are available at this time.</div>
                )}
            </div>
            
            {uploadedDocuments.length > 0 && (
                <div className="mt-10">
                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-gray-100 mb-5 tracking-tight flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-logip-primary rounded-full"></span>
                        Your Uploaded Documents
                    </h3>
                    <div className="space-y-4">
                        {uploadedDocuments.map(doc => (
                            <DocumentItem 
                                key={doc.id}
                                icon={doc.icon}
                                name={doc.name} 
                                size={doc.size}
                                hasFile={true}
                                isLockedByPayment={false}
                                lockPrice={financials.docAccessFeePrice}
                                onPrint={() => handlePrint(doc.id, doc.fileName, doc.data)}
                                onDownload={() => handleDownload(doc.id, doc.fileName, doc.data)}
                                onPayToUnlock={() => setIsPaymentActive(true)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* REQUIREMENT: Payment Popup Centered in browser with matched height and size */}
            <Modal isOpen={isPaymentActive} onClose={() => setIsPaymentActive(false)} size="4xl">
                 <div className="relative -m-6 sm:-m-8 rounded-xl overflow-hidden shadow-2xl">
                    <PaymentGateway 
                        student={student} 
                        onPaymentSuccess={handlePaymentSuccess} 
                        onClose={() => setIsPaymentActive(false)}
                        isInitialVoucherPayment={false}
                        customPrice={financials.docAccessFeePrice}
                        customTitle="Document Access Fee"
                        customSubtitle="One-time payment to unlock your admission documents for printing."
                    />
                </div>
            </Modal>
        </div>
    );
};

export default React.memo(AdmissionDocumentsPage);
import React, { useState, useEffect, useMemo } from 'react';
import { Student } from './StudentDetails';
import { setLocalStorageAndNotify } from '../utils/storage';
import { safeJsonParse } from '../utils/security';
import { getInsForgeClient } from '../lib/insforgeClient';
import { upsertPaymentStatus, upsertCredentials } from '../lib/insforgeData';
import Icon from './admin/shared/Icons';
import Modal from './Modal';
import { Select } from './FormControls';
import { AdminStudent } from './admin/pages/StudentsPage';
import { AdmissionSettings } from './admin/pages/SecuritySettingsTab';
import { GatewayConfig } from './admin/pages/FinancialsSettingsTab';

interface PaymentGatewayProps {
  student: Student;
  onPaymentSuccess: () => void;
  onClose?: () => void;
  // Customization props for document access or other fees
  customPrice?: string;
  customTitle?: string;
  customSubtitle?: string;
  isInitialVoucherPayment?: boolean;
}

const MtnIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="4" fill="#FFCB05"/>
        <ellipse cx="12" cy="12" rx="9" ry="5.5" stroke="black" strokeWidth="1.2"/>
        <text x="12" y="14" fontFamily="Arial, sans-serif" fontSize="6" fontWeight="900" textAnchor="middle" fill="black">MTN</text>
    </svg>
);

const TelecelIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="4" fill="#E60000"/>
        <circle cx="12" cy="9.5" r="5" fill="white"/>
        <path d="M12.5 7.5V11C12.5 11.5 12.2 12 11.5 12" stroke="#E60000" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M10.5 8.5H13.5" stroke="#E60000" strokeWidth="1.2" strokeLinecap="round"/>
        <text x="12" y="19" fontFamily="Arial, sans-serif" fontSize="5" fontWeight="bold" textAnchor="middle" fill="white">telecel</text>
    </svg>
);

const AtIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="4" fill="white"/>
        <text x="7" y="15" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#ED1C24">a</text>
        <text x="14" y="15" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#2E3192">t</text>
        <text x="12" y="21" fontFamily="Arial, sans-serif" fontSize="3" fontStyle="italic" textAnchor="middle" fill="black">life is simple</text>
    </svg>
);

const NETWORKS: Record<string, { name: string; icon: React.ReactNode }> = {
    mtn: { name: 'MTN', icon: <MtnIcon /> },
    telecel: { name: 'Telecel', icon: <TelecelIcon /> },
    at: { name: 'at', icon: <AtIcon /> },
};

/** Main application phone (from student or application form). Used to prefill MOMO and Notification SMS. */
function getMainApplicationNumber(student: Student): string {
    const norm = (s: string) => String(s).replace(/\D/g, '').slice(-10);
    if (student.phoneNumber && norm(student.phoneNumber).length >= 10) return norm(student.phoneNumber);
    if (typeof localStorage === 'undefined') return '';
    try {
        const key = `applicationData_${student.schoolId}_${student.indexNumber}`;
        const raw = localStorage.getItem(key);
        if (raw) {
            const data = safeJsonParse<{ contactNumber?: string }>(raw, {});
            if (data.contactNumber && norm(data.contactNumber).length >= 10) return norm(data.contactNumber);
        }
        const smsKey = `smsNotificationNumber_${student.schoolId}_${student.indexNumber}`;
        const smsRaw = localStorage.getItem(smsKey);
        if (smsRaw) return norm(safeJsonParse<string>(smsRaw, ''));
    } catch (_) {}
    return '';
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({ 
    student, 
    onPaymentSuccess, 
    onClose,
    customPrice, 
    customTitle, 
    customSubtitle,
    isInitialVoucherPayment = true 
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [momoNumber, setMomoNumber] = useState(() => getMainApplicationNumber(student));
    const [notificationNumber, setNotificationNumber] = useState(() => getMainApplicationNumber(student));
    const [isSameNumber, setIsSameNumber] = useState(true); 
    const [network, setNetwork] = useState('mtn');
    const [selectedGatewayId, setSelectedGatewayId] = useState<string>('');
    const [isOfficialEditOpen, setIsOfficialEditOpen] = useState(false);
    const [officialEditForm, setOfficialEditForm] = useState({
        name: '',
        indexNumber: '',
        gender: '',
        aggregate: '',
        residence: '',
        programme: '',
        reason: '',
    });
    const [officialEditEvidence, setOfficialEditEvidence] = useState<{ name: string; dataUrl: string } | null>(null);
    const [correctionSuccessModal, setCorrectionSuccessModal] = useState<{ title: string; message: string } | null>(null);

    const financialsSettings = useMemo(() => {
        // STRICT CONTEXT: Filter by current school and admission ID
        const key = `financialsSettings_${student.schoolId}_${student.admissionId}`;
        const raw = localStorage.getItem(key);
        if (!raw) return {
            voucherPrice: '50',
            gatewayStatus: true,
            gateways: [
                { id: 'gw_1', label: 'Paystack (Primary)', enabled: true }
            ],
            applicationList: ["Admission Documents", "AI Editing", "SMS Notifications"]
        };
        return safeJsonParse(raw, {
            voucherPrice: '50',
            gatewayStatus: true,
            gateways: [{ id: 'gw_1', label: 'Paystack (Primary)', enabled: true }],
            applicationList: ["Admission Documents", "AI Editing", "SMS Notifications"]
        });
    }, [student.schoolId, student.admissionId]);

    const activeGateways = useMemo(() => {
        return (financialsSettings.gateways || []).filter((gw: GatewayConfig) => gw.enabled);
    }, [financialsSettings]);

    const applicationList = financialsSettings.applicationList || [];
    const voucherPrice = customPrice || financialsSettings.voucherPrice || '50';

    const officialEditSettings = useMemo(() => {
        const key = `admissionSettings_${student.schoolId}_${student.admissionId}`;
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return { allowOfficialEditRequests: true, autoApproveOfficialEdits: false };
            const parsed = safeJsonParse<{ allowOfficialEditRequests?: boolean; autoApproveOfficialEdits?: boolean }>(raw, {});
            return {
                allowOfficialEditRequests: parsed.allowOfficialEditRequests !== false,
                autoApproveOfficialEdits: !!parsed.autoApproveOfficialEdits,
            };
        } catch {
            return { allowOfficialEditRequests: true, autoApproveOfficialEdits: false };
        }
    }, [student.schoolId, student.admissionId]);

    useEffect(() => {
        if (activeGateways.length > 0 && !selectedGatewayId) {
            setSelectedGatewayId(activeGateways[0].id);
        }
    }, [activeGateways, selectedGatewayId]);

    useEffect(() => {
        if (isSameNumber) {
            setNotificationNumber(momoNumber);
        }
    }, [isSameNumber, momoNumber]);

    const handleSameNumberChange = (checked: boolean) => {
        setIsSameNumber(checked);
        if (checked) {
            setNotificationNumber(momoNumber);
        }
    };

    const generateCredential = (length: number, format: 'numeric' | 'alphabetic' | 'alphanumeric' | undefined): string => {
        const safeLength = (typeof length === 'number' && length > 0) ? length : 10;
        const safeFormat = format || 'numeric';
        let chars = '0123456789';
        if (safeFormat === 'alphabetic') chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        else if (safeFormat === 'alphanumeric') chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < safeLength; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        // When you integrate a real payment API, pass momoNumber to the gateway so the payment form can pre-fill the mobile money number (e.g. mobile_money.phone or similar).

        setTimeout(() => {
            const credentialsKey = `credentials_${student.schoolId}_${student.indexNumber}`;
            const existingCredentialsRaw = localStorage.getItem(credentialsKey);
            
            let credentials = null;
            if (existingCredentialsRaw) {
                credentials = safeJsonParse<{ serialNumber?: string; pin?: string }>(existingCredentialsRaw, null);
            }
            if (!credentials || !credentials.serialNumber || !credentials.pin) {
                // Generation logic for ANY successful payment if missing
                const admissionSettingsKey = `admissionSettings_${student.schoolId}_${student.admissionId}`;
                const settingsRaw = localStorage.getItem(admissionSettingsKey);
                const settings: Partial<AdmissionSettings> = safeJsonParse<Partial<AdmissionSettings>>(settingsRaw, {});

                const serialNumber = generateCredential(settings.serialNumberLength || 10, settings.serialNumberFormat);
                const pin = generateCredential(settings.pinLength || 5, settings.pinFormat);
                
                credentials = { serialNumber, pin };
                setLocalStorageAndNotify(credentialsKey, credentials);
                const client = getInsForgeClient();
                if (client) {
                  upsertCredentials(client, student.schoolId, student.admissionId, student.indexNumber, serialNumber, pin).catch(() => {});
                }
            }

            // --- REQUIREMENT 3: Conditional SMS Sending ---
            const isGlobalStatusOn = financialsSettings.gatewayStatus === true;
            let shouldSendSms = false;
            
            if (isGlobalStatusOn && isInitialVoucherPayment) {
                // Scenario: Pay for initial voucher, receive SMS immediately
                shouldSendSms = true;
            } else if (!isGlobalStatusOn && !isInitialVoucherPayment) {
                // Scenario: Bypassed initial fee (OFF), now paying for doc access
                shouldSendSms = true;
            }

            if (shouldSendSms && credentials) {
                console.log(`[SIMULATED SMS] to ${notificationNumber}: Your portal credentials have been generated. Serial: ${credentials.serialNumber}, PIN: ${credentials.pin}. Keep them safe.`);
            }

            // Mark statuses internally
            const paymentType = isInitialVoucherPayment ? 'initial' : 'doc_access';
            if (isInitialVoucherPayment) {
                setLocalStorageAndNotify(`paymentStatus_${student.schoolId}_${student.indexNumber}`, { paid: true });
            } else {
                setLocalStorageAndNotify(`paymentStatus_docAccess_${student.schoolId}_${student.indexNumber}`, { paid: true });
            }
            const insforgeClient = getInsForgeClient();
            if (insforgeClient) {
              upsertPaymentStatus(insforgeClient, student.schoolId, student.admissionId, student.indexNumber, paymentType, true).catch(() => {});
            }
            
            setLocalStorageAndNotify(`smsNotificationNumber_${student.schoolId}_${student.indexNumber}`, notificationNumber);
            
            // Sync status with AdminStudent list
            const studentsRaw = localStorage.getItem('admin_students');
            let studentsList: AdminStudent[] = safeJsonParse<AdminStudent[]>(studentsRaw, []);
            
            const studentIndex = studentsList.findIndex(s => s.indexNumber === student.indexNumber && s.schoolId === student.schoolId);
            
            if (studentIndex > -1) {
                // Only update feeStatus if this was the initial payment
                if (isInitialVoucherPayment) {
                    studentsList[studentIndex].feeStatus = 'Paid';
                    studentsList[studentIndex].paymentDate = new Date().toISOString();
                }
                studentsList[studentIndex].phoneNumber = notificationNumber;
            } else if (isInitialVoucherPayment) {
                const newStudent: AdminStudent = {
                    id: `stud_${student.indexNumber}`,
                    name: student.name,
                    indexNumber: student.indexNumber,
                    schoolId: student.schoolId,
                    admissionId: student.admissionId,
                    programme: student.programme,
                    gender: student.gender as 'Male' | 'Female',
                    aggregate: student.aggregate,
                    status: 'Prospective',
                    classId: '',
                    houseId: '',
                    feeStatus: 'Paid',
                    residence: student.residence as 'Boarding' | 'Day',
                    admissionDate: new Date().toISOString(),
                    paymentDate: new Date().toISOString(),
                    isProtocol: !!student.isProtocol,
                    phoneNumber: notificationNumber
                };
                studentsList.push(newStudent);
            }
            setLocalStorageAndNotify('admin_students', studentsList);
            
            onPaymentSuccess();
        }, 800);
    };

    return (
        <div className="relative w-full max-w-xl mx-auto px-4 animate-scaleIn font-display text-left">
            <form onSubmit={handleSubmit} className="flex flex-col items-center pt-4 sm:pt-8">
                {/* Top icon – hide when correction modal is open so it doesn’t show behind */}
                {!isOfficialEditOpen && (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-3 sm:mb-5 flex-shrink-0">
                        <Icon name="warning" className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500" />
                    </div>
                )}

                <h2 id="payment-title" className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1 text-center sm:text-left">
                    {customTitle ?? 'Applicant Information'}
                </h2>

                {/* Application System Charges: student details; Admission Document Access: what you're paying for */}
                <div className="mt-5 sm:mt-8 w-full text-left">
                    {isInitialVoucherPayment ? (
                    <>
                        <ul className="space-y-1.5 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                            {[
                                { label: 'Full Name', value: student.name },
                                { label: 'Index Number', value: student.indexNumber },
                                { label: 'Gender', value: student.gender },
                                { label: 'Aggregate', value: student.aggregate },
                                { label: 'Residence', value: student.residence },
                                { label: 'Programme', value: student.programme },
                            ].map(({ label, value }) => (
                                <li key={label} className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                    <span>{label}: <span className="font-medium text-gray-800 dark:text-gray-200">{value || '—'}</span></span>
                                </li>
                            ))}
                        </ul>

                        {officialEditSettings.allowOfficialEditRequests && (
                            <div className="mt-3">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    Do you see any mistakes in the applicant information above? You can submit a correction request to have them fixed.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOfficialEditForm({
                                            name: student.name,
                                            indexNumber: student.indexNumber,
                                            gender: student.gender,
                                            aggregate: student.aggregate,
                                            residence: student.residence,
                                            programme: student.programme,
                                            reason: '',
                                        });
                                        setOfficialEditEvidence(null);
                                        setIsOfficialEditOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-logip-primary hover:text-logip-primary-hover min-h-[44px] touch-manipulation px-3 py-2.5 rounded-lg hover:bg-blue-50/50 dark:hover:bg-blue-500/10"
                                >
                                    <Icon name="edit_note" className="w-4 h-4 flex-shrink-0" />
                                    Request correction to Official Records
                                </button>
                            </div>
                        )}
                    </>
                    ) : (
                    <>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">What you're paying for</p>
                        <ul className="space-y-1.5 text-base text-gray-600 dark:text-gray-400">
                            {applicationList.map((item) => (
                                <li key={item} className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </>
                    )}
                </div>

                {/* MOMO & SMS – same gray box style, responsive padding */}
                <div className="mt-6 sm:mt-10 w-full space-y-4 bg-gray-100 dark:bg-gray-800/50 p-4 sm:p-6 rounded-lg">
                    <div>
                        <label htmlFor="momo-number-left" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Mobile Money number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75h3" />
                                </svg>
                            </span>
                            <input
                                id="momo-number-left"
                                type="tel"
                                required
                                value={momoNumber}
                                onChange={(e) => setMomoNumber(e.target.value)}
                                placeholder="024 XXX XXXX"
                                maxLength={10}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-logip-primary/20 focus:border-logip-primary"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="notification-number-left" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            SMS Notification <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.027.163 2.057.277 2.907.277.58 0 1.163-.069 1.704-.2 1.09-.263 1.97-.726 2.5-1.385.53-.659.83-1.41.83-2.2 0-.79-.3-1.541-.83-2.2-.53-.659-1.41-1.122-2.5-1.385-.54-.131-1.124-.2-1.704-.2H9.75" />
                                </svg>
                            </span>
                            <input
                                id="notification-number-left"
                                type="tel"
                                required
                                disabled={isSameNumber}
                                value={isSameNumber ? momoNumber : notificationNumber}
                                onChange={(e) => setNotificationNumber(e.target.value)}
                                placeholder="024 XXX XXXX"
                                maxLength={10}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-logip-primary/20 focus:border-logip-primary disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>
                        <label className="mt-2 flex items-center gap-2 cursor-pointer select-none w-fit group">
                            <div className="relative flex items-center justify-center w-5 h-5">
                                <input
                                    type="checkbox"
                                    checked={isSameNumber}
                                    onChange={(e) => handleSameNumberChange(e.target.checked)}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-300 dark:border-gray-600 transition-all checked:bg-logip-primary checked:border-logip-primary dark:checked:bg-logip-primary focus:ring-2 focus:ring-logip-primary/30 focus:ring-offset-0"
                                />
                                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200">Same as MOMO number</span>
                        </label>
                    </div>
                </div>

                {/* Total */}
                <div className="mt-4 w-full flex justify-end items-baseline text-base">
                    <span className="text-gray-500 dark:text-gray-400 mr-1.5">Total:</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">GH¢ {voucherPrice}.00</span>
                </div>

                {/* Bottom actions – stack on mobile, side-by-side on tablet+ */}
                <div className="mt-6 sm:mt-8 mb-6 sm:mb-8 w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-3 sm:py-2.5 px-4 text-base font-semibold rounded-lg text-gray-900 dark:text-gray-300 bg-transparent hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-gray-300 dark:border-gray-600 transition-colors whitespace-nowrap min-h-[44px] touch-manipulation"
                        >
                            Go Back
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading || !momoNumber || momoNumber.length < 10}
                        className="w-full py-3 sm:py-2.5 px-4 text-base font-semibold rounded-lg text-white bg-logip-primary hover:bg-logip-primary-hover shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap min-h-[44px] touch-manipulation"
                    >
                        {isLoading ? 'Processing…' : (
                            'Proceed to pay'
                        )}
                    </button>
                </div>
            </form>

            {isInitialVoucherPayment && (
                <Modal isOpen={isOfficialEditOpen} onClose={() => setIsOfficialEditOpen(false)} size="lg" backdropWhite>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const s = student;
                            const changes: Record<string, { oldValue: string; newValue: string }> = {};
                            const fields: Array<keyof typeof officialEditForm> = ['name', 'indexNumber', 'gender', 'aggregate', 'residence', 'programme'];
                            fields.forEach((field) => {
                                const oldVal = String((s as any)[field] ?? '');
                                const newVal = String(officialEditForm[field] ?? '');
                                if (newVal.trim() && newVal.trim() !== oldVal.trim()) {
                                    changes[field] = { oldValue: oldVal, newValue: newVal };
                                }
                            });

                            if (!Object.keys(changes).length) {
                                window.alert('No changes detected. Please update at least one field before submitting.');
                                return;
                            }
                            if (!officialEditEvidence) {
                                window.alert('Please upload a supporting document (e.g., placement form, ID card) as evidence.');
                                return;
                            }

                            const key = `officialEditRequest_${s.schoolId}_${s.indexNumber}`;
                            const request = {
                                schoolId: s.schoolId,
                                admissionId: s.admissionId,
                                indexNumber: s.indexNumber,
                                name: s.name,
                                requestedAt: new Date().toISOString(),
                                status: officialEditSettings.autoApproveOfficialEdits ? 'approved' : 'pending',
                                changes,
                                reason: officialEditForm.reason,
                                evidence: officialEditEvidence,
                            };

                            try {
                                setLocalStorageAndNotify(key, request);
                            } catch {
                                localStorage.setItem(key, JSON.stringify(request));
                            }

                            if (officialEditSettings.autoApproveOfficialEdits) {
                                try {
                                    const studentsRaw = localStorage.getItem('admin_students');
                                    const list: AdminStudent[] = safeJsonParse<AdminStudent[]>(studentsRaw, []);
                                    const idx = list.findIndex(
                                        (st) => st.indexNumber === s.indexNumber && st.schoolId === s.schoolId && st.admissionId === s.admissionId
                                    );
                                    if (idx !== -1) {
                                        const updated = { ...list[idx] };
                                        if (changes.name) updated.name = changes.name.newValue;
                                        if (changes.gender) updated.gender = changes.gender.newValue as any;
                                        if (changes.aggregate) updated.aggregate = changes.aggregate.newValue;
                                        if (changes.residence) updated.residence = changes.residence.newValue as any;
                                        if (changes.programme) updated.programme = changes.programme.newValue;
                                        if (changes.indexNumber) updated.indexNumber = changes.indexNumber.newValue;
                                        list[idx] = updated;
                                        setLocalStorageAndNotify('admin_students', list);
                                    }
                                } catch {
                                    // ignore
                                }
                                setCorrectionSuccessModal({ title: 'Correction applied', message: 'Your correction has been applied to your record.' });
                            } else {
                                setCorrectionSuccessModal({ title: 'Request submitted', message: 'Your correction request has been submitted and is awaiting approval.' });
                            }

                            setIsOfficialEditOpen(false);
                        }}
                        className="space-y-3 sm:space-y-4 text-left px-0 sm:px-1 min-w-0 w-full"
                    >
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 text-center">Corrections to Official School Records Request</h2>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            Correct any incorrect fields and upload a clear photo or scanned copy of an official document that verifies the correct information.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={officialEditForm.name}
                                    onChange={(e) => setOfficialEditForm((f) => ({ ...f, name: e.target.value.toUpperCase() }))}
                                    className="w-full px-3 py-2 rounded-lg border border-logip-border dark:border-dark-border bg-white dark:bg-dark-bg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Index Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={officialEditForm.indexNumber}
                                    onChange={(e) => setOfficialEditForm((f) => ({ ...f, indexNumber: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-logip-border dark:border-dark-border bg-white dark:bg-dark-bg text-sm font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Gender <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    value={officialEditForm.gender}
                                    onChange={(e) => setOfficialEditForm((f) => ({ ...f, gender: e.target.value }))}
                                    placeholder="Select"
                                >
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Aggregate <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={officialEditForm.aggregate}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, '');
                                        if (raw.length === 0) {
                                            setOfficialEditForm((f) => ({ ...f, aggregate: '' }));
                                            return;
                                        }
                                        if (raw.length === 1) {
                                            if (raw === '0') {
                                                setOfficialEditForm((f) => ({ ...f, aggregate: '0' }));
                                                return;
                                            }
                                            if (['6', '7', '8', '9'].includes(raw)) {
                                                setOfficialEditForm((f) => ({ ...f, aggregate: '0' + raw }));
                                                return;
                                            }
                                        }
                                        setOfficialEditForm((f) => ({ ...f, aggregate: raw }));
                                    }}
                                    placeholder="e.g. 06 or 60"
                                    className="w-full px-3 py-2 rounded-lg border border-logip-border dark:border-dark-border bg-white dark:bg-dark-bg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Residence <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    value={officialEditForm.residence}
                                    onChange={(e) => setOfficialEditForm((f) => ({ ...f, residence: e.target.value }))}
                                    placeholder="Select"
                                >
                                    <option value="">Select</option>
                                    <option value="Boarding">Boarding</option>
                                    <option value="Day">Day</option>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Programme <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    value={officialEditForm.programme}
                                    onChange={(e) => setOfficialEditForm((f) => ({ ...f, programme: e.target.value }))}
                                    placeholder="Select"
                                >
                                    <option value="">Select</option>
                                    <option value="General Science">General Science</option>
                                    <option value="General Arts">General Arts</option>
                                    <option value="Visual Arts">Visual Arts</option>
                                    <option value="Business">Business</option>
                                    <option value="Home Economics">Home Economics</option>
                                    <option value="Agricultural Science">Agricultural Science</option>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Upload supporting document (eg. Birth Cert, NHIA, Ghana Card, Placement form, Result Slip) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) {
                                        setOfficialEditEvidence(null);
                                        return;
                                    }
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                        setOfficialEditEvidence({ name: file.name, dataUrl: String(reader.result || '') });
                                    };
                                    reader.readAsDataURL(file);
                                }}
                                className="block w-full text-sm text-gray-700 dark:text-gray-300"
                            />
                            {officialEditEvidence && (
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Selected: {officialEditEvidence.name}
                                </p>
                            )}
                        </div>

                        <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                            <button
                                type="button"
                                onClick={() => setIsOfficialEditOpen(false)}
                                className="w-full py-3 sm:py-2.5 px-4 text-sm font-semibold rounded-lg border border-logip-border dark:border-dark-border text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-dark-bg min-h-[44px] touch-manipulation"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="w-full py-3 sm:py-2.5 px-4 text-sm font-semibold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover shadow-md min-h-[44px] touch-manipulation"
                            >
                                Submit
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
            {correctionSuccessModal && (
                <Modal isOpen={true} onClose={() => setCorrectionSuccessModal(null)}>
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-5"><Icon name="check_circle" className="w-10 h-10 text-emerald-600 dark:text-emerald-400" /></div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{correctionSuccessModal.title}</h2>
                        <div className="mt-4 text-base text-gray-600 dark:text-gray-300 leading-relaxed text-center">{correctionSuccessModal.message}</div>
                        <button onClick={() => setCorrectionSuccessModal(null)} className="mt-8 w-full py-2 px-4 text-base font-semibold rounded-lg text-white bg-logip-primary hover:bg-logip-primary-hover">OK</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default PaymentGateway;
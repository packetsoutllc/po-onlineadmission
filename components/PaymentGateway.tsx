import React, { useState, useEffect, useMemo } from 'react';
import { Student } from './StudentDetails';
import { setLocalStorageAndNotify } from '../utils/storage';
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

// Redesigned for strict left alignment
const SummaryItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex flex-col py-1.5 border-b border-white/5 last:border-0 items-start">
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-semibold text-white truncate w-full mt-0.5">{value}</span>
    </div>
);

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
    const [momoNumber, setMomoNumber] = useState('');
    const [notificationNumber, setNotificationNumber] = useState('');
    const [isSameNumber, setIsSameNumber] = useState(true); 
    const [network, setNetwork] = useState('mtn');
    const [selectedGatewayId, setSelectedGatewayId] = useState<string>('');

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
        return JSON.parse(raw);
    }, [student.schoolId, student.admissionId]);

    const activeGateways = useMemo(() => {
        return (financialsSettings.gateways || []).filter((gw: GatewayConfig) => gw.enabled);
    }, [financialsSettings]);

    const applicationList = financialsSettings.applicationList || [];
    const voucherPrice = customPrice || financialsSettings.voucherPrice || '50';

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

        setTimeout(() => {
            const credentialsKey = `credentials_${student.schoolId}_${student.indexNumber}`;
            const existingCredentialsRaw = localStorage.getItem(credentialsKey);
            
            let credentials = null;
            if (existingCredentialsRaw) {
                credentials = JSON.parse(existingCredentialsRaw);
            } else {
                // Generation logic for ANY successful payment if missing
                const admissionSettingsKey = `admissionSettings_${student.schoolId}_${student.admissionId}`;
                const settingsRaw = localStorage.getItem(admissionSettingsKey);
                const settings: Partial<AdmissionSettings> = settingsRaw ? JSON.parse(settingsRaw) : {};

                const serialNumber = generateCredential(settings.serialNumberLength || 10, settings.serialNumberFormat);
                const pin = generateCredential(settings.pinLength || 5, settings.pinFormat);
                
                credentials = { serialNumber, pin };
                setLocalStorageAndNotify(credentialsKey, credentials);
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
            if (isInitialVoucherPayment) {
                setLocalStorageAndNotify(`paymentStatus_${student.schoolId}_${student.indexNumber}`, { paid: true });
            } else {
                setLocalStorageAndNotify(`paymentStatus_docAccess_${student.schoolId}_${student.indexNumber}`, { paid: true });
            }
            
            setLocalStorageAndNotify(`smsNotificationNumber_${student.schoolId}_${student.indexNumber}`, notificationNumber);
            
            // Sync status with AdminStudent list
            const studentsRaw = localStorage.getItem('admin_students');
            let studentsList: AdminStudent[] = studentsRaw ? JSON.parse(studentsRaw) : [];
            
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

    const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="relative flex flex-col lg:flex-row min-h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden animate-scaleIn font-display text-left">
            {/* Beautiful Close Button */}
            {onClose && (
                <button 
                    onClick={onClose}
                    className="absolute top-5 right-5 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-gray-500 hover:text-black transition-all transform active:scale-90"
                    aria-label="Close Checkout"
                >
                    <span className="material-symbols-outlined text-2xl">close</span>
                </button>
            )}

            {/* Left side: Student Info Panel */}
            <div className="lg:w-1/2 bg-[#1A1F36] p-6 sm:p-8 flex flex-col text-white relative">
                <div className="relative z-10 flex-grow">
                    {/* Student Profile Header */}
                    <div className="flex items-center gap-3.5 mb-6 pt-1">
                        <div className="w-11 h-11 flex-shrink-0 rounded-xl bg-gradient-to-br from-logip-primary to-indigo-600 flex items-center justify-center text-sm font-normal shadow-xl border border-white/10">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-lg font-normal truncate leading-tight uppercase tracking-tight text-left">{student.name}</h4>
                            <p className="text-[11px] text-white/50 font-normal mt-0.5 text-left">Index: {student.indexNumber}</p>
                        </div>
                    </div>

                    {/* Summary Card - Strictly left aligned */}
                    <div className="space-y-4 mb-8 bg-[#232942] p-5 rounded-xl border border-white/5 shadow-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <SummaryItem label="Programme" value={student.programme} />
                            <SummaryItem label="Gender" value={student.gender} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <SummaryItem label="Residence" value={student.residence} />
                            <SummaryItem label="Aggregate" value={student.aggregate} />
                        </div>
                    </div>

                    {/* Included List */}
                    <div className="px-0.5 text-left">
                        <h5 className="text-[11px] font-bold text-white/30 tracking-[0.2em] mb-4 uppercase text-left">What you are paying for</h5>
                        <ul className="space-y-3">
                            {applicationList.map((item, idx) => (
                                <li key={item} className="flex items-center gap-3 animate-slideInUp" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-emerald-400 text-[10px] font-black">check</span>
                                    </div>
                                    <span className="text-[13px] text-white/70 font-medium leading-tight">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                
                {/* Total Fee Footer */}
                <div className="relative z-10 pt-5 mt-8 border-t border-white/5 mb-1 text-left">
                    <div className="flex flex-col gap-1.5 items-start">
                        <div className="flex items-baseline gap-2 whitespace-nowrap">
                            <span className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">Total:</span>
                            <span className="text-3xl font-black text-white tracking-tighter">GH¢ {voucherPrice}.00</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-lg inline-block border border-emerald-500/20 shadow-sm">Secure Payment Gate</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side: Payment Details Panel */}
            <div className="lg:w-1/2 p-6 sm:p-8 flex flex-col bg-white text-left">
                <div className="flex justify-between items-start mb-6">
                    <div className="min-w-0 flex-1 text-left">
                        <h2 className="text-2xl font-black text-black tracking-tight leading-tight text-left">{customTitle || "Payment Checkout"}</h2>
                        <p className="text-[13px] font-medium text-gray-500 mt-1 text-left leading-relaxed">{customSubtitle || "Securely complete your transaction using mobile money."}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-grow flex flex-col text-left">
                    <div className="space-y-6">
                        {/* Payment Gateway */}
                        <div className="text-left">
                            <label htmlFor="gateway" className="block text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 text-left">Gateway Provider</label>
                            <div className="relative">
                                <select 
                                    id="gateway" 
                                    value={selectedGatewayId} 
                                    onChange={(e) => setSelectedGatewayId(e.target.value)}
                                    className="appearance-none rounded-xl block w-full px-4 py-3 bg-gray-50 border border-gray-100 text-black font-bold focus:outline-none focus:ring-2 focus:ring-logip-primary/10 focus:border-logip-primary transition-all text-sm shadow-sm"
                                >
                                    {activeGateways.map(gw => (
                                        <option key={gw.id} value={gw.id}>{gw.label}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                    <span className="material-symbols-outlined text-xl font-normal">expand_more</span>
                                </div>
                            </div>
                        </div>

                        {/* Select Payment Network */}
                        <div className="text-left">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 text-left">Select Network</label>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.entries(NETWORKS).map(([key, value]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setNetwork(key)}
                                        className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl border-2 transition-all group ${network === key ? 'border-logip-primary bg-blue-50/50 shadow-md' : 'border-gray-50 hover:border-gray-200 bg-gray-50/30'}`}
                                    >
                                        <div className="transform transition-transform mb-2 scale-110">
                                            {value.icon}
                                        </div>
                                        <span className={`text-[11px] font-black text-center leading-tight tracking-widest uppercase ${network === key ? 'text-logip-primary' : 'text-gray-400'}`}>
                                            {value.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Fields */}
                        <div className="grid grid-cols-1 gap-5 text-left">
                            <div>
                                <label htmlFor="momo-number" className="block text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 text-left">
                                    MOMO wallet <span className="text-red-500 font-normal">*</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-logip-primary transition-colors">
                                        <span className="material-symbols-outlined text-xl font-normal">account_balance_wallet</span>
                                    </div>
                                    <input 
                                        id="momo-number" 
                                        type="tel" 
                                        required 
                                        value={momoNumber}
                                        onChange={(e) => setMomoNumber(e.target.value)}
                                        className="appearance-none rounded-xl block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 placeholder-gray-300 text-black font-bold focus:outline-none focus:ring-2 focus:ring-logip-primary/10 focus:border-logip-primary transition-all text-sm shadow-sm"
                                        placeholder="024 XXX XXXX" 
                                        maxLength={10} 
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="notification-number" className="block text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 text-left">
                                    Notification SMS <span className="text-red-500 font-normal">*</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-logip-primary transition-colors">
                                        <span className="material-symbols-outlined text-xl font-normal">sms</span>
                                    </div>
                                    <input 
                                        id="notification-number" 
                                        type="tel" 
                                        required 
                                        disabled={isSameNumber} 
                                        value={isSameNumber ? momoNumber : notificationNumber}
                                        onChange={(e) => setNotificationNumber(e.target.value)}
                                        className="appearance-none rounded-xl block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 placeholder-gray-300 text-black font-bold focus:outline-none focus:ring-2 focus:ring-logip-primary/10 focus:border-logip-primary transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
                                        placeholder="024 XXX XXXX" 
                                        maxLength={10} 
                                    />
                                </div>
                                <div className="mt-3 pl-1 text-left">
                                    <label className="flex items-center gap-3 cursor-pointer select-none group w-fit">
                                        <div className="relative flex items-center justify-center w-5 h-5">
                                            <input
                                                type="checkbox"
                                                checked={isSameNumber}
                                                onChange={(e) => handleSameNumberChange(e.target.checked)}
                                                className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-200 transition-all checked:bg-logip-primary checked:border-logip-primary"
                                            />
                                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                                </svg>
                                            </span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-500 group-hover:text-black transition-colors uppercase tracking-widest">Same as MOMO number</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Section */}
                    <div className="mt-auto pt-10 text-left">
                        <button 
                            type="submit" 
                            disabled={isLoading || !momoNumber || momoNumber.length < 10} 
                            className="w-full h-14 flex justify-center items-center gap-3 py-2 px-8 text-base font-black rounded-2xl text-white bg-logip-primary hover:bg-logip-primary-hover transform transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-logip-primary/10 shadow-xl shadow-logip-primary/20 disabled:opacity-80 disabled:cursor-not-allowed enabled:hover:-translate-y-1 uppercase tracking-widest"
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <span className="material-symbols-outlined font-normal text-xl">lock</span>
                            )}
                            {isLoading ? 'SECURELY PROCESSING...' : `MAKE PAYMENT NOW`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentGateway;
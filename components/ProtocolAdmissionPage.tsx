import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from './Modal';
import { FormField, Input, Select } from './FormControls';
import { useLocalStorage } from './hooks/useLocalStorage';
import { AdminStudent, initialAdminStudents } from './admin/pages/StudentsPage';
import { Admission, initialAdmissions, School, initialSchools } from './admin/pages/SettingsPage';
import { AdmissionSettings } from './admin/pages/SecuritySettingsTab';
import NotificationPreviewModal from './admin/shared/NotificationPreviewModal';
import VideoPreviewModal from './admin/shared/VideoPreviewModal';

const isNotificationActive = (notif: any, admissionId: string, type: 'scrolling' | 'popup' | 'video', currentPage: string) => {
    if (!notif || !notif.enabled) return false;
    if (notif.targetPages && !notif.targetPages.includes('all') && !notif.targetPages.includes(currentPage)) return false;
    const now = new Date();
    if (notif.startTime && new Date(notif.startTime) > now) return false;
    if (notif.endTime && new Date(notif.endTime) < now) return false;
    if (notif.frequency === 'once') {
        const sessionKey = `${type}_shown_${currentPage}_${admissionId}`;
        if (sessionStorage.getItem(sessionKey)) return false;
    }
    return true;
};

const updateFaviconForSchool = (school?: School | null) => {
    if (!school?.logo) return;
    if (typeof document === 'undefined') return;
    try {
        const head = document.head || document.getElementsByTagName('head')[0];
        if (!head) return;

        const existingIcons = head.querySelectorAll("link[rel*='icon']");
        existingIcons.forEach(el => head.removeChild(el));

        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = school.logo;
        head.appendChild(link);
    } catch (e) {
        // Silently ignore favicon update errors
    }
};

interface ProtocolAdmissionPageProps {
  onReturnToVerification: () => void;
  schoolSlug?: string;
  admissionSlug?: string;
}

const ProtocolAdmissionPage: React.FC<ProtocolAdmissionPageProps> = ({ onReturnToVerification, schoolSlug, admissionSlug }) => {
    const [formData, setFormData] = useState({
        name: '',
        indexNumber: '',
        phoneNumber: '',
        parentContact: '',
        currentSchoolPlaced: '',
        gender: '' as 'Male' | 'Female' | '',
        aggregate: '',
        residence: '' as 'Boarding' | 'Day' | '',
        programme: '',
    });
    const [isNoneChecked, setIsNoneChecked] = useState(false);
    const [isFinalConfirmed, setIsFinalConfirmed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [indexError, setIndexError] = useState('');

    const [adminStudents, setAdminStudents] = useLocalStorage<AdminStudent[]>('admin_students', initialAdminStudents);
    const [admissions] = useLocalStorage<Admission[]>('admin_admissions', initialAdmissions);
    const [schools] = useLocalStorage<School[]>('admin_schools', initialSchools);

    // Determine active school/admission based on slugs, with fallback to defaults
    const activeSchool = useMemo(() => {
        if (schoolSlug) {
            const bySlug = schools.find(s => s.slug === schoolSlug);
            if (bySlug) {
                document.title = `${bySlug.name} - Online Admission Portal`;
                updateFaviconForSchool(bySlug);
                return bySlug;
            }
        }
        const fallback = schools.find(s => s.id === 's1') || null;
        if (fallback) {
            document.title = `${fallback.name} - Online Admission Portal`;
            updateFaviconForSchool(fallback);
        }
        return fallback;
    }, [schools, schoolSlug]);

    const activeAdmission = useMemo(() => {
        if (!activeSchool) return null;
        if (admissionSlug) {
            const bySlug = admissions.find(a => a.schoolId === activeSchool.id && a.slug === admissionSlug);
            if (bySlug) return bySlug;
        }
        // Fallback to first active admission for that school, or any admission
        return (
            admissions.find(a => a.schoolId === activeSchool.id && a.status === 'Active') ||
            admissions.find(a => a.schoolId === activeSchool.id) ||
            null
        );
    }, [admissions, activeSchool, admissionSlug]);

    const ACTIVE_SCHOOL_ID = activeSchool?.id || 's1';
    const ACTIVE_ADMISSION_ID = activeAdmission?.id || 'a1';

    const getInitialNotification = (type: 'scrolling' | 'popup' | 'video') => {
        const key = `notification_${type}_${ACTIVE_SCHOOL_ID}_${ACTIVE_ADMISSION_ID}`;
        const raw = localStorage.getItem(key);
        if (raw) {
            const data = JSON.parse(raw);
            if (isNotificationActive(data, ACTIVE_ADMISSION_ID, type, 'protocol_admission')) return data;
        }
        return null;
    };

    const [scrollingBanner, setScrollingBanner] = useState<any | null>(() => getInitialNotification('scrolling'));
    const [popupBanner, setPopupBanner] = useState<any | null>(() => getInitialNotification('popup'));
    const [videoNotification, setVideoNotification] = useState<any | null>(() => getInitialNotification('video'));
    const [isPopupBannerVisible, setIsPopupBannerVisible] = useState(() => !!getInitialNotification('popup'));
    const [isVideoNotificationVisible, setIsVideoNotificationVisible] = useState(() => !!getInitialNotification('video'));

    useEffect(() => {
        if (popupBanner && popupBanner.frequency === 'once') sessionStorage.setItem(`popup_shown_protocol_admission_${ACTIVE_ADMISSION_ID}`, 'true');
        if (videoNotification && videoNotification.frequency === 'once') sessionStorage.setItem(`video_shown_protocol_admission_${ACTIVE_ADMISSION_ID}`, 'true');
        if (scrollingBanner && scrollingBanner.frequency === 'once') sessionStorage.setItem(`scrolling_shown_protocol_admission_${ACTIVE_ADMISSION_ID}`, 'true');
    }, [popupBanner, videoNotification, scrollingBanner]);

    const admissionSettingsKey = `admissionSettings_${ACTIVE_SCHOOL_ID}_${ACTIVE_ADMISSION_ID}`;
    const [admissionSettings] = useLocalStorage<AdmissionSettings | null>(admissionSettingsKey, null);

    useEffect(() => {
        const scrollingKey = `notification_scrolling_${ACTIVE_SCHOOL_ID}_${ACTIVE_ADMISSION_ID}`;
        const popupKey = `notification_popup_${ACTIVE_SCHOOL_ID}_${ACTIVE_ADMISSION_ID}`;
        const videoKey = `notification_video_${ACTIVE_SCHOOL_ID}_${ACTIVE_ADMISSION_ID}`;
        const checkNotifications = () => {
            const scroll = getInitialNotification('scrolling');
            const popup = getInitialNotification('popup');
            const video = getInitialNotification('video');
            setScrollingBanner(scroll);
            setPopupBanner(popup);
            setIsPopupBannerVisible(!!popup);
            setVideoNotification(video);
            setIsVideoNotificationVisible(!!video);
        };
        const handleStorageChange = (e: StorageEvent) => { if (e.key === scrollingKey || e.key === popupKey || e.key === videoKey) checkNotifications(); };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);
    
    const { indexHint = '' } = activeAdmission || {};
    const requiredEnding = useMemo(() => { if (!indexHint) return null; const match = indexHint.match(/(\d+)$/); return match ? match[1] : null; }, [indexHint]);
    const inlineHint = useMemo(() => { if (!indexHint) return null; const exampleLine = indexHint.split('\n').find(line => line.toLowerCase().startsWith('example:')); return exampleLine || null; }, [indexHint]);

    const isLocked = isFinalConfirmed;

    const handleNoneToggle = (checked: boolean) => {
        if (isLocked) return;
        setIsNoneChecked(checked);
        setFormData(prev => ({ ...prev, currentSchoolPlaced: checked ? 'None' : '' }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (isLocked) return;
        let { name, value } = e.target;
        if (name === 'phoneNumber' || name === 'parentContact') {
            if (value !== '' && !/^\d*$/.test(value)) return;
            if (value.length > 10) return;
            if (value.length === 1 && value !== '0') value = '0' + value;
        }
        if (name === 'indexNumber') if (value.length > 12) return;
        if (name === 'currentSchoolPlaced') value = value.replace(/(^|\s)\S/g, (char) => char.toUpperCase());
        setFormData(prev => ({ ...prev, [name]: name === 'name' ? value.toUpperCase() : value as any, }));
        if (name === 'indexNumber') {
            if (!requiredEnding) { setIndexError(''); return; }
            if (value.length > 0 && value.length !== 12) setIndexError('Index number must be exactly 12 digits.');
            else if (value.length === 12 && !value.endsWith(requiredEnding)) setIndexError(`Index number must end with '${requiredEnding}'.`);
            else setIndexError('');
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (isLocked) return;
        const { name, value } = e.target;
        if (name === 'aggregate') {
            const numVal = parseInt(value, 10);
            if (!isNaN(numVal) && numVal < 6) { setFormData(prev => ({ ...prev, aggregate: '' })); return; }
            if (value.length === 1 && /^\d$/.test(value)) setFormData(prev => ({ ...prev, aggregate: `0${value}` }));
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsConfirmModalOpen(true);
    };

    const handleConfirmSubmit = () => {
        setIsConfirmModalOpen(false);
        setIsLoading(true);
        setTimeout(() => {
            const existingStudent = adminStudents.find(
                student =>
                    student.indexNumber === formData.indexNumber &&
                    student.schoolId === ACTIVE_SCHOOL_ID &&
                    student.admissionId === ACTIVE_ADMISSION_ID
            );
            if (existingStudent) { setIsLoading(false); setIsDuplicateModalOpen(true); return; }

            // FIXED: Protocol status is assigned 'Pending' by default
            const newStatus = 'Pending';
            const newProtocolStudent: AdminStudent = {
                id: `proto_${Date.now()}`,
                ...formData,
                schoolId: ACTIVE_SCHOOL_ID,
                admissionId: ACTIVE_ADMISSION_ID,
                status: newStatus,
                classId: '',
                houseId: '',
                feeStatus: 'Unpaid',
                admissionDate: new Date().toISOString(),
                paymentDate: null,
                isProtocol: true,
                gender: formData.gender as 'Male' | 'Female',
                residence: formData.residence as 'Boarding' | 'Day',
                parentContact: formData.parentContact,
                currentSchoolPlaced: formData.currentSchoolPlaced
            };
            setAdminStudents(prevStudents => [...prevStudents, newProtocolStudent]);
            setIsLoading(false);
            setIsSuccessModalOpen(true);
        }, 1500);
    };

    const handleFinish = () => {
        setIsSuccessModalOpen(false);
        onReturnToVerification();
    };

    const PROGRAMME_OPTIONS = ['General Science', 'General Arts', 'Visual Arts', 'Business', 'Home Economics', 'Agricultural Science'];
    const isPhoneValid = /^0\d{9}$/.test(formData.phoneNumber);
    const isParentContactValid = /^0\d{9}$/.test(formData.parentContact);
    const isIndexLengthValid = formData.indexNumber.length === 12;
    const isIndexValid = !indexError && isIndexLengthValid;
    const isAggregateValid = !formData.aggregate || (parseInt(formData.aggregate) >= 6);
    const isValid = formData.name && isIndexValid && isPhoneValid && isParentContactValid && formData.currentSchoolPlaced && formData.aggregate && isAggregateValid && isFinalConfirmed && formData.gender && formData.residence && formData.programme;
    const scrollingSpeed = useMemo(() => `${scrollingBanner?.speed || 25}s`, [scrollingBanner]);

    return (
        <>
            <style>{`@keyframes logip-marquee { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-100%, 0, 0); } }`}</style>
            {scrollingBanner && (
                <div className={`fixed ${scrollingBanner.position === 'top' ? 'top-0' : 'bottom-0'} left-0 w-full h-12 z-[150] overflow-hidden flex items-center shadow-md`} style={{ backgroundColor: scrollingBanner.backgroundColor }}>
                    <p className="whitespace-nowrap flex-shrink-0 inline-block" style={{ color: scrollingBanner.textColor, paddingLeft: '100%', animation: `logip-marquee ${scrollingSpeed} linear infinite`, fontSize: `${scrollingBanner.fontSize || 14}px`, fontWeight: scrollingBanner.isBold ? 'bold' : 'normal', fontStyle: scrollingBanner.isItalic ? 'italic' : 'normal', willChange: 'transform' }}>{scrollingBanner.text}</p>
                </div>
            )}
            {isPopupBannerVisible && popupBanner && (
              <NotificationPreviewModal isOpen={true} onClose={() => setIsPopupBannerVisible(false)} title={popupBanner.title} message={popupBanner.message} icon={popupBanner.icon} iconColor={popupBanner.iconColor} textColor={popupBanner.textColor} style={popupBanner.popupStyle || 'standard'} image={popupBanner.popupImage} />
            )}
            {isVideoNotificationVisible && videoNotification && (
              <VideoPreviewModal isOpen={true} onClose={() => setIsVideoNotificationVisible(false)} url={videoNotification.url} autoplay={videoNotification.autoplay} isDraggable={true} />
            )}

            <div className="relative">
                <button onClick={onReturnToVerification} className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all z-20" aria-label="Close and return"><span className="material-symbols-outlined text-2xl">close</span></button>
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mt-4">Protocol Admission Request</h1>
                    <p className="text-base text-gray-500 dark:text-gray-400 mt-4">Fill in your details below to submit a protocol admission request for review.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="Full Name"><Input name="name" value={formData.name} onChange={handleChange} required placeholder="Enter your full name" disabled={isLocked} /></FormField>
                            <FormField label={<div className="flex items-center justify-between w-full"><span>Which SHS were you placed</span><label className={`flex items-center gap-1.5 ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} select-none group`}><div className="relative flex items-center"><input type="checkbox" checked={isNoneChecked} onChange={(e) => handleNoneToggle(e.target.checked)} disabled={isLocked} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 dark:border-gray-600 transition-all checked:bg-logip-primary checked:border-logip-primary dark:checked:bg-logip-primary disabled:opacity-50 disabled:cursor-not-allowed"/><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg></span></div><span className="text-xs font-bold text-gray-400 group-hover:text-gray-600 transition-colors tracking-wider">None</span></label></div>}><Input name="currentSchoolPlaced" value={formData.currentSchoolPlaced} onChange={handleChange} required disabled={isLocked || isNoneChecked} placeholder={isNoneChecked ? "None" : "Enter the school you were placed in"} /></FormField>
                        </div>
                        <FormField label="BECE Index Number">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3"><Input name="indexNumber" value={formData.indexNumber} onChange={handleChange} required placeholder="Enter your index number" className="flex-grow" disabled={isLocked} />{inlineHint && <p className="text-sm text-red-500 whitespace-nowrap flex-shrink-0 font-medium">{inlineHint}</p>}</div>
                            {indexError && <p className="text-xs text-red-500 mt-1 animate-fadeIn">{indexError}</p>}
                            {!isIndexLengthValid && formData.indexNumber.length > 0 && !indexError && <p className="text-xs text-red-500 mt-1 animate-fadeIn">Must be exactly 12 digits</p>}
                        </FormField>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField label="Phone Number"><Input name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} required placeholder="024..." disabled={isLocked} />{!isPhoneValid && formData.phoneNumber.length > 0 && <p className="text-xs text-red-500 mt-1 animate-fadeIn">10 digits starting with 0</p>}</FormField>
                            <FormField label="Guardian Contact"><Input name="parentContact" type="tel" value={formData.parentContact} onChange={handleChange} required placeholder="024..." disabled={isLocked} />{!isParentContactValid && formData.parentContact.length > 0 && <p className="text-xs text-red-500 mt-1 animate-fadeIn">10 digits starting with 0</p>}</FormField>
                            <FormField label="Gender"><Select name="gender" value={formData.gender} onChange={handleChange} disabled={isLocked}><option value="">Select an option</option><option value="Male">Male</option><option value="Female">Female</option></Select></FormField>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <FormField label="Programme"><Select name="programme" value={formData.programme} onChange={handleChange} disabled={isLocked}><option value="">Select an option</option>{PROGRAMME_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}</Select></FormField>
                            <FormField label="Aggregate"><Input name="aggregate" value={formData.aggregate} onChange={handleChange} onBlur={handleBlur} required placeholder="e.g., 15" disabled={isLocked}/>{!isAggregateValid && formData.aggregate.length > 0 && <p className="text-xs text-red-500 mt-1 animate-fadeIn">Must be 06 or higher</p>}</FormField>
                            <FormField label="Residence"><Select name="residence" value={formData.residence} onChange={handleChange} disabled={isLocked}><option value="">Select an option</option><option value="Boarding">Boarding</option><option value="Day">Day</option></Select></FormField>
                        </div>
                    </div>
                    <div className="pt-4 space-y-6">
                        <div className="bg-logip-upgrade-bg dark:bg-logip-primary/10 rounded-lg p-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <div className="relative flex items-center mt-1"><input type="checkbox" checked={isFinalConfirmed} onChange={(e) => setIsFinalConfirmed(e.target.checked)} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 dark:border-gray-600 transition-all checked:bg-logip-primary checked:border-logip-primary dark:checked:bg-logip-primary"/><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg></span></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">I confirm that all information provided on this form is accurate and a true representation of the applicant. I also acknowledge that the school reserves the right to approve or decline my protocol request.</span>
                            </label>
                        </div>
                        <button type="submit" disabled={isLoading || !isValid} className="w-full flex justify-center py-2.5 px-4 text-lg font-bold rounded-lg text-white bg-logip-primary hover:bg-logip-primary-hover transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed shadow-md">{isLoading ? 'Submitting...' : 'Submit Request'}</button>
                    </div>
                </form>
            </div>
            <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} size="xl">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-5"><span className="material-symbols-outlined text-4xl text-yellow-500">warning</span></div>
                    <h2 id="modal-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100">Confirm Your Details</h2>
                    <p className="mt-4 text-base text-gray-600 dark:text-gray-300 leading-relaxed text-left w-full">Please double-check the following information before submitting:</p>
                    <dl className="mt-4 w-full text-left space-y-2 text-base bg-gray-100 dark:bg-gray-800/50 p-8 rounded-lg">
                        <div className="flex justify-between"><dt className="text-gray-500">Full Name:</dt><dd className="font-semibold text-gray-900 dark:text-gray-100">{formData.name}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500">Index Number:</dt><dd className="font-semibold text-gray-900 dark:text-gray-100">{formData.indexNumber}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500">Phone Number:</dt><dd className="font-semibold text-gray-900 dark:text-gray-100">{formData.phoneNumber}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500">Guardian Contact:</dt><dd className="font-semibold text-gray-900 dark:text-gray-100">{formData.parentContact}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500">Which SHS were you placed:</dt><dd className="font-semibold text-gray-900 dark:text-gray-100">{formData.currentSchoolPlaced}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500">Gender:</dt><dd className="font-semibold text-gray-900 dark:text-gray-100">{formData.gender}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500">Aggregate:</dt><dd className="font-semibold text-gray-900 dark:text-gray-100">{formData.aggregate}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500">Residence:</dt><dd className="font-semibold text-gray-900 dark:text-gray-100">{formData.residence}</dd></div>
                        <div className="flex justify-between"><dt className="text-gray-500">Programme:</dt><dd className="font-semibold text-gray-900 dark:text-gray-100">{formData.programme}</dd></div>
                    </dl>
                    <div className="mt-8 w-full flex items-center gap-4"><button onClick={() => setIsConfirmModalOpen(false)} type="button" className="w-full py-2 px-4 text-base font-semibold rounded-lg text-gray-900 dark:text-gray-300 bg-transparent hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-gray-300 dark:border-gray-600 transition-colors">Go Back & Edit</button><button onClick={handleConfirmSubmit} type="button" className="w-full py-2 px-4 text-base font-semibold rounded-lg text-white bg-logip-primary hover:bg-logip-primary-hover">Confirm & Submit</button></div>
                </div>
            </Modal>
            <Modal isOpen={isDuplicateModalOpen} onClose={() => setIsDuplicateModalOpen(false)}>
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-5"><span className="material-symbols-outlined text-4xl text-red-500">error</span></div>
                    <h2 id="modal-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100">Duplicate Entry Detected</h2>
                    <p className="mt-4 text-base text-gray-600 dark:text-gray-300 leading-relaxed">A student with index number <strong>{formData.indexNumber}</strong> already exists in the system.</p>
                    <button onClick={() => setIsDuplicateModalOpen(false)} className="mt-8 w-full py-2 px-4 text-base font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700">Acknowledge</button>
                </div>
            </Modal>
            <Modal isOpen={isSuccessModalOpen} onClose={handleFinish}>
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-5"><span className="material-symbols-outlined text-4xl text-green-500">task_alt</span></div>
                    <h2 id="modal-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100">Request Submitted</h2>
                    <p className="mt-4 text-base text-gray-600 dark:text-gray-300 leading-relaxed">Your protocol admission request has been submitted. You will be notified once it has been approved or declined.</p>
                    <button onClick={handleFinish} className="mt-8 w-full py-2 px-4 text-base font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700">Done</button>
                </div>
            </Modal>
        </>
    );
};

export default ProtocolAdmissionPage;
import React, { useState, useEffect, useMemo } from 'react';
import { Student } from './StudentDetails';
import Modal from './Modal';
import { Admission, School, initialSchools } from './admin/pages/SettingsPage';
import { isNotificationActive } from './AuthForm';
import NotificationPreviewModal from './admin/shared/NotificationPreviewModal';
import VideoPreviewModal from './admin/shared/VideoPreviewModal';
import { useLocalStorage } from './hooks/useLocalStorage';

interface ApplicantLoginFormProps {
  student: Student;
  onLoginSuccess: () => void;
  onClose?: () => void;
}

const ApplicantLoginForm: React.FC<ApplicantLoginFormProps> = ({ student, onLoginSuccess, onClose }) => {
  const [serialNumber, setSerialNumber] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [retrieveCredentials, setRetrieveCredentials] = useState(false);

  // Notification logic
  const getInitialNotification = (type: 'scrolling' | 'popup' | 'video') => {
      if (!student.schoolId || !student.admissionId) return null;
      const key = `notification_${type}_${student.schoolId}_${student.admissionId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
          const data = JSON.parse(raw);
          if (isNotificationActive(data, student.admissionId, type, 'applicant_login')) return data;
      }
      return null;
  };

  const [scrollingBanner, setScrollingBanner] = useState<any | null>(() => getInitialNotification('scrolling'));
  const [popupBanner, setPopupBanner] = useState<any | null>(() => getInitialNotification('popup'));
  const [videoNotification, setVideoNotification] = useState<any | null>(() => getInitialNotification('video'));
  const [isPopupBannerVisible, setIsPopupBannerVisible] = useState(() => !!getInitialNotification('popup'));
  const [isVideoNotificationVisible, setIsVideoNotificationVisible] = useState(() => !!getInitialNotification('video'));

  const [schools] = useLocalStorage<School[]>('admin_schools', initialSchools);
  const activeSchool = useMemo(
    () => schools.find((s) => s.id === student.schoolId) || null,
    [schools, student.schoolId]
  );

  useEffect(() => {
    if (popupBanner && popupBanner.frequency === 'once') sessionStorage.setItem(`popup_shown_applicant_login_${student.admissionId}`, 'true');
    if (videoNotification && videoNotification.frequency === 'once') sessionStorage.setItem(`video_shown_applicant_login_${student.admissionId}`, 'true');
    if (scrollingBanner && scrollingBanner.frequency === 'once') sessionStorage.setItem(`scrolling_shown_applicant_login_${student.admissionId}`, 'true');
  }, [popupBanner, videoNotification, scrollingBanner, student.admissionId]);

  const scrollingSpeed = useMemo(() => `${scrollingBanner?.speed || 25}s`, [scrollingBanner]);

  const contactInfo = useMemo(() => {
    try {
        const admissionsRaw = localStorage.getItem('admin_admissions');
        const admissions: Admission[] = admissionsRaw ? JSON.parse(admissionsRaw) : [];
        const activeAdmission = admissions.find(a => a.id === student.admissionId);
        return { school: activeAdmission?.headOfSchoolNumber || '0244889791', it: activeAdmission?.headOfItNumber || '0243339546' };
    } catch (e) { return { school: '0244889791', it: '0243339546' }; }
  }, [student.admissionId]);

  const isSubmitted = useMemo(() => {
    try {
      const statusRaw = localStorage.getItem(`submissionStatus_${student.schoolId}_${student.indexNumber}`);
      if (statusRaw) return JSON.parse(statusRaw).submitted === true;
    } catch (e) {}
    return false;
  }, [student.schoolId, student.indexNumber]);

  useEffect(() => {
    if (retrieveCredentials) {
      if (!isSubmitted) {
        try {
          const storedCredentialsRaw = localStorage.getItem(`credentials_${student.schoolId}_${student.indexNumber}`);
          if (storedCredentialsRaw) {
            const storedCredentials = JSON.parse(storedCredentialsRaw);
            setSerialNumber((storedCredentials.serialNumber || '').toUpperCase());
            setPin((storedCredentials.pin || '').toUpperCase());
          } else {
            setError('Credentials not found in system.');
            setRetrieveCredentials(false);
          }
        } catch (err) { setRetrieveCredentials(false); }
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        const logKey = `credential_retrieval_log_${student.schoolId}_${student.indexNumber}`;
        let retrievalLog = { date: '', count: 0 };
        try { const storedLog = localStorage.getItem(logKey); if (storedLog) retrievalLog = JSON.parse(storedLog); } catch (e) {}
        if (retrievalLog.date === todayStr && retrievalLog.count >= 1) { setIsLimitModalOpen(true); setRetrieveCredentials(false); return; }
        setSerialNumber(''); setPin('');
        try {
          const smsNumberRaw = localStorage.getItem(`smsNotificationNumber_${student.schoolId}_${student.indexNumber}`);
          const smsNumber = smsNumberRaw ? JSON.parse(smsNumberRaw) : null;
          if (smsNumber) setInfoMessage(`Credentials have been resent via SMS to ${smsNumber}.`);
          else setInfoMessage('Application is submitted. Credentials sent via SMS.');
          localStorage.setItem(logKey, JSON.stringify({ date: todayStr, count: 1 }));
        } catch (e) { setInfoMessage('Credentials sent via SMS.'); }
        setTimeout(() => { setRetrieveCredentials(false); setInfoMessage(''); }, 5000);
      }
    }
  }, [retrieveCredentials, isSubmitted, student.indexNumber]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setInfoMessage(''); setIsLoading(true);
    try {
        const storedCredentialsRaw = localStorage.getItem(`credentials_${student.schoolId}_${student.indexNumber}`);
        if (!storedCredentialsRaw) { setError('Could not find credentials.'); setIsLoading(false); return; }
        const storedCredentials = JSON.parse(storedCredentialsRaw);
        
        // Case-insensitive comparison
        if (storedCredentials.serialNumber.toUpperCase() === serialNumber.toUpperCase() && 
            storedCredentials.pin.toUpperCase() === pin.toUpperCase()) {
            localStorage.setItem(`student_login_timestamp_${student.schoolId}_${student.indexNumber}`, new Date().getTime().toString());
            onLoginSuccess();
        } else setError('Invalid Serial Number or PIN.');
    } catch (err) { setError('Unexpected error occurred.'); } finally { setIsLoading(false); }
  };

  return (
    <>
        <style>{`@keyframes logip-marquee { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-100%, 0, 0); } }`}</style>
        {scrollingBanner && scrollingBanner.enabled && (
            <div className={`fixed ${scrollingBanner.position === 'top' ? 'top-0' : 'bottom-0'} left-0 w-full h-12 z-[150] overflow-hidden flex items-center shadow-md`} style={{ backgroundColor: scrollingBanner.backgroundColor }}>
                <p className="whitespace-nowrap flex-shrink-0 inline-block" style={{ color: scrollingBanner.textColor, paddingLeft: '100%', animation: `logip-marquee ${scrollingSpeed} linear infinite`, fontSize: `${scrollingBanner.fontSize || 14}px`, fontWeight: scrollingBanner.isBold ? 'bold' : 'normal', fontStyle: scrollingBanner.isItalic ? 'italic' : 'normal', willChange: 'transform' }}>{scrollingBanner.text}</p>
            </div>
        )}
        {isPopupBannerVisible && popupBanner && (
          <NotificationPreviewModal isOpen={true} onClose={() => setIsPopupBannerVisible(false)} title={popupBanner.title} message={popupBanner.message} icon={popupBanner.icon} iconColor={popupBanner.iconColor} textColor={popupBanner.textColor} style={popupBanner.popupStyle} image={popupBanner.popupImage} />
        )}
        {isVideoNotificationVisible && videoNotification && (
          <VideoPreviewModal isOpen={true} onClose={() => setIsVideoNotificationVisible(false)} url={videoNotification.url} autoplay={videoNotification.autoplay} isDraggable />
        )}

        <div>
            <div className="relative mb-8">
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-0 right-0 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-800"
                        aria-label="Close"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                )}
                <div className="text-center">
                    {activeSchool?.logo && (
                        <div className="flex items-center justify-center mb-4">
                            <img
                                src={activeSchool.logo}
                                alt={activeSchool.name}
                                className="h-16 w-auto object-contain"
                            />
                        </div>
                    )}
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">Applicant Login</h1>
                    <p className="text-base text-gray-500 dark:text-gray-400 mt-4">
                        Enter the credentials you received after payment.
                    </p>
                </div>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <div className="relative">
                    <input 
                      id="serial-number" 
                      name="serialNumber" 
                      type="text" 
                      required 
                      className="appearance-none rounded-lg relative block w-full px-4 py-4 border border-input-border-light dark:border-input-border-dark bg-gray-50/50 dark:bg-black/20 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base transition uppercase placeholder:normal-case" 
                      placeholder="Serial Number" 
                      value={serialNumber} 
                      onChange={(e) => setSerialNumber(e.target.value.toUpperCase())} 
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <div className="relative">
                    <input 
                      id="pin" 
                      name="pin" 
                      type="text" 
                      required 
                      className="appearance-none rounded-lg relative block w-full px-4 py-4 border border-input-border-light dark:border-input-border-dark bg-gray-50/50 dark:bg-black/20 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base transition uppercase placeholder:normal-case" 
                      placeholder="PIN" 
                      value={pin} 
                      onChange={(e) => setPin(e.target.value.toUpperCase())} 
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mb-6"><label htmlFor="remember-credentials" className="flex items-center cursor-pointer select-none"><input id="remember-credentials" name="remember-credentials" type="checkbox" checked={retrieveCredentials} onChange={e => setRetrieveCredentials(e.target.checked)} className="sr-only peer" /><div className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-colors ${retrieveCredentials ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400 dark:border-gray-500'}`}>{retrieveCredentials && <span className="material-symbols-outlined text-white text-xs">check</span>}</div><span className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Retrieve my credentials</span></label></div>
                {error && <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded-r mb-6 flex items-start space-x-3 animate-fadeIn"><span className="material-symbols-outlined text-xl mt-0.5">error</span><p>{error}</p></div>}
                {infoMessage && <div className="bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500 text-blue-700 dark:text-blue-200 p-4 rounded-r mb-6 flex items-start space-x-3 animate-fadeIn"><span className="material-symbols-outlined text-xl mt-0.5">info</span><p>{infoMessage}</p></div>}
                <div><button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 text-lg font-semibold rounded-lg text-white bg-logip-primary hover:bg-logip-primary-hover transform transition-all duration-300 disabled:opacity-60">{isLoading ? 'Authenticating...' : 'Login to Continue'}</button></div>
            </form>
            <Modal isOpen={isLimitModalOpen} onClose={() => setIsLimitModalOpen(false)}><div className="flex flex-col items-center"><div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-5"><span className="material-symbols-outlined text-4xl text-red-500">history_toggle_off</span></div><h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Daily Limit Reached</h2><p className="mt-4 text-base text-gray-600 dark:text-gray-300 leading-relaxed text-center">You have exhausted your daily retrieval limit. Call the School on <a href={`tel:${contactInfo.school}`} className="font-bold underline text-logip-primary">{contactInfo.school}</a> or call the IT Department on <a href={`tel:${contactInfo.it}`} className="font-bold underline text-logip-primary">{contactInfo.it}</a>.</p><button onClick={() => setIsLimitModalOpen(false)} className="mt-8 w-full py-2 px-4 text-base font-semibold rounded-lg text-white bg-logip-primary hover:bg-logip-primary-hover shadow-md transition-all">Close</button></div></Modal>
        </div>
    </>
  );
};

export default ApplicantLoginForm;
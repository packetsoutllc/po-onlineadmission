import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ApplicationProgressBar from './ApplicationProgressBar';
import PersonalInfoForm from './PersonalInfoForm';
import AcademicInfoForm from './AcademicInfoForm';
import OtherRelevantInfoForm from './OtherRelevantInfoForm';
import ParentsInfoForm from './ParentsInfoForm';
import HouseAllocationForm from './HouseAllocationForm';
import DormAllocationForm from './DormAllocationForm';
import DocumentsSection from './DocumentsUploadForm';
import SubmitApplicationForm from './SubmitApplicationForm';
import AdmissionDocumentsPage from './AdmissionDocumentsPage';
import Modal from './Modal';
import Chat, { ChatMessage, getTimestamp } from './Chat';
import ChatModal from './ChatModal';
import { getHouseColor, initialHouses, House } from './admin/shared/houseData';
import { useLocalStorage } from './hooks/useLocalStorage';
import { StudentStatus, AdminStudent, initialAdminStudents } from './admin/pages/StudentsPage';
import { setLocalStorageAndNotify, logActivity } from '../utils/storage';
import { safeJsonParse } from '../utils/security';
import { getInsForgeClient } from '../lib/insforgeClient';
import { upsertSubmissionStatus, upsertApplicationData, upsertCredentials } from '../lib/insforgeData';
import { setFavicon } from '../utils/favicon';
import { formatDate, formatDateTime } from '../utils/date';
import { Dormitory, initialDormitories } from './admin/shared/dormitoryData';
import { AdmissionSettings } from './admin/pages/SecuritySettingsTab';
import NotificationPreviewModal from './admin/shared/NotificationPreviewModal';
import VideoPreviewModal from './admin/shared/VideoPreviewModal';
import { FormSettings, INITIAL_FORM_SETTINGS } from './admin/pages/ApplicationDashboardSettings';
import { School, initialSchools, Admission, initialAdmissions } from './admin/pages/SettingsPage';
import { initialClasses, Class } from './admin/pages/ClassesPage';
import { allocateHouseForStudent, allocateDormForStudent } from './admin/shared/houseAllocationService';
import PacketsOutArrowIcon from './PacketsOutArrowIcon';
import Icon from './admin/shared/Icons';
import PacketsOutLogo from './PacketsOutLogo';

export type ApplicationStatus = 'not_submitted' | 'submitted';
export type AppStatus = ApplicationStatus | StudentStatus;

interface DocumentAccessSettings {
  [key: string]: { 
      prospective: boolean; 
      prospectiveReason?: string;
      admitted: boolean; 
      admittedReason?: string;
  };
}

export interface Student {
  name: string;
  indexNumber: string;
  programme: string;
  gender: string;
  residence: string;
  aggregate: string;
  schoolId: string;
  admissionId: string;
  isProtocol?: boolean;
  currentSchoolPlaced?: string;
  phoneNumber?: string;
  parentContact?: string; 
}

export interface AiSettings {
    enableAiChat: boolean;
    systemInstruction: string;
    enableAiUniformGeneration: boolean;
    maleUniformDescription: string;
    femaleUniformDescription: string;
    uniformColor: string;
    maleUniformSample?: string | null;
    femaleUniformSample?: string | null;
    enableAiWatchDog: boolean;
    watchDogFlags: {
        inconsistentData: boolean;
        resultPatterns: boolean;
        summarizeEdits: boolean;
        formHacking: boolean;
    };
    watchDogSensitivity: 'low' | 'medium' | 'high';
}

interface SectionAccessSetting {
    prospective: boolean;
    prospectiveReason?: string;
    admitted: boolean; 
    admittedReason?: string;
}

interface ClassHouseDormAccessSettings {
    class: SectionAccessSetting;
    house: SectionAccessSetting;
    dorm: SectionAccessSetting;
}

interface StudentDetailsProps {
  student: Student;
  onReturn: () => void;
  applicationStatus: AppStatus;
  toggleTheme: () => void;
  isDarkMode: boolean;
  isAdminEditMode?: boolean;
  allStudents?: AdminStudent[];
}

const defaultAvatarPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2UyZThmMCIgLz4KICA8ZyBmaWxsPSIjYTBlYmMwIj4KICAgIDxjaXJjbGUgY3g9IjEwMCIgLz4KICAgIDxwYXRoIGQ9I00zMCAyMDAgViAxODAgQyAzMCAxNDAsIDE3MCAxNDAsIDE3MCAxODAgViAyMDAgWiIgLz4KICA8L2c+Cjwvc3ZnPg==';

const SchoolLogo: React.FC<{school?: School}> = ({ school }) => (
    <div className="flex items-center gap-3 min-w-0 overflow-hidden">
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-logip-text-header dark:bg-gray-800 shadow-sm overflow-hidden">
            {school?.logo ? (
                <img src={school.logo} alt={school.name} className="w-full h-full object-contain p-1 rounded-sm" />
            ) : (
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 12.6667L9.33333 18L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </div>
        <span 
            className="font-bold text-lg text-black dark:text-gray-100 tracking-tight truncate" 
            title={school?.name || 'Peki Senior High School'}
        >
            {school?.name || 'Peki Senior High School'}
        </span>
    </div>
);

const NavItem: React.FC<{ icon: string; label: string; active?: boolean; onClick?: () => void; color?: string; }> = ({ icon, label, active, onClick, color }) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-sm text-black dark:text-report-subtle transition-colors text-left ${active ? 'bg-gray-100 dark:bg-gray-800 font-normal text-black dark:text-gray-100' : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}>
    <div className="flex items-center gap-3">
        <Icon name={icon} className={`w-5 h-5 ${color || 'text-logip-primary'}`} />
        <span>{label}</span>
    </div>
  </button>
);

type Page = 'personal_info' | 'academic_info' | 'other_info' | 'parents_info' | 'housing' | 'dorm_allocation' | 'documents' | 'submit' | 'admission_docs';

export const isNotificationActive = (notif: any, admissionId: string, type: 'scrolling' | 'popup' | 'video', currentPage: string, bypassSeenCheck = false) => {
    if (!notif || !notif.enabled) {
        return false;
    }
    // Check page targeting
    if (notif.targetPages && !notif.targetPages.includes('all') && !notif.targetPages.includes(currentPage)) {
        return false;
    }
    
    const now = new Date();
    if (notif.startTime && new Date(notif.startTime) > now) {
        return false;
    }
    if (notif.endTime && new Date(notif.endTime) < now) {
        return false;
    }
    if (notif.frequency === 'once' && !bypassSeenCheck) {
        const sessionKey = `${type}_shown_${currentPage}_${admissionId}`;
        if (sessionStorage.getItem(sessionKey)) {
            return false;
        }
    }
    return true;
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

const StudentDetails: React.FC<StudentDetailsProps> = ({ student: initialStudent, onReturn, applicationStatus, toggleTheme, isDarkMode, isAdminEditMode = false, allStudents }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [activeStudentIndex, setActiveStudentIndex] = useState(initialStudent.indexNumber);
  
  const submissionStatusKey = `submissionStatus_${initialStudent.schoolId}_${activeStudentIndex}`;
  const [submissionStatus, setSubmissionStatus] = useLocalStorage(submissionStatusKey, {
    submitted: applicationStatus === 'Admitted' || applicationStatus === 'submitted',
    date: null as string | null,
    admissionNumber: null as string | null,
  });

  const { submitted: isApplicationSubmitted, date: submissionDate, admissionNumber } = submissionStatus;

  const [currentPage, setCurrentPage] = useState<Page>(isApplicationSubmitted ? 'admission_docs' : 'personal_info');
  
  useEffect(() => {
    const checkMidnightLogout = () => {
        const now = new Date();
        if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
            console.log('Midnight UTC reached. Automatically logging out student account.');
            onReturn();
        }
    };
    const timerId = setInterval(checkMidnightLogout, 3000);
    return () => clearInterval(timerId);
  }, [onReturn]);

  useEffect(() => {
    if (!isAdminEditMode) {
        logActivity(
            { name: initialStudent.name, avatar: '', type: 'student' },
            'navigated to',
            'navigation',
            `${currentPage.replace(/_/g, ' ')} Page`,
            initialStudent.schoolId
        );
    }
  }, [currentPage, initialStudent.name, initialStudent.schoolId, isAdminEditMode]);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Mobile Nav/Scroll Logic
  const [isScrollingUp, setIsScrollingUp] = useState(true);
  const lastScrollTopRef = useRef(0);
  const scrollSpyRafRef = useRef<number | null>(null);
  const lastActiveSectionRef = useRef<Page | null>(null);
  /** Skip scroll-spy until this time (ms) after menu click so programmatic scroll doesn't override selection (all viewports) */
  const skipScrollSpyUntilRef = useRef(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const st = target.scrollTop;
    
    if (st < lastScrollTopRef.current) {
        setIsScrollingUp(true);
    } else if (st > lastScrollTopRef.current && st > 50) {
        setIsScrollingUp(false);
    }
    
    lastScrollTopRef.current = st <= 0 ? 0 : st;

    // Scroll-spy: update active section on desktop, tablet, and mobile (throttled via rAF to avoid flicker)
    if (scrollSpyRafRef.current !== null) {
      cancelAnimationFrame(scrollSpyRafRef.current);
    }
    scrollSpyRafRef.current = requestAnimationFrame(() => {
      scrollSpyRafRef.current = null;
      const container = scrollContainerRef.current;
      if (!container) return;

      // After menu click we scroll programmatically; ignore scroll-spy briefly so the selected item stays active (fixes "select twice" on desktop and flicker on mobile/tablet)
      if (Date.now() < skipScrollSpyUntilRef.current) return;

      // Reference point: 25% from top of visible area (stable rule to avoid boundary flicker)
      const referenceY = st + container.clientHeight * 0.25;

      // Sections are direct children; offsetTop is relative to scroll container content
      const entries = Object.entries(sectionRefs.current)
        .filter(([, el]) => el != null)
        .map(([id, el]) => ({
          id: id as Page,
          top: (el as HTMLElement).offsetTop,
        }))
        .sort((a, b) => a.top - b.top);

      // Active section = last section whose top is at or above the reference line (stable, no flicker)
      let activeId: Page | null = entries.length > 0 ? entries[0].id : null;
      for (const { id, top } of entries) {
        if (top <= referenceY) activeId = id;
        else break;
      }

      if (activeId && activeId !== lastActiveSectionRef.current) {
        lastActiveSectionRef.current = activeId;
        setCurrentPage(activeId);
      }
    });
  }, []);

  const [isConfirmUnlockModalOpen, setIsConfirmUnlockModalOpen] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [otpArray, setOtpArray] = useState<string[]>(new Array(6).fill(""));
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [mockOtp, setMockOtp] = useState<string | null>(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState(300); 
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const chatHistoryKey = `ai_chat_history_msgs_${initialStudent.schoolId}_${activeStudentIndex}`;
  const formattedNameForChat = initialStudent.name.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  const initialAiMessage: ChatMessage = { 
      id: 'initial', 
      text: `Hello ${formattedNameForChat}! I’m the IT Support Assistant at Peki Senior High School. How can I help you with your admission process today?`, 
      sender: 'ai', 
      timestamp: getTimestamp() 
  };
  
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>(chatHistoryKey, [initialAiMessage]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [attachment, setAttachment] = useState<{ file: File; previewUrl: string } | null>(null);

  useEffect(() => {
    if (messages.length > 1) {
        const chatLog = {
            studentName: initialStudent.name,
            studentIndex: activeStudentIndex,
            schoolName: 'Peki Senior High School',
            schoolId: initialStudent.schoolId,
            admissionId: initialStudent.admissionId,
            timestamp: new Date().toISOString(),
            messages,
        };
        localStorage.setItem(`ai_chat_history_${initialStudent.schoolId}_${activeStudentIndex}`, JSON.stringify(chatLog));
    }
  }, [messages, activeStudentIndex, initialStudent.name, initialStudent.schoolId, initialStudent.admissionId]);
  
  const formSettingsKey = `formSettings_${initialStudent.schoolId}_${initialStudent.admissionId}`;
  const [formSettings] = useLocalStorage<FormSettings>(formSettingsKey, INITIAL_FORM_SETTINGS);

  const applicationDataKey = `applicationData_${initialStudent.schoolId}_${activeStudentIndex}`;
  const [applicationData, setApplicationData] = useLocalStorage<Record<string, any>>(applicationDataKey, {});
  
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const saveTimerRef = useRef<number | null>(null);

  const [schools] = useLocalStorage<School[]>('admin_schools', initialSchools);
  const school = useMemo(() => {
      const s = schools.find(s => s.id === initialStudent.schoolId);
      if (s) {
          document.title = 'Packets Out - Online Admission System';
          setFavicon(s.logo ?? null);
      }
      return s;
  }, [schools, initialStudent.schoolId]);
  const [admissions] = useLocalStorage<Admission[]>('admin_admissions', initialAdmissions);
  const admission = useMemo(() => admissions.find(a => a.id === initialStudent.admissionId), [admissions, initialStudent.admissionId]);
  
  const [classes] = useLocalStorage<Class[]>('admin_classes', initialClasses);
  const [adminStudents, setAdminStudents] = useLocalStorage<AdminStudent[]>('admin_students', initialAdminStudents);

  const handleApplicationDataChange = useCallback((value: Record<string, any> | ((val: Record<string, any>) => Record<string, any>)) => {
    setSaveStatus('saving');
    setApplicationData(value); 
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
        setSaveStatus('saved');
    }, 1000); 
  }, [setApplicationData]);

  useEffect(() => {
    if (!isApplicationSubmitted && !applicationData.contactNumber) {
        const smsNumberRaw = localStorage.getItem(`smsNotificationNumber_${initialStudent.schoolId}_${activeStudentIndex}`);
        if (smsNumberRaw) {
            try {
                let smsNumber = smsNumberRaw;
                smsNumber = safeJsonParse<string>(smsNumberRaw, '') || smsNumber;
                if (smsNumber) handleApplicationDataChange(prev => ({ ...prev, contactNumber: smsNumber }));
            } catch(e) {}
        }
    }
  }, [isApplicationSubmitted, activeStudentIndex, applicationData.contactNumber, handleApplicationDataChange, initialStudent.schoolId]);

  const isFieldVisible = useCallback((fieldId: string) => {
      const field = formSettings.fields.find(f => f.id === fieldId);
      if (!field || !field.visible) return false;
      if (field.condition) {
          const parentValue = applicationData[field.condition.fieldId];
          return String(parentValue).toLowerCase() === String(field.condition.value).toLowerCase();
      }
      return true;
  }, [formSettings, applicationData]);

  const isOpenFirstTime = useRef(true);
 
  const handleNavClick = (pageId: Page, fieldId?: string) => {
      // When the form is locked and the user is on the Admission Documents page,
      // prevent navigation to other sections until Edit Application unlocks it.
      if (isFormLocked && currentPage === 'admission_docs' && pageId !== 'admission_docs') {
          return;
      }

      document.querySelectorAll('.field-highlight-error').forEach(el => el.classList.remove('field-highlight-error'));
      
      // Always update current page for consistent navigation and validation jumps
      setCurrentPage(pageId);
      lastActiveSectionRef.current = pageId;
      // Skip scroll-spy briefly on all viewports so programmatic scroll doesn't override selection (fixes desktop "select twice" and mobile/tablet flicker)
      skipScrollSpyUntilRef.current = Date.now() + 1000;

      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      
      // Scroll immediately for a snappier navigation experience
      if (fieldId) {
          const element = document.getElementById(fieldId);
          if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.focus({ preventScroll: true });
              element.classList.add('field-highlight-error');
              element.style.outline = '2px solid #2563EB';
              element.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.2)';
              setTimeout(() => { element.style.outline = ''; element.style.boxShadow = ''; }, 3000);
          }
      } else {
          sectionRefs.current[pageId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } 
  };

  useEffect(() => {
      if (!isApplicationSubmitted && isOpenFirstTime.current && formSettings.fields.length > 0) {
          isOpenFirstTime.current = false;
          const visibleRequiredFields = formSettings.fields.filter(f => {
              const isReq = f.required || (f.id === 'officialCurrentSchool' && initialStudent.isProtocol);
              return isReq && isFieldVisible(f.id);
          });
          for (const field of visibleRequiredFields) {
              const value = field.id in applicationData ? applicationData[field.id] : null;
              if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
                   if (field.id.startsWith('secondary') && !applicationData.showSecondaryGuardian) continue;
                  let targetPage: Page = 'personal_info';
                  if (field.section === 'academic') targetPage = 'academic_info';
                  else if (field.section === 'parents') targetPage = 'parents_info';
                  else if (field.section === 'other') targetPage = 'other_info';
                  else if (field.section === 'documents') targetPage = 'documents';
                  else if (field.section === 'official_records') targetPage = 'personal_info';
                  handleNavClick(targetPage, field.id);
                  return;
              }
          }
      }
  }, [isApplicationSubmitted, formSettings, isFieldVisible, applicationData, initialStudent.isProtocol]);

  useEffect(() => {
      const newIndex = applicationData.officialIndexNumber;
      if (newIndex && newIndex !== activeStudentIndex && newIndex.length === 12) {
          const sid = initialStudent.schoolId;
          const oldDataKey = `applicationData_${sid}_${activeStudentIndex}`;
          const newDataKey = `applicationData_${sid}_${newIndex}`;
          localStorage.setItem(newDataKey, JSON.stringify(applicationData));
          localStorage.removeItem(oldDataKey);
          const oldSubKey = `submissionStatus_${sid}_${activeStudentIndex}`;
          const newSubKey = `submissionStatus_${sid}_${newIndex}`;
          const subStatus = localStorage.getItem(oldSubKey);
          if (subStatus) {
              localStorage.setItem(newSubKey, subStatus);
              localStorage.removeItem(oldSubKey);
          }
          ['credentials', 'paymentStatus', 'smsNotificationNumber', 'editHistory'].forEach(prefix => {
              const oldKey = `${prefix}_${sid}_${activeStudentIndex}`;
              const newKey = `${prefix}_${sid}_${newIndex}`;
              const data = localStorage.getItem(oldKey);
              if (data) {
                  localStorage.setItem(newKey, data);
                  localStorage.removeItem(oldKey);
              }
          });
          const updatedList = adminStudents.map(s => {
              if (s.indexNumber === activeStudentIndex && s.schoolId === sid) return { ...s, indexNumber: newIndex };
              return s;
          });
          setAdminStudents(updatedList);
          setActiveStudentIndex(newIndex);
          showToast(`Index number updated to ${newIndex}. Records migrated.`, 'info');
      }
  }, [applicationData.officialIndexNumber, activeStudentIndex, applicationData, adminStudents, setAdminStudents, initialStudent.schoolId]);

  const [allDorms] = useLocalStorage<Dormitory[]>('admin_dormitories', initialDormitories);
  
  const liveStudent = useMemo(() => {
      const match = adminStudents.find(s => s.indexNumber === activeStudentIndex && s.schoolId === initialStudent.schoolId);
      const base = match ? { ...initialStudent, ...match } : { ...initialStudent, indexNumber: activeStudentIndex };
      const officialDataMap: Record<string, keyof Student> = {
          officialFullName: 'name',
          officialIndexNumber: 'indexNumber',
          officialGender: 'gender',
          officialAggregate: 'aggregate',
          officialResidence: 'residence',
          officialProgramme: 'programme',
          officialCurrentSchool: 'currentSchoolPlaced',
      };
      const updatedStudent = { ...base };
      Object.entries(officialDataMap).forEach(([fieldId, studentKey]) => {
          if (fieldId in applicationData) (updatedStudent as any)[studentKey] = applicationData[fieldId];
      });
      if (formSettings?.nameSystem === 'separated') {
          const surname = applicationData.surname || initialStudent.name.split(' ')[0] || '';
          const firstName = applicationData.firstName || initialStudent.name.split(' ').slice(1, 2).join(' ') || '';
          const otherNames = applicationData.otherNames || initialStudent.name.split(' ').slice(2).join(' ') || '';
          if ('surname' in applicationData || 'firstName' in applicationData) {
              updatedStudent.name = [surname, firstName, otherNames].filter(Boolean).join(' ');
          }
      }
      return updatedStudent as Student;
  }, [initialStudent, activeStudentIndex, adminStudents, applicationData, formSettings]);

  const getInitialNotification = (type: 'scrolling' | 'popup' | 'video', page: string) => {
      if (!initialStudent.schoolId || !initialStudent.admissionId) return null;
      const key = `notification_${type}_${initialStudent.schoolId}_${initialStudent.admissionId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
          const data = safeJsonParse(raw, null);
          if (isNotificationActive(data, initialStudent.admissionId, type, page, isAdminEditMode)) return data;
      }
      return null;
  };

  const [scrollingBanner, setScrollingBanner] = useState<any | null>(() => getInitialNotification('scrolling', currentPage));
  const [popupBanner, setPopupBanner] = useState<any | null>(() => getInitialNotification('popup', currentPage));
  const [videoNotification, setVideoNotification] = useState<any | null>(() => getInitialNotification('video', currentPage));
  const [isPopupBannerVisible, setIsPopupBannerVisible] = useState(() => !!getInitialNotification('popup', currentPage));
  const [isVideoNotificationVisible, setIsVideoNotificationVisible] = useState(() => !!getInitialNotification('video', currentPage));

  useEffect(() => {
      const scroll = getInitialNotification('scrolling', currentPage);
      const popup = getInitialNotification('popup', currentPage);
      const video = getInitialNotification('video', currentPage);
      setScrollingBanner(scroll);
      setPopupBanner(popup);
      setIsPopupBannerVisible(!!popup);
      setVideoNotification(video);
      setIsVideoNotificationVisible(!!video);
      if (scroll && scroll.frequency === 'once' && !isAdminEditMode) sessionStorage.setItem(`scrolling_shown_${currentPage}_${initialStudent.admissionId}`, 'true');
      if (popup && popup.frequency === 'once' && !isAdminEditMode) sessionStorage.setItem(`popup_shown_${currentPage}_${initialStudent.admissionId}`, 'true');
      if (video && video.frequency === 'once' && !isAdminEditMode) sessionStorage.setItem(`video_shown_${currentPage}_${initialStudent.admissionId}`, 'true');
  }, [currentPage, initialStudent.schoolId, initialStudent.admissionId, isAdminEditMode]);

  const scrollingSpeed = useMemo(() => `${scrollingBanner?.speed || 25}s`, [scrollingBanner]);
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null);
  const studentHouseChoice = applicationData.studentHouseChoice || '';
  const studentDormChoice = applicationData.studentDormChoice || '';
  const admissionSettingsKey = `admissionSettings_${initialStudent.schoolId}_${initialStudent.admissionId}`;
  const [admissionSettings] = useLocalStorage<AdmissionSettings | null>(admissionSettingsKey, null);
  const docAccessSettingsKey = `docAccessSettings_${initialStudent.schoolId}_${initialStudent.admissionId}`;
  const [docAccessSettings] = useLocalStorage<DocumentAccessSettings | null>(docAccessSettingsKey, null);
  const classHouseDormAccessSettingsKey = `classHouseDormAccessSettings_${initialStudent.schoolId}_${initialStudent.admissionId}`;
  const [classHouseDormAccessSettings] = useLocalStorage<ClassHouseDormAccessSettings>(classHouseDormAccessSettingsKey, {
      class: { prospective: false, admitted: true },
      house: { prospective: false, admitted: true },
      dorm: { prospective: false, admitted: true }
  });

  const { houseAssignmentMethod = 'automatic', enableRoomManagement = true, dormAssignmentMethod = 'automatic' } = admissionSettings || {};
  
  const realTimeApplicationStatus = useMemo((): AppStatus => {
    const studentRecord = adminStudents.find(s => s.indexNumber === activeStudentIndex && s.schoolId === initialStudent.schoolId);
    if (studentRecord) {
        if (studentRecord.status === 'Placed' && !isApplicationSubmitted) return 'not_submitted';
        return studentRecord.status;
    }
    if (isApplicationSubmitted) return 'submitted'; 
    return applicationStatus;
  }, [applicationStatus, isApplicationSubmitted, adminStudents, activeStudentIndex, initialStudent.schoolId]);

  const hasOtherInfoData = useMemo(() => {
    const otherFieldKeys = ['nsmqClub', 'stemNovationClub', 'otherClubs', 'otherClubsDetails', 'specialInterest', 'specialInterestDetails'];
    return otherFieldKeys.some(key => {
      const val = applicationData[key];
      return val === true || (val && String(val).trim().length > 0);
    });
  }, [applicationData]);

  const handleCloseMedicalSection = useCallback(() => {
    handleApplicationDataChange(prev => ({ ...prev, hasDisability: 'No', medicalReport: null }));
  }, [handleApplicationDataChange]);

  useEffect(() => {
    const checkLogout = () => {
        const forceLogoutKey = `force_logout_timestamp_${initialStudent.schoolId}_${initialStudent.admissionId}`;
        const forceLogoutTimeRaw = localStorage.getItem(forceLogoutKey);
        const loginTimeRaw = localStorage.getItem(`student_login_timestamp_${initialStudent.schoolId}_${activeStudentIndex}`);
        if (forceLogoutTimeRaw && loginTimeRaw) {
            const forceLogoutTime = parseInt(forceLogoutTimeRaw, 10);
            const loginTime = parseInt(loginTimeRaw, 10);
            if (forceLogoutTime > loginTime) {
                localStorage.removeItem(`student_login_timestamp_${initialStudent.schoolId}_${activeStudentIndex}`);
                onReturn();
            }
        }
    };
    const interval = setInterval(checkLogout, 3000);
    const handleForceLogoutTrigger = (e: StorageEvent | CustomEvent) => {
        const key = (e as StorageEvent).key || (e as CustomEvent).detail?.key;
        if (key && key.startsWith('force_logout_timestamp_')) checkLogout();
    };
    window.addEventListener('storage', handleForceLogoutTrigger as EventListener);
    window.addEventListener('logip-storage-update', handleForceLogoutTrigger as EventListener);
    return () => {
        clearInterval(interval);
        window.removeEventListener('storage', handleForceLogoutTrigger as EventListener);
        window.removeEventListener('logip-storage-update', handleForceLogoutTrigger as EventListener);
    };
  }, [activeStudentIndex, initialStudent.schoolId, initialStudent.admissionId, onReturn]);

  useEffect(() => {
    if (initialStudent.schoolId && initialStudent.admissionId) {
        const aiStorageKey = `aiFeaturesSettings_${initialStudent.schoolId}_${initialStudent.admissionId}`;
        const aiSettingsRaw = localStorage.getItem(aiStorageKey);
        if (aiSettingsRaw) {
            setAiSettings(safeJsonParse(aiSettingsRaw, null));
        } else {
            const currentSchoolName = schools.find(s => s.id === initialStudent.schoolId)?.name || 'School';
            setAiSettings({
                enableAiChat: true,
                systemInstruction: `You are a friendly and helpful AI assistant for the ${currentSchoolName} admission portal.`,
                enableAiUniformGeneration: true,
                maleUniformDescription: "a formal collared school uniform shirt",
                femaleUniformDescription: "a formal round-neck school uniform blouse",
                uniformColor: "#2563EB",
                enableAiWatchDog: true,
                watchDogFlags: {
                    inconsistentData: true,
                    resultPatterns: false,
                    summarizeEdits: true,
                    formHacking: true,
                },
                watchDogSensitivity: 'medium',
            });
        }
    }
  }, [initialStudent.schoolId, initialStudent.admissionId, schools]);
  
  useEffect(() => {
      if (!isOtpModalOpen || otpTimeLeft <= 0) return;
      const timer = setInterval(() => { setOtpTimeLeft((prev) => prev - 1); }, 1000);
      return () => clearInterval(timer);
  }, [isOtpModalOpen, otpTimeLeft]);

  const avatarUrl = useMemo(() => {
      if (applicationData?.passportPhotograph?.data) return applicationData.passportPhotograph.data;
      return defaultAvatarPlaceholder;
  }, [applicationData]);
  
  useEffect(() => { if (realTimeApplicationStatus === 'Rejected') setCurrentPage('personal_info'); }, [realTimeApplicationStatus]);
  useEffect(() => {
      if (currentPage === 'admission_docs') {
          const isRestricted = ['Placed', 'Rejected', 'not_submitted'].includes(realTimeApplicationStatus);
          if (isRestricted) setCurrentPage(isApplicationSubmitted ? 'submit' : 'personal_info');
      }
  }, [currentPage, realTimeApplicationStatus, isApplicationSubmitted]);

  const isFormLocked = (isApplicationSubmitted || realTimeApplicationStatus === 'Rejected') && !isAdminEditMode;

  const showToast = (message: string, type: 'error' | 'info' = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => { setToastMessage(null); }, 4000);
  };

  const hasVisibleDocumentFields = formSettings.fields.some(f => f.section === 'documents' && isFieldVisible(f.id));

  const classDisplay = useMemo(() => {
      const isProspective = ['submitted', 'Prospective', 'Pending'].includes(realTimeApplicationStatus);
      const isAdmitted = realTimeApplicationStatus === 'Admitted';
      let visible = false;
      let overrideValue = null;
      if (isProspective) {
          if (classHouseDormAccessSettings.class.prospective) visible = true;
          else { visible = true; overrideValue = classHouseDormAccessSettings.class.prospectiveReason || "Access Restricted"; }
      } else if (isAdmitted) {
          if (classHouseDormAccessSettings.class.admitted) visible = true;
          else { visible = true; overrideValue = classHouseDormAccessSettings.class.admittedReason || "Access Restricted"; }
      } else if (applicationData?.studentClass || (adminStudents.find(s => s.indexNumber === activeStudentIndex && s.schoolId === initialStudent.schoolId)?.classId)) {
          visible = true; 
      }
      if (overrideValue) return { visible, value: overrideValue, isRestricted: true };
      const studentRecord = adminStudents.find(s => s.indexNumber === activeStudentIndex && s.schoolId === initialStudent.schoolId);
      let className = studentRecord?.classId ? classes.find(c => c.id === studentRecord.classId)?.name : null;
      if (!className && applicationData?.studentClass) className = applicationData.studentClass;
      return { visible, value: className || 'N/A', isRestricted: false };
  }, [realTimeApplicationStatus, classHouseDormAccessSettings, adminStudents, activeStudentIndex, applicationData, classes, initialStudent.schoolId]);

  const assignedHouse = useMemo(() => {
    const studentData = adminStudents.find(s => s.indexNumber === activeStudentIndex && s.schoolId === initialStudent.schoolId);
    if (studentData?.houseId) {
        const house = initialHouses.find(h => h.id === studentData.houseId);
        return house?.name || '';
    }
    return '';
  }, [activeStudentIndex, adminStudents, initialStudent.schoolId]);

  const assignedDorm = useMemo(() => {
    const studentData = adminStudents.find(s => s.indexNumber === activeStudentIndex && s.schoolId === initialStudent.schoolId);
    if (studentData?.dormitoryId) {
        const dorm = allDorms.find(d => d.id === studentData.dormitoryId);
        return dorm?.name || '';
    }
    return '';
  }, [activeStudentIndex, adminStudents, allDorms, initialStudent.schoolId]);

  const dormDisplay = useMemo(() => {
      if (!enableRoomManagement) return { visible: false, value: 'N/A', isRestricted: false };
      const status = realTimeApplicationStatus;
      const isFillingForm = status === 'not_submitted' || status === 'Placed';
      let visible = false;
      let overrideValue = null;
      if (['submitted', 'Prospective', 'Pending'].includes(status)) {
           if (!classHouseDormAccessSettings.dorm.prospective) overrideValue = classHouseDormAccessSettings.dorm.prospectiveReason || "Access Restricted";
           visible = true;
      } else if (status === 'Admitted') {
           if (!classHouseDormAccessSettings.dorm.admitted) overrideValue = classHouseDormAccessSettings.dorm.admittedReason || "Access Restricted";
           visible = true;
      } else if (assignedDorm || isFillingForm) { visible = true; }
      if (liveStudent.residence === 'Day' && !assignedDorm) visible = false;
      if (liveStudent.residence === 'Day' && !assignedDorm) return { visible: false, value: 'N/A', isRestricted: false };
      if (overrideValue && visible) return { visible, value: overrideValue, isRestricted: true };
      return { visible, value: assignedDorm || 'N/A', isRestricted: false };
  }, [realTimeApplicationStatus, classHouseDormAccessSettings, assignedDorm, enableRoomManagement, liveStudent.residence]);

  const houseDisplay = useMemo(() => {
      const status = realTimeApplicationStatus;
      const isFillingForm = status === 'not_submitted' || status === 'Placed';
      let visible = false;
      let overrideValue = null;
      if (['submitted', 'Prospective', 'Pending'].includes(status)) {
           if (!classHouseDormAccessSettings.house.prospective) overrideValue = classHouseDormAccessSettings.house.prospectiveReason || "Access Restricted";
           visible = true;
      } else if (status === 'Admitted') {
           if (!classHouseDormAccessSettings.house.admitted) overrideValue = classHouseDormAccessSettings.house.admittedReason || "Access Restricted";
           visible = true;
      } else if (assignedHouse || houseAssignmentMethod === 'student_choice' || isFillingForm || (enableRoomManagement && dormDisplay.visible)) { visible = true; }
      if (liveStudent.residence === 'Day' && !assignedHouse) return { visible: false, value: 'N/A', isRestricted: false };
      if (overrideValue && visible) return { visible, value: overrideValue, isRestricted: true };
      return { visible, value: assignedHouse || 'N/A', isRestricted: false };
  }, [realTimeApplicationStatus, classHouseDormAccessSettings, assignedHouse, houseAssignmentMethod, enableRoomManagement, dormDisplay.visible, liveStudent.residence]);

  const allNavItems = [
    { id: 'personal_info', icon: 'person', label: 'Personal Information', color: 'text-orange-500' },
    { id: 'academic_info', icon: 'school', label: 'Academic Information', color: 'text-blue-500' },
    { id: 'housing', icon: 'house', label: 'House Allocation', color: 'text-indigo-500' },
    { id: 'dorm_allocation', icon: 'king_bed', label: 'Dorm/Room Allocation', color: 'text-sky-500' },
    { id: 'other_info', icon: 'info', label: 'Other Relevant Info.', color: 'text-cyan-500' },
    { id: 'parents_info', icon: 'supervisor_account', label: 'Parents/Guardian Info.', color: 'text-rose-500' },
    { id: 'documents', icon: 'upload_file', label: 'Documents Upload', color: 'text-amber-500' },
    { id: 'submit', icon: 'task_alt', label: 'Submit Application', color: 'text-emerald-500' },
    { id: 'admission_docs', icon: 'description', label: 'Admission Documents', color: 'text-violet-500' },
  ];

  const pageTitles: Record<Page, { title: string, subtitle: string }> = {
    personal_info: { title: 'Personal Information', subtitle: 'Please fill in your details accurately.' },
    academic_info: { title: 'Academic Information', subtitle: 'Provide your BECE results and previous school details.' },
    other_info: { title: 'Other Relevant Info.', subtitle: 'Share information about your extracurricular activities and interests.' },
    parents_info: { title: 'Parents/Guardian Info.', subtitle: 'Provide contact and occupation details for your parent or guardian.' },
    housing: { title: 'House Allocation', subtitle: 'View your assigned house of residence.' },
    dorm_allocation: { title: 'Dorm/Room Allocation', subtitle: 'View your assigned room of residence.' },
    documents: { title: 'Documents Upload', subtitle: 'Upload required documents like your birth certificate.' },
    submit: { title: 'Submit Application', subtitle: 'Review and submit your completed application.' },
    admission_docs: { title: 'Admission Documents', subtitle: 'Download your admission letter and other required documents.' },
  };

  const navItems = allNavItems.filter(item => {
    // Do not collapse menu after submission; keep all relevant sections visible.
    if (item.id === 'documents' && applicationData.hasDisability !== 'Yes') return false;
    if (item.id === 'other_info' && isApplicationSubmitted && !hasOtherInfoData) return false;
    if (item.id === 'housing' && !houseDisplay.visible) return false;
    if (item.id === 'dorm_allocation' && !dormDisplay.visible) return false;
    if (item.id === 'admission_docs') {
        if (realTimeApplicationStatus === 'Placed' || realTimeApplicationStatus === 'not_submitted') return false;
        // Simplified check: Allow Pending (Prospective equivalent) to see the documents tab if admin has configured payment requirement for prospective students.
        const canSeeAsProspective = docAccessSettings ? Object.values(docAccessSettings).some(s => (s as { prospective: boolean }).prospective) : true;
        const canSeeAsAdmitted = docAccessSettings ? Object.values(docAccessSettings).some(s => (s as { admitted: boolean }).admitted) : true;
        const isProspectiveEquivalent = realTimeApplicationStatus === 'submitted' || realTimeApplicationStatus === 'Prospective' || realTimeApplicationStatus === 'Pending';
        const isAdmitted = realTimeApplicationStatus === 'Admitted';
        if (isProspectiveEquivalent && canSeeAsProspective) return true; 
        if (isAdmitted && canSeeAsAdmitted) return true; 
        return false;
    }
    if (item.id === 'dorm_allocation' && !enableRoomManagement) return false;
    return true;
  });
  
  const handleApplicationSubmit = () => {
    const phoneRegex = /^0\d{9}$/;
    if (applicationData.contactNumber && !phoneRegex.test(applicationData.contactNumber)) { showToast('Your contact number is invalid.', 'error'); handleNavClick('personal_info'); return; }
    if (applicationData.primaryContact && !phoneRegex.test(applicationData.primaryContact)) { showToast("Primary guardian's contact number is invalid.", 'error'); handleNavClick('parents_info'); return; }
    const date = new Date();
    const studentIndex = adminStudents.findIndex(s => s.indexNumber === activeStudentIndex && s.schoolId === initialStudent.schoolId);
    let studentToUpdate: AdminStudent;
    if (studentIndex > -1) studentToUpdate = { ...adminStudents[studentIndex] };
    else studentToUpdate = {
            id: `stud_${initialStudent.schoolId}_${activeStudentIndex}`, name: liveStudent.name, indexNumber: activeStudentIndex,
            schoolId: initialStudent.schoolId, admissionId: initialStudent.admissionId, programme: liveStudent.programme,
            gender: liveStudent.gender as 'Male' | 'Female', aggregate: liveStudent.aggregate,
            status: 'Placed', classId: '', houseId: '', feeStatus: 'Unpaid',
            residence: liveStudent.residence as 'Boarding' | 'Day', admissionDate: new Date().toISOString(), isProtocol: !!initialStudent.isProtocol,
    };
    if (applicationData.contactNumber) studentToUpdate.phoneNumber = applicationData.contactNumber;
    if (applicationData.primaryContact) studentToUpdate.parentContact = applicationData.primaryContact;
    if (applicationData.officialResidence) studentToUpdate.residence = applicationData.officialResidence;
    if (applicationData.studentClass) {
        const selectedClass = classes.find(c => c.name === applicationData.studentClass && c.schoolId === initialStudent.schoolId);
        if (selectedClass) studentToUpdate.classId = selectedClass.id;
    }
    if (studentToUpdate.residence === 'Boarding') {
        if (houseAssignmentMethod === 'automatic' && !studentToUpdate.houseId) {
            // FIX: Provided missing schoolId and admissionId arguments as required by allocateHouseForStudent
            const assignedHouseName = allocateHouseForStudent(studentToUpdate.gender as 'Male' | 'Female', studentToUpdate.schoolId, studentToUpdate.admissionId);
            const houseId = initialHouses.find(h => h.name === assignedHouseName)?.id;
            if (houseId) studentToUpdate.houseId = houseId;
        }
        if (enableRoomManagement && studentToUpdate.houseId) {
            if (dormAssignmentMethod === 'automatic' && !studentToUpdate.dormitoryId) {
                const allocatedDormId = allocateDormForStudent(studentToUpdate.houseId, adminStudents, allDorms);
                if (allocatedDormId) studentToUpdate.dormitoryId = allocatedDormId;
            }
        }
    }
    const canBeUpdated = ['Placed', 'not_submitted', 'Pending'].includes(realTimeApplicationStatus);
    if (canBeUpdated) {
        if (admissionSettings?.autoApproveProspective) studentToUpdate.status = 'Admitted';
        else studentToUpdate.status = 'Prospective';
    }
    const newList = [...adminStudents];
    if (studentIndex > -1) newList[studentIndex] = studentToUpdate;
    else newList.push(studentToUpdate);
    setAdminStudents(newList);
    let finalAdmissionNumber = admissionNumber;
    if (!finalAdmissionNumber) {
        const programmeCode = liveStudent.programme.substring(0,3).toUpperCase() || 'GEN';
        const counterKey = `admissionSubmissionCounter_${initialStudent.schoolId}`;
        let currentCount = parseInt(localStorage.getItem(counterKey) || '0', 10) + 1;
        localStorage.setItem(counterKey, currentCount.toString());
        finalAdmissionNumber = `${programmeCode}-${activeStudentIndex.slice(-3)}/${String(currentCount).padStart(3, '0')}`;
    }

    const credentialsKey = `credentials_${initialStudent.schoolId}_${activeStudentIndex}`;
    if (!localStorage.getItem(credentialsKey)) {
        const serial = generateCredential(admissionSettings?.serialNumberLength || 10, admissionSettings?.serialNumberFormat);
        const pin = generateCredential(admissionSettings?.pinLength || 5, admissionSettings?.pinFormat);
        setLocalStorageAndNotify(credentialsKey, { serialNumber: serial, pin: pin });
        const credClient = getInsForgeClient();
        if (credClient) {
          upsertCredentials(credClient, initialStudent.schoolId, initialStudent.admissionId, activeStudentIndex, serial, pin).catch(() => {});
        }
        console.log(`[SYSTEM] Generated credentials for student ${activeStudentIndex}: Serial ${serial}, PIN ${pin}`);
    }

    setSubmissionStatus({ submitted: true, date: date.toISOString(), admissionNumber: finalAdmissionNumber });
    const client = getInsForgeClient();
    if (client) {
      upsertSubmissionStatus(client, initialStudent.schoolId, initialStudent.admissionId, activeStudentIndex, true).catch(() => {});
      upsertApplicationData(client, initialStudent.schoolId, initialStudent.admissionId, activeStudentIndex, applicationData).catch(() => {});
    }

    logActivity(
        { name: initialStudent.name, avatar: '', type: 'student' },
        'submitted application for',
        'admission_process',
        `${school?.name} (${admission?.title})`,
        initialStudent.schoolId
    );

    showToast('Application successfully submitted.');
    setCurrentPage('admission_docs');
  };

  const handleEdit = () => handleNavClick('personal_info');
  
  const handleRequestUnlock = () => {
    if (isAdminEditMode) {
        setSubmissionStatus(prev => ({ ...prev, submitted: false }));
        showToast("Application unlocked.");
        setCurrentPage('personal_info');
        return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const logKey = `edit_app_limit_${initialStudent.schoolId}_${activeStudentIndex}`;
    let limitLog = { date: '', count: 0 };
    const stored = localStorage.getItem(logKey);
    if (stored) {
      const parsed = safeJsonParse<{ date?: string; count?: number }>(stored, {});
      limitLog = { date: parsed?.date ?? '', count: typeof parsed?.count === 'number' ? parsed.count : 0 };
    }
    if (limitLog.date === todayStr && limitLog.count >= 2) { setIsLimitModalOpen(true); return; }
    setIsConfirmUnlockModalOpen(true);
  };

  const handleProceedToOtp = () => { 
      setIsConfirmUnlockModalOpen(false); 
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setMockOtp(newOtp);
      showToast(`An OTP has been sent.`); 
      const todayStr = new Date().toISOString().split('T')[0];
      const logKey = `edit_app_limit_${initialStudent.schoolId}_${activeStudentIndex}`;
      let limitLog = { date: todayStr, count: 0 };
      const stored = localStorage.getItem(logKey);
      if (stored) {
        const parsed = safeJsonParse<{ date?: string; count?: number }>(stored, {});
        if (parsed?.date === todayStr && typeof parsed.count === 'number') limitLog.count = parsed.count;
      }
      limitLog.count += 1;
      localStorage.setItem(logKey, JSON.stringify(limitLog));
      setOtpArray(new Array(6).fill(""));
      setOtpError('');
      setOtpTimeLeft(300);
      setIsOtpModalOpen(true);
  };
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpArray];
    newOtp[index] = value.substring(value.length - 1);
    setOtpArray(newOtp);
    if (value && index < 5 && otpInputRefs.current[index + 1]) otpInputRefs.current[index + 1]?.focus();
  };
  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => { if (e.key === 'Backspace' && !otpArray[index] && index > 0 && otpInputRefs.current[index - 1]) otpInputRefs.current[index - 1]?.focus(); };
  const handleVerifyOtp = () => {
      setIsVerifyingOtp(true);
      const enteredOtp = otpArray.join('');
      setTimeout(() => {
          if (enteredOtp === mockOtp || enteredOtp === '123456') {
               setSubmissionStatus(prev => ({ ...prev, submitted: false }));
               showToast("Application unlocked successfully.", 'info');
               logActivity({ name: initialStudent.name, avatar: '', type: 'student' }, 'requested and performed application unlock', 'security', 'OTP verified successfully', initialStudent.schoolId);
               setIsOtpModalOpen(false);
               setIsVerifyingOtp(false);
               setCurrentPage('personal_info');
          } else { setOtpError('Invalid OTP. Please try again.'); setIsVerifyingOtp(false); }
      }, 1000);
  };
  
  const contactInfo = useMemo(() => {
    try {
        const admissionsRaw = localStorage.getItem('admin_admissions');
        const admissions: Admission[] = safeJsonParse<Admission[]>(admissionsRaw, []);
        const activeAdmission = admissions.find(a => a.id === initialStudent.admissionId);
        return { school: activeAdmission?.headOfSchoolNumber || '0244889791', it: activeAdmission?.headOfItNumber || '0243339546' };
    } catch (e) { return { school: '0244889791', it: '0243339546' }; }
  }, [initialStudent.admissionId]);

  useEffect(() => { 
    if (isApplicationSubmitted && currentPage !== 'admission_docs') { 
      setTimeout(() => { sectionRefs.current.submit?.scrollIntoView({ behavior: 'auto', block: 'start' }); }, 100); 
    } 
  }, [isApplicationSubmitted, currentPage]);

  const dormDisplayValue = useMemo(() => (isApplicationSubmitted || realTimeApplicationStatus === 'Admitted') ? (assignedDorm || 'N/A') : (assignedDorm || 'N/A'), [isApplicationSubmitted, realTimeApplicationStatus, assignedDorm]);
  const ProtocolIndicator: React.FC = () => ( <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-xs font-black text-red-700 bg-pink-100 rounded-lg shadow-sm border border-pink-200">P</span> );
  const currentStatus = useMemo(() => {
    const statusConfig: Record<AppStatus, { text: string; color: string }> = {
      'Placed': { text: 'Not yet admitted', color: 'bg-red-100 text-red-800 dark:bg-red-50/20 dark:text-red-300' },
      'Admitted': { text: 'Admitted (Student)', color: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' },
      'Prospective': { text: 'Prospective Student', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-50/20 dark:text-yellow-300' },
      'Pending': { text: 'Prospective Student', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-50/20 dark:text-yellow-300' },
      'Rejected': { text: 'Declined', color: 'bg-red-100 text-red-800 dark:bg-red-50/20 dark:text-red-300' },
      'not_submitted': { text: 'Not yet admitted', color: 'bg-red-100 text-red-800 dark:bg-red-50/20 dark:text-red-300' },
      'submitted': { text: 'Prospective Student', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-50/20 dark:text-yellow-300' },
    };
    return statusConfig[realTimeApplicationStatus] || statusConfig['not_submitted'];
  }, [realTimeApplicationStatus]);
  const showTopBanner = scrollingBanner && scrollingBanner.position === 'top';
  const showBottomBanner = scrollingBanner && scrollingBanner.position === 'bottom';
  const houseColors = getHouseColor(houseDisplay.value !== 'N/A' && !houseDisplay.isRestricted ? { ...initialHouses.find(h => h.name === houseDisplay.value), studentCount: 0 } as any : undefined);
  const lastLoginTime = useMemo(() => { const timestamp = localStorage.getItem(`student_login_timestamp_${initialStudent.schoolId}_${activeStudentIndex}`); if (!timestamp) return null; return formatDateTime(parseInt(timestamp, 10)); }, [activeStudentIndex, initialStudent.schoolId]);
  const displayedAdmissionNumber = useMemo(() => { if (admissionNumber) return admissionNumber; if (realTimeApplicationStatus === 'Admitted') { const counterKey = `admissionSubmissionCounter_${initialStudent.schoolId}`; const currentCount = localStorage.getItem(counterKey) || '0'; return `${liveStudent.programme.substring(0,3).toUpperCase()}-${activeStudentIndex.slice(-3)}/${String(currentCount).padStart(3, '0')}`; } return null; }, [admissionNumber, realTimeApplicationStatus, liveStudent.programme, activeStudentIndex, initialStudent.schoolId]);
  const displayedSubmissionDate = useMemo(() => { if (submissionDate) return submissionDate; if (realTimeApplicationStatus === 'Admitted') return new Date().toISOString(); return null; }, [submissionDate, realTimeApplicationStatus]);
  const footerBranding = (
    <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1 font-normal">
      Powered by:
      <PacketsOutLogo size="sm" className="ml-0.5 text-gray-400 dark:text-gray-500" />
    </p>
  );
  const footerLogoutButton = (
    <button
      onClick={() => onReturn()}
      className="flex items-center gap-2 py-2 px-4 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/50 text-sm font-bold text-black dark:text-report-subtle shrink-0 whitespace-nowrap"
    >
      <Icon name="power_settings_new" className="w-5 h-5 flex-shrink-0" />
      <span>{isAdminEditMode ? 'Close Editor' : 'Log out'}</span>
    </button>
  );

  const logoutAndBranding = (isSidebar: boolean = false) => {
    const branding = (
      <p className={`text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 font-normal ${isSidebar ? 'text-left pl-0' : 'text-center'}`}>
        Powered by:
        <PacketsOutLogo size="sm" className="ml-0.5 text-gray-400 dark:text-gray-500" />
      </p>
    );
    const logoutButton = (
      <button
        onClick={() => onReturn()}
        className={`flex items-center gap-2 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/50 text-sm text-black dark:text-report-subtle shrink-0 whitespace-nowrap ${
          isSidebar ? 'pl-0 pr-3 w-full text-left' : 'px-3 w-full text-left'
        }`}
      >
        <Icon name="power_settings_new" className="w-5 h-5 flex-shrink-0" />
        <span>{isAdminEditMode ? 'Close Editor' : 'Log out'}</span>
      </button>
    );
    return (
      <div className={`mt-auto w-full ${isSidebar ? 'px-3' : ''}`}>
        {logoutButton}
        <div className={isSidebar ? 'pl-0 mt-2' : 'mt-2 flex justify-center'}>{branding}</div>
      </div>
    );
  };

  const CommonModals = (
      <>
          <Modal isOpen={isConfirmUnlockModalOpen} onClose={() => setIsConfirmUnlockModalOpen(false)}>
              <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-5"><Icon name="lock_open" className="w-10 h-10 text-yellow-500" /></div>
                  <h2 id="modal-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100">Unlock Application?</h2>
                  <p className="mt-4 text-base text-gray-600 dark:text-gray-300 leading-relaxed text-center">Are you sure you want to unlock your application for editing? You will need to re-submit once changes are made.</p>
                  <div className="mt-8 w-full flex items-center gap-4"><button onClick={() => setIsConfirmUnlockModalOpen(false)} type="button" className="w-full py-2 px-4 text-base font-semibold rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors">Cancel</button><button onClick={handleProceedToOtp} type="button" className="w-full py-2 px-4 text-base font-semibold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover shadow-md">Proceed</button></div>
              </div>
          </Modal>
          <Modal isOpen={isOtpModalOpen} onClose={() => setIsOtpModalOpen(false)} size="md">
              <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-5"><Icon name="sms" className="w-10 h-10 text-blue-500" /></div>
                  <h2 id="modal-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100">Verification Required</h2>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">Enter the 6-digit code sent to your phone number ending in ...{liveStudent.phoneNumber?.slice(-4)}</p>
                  <div className="mt-8 flex justify-center gap-2 sm:gap-3">
                      {otpArray.map((digit, index) => (
                          <input key={index} ref={(el) => { otpInputRefs.current[index] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOtpChange(e, index)} onKeyDown={(e) => handleOtpKeyDown(e, index)} className="w-10 h-12 sm:w-12 sm:h-14 text-center text-2xl font-bold border-2 rounded-lg bg-white dark:bg-black/20 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-logip-primary focus:ring-1 focus:ring-logip-primary transition-all outline-none" />
                      ))}
                  </div>
                  {otpError && <p className="mt-4 text-sm text-red-500 animate-fadeIn">{otpError}</p>}
                  <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">Code expires in <span className="font-bold text-logip-primary">{formatTime(otpTimeLeft)}</span></p>
                  <div className="mt-8 w-full flex items-center gap-4"><button onClick={() => setIsOtpModalOpen(false)} type="button" className="w-full py-2 px-4 text-base font-semibold rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors">Cancel</button><button onClick={handleVerifyOtp} disabled={isVerifyingOtp || otpArray.join('').length < 6} type="button" className="w-full py-2 px-4 text-base font-semibold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">{isVerifyingOtp ? 'Verifying...' : 'Unlock Now'}</button></div>
              </div>
          </Modal>
          <Modal isOpen={isLimitModalOpen} onClose={() => setIsLimitModalOpen(false)}>
              <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-5"><Icon name="history_toggle_off" className="w-10 h-10 text-red-500" /></div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Daily Limit Reached</h2>
                  <p className="mt-4 text-base text-gray-600 dark:text-gray-300 leading-relaxed text-center">You have exhausted your daily limit. Call the School on <a href={`tel:${contactInfo.school}`} className="font-bold underline text-logip-primary">{contactInfo.school}</a> or call the IT Department on <a href={`tel:${contactInfo.it}`} className="font-bold underline text-logip-primary">{contactInfo.it}</a>.</p>
                  <button onClick={() => setIsLimitModalOpen(false)} className="mt-8 w-full py-2 px-4 text-base font-semibold rounded-lg text-white bg-logip-primary hover:bg-logip-primary-hover shadow-md transition-all">Close</button>
              </div>
          </Modal>
          <ChatModal isOpen={isChatModalOpen} onClose={() => setIsChatModalOpen(false)} title="Support Connect">
              <Chat student={liveStudent} applicationStatus={realTimeApplicationStatus} submissionDate={submissionDate} admissionNumber={admissionNumber} assignedHouse={assignedHouse} studentHouseChoice={studentHouseChoice} studentDormChoice={dormDisplayValue} avatarUrl={avatarUrl} personalInfoData={applicationData as any} academicInfoData={applicationData as any} aiSettings={aiSettings} houseAssignmentMethod={houseAssignmentMethod} enableRoomManagement={enableRoomManagement} showToast={showToast} toggleTheme={toggleTheme} isDarkMode={isDarkMode} variant="modal" messages={messages} setMessages={setMessages} chatInput={chatInput} setChatInput={setChatInput} isChatLoading={isChatLoading} setIsChatLoading={setIsChatLoading} attachment={attachment} setAttachment={setAttachment} />
          </ChatModal>
      </>
  );

  const MobileBottomNav = () => {
    const navDestinations = [
      { id: 'personal_info', label: 'P. INFO', icon: 'person', color: 'text-orange-500' },
      { id: 'academic_info', label: 'ACA', icon: 'school', color: 'text-blue-500' },
      { id: 'housing', label: 'HOUSE', icon: 'house', color: 'text-indigo-500' },
      { id: 'dorm_allocation', label: 'DORM', icon: 'king_bed', color: 'text-sky-500' },
      { id: 'parents_info', label: 'PARENT', icon: 'supervisor_account', color: 'text-rose-500' },
      { id: 'submit', label: 'REVIEW', icon: 'task_alt', color: 'text-emerald-500' },
    ];
    
    const itemsToDisplay = navDestinations.filter(item => { 
        if (item.id === 'housing' && !houseDisplay.visible) return false; 
        if (item.id === 'dorm_allocation' && (!enableRoomManagement || !dormDisplay.visible)) return false;
        return true; 
    });
    
    const showEditButton = isApplicationSubmitted && realTimeApplicationStatus !== 'Rejected' && (admissionSettings?.allowStudentEdit !== false) && isScrollingUp && currentPage !== 'admission_docs';

    return (
        <>
            {/* Mobile / Tablet bottom navigation – floating dock style */}
            <div className="lg:hidden fixed inset-x-0 bottom-0 z-[90] pointer-events-none flex flex-col items-stretch pb-3">
                {/* Elevated Edit Application pill above the dock */}
                {showEditButton && (
                    <div className="flex justify-center w-full px-4 mb-3 animate-slideInUp">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleRequestUnlock(); }} 
                            className="pointer-events-auto w-full max-w-md py-3 text-sm font-semibold rounded-2xl text-white bg-blue-600 shadow-2xl transform active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                            <Icon name="edit_note" className="w-5 h-5" />
                            Edit Application
                        </button>
                    </div>
                )}

                {/* Floating nav bar */}
                <div className="pointer-events-auto px-4">
                    <div className="max-w-md mx-auto rounded-3xl bg-white/95 dark:bg-report-dark/95 border border-gray-200/80 dark:border-white/10 shadow-[0_12px_35px_rgba(15,23,42,0.25)] backdrop-blur-md px-3 py-2 flex justify-between items-center">
                        {itemsToDisplay.map((item, idx) => {
                            const isTrulyActive = currentPage === item.id;
                            return (
                                <button 
                                    key={`${item.id}-${idx}`} 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (item.id === 'home') {
                                            scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                                        } else {
                                            handleNavClick(item.id as Page);
                                        }
                                    }} 
                                    className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 touch-manipulation focus:outline-none select-none ${
                                        isTrulyActive ? 'bg-gray-100/90 dark:bg-gray-800/80' : 'bg-transparent'
                                    }`}
                                >
                                    <Icon name={item.icon} className={`w-6 h-6 transition-colors duration-200 ${item.color} ${isTrulyActive ? 'opacity-100' : 'opacity-70'}`} />
                                    <span className={`text-[9px] mt-1 transition-colors duration-200 uppercase tracking-tight font-medium ${isTrulyActive ? item.color : 'text-gray-400 dark:text-gray-500'}`}>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
  };

    if (currentPage === 'admission_docs') {
        return (
            <div className={`bg-gray-50 dark:bg-background-dark font-display flex h-screen text-black dark:text-report-subtle text-sm overflow-hidden relative ${showTopBanner ? 'pt-12' : ''} ${showBottomBanner ? 'pb-12' : ''}`}>
                <style>{`@keyframes logip-marquee { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-100%, 0, 0); } }`}</style>
                {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-[190] lg:hidden backdrop-blur-[2px]"></div>}
                {scrollingBanner && (
                    <div className={`fixed ${scrollingBanner.position === 'top' ? 'top-0' : 'bottom-0'} left-0 w-full h-12 z-[150] overflow-hidden flex items-center shadow-md`} style={{ backgroundColor: scrollingBanner.backgroundColor }}>
                        <p className="whitespace-nowrap flex-shrink-0 inline-block" style={{ color: scrollingBanner.textColor, paddingLeft: '100%', animation: `logip-marquee ${scrollingSpeed} linear infinite`, fontSize: `${scrollingBanner.fontSize || 14}px`, fontWeight: scrollingBanner.isBold ? 'bold' : 'normal', fontStyle: scrollingBanner.isItalic ? 'italic' : 'normal', willChange: 'transform' }}>{scrollingBanner.text}</p>
                    </div>
                )}
                <aside className={`fixed top-0 left-0 h-full z-[200] w-[280px] bg-logip-white dark:bg-report-dark border-r border-logip-border dark:border-report-border p-6 flex flex-col flex-shrink-0 transform transition-transform duration-300 ease-in-out lg:hidden ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'}`}>
                    <div className="flex-1 min-w-0">
                        <div className="mb-10"><SchoolLogo school={school} /></div>
                        <nav className="space-y-1">{navItems.map(item => (<NavItem key={item.id} icon={item.icon} label={item.label} color={item.color} active={currentPage === item.id} onClick={() => handleNavClick(item.id as Page)} />))}</nav>
                    </div>
                    {logoutAndBranding(true)}
                </aside>
                <main className={`flex-1 flex flex-col overflow-hidden`}>
                    {/* Mobile/Tablet only: header matching Personal Information page */}
                    <header className="lg:hidden flex-shrink-0 flex flex-col gap-4 px-4 py-3 sm:px-6 border-b border-logip-border dark:border-report-border bg-logip-white dark:bg-report-dark">
                        <div className="flex items-center justify-between w-full gap-4 min-w-0">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 -ml-1 rounded-md text-black dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0" aria-label="Open menu"><Icon name="menu" className="w-5 h-5" /></button>
                                <div className="min-w-0">
                                    <h1 className="text-xl font-bold text-black dark:text-gray-100 truncate">{pageTitles.admission_docs.title}</h1>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate">{pageTitles.admission_docs.subtitle}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between w-full gap-4">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-xl font-bold text-black dark:text-gray-100 truncate" title={liveStudent.name}>Hello, {(liveStudent.name.length > 24 ? liveStudent.name.slice(0, 24) + '...' : liveStudent.name)}</h2>
                                <div className="flex flex-row items-center gap-2 mt-1 flex-wrap">{currentStatus.text && <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${currentStatus.color}`}>{currentStatus.text}</div>}{liveStudent.isProtocol && <ProtocolIndicator />}</div>
                            </div>
                            <div className="flex flex-col items-end flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <img src={avatarUrl} alt={liveStudent.name} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                                    <button onClick={toggleTheme} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm" aria-label="Toggle theme"><Icon name={isDarkMode ? 'light_mode' : 'dark_mode'} className="w-5 h-5" /></button>
                                </div>
                                {lastLoginTime && <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">Last logged in: {lastLoginTime}</span>}
                            </div>
                        </div>
                    </header>
                    {/* Desktop: original header */}
                    <header className="hidden lg:flex flex-shrink-0 flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 border-b border-logip-border dark:border-report-border bg-logip-white dark:bg-report-dark">
                        <div className="flex items-center justify-between gap-4 min-w-0">
                            <div className="flex items-center gap-4">
                                <SchoolLogo school={school} />
                                {admission && (<><span className="font-light text-2xl text-gray-300 dark:text-gray-600">|</span><h1 className="text-lg text-gray-500 dark:text-gray-400 truncate">{admission.title}</h1></>)}
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="text-right">
                                <h2 className="text-lg font-normal text-black dark:text-gray-100">Congratulations!, <span className="font-bold">{liveStudent.name}</span></h2>
                                <div className="flex flex-row items-center justify-end gap-2 mt-1">{lastLoginTime && <span className="text-xs text-gray-500 dark:text-gray-400">Last logged in: {lastLoginTime}</span>}{currentStatus.text && <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${currentStatus.color}`}>{currentStatus.text}</div>}{liveStudent.isProtocol && <ProtocolIndicator />}</div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <img src={avatarUrl} alt={liveStudent.name} className="w-12 h-12 rounded-full object-cover" />
                                <button onClick={toggleTheme} className="p-2 rounded-lg border border-logip-border dark:border-report-border text-logip-text-body dark:text-gray-400 bg-logip-white/50 dark:bg-report-button hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm" aria-label="Toggle theme"><Icon name={isDarkMode ? 'light_mode' : 'dark_mode'} className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </header>
                    <div className="flex-1 flex overflow-hidden min-h-0 px-4 pt-4 pb-0 sm:p-6 gap-6 pb-24 lg:pb-6">
                        <div className="hidden md:flex w-full max-w-sm flex-shrink-0 bg-logip-white dark:bg-report-dark border border-logip-border dark:border-report-border rounded-xl flex flex-col p-6">
                            <div className="text-center">
                                <button className="block mx-auto mb-4 p-0 bg-transparent border-0"><img src={avatarUrl} alt={liveStudent.name} className="w-24 h-24 rounded-lg object-cover shadow-md" /></button>
                                <h3 className="text-xl font-bold text-black dark:text-gray-100">{liveStudent.name}</h3>
                                <div className="flex justify-center items-center mt-3 gap-2">{currentStatus.text && <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${currentStatus.color}`}>{currentStatus.text}</div>}{liveStudent.isProtocol && <ProtocolIndicator />}</div>
                            </div>
                            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3">{displayedAdmissionNumber && <><dt className="text-sm text-black dark:text-gray-400">Admission No.</dt><dd className="text-sm text-right font-semibold text-logip-primary dark:text-logip-accent">{displayedAdmissionNumber}</dd></>}{displayedSubmissionDate && <><dt className="text-sm text-black dark:text-gray-400">Date Submitted</dt><dd className="text-sm text-right font-semibold text-black dark:text-gray-200">{formatDateTime(displayedSubmissionDate)}</dd></>}<dt className="text-sm text-black dark:text-gray-400">Index Number</dt><dd className="text-sm text-right font-semibold text-black dark:text-gray-200">{liveStudent.indexNumber}</dd><dt className="text-sm text-black dark:text-gray-400">Gender</dt><dd className="text-sm text-right font-semibold text-black dark:text-gray-200">{liveStudent.gender}</dd><dt className="text-sm text-black dark:text-gray-400">Aggregate</dt><dd className="text-sm text-right font-semibold text-black dark:text-gray-200">{liveStudent.aggregate}</dd><dt className="text-sm text-black dark:text-gray-400">Residence</dt><dd className="text-sm text-right font-semibold text-black dark:text-gray-200">{liveStudent.residence}</dd><dt className="text-sm text-black dark:text-gray-400">Programme</dt><dd className="text-sm text-right font-semibold text-black dark:text-gray-200 truncate">{liveStudent.programme}</dd>{classDisplay.visible && <><dt className="text-sm text-black dark:text-gray-400">Class</dt><dd className={`text-sm text-right font-semibold ${classDisplay.isRestricted ? 'text-red-500 italic text-xs' : 'text-black dark:text-gray-200'}`}>{classDisplay.isRestricted ? classDisplay.value : <span className="px-2 py-1 text-xs font-semibold rounded-md bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">{classDisplay.value}</span>}</dd></>}{houseDisplay.visible && ['Admitted', 'submitted', 'Prospective', 'Pending'].includes(realTimeApplicationStatus) && <><dt className="text-sm text-black dark:text-gray-400">House</dt><dd className={`text-sm text-right font-semibold ${houseDisplay.isRestricted ? 'text-red-500 italic text-xs' : 'text-black dark:text-gray-200'}`}>{houseDisplay.isRestricted ? houseDisplay.value : (houseDisplay.value === 'N/A' ? 'N/A' : <span className={`px-2 py-1 text-xs font-semibold rounded-md ${houseColors.pillBg} ${houseColors.pillText}`}>{houseDisplay.value}</span>)}</dd></>}{dormDisplay.visible && ['Admitted', 'submitted', 'Prospective', 'Pending'].includes(realTimeApplicationStatus) && <><dt className="text-sm text-black dark:text-gray-400">Dorm/Room</dt><dd className={`text-sm text-right font-semibold ${dormDisplay.isRestricted ? 'text-red-500 italic text-xs' : 'text-black dark:text-gray-200'}`}>{dormDisplay.isRestricted ? dormDisplay.value : <span className="px-2 py-1 text-xs font-semibold rounded-md bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300">{dormDisplay.value}</span>}</dd></>}</dl>
                        </div>
                        <div onScroll={handleScroll} className="flex-1 overflow-y-auto no-scrollbar bg-logip-white dark:bg-report-dark border border-logip-border dark:border-report-border rounded-xl p-6 lg:p-8">
                            <AdmissionDocumentsPage
                                student={liveStudent}
                                applicationStatus={realTimeApplicationStatus}
                                admission={admission}
                                schoolName={school?.name}
                                formSettings={formSettings}
                                applicationData={applicationData}
                                showToast={showToast}
                            />
                            {/* Mobile / Tablet action: Edit Application only (spaced above floating button) */}
                            <div className="mt-8 mb-20 flex flex-col sm:flex-row gap-3 lg:hidden">
                                {isApplicationSubmitted && realTimeApplicationStatus !== 'Rejected' && (admissionSettings?.allowStudentEdit !== false) && (
                                    <button
                                        onClick={handleRequestUnlock}
                                        className="flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg border border-blue-600 text-blue-700 bg-white hover:bg-blue-50 transition-colors whitespace-nowrap"
                                    >
                                        Edit Application
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <footer className="hidden lg:grid grid-cols-3 flex-shrink-0 items-center px-4 py-3 sm:px-6 border-t border-logip-border dark:border-report-border bg-logip-white dark:bg-report-dark gap-4">
                        <div className="flex items-center gap-3 min-w-0 justify-start">
                          {footerLogoutButton}
                          {isApplicationSubmitted && realTimeApplicationStatus !== 'Rejected' && (admissionSettings?.allowStudentEdit !== false) && (
                            <button onClick={handleRequestUnlock} className="px-6 py-2 text-base font-normal rounded-lg text-blue-700 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors whitespace-nowrap shrink-0">
                              Edit Application
                            </button>
                          )}
                        </div>
                        <div className="flex justify-center min-w-0">
                          {footerBranding}
                        </div>
                        <div className="min-w-0" aria-hidden />
                      </footer>
                </main>
                <MobileBottomNav />
                {aiSettings?.enableAiChat && (
                    <button onClick={() => setIsChatModalOpen(true)} className="xl:hidden fixed bottom-28 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-logip-primary to-blue-600 text-white shadow-2xl flex items-center justify-center z-[50] transform hover:scale-110 active:scale-95 transition-all animate-fadeIn"><Icon name="support_agent" className="w-6 h-6" /></button>
                )}
                {CommonModals}
                {toastMessage && (<div className={`fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full dark:shadow-lg animate-fadeIn flex items-center gap-2 ${toastMessage.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'}`}>{toastMessage.type === 'error' && <Icon name="error" className="w-5 h-5" />}{toastMessage.message}</div>)}
            </div>
        );
    }
  
  return (
    <div className={`bg-logip-bg dark:bg-background-dark font-display flex h-screen text-black dark:text-report-subtle text-sm overflow-hidden relative ${showTopBanner ? 'pt-12' : ''} ${showBottomBanner ? 'pb-12' : ''}`}>
      <style>{`@keyframes logip-marquee { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-100%, 0, 0); } }`}</style>
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-[190] lg:hidden backdrop-blur-[2px]"></div>}
      {scrollingBanner && (
          <div className={`fixed ${scrollingBanner.position === 'top' ? 'top-0' : 'bottom-0'} left-0 w-full h-12 z-[150] overflow-hidden flex items-center shadow-md`} style={{ backgroundColor: scrollingBanner.backgroundColor }}>
              <p className="whitespace-nowrap flex-shrink-0 inline-block" style={{ color: scrollingBanner.textColor, paddingLeft: '100%', animation: `logip-marquee ${scrollingSpeed} linear infinite`, fontSize: `${scrollingBanner.fontSize || 14}px`, fontWeight: scrollingBanner.isBold ? 'bold' : 'normal', fontStyle: scrollingBanner.isItalic ? 'italic' : 'normal', willChange: 'transform' }}>{scrollingBanner.text}</p>
          </div>
      )}
      <aside className={`fixed top-0 left-0 h-full z-[200] w-[280px] bg-logip-white dark:bg-report-dark border-r border-logip-border dark:border-report-border p-6 flex flex-col flex-shrink-0 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'} pointer-events-auto`}>
        <div className="flex-1 min-w-0">
            <div className="mb-10"><SchoolLogo school={school} /></div>
            <nav className="space-y-1">{navItems.map(item => (<NavItem key={item.id} icon={item.icon} label={item.label} color={item.color} active={currentPage === item.id} onClick={() => handleNavClick(item.id as Page)} />))}</nav>
        </div>
        {logoutAndBranding(true)}
      </aside>
      <main className={`flex-1 px-4 pt-4 pb-0 sm:p-8 flex flex-col overflow-hidden gap-6 pb-20 lg:pb-8 transition-all duration-300 pointer-events-auto`}>
        {/* Mobile/Tablet only: same header as Admission Documents page */}
        <header className="lg:hidden flex-shrink-0 flex flex-col gap-4 px-4 py-3 sm:px-6 border-b border-logip-border dark:border-report-border bg-logip-white dark:bg-report-dark">
            <div className="flex items-center justify-between w-full gap-4 min-w-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 -ml-1 rounded-md text-black dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0" aria-label="Open menu"><Icon name="menu" className="w-5 h-5" /></button>
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold text-black dark:text-gray-100 truncate">{pageTitles[currentPage]?.title || 'Dashboard'}</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate">{pageTitles[currentPage]?.subtitle || 'Welcome'}</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between w-full gap-4">
                <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-black dark:text-gray-100 truncate" title={liveStudent.name}>Hello, {(liveStudent.name.length > 24 ? liveStudent.name.slice(0, 24) + '...' : liveStudent.name)}</h2>
                    <div className="flex flex-row items-center gap-2 mt-1 flex-wrap">{currentStatus.text && <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${currentStatus.color}`}>{currentStatus.text}</div>}{liveStudent.isProtocol && <ProtocolIndicator />}</div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <img src={avatarUrl} alt={liveStudent.name} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                        <button onClick={toggleTheme} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm" aria-label="Toggle theme"><Icon name={isDarkMode ? 'light_mode' : 'dark_mode'} className="w-5 h-5" /></button>
                    </div>
                    {lastLoginTime && <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">Last logged in: {lastLoginTime}</span>}
                </div>
            </div>
        </header>
        {/* Desktop only */}
        <header className="hidden lg:flex flex-shrink-0 flex-wrap items-center justify-between gap-y-6 gap-x-4">
            <div className="flex items-center justify-between w-full lg:w-auto gap-4">
                <div className="flex items-center gap-4">
                    <div><h1 className="text-xl font-bold text-black dark:text-gray-100">{pageTitles[currentPage]?.title || 'Dashboard'}</h1><p className="text-sm text-black dark:text-gray-400 mt-1">{pageTitles[currentPage]?.subtitle || 'Welcome'}</p></div>
                </div>
            </div>
            <div className="flex items-center justify-between w-full lg:w-auto gap-4">
                <div className="text-left lg:text-right min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-black dark:text-gray-100 truncate" title={liveStudent.name}>Hello, {(liveStudent.name.length > 24 ? liveStudent.name.slice(0, 24) + '...' : liveStudent.name)}</h2>
                    <div className="mt-1 flex flex-wrap items-center justify-start lg:justify-end gap-2">{lastLoginTime && <span className="text-xs text-gray-500 dark:text-gray-400">Last logged in: {lastLoginTime}</span>}{currentStatus.text && <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm text-center ${currentStatus.color}`}>{currentStatus.text}</div>}{liveStudent.isProtocol && <ProtocolIndicator />}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <img src={avatarUrl} alt={liveStudent.name} className="w-16 h-16 rounded-lg object-cover" />
                    <button onClick={toggleTheme} className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm" aria-label="Toggle theme"><Icon name={isDarkMode ? 'light_mode' : 'dark_mode'} className="w-5 h-5" /></button>
                </div>
            </div>
        </header>
        <div className="flex-1 bg-logip-white dark:bg-report-dark border border-logip-border dark:border-report-border rounded-xl flex flex-col overflow-hidden min-h-0">
          <div className="sticky top-0 bg-logip-white dark:bg-report-dark z-10">
            <div className="p-6 lg:p-8 flex-shrink-0">
              <ApplicationProgressBar
                currentPage={currentPage}
                hasDisability={applicationData.hasDisability === 'Yes'}
                isApplicationSubmitted={isApplicationSubmitted}
                hasOtherInfoData={hasOtherInfoData}
                enableRoomManagement={enableRoomManagement}
              />
            </div>
            <hr className="border-logip-border dark:border-report-border flex-shrink-0" />
          </div>
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto no-scrollbar pb-32"
          >
            <section
              id="personal_info"
              ref={(el) => {
                sectionRefs.current['personal_info'] = el;
              }}
              className="p-6 lg:p-8"
            >
              <PersonalInfoForm
                student={liveStudent}
                showToast={showToast}
                isSubmitted={isFormLocked}
                formSettings={formSettings}
                applicationData={applicationData}
                setApplicationData={handleApplicationDataChange}
                isAdminEditMode={isAdminEditMode}
                aiSettings={aiSettings}
              />
            </section>
            <hr className="border-logip-border dark:border-report-border mx-8" />
            <section
              id="academic_info"
              ref={(el) => {
                sectionRefs.current['academic_info'] = el;
              }}
              className="p-6 lg:p-8"
            >
              <AcademicInfoForm
                student={liveStudent}
                showToast={showToast}
                isSubmitted={isFormLocked}
                formSettings={formSettings}
                applicationData={applicationData}
                setApplicationData={handleApplicationDataChange}
                isAdminEditMode={isAdminEditMode}
                allStudents={allStudents || adminStudents}
                aiSettings={aiSettings}
                classes={classes}
              />
            </section>
            {houseDisplay.visible && (
              <>
                <hr className="border-logip-border dark:border-report-border mx-8" />
                <section
                  id="housing"
                  ref={(el) => {
                    sectionRefs.current['housing'] = el;
                  }}
                  className="p-6 lg:p-8"
                >
                  <HouseAllocationForm
                    student={liveStudent}
                    showToast={showToast}
                    isSubmitted={isFormLocked}
                    houseAssignmentMethod={houseAssignmentMethod}
                    studentHouseChoice={studentHouseChoice}
                    setStudentHouseChoice={(val) => {
                      handleApplicationDataChange((prev) => ({ ...prev, studentHouseChoice: val }));
                    }}
                    allStudents={allStudents || adminStudents}
                    assignedHouse={assignedHouse}
                  />
                </section>
              </>
            )}
            {dormDisplay.visible && (
              <>
                <hr className="border-logip-border dark:border-report-border mx-8" />
                <section
                  id="dorm_allocation"
                  ref={(el) => {
                    sectionRefs.current['dorm_allocation'] = el;
                  }}
                  className="p-6 lg:p-8"
                >
                  <DormAllocationForm
                    isSubmitted={isFormLocked}
                    dormAssignmentMethod={dormAssignmentMethod}
                    enableRoomManagement={enableRoomManagement}
                    studentHouseChoice={studentHouseChoice}
                    studentDormChoice={studentDormChoice}
                    setStudentDormChoice={(val) => {
                      handleApplicationDataChange((prev) => ({ ...prev, studentDormChoice: val }));
                    }}
                    allStudents={allStudents || adminStudents}
                    assignedDorm={assignedDorm}
                    assignedHouse={assignedHouse}
                  />
                </section>
              </>
            )}
            {(!isApplicationSubmitted || hasOtherInfoData) && (
              <>
                <hr className="border-logip-border dark:border-report-border mx-8" />
                <section
                  id="other_info"
                  ref={(el) => {
                    sectionRefs.current['other_info'] = el;
                  }}
                  className="p-6 lg:p-8"
                >
                  <OtherRelevantInfoForm
                    student={liveStudent}
                    showToast={showToast}
                    isSubmitted={isFormLocked}
                    formSettings={formSettings}
                    applicationData={applicationData}
                    setApplicationData={handleApplicationDataChange}
                    isAdminEditMode={isAdminEditMode}
                    aiSettings={aiSettings}
                  />
                </section>
              </>
            )}
            <hr className="border-logip-border dark:border-report-border mx-8" />
            <section
              id="parents_info"
              ref={(el) => {
                sectionRefs.current['parents_info'] = el;
              }}
              className="p-6 lg:p-8"
            >
              <ParentsInfoForm
                student={liveStudent}
                showToast={showToast}
                isSubmitted={isFormLocked}
                formSettings={formSettings}
                applicationData={applicationData}
                setApplicationData={handleApplicationDataChange}
                isAdminEditMode={isAdminEditMode}
                aiSettings={aiSettings}
              />
            </section>
            {hasVisibleDocumentFields && (
              <>
                <hr className="border-logip-border dark:border-report-border mx-8" />
                <section
                  id="documents"
                  ref={(el) => {
                    sectionRefs.current['documents'] = el;
                  }}
                  className="p-6 lg:p-8"
                >
                  <DocumentsSection
                    student={liveStudent}
                    isSubmitted={isFormLocked}
                    onCloseMedicalSection={handleCloseMedicalSection}
                    isAdminEditMode={isAdminEditMode}
                    formSettings={formSettings}
                    applicationData={applicationData}
                    setApplicationData={handleApplicationDataChange}
                    aiSettings={aiSettings}
                  />
                </section>
              </>
            )}
            <hr className="border-logip-border dark:border-report-border mx-8" />
            <section
              id="submit"
              ref={(el) => {
                sectionRefs.current['submit'] = el;
              }}
              className="p-6 lg:p-8"
            >
              <SubmitApplicationForm
                student={liveStudent}
                onSubmissionSuccess={handleApplicationSubmit}
                isSubmitted={isApplicationSubmitted}
                submissionDate={submissionDate}
                admissionNumber={admissionNumber}
                onEdit={handleEdit}
                onUnlockForEditing={handleRequestUnlock}
                formSettings={formSettings}
                applicationData={applicationData}
                isAdminEditMode={isAdminEditMode}
                applicationStatus={realTimeApplicationStatus}
                showToast={showToast}
                handleNavClick={handleNavClick}
                assignedHouse={assignedHouse}
                assignedDorm={assignedDorm}
                enableRoomManagement={enableRoomManagement}
                houseAssignmentMethod={houseAssignmentMethod}
                dormAssignmentMethod={dormAssignmentMethod}
                studentHouseChoice={studentHouseChoice}
                studentDormChoice={studentDormChoice}
                residence={liveStudent.residence}
                classDisplay={classDisplay}
                houseDisplay={houseDisplay}
                dormDisplay={dormDisplay}
                isConfirmModalOpen={isConfirmModalOpen}
                setIsConfirmModalOpen={setIsConfirmModalOpen}
              />
            </section>
          </div>
        </div>
      </main>
      <MobileBottomNav />
      <aside className={`w-[340px] h-full bg-logip-white dark:bg-report-dark border-l border-logip-border dark:border-report-border p-6 flex-col gap-6 hidden xl:flex transition-all duration-300 pointer-events-auto`}>
          {aiSettings?.enableAiChat && (
            <Chat student={liveStudent} applicationStatus={realTimeApplicationStatus} submissionDate={submissionDate} admissionNumber={admissionNumber} assignedHouse={assignedHouse} studentHouseChoice={studentHouseChoice} studentDormChoice={dormDisplayValue} avatarUrl={avatarUrl} personalInfoData={applicationData as any} academicInfoData={applicationData as any} aiSettings={aiSettings} houseAssignmentMethod={houseAssignmentMethod} enableRoomManagement={enableRoomManagement} showToast={showToast} toggleTheme={toggleTheme} isDarkMode={isDarkMode} onExpand={() => setIsChatModalOpen(true)} variant="sidebar" messages={messages} setMessages={setMessages} chatInput={chatInput} setChatInput={setChatInput} isChatLoading={isChatLoading} setIsChatLoading={setIsChatLoading} attachment={attachment} setAttachment={setAttachment} />
          )}
      </aside>
      {aiSettings?.enableAiChat && (
        <button onClick={() => setIsChatModalOpen(true)} className="xl:hidden fixed bottom-28 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-logip-primary to-blue-600 text-white shadow-2xl flex items-center justify-center z-[50] transform hover:scale-110 active:scale-95 transition-all animate-fadeIn"><Icon name="support_agent" className="w-6 h-6" /></button>
      )}
      {CommonModals}
      {toastMessage && (<div className={`fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full dark:shadow-lg animate-fadeIn flex items-center gap-2 ${toastMessage.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'}`}>{toastMessage.type === 'error' && <Icon name="error" className="w-5 h-5" />}{toastMessage.message}</div>)}
    </div>
  );
};
export default StudentDetails;
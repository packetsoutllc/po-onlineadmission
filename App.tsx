import React, { useState, useEffect } from 'react';
import { setFavicon } from './utils/favicon';
import { sanitizeSlug, safeJsonParse } from './utils/security';
import AuthForm from './components/AuthForm';
import StudentDetails, { ApplicationStatus, Student } from './components/StudentDetails';
import AdminLayout, { AdminUser } from './components/admin/AdminLayout';
import AdminLogin from './components/admin/AdminLogin';
import PaymentGateway from './components/PaymentGateway';
import ApplicantLoginForm from './components/ApplicantLoginForm';
import ProtocolAdmissionPage from './components/ProtocolAdmissionPage';
import LandingPage from './components/LandingPage';
import PacketsOutLogo from './components/PacketsOutLogo';
import { StudentStatus } from './components/admin/pages/StudentsPage';

type StudentView = 'auth' | 'payment' | 'applicant_login' | 'details' | 'protocol_admission';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (localStorage.theme === 'dark') return true;
    if (localStorage.theme === 'light') return false;
    return false; // default to light when no preference stored
  });

  // Derive routing context from the URL
  // Student routes look like: /:schoolSlug/:admissionSlug
  // Admin login route: strictly /login/admin (optionally with trailing slash)
  const rawPath = window.location.pathname;
  const pathSegments = rawPath.split('/').filter(Boolean);
  const isAdminLoginRoute = rawPath === '/login/admin' || rawPath === '/login/admin/';
  const isLandingRoute = pathSegments.length === 0 && !isAdminLoginRoute;
  const schoolSlugFromPath = !isAdminLoginRoute && pathSegments.length >= 1 ? sanitizeSlug(pathSegments[0]) || undefined : undefined;
  const admissionSlugFromPath = !isAdminLoginRoute && pathSegments.length >= 2 ? sanitizeSlug(pathSegments[1]) || undefined : undefined;

  const [currentView, setCurrentView] = useState<StudentView>('auth');
  const [verifiedStudent, setVerifiedStudent] = useState<Student | null>(null);
  const [appMode, setAppMode] = useState<'student' | 'admin'>(() => (isAdminLoginRoute ? 'admin' : 'student'));
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | StudentStatus>('not_submitted');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [activePaymentType, setActivePaymentType] = useState<'initial' | 'doc_access'>('initial');

  useEffect(() => {
    document.documentElement.classList.remove('opacity-0');
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const setAdminFaviconAndTitle = () => {
    document.title = 'Packets Out - Online Admission System';
    setFavicon(null); // use main admin (Packets Out) logo as favicon
  };

  // Favicon + title: landing, admin login, and admin dashboard use main admin logo
  useEffect(() => {
    if (isLandingRoute) {
      setAdminFaviconAndTitle();
      return;
    }
    if (isAdminLoginRoute && !adminUser) {
      setAdminFaviconAndTitle();
      return;
    }
    if (appMode === 'admin' && adminUser) {
      setAdminFaviconAndTitle();
    }
  }, [isLandingRoute, isAdminLoginRoute, appMode, adminUser]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  
  const handleVerificationSuccess = (student: Student, status: ApplicationStatus | StudentStatus, hasPaid: boolean, isExempt: boolean = false, paymentType: 'initial' | 'doc_access' = 'initial') => {
    setVerifiedStudent(student);
    setApplicationStatus(status);
    setActivePaymentType(paymentType);

    // Flow Requirement: Always show Serial/PIN login page if "Paid" or "Exempt"
    if (hasPaid || isExempt) { 
        setCurrentView('applicant_login');
    } else { 
        setCurrentView('payment');
    }
  };

  const handlePaymentSuccess = () => {
    setCurrentView('applicant_login');
  };
  
  const handleApplicantLoginSuccess = () => {
    setCurrentView('details');
  }

  const handleReturnToVerification = () => {
    setVerifiedStudent(null);
    setCurrentView('auth');
    setAppMode('student');
  };

  const handleSwitchToAdmin = () => {
    setAppMode('admin');
    setCurrentView('auth');
  };

  const handleSwitchToProtocolAdmission = () => {
    setCurrentView('protocol_admission');
  };

  const handleAdminLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
  };

  const handleAdminLogoutAndReturn = () => {
    setAdminUser(null);
    setCurrentView('auth');
    setAppMode('admin');
    setVerifiedStudent(null);
    window.history.replaceState({}, '', '/login/admin');
  };

  const isDashboardView = (appMode === 'admin' && !!adminUser) || 
                          (appMode === 'student' && currentView === 'details');

  // Root path: show Packets Out landing page for selecting school
  if (isLandingRoute) {
    return <LandingPage toggleTheme={toggleTheme} isDarkMode={isDarkMode} />;
  }

  if (isDashboardView) {
    const dashboardContent = appMode === 'admin' && adminUser
      ? <AdminLayout
            adminUser={adminUser}
            setAdminUser={setAdminUser}
            toggleTheme={toggleTheme}
            isDarkMode={isDarkMode}
            onExitAdmin={handleAdminLogoutAndReturn}
        />
      : <StudentDetails 
            student={verifiedStudent!} 
            onReturn={handleReturnToVerification} 
            applicationStatus={applicationStatus} 
            toggleTheme={toggleTheme} 
            isDarkMode={isDarkMode}
        />;
      
    return (
      <div>
        {dashboardContent}
      </div>
    );
  }

  let authContent: React.ReactNode;
  let authContentKey: string;

  if (appMode === 'admin' && !adminUser) {
      authContentKey = 'admin-login';
      authContent = <AdminLogin onLoginSuccess={handleAdminLoginSuccess} onReturnToStudentView={handleAdminLogoutAndReturn} />;
  } else {
      authContentKey = currentView;
      switch (currentView) {
          case 'auth':
              authContent = (
                <AuthForm
                  schoolSlug={schoolSlugFromPath}
                  admissionSlug={admissionSlugFromPath}
                  onVerificationSuccess={handleVerificationSuccess}
                  onSwitchToAdmin={handleSwitchToAdmin}
                  onSwitchToProtocolAdmission={handleSwitchToProtocolAdmission}
                />
              );
              break;
          case 'payment':
              const financialsKey = `financialsSettings_${verifiedStudent?.schoolId}_${verifiedStudent?.admissionId}`;
              const financialsRaw = localStorage.getItem(financialsKey);
              const financials = safeJsonParse<Record<string, unknown>>(financialsRaw, {});
              // Same card as Admission Document Access modal: white panel, rounded, shadow, border
              authContent = (
                <div className="w-full max-w-4xl mx-auto bg-white dark:bg-[#1C1A27] rounded-xl border border-gray-200/50 dark:border-transparent shadow-2xl overflow-hidden">
                  <PaymentGateway 
                    student={verifiedStudent!} 
                    onPaymentSuccess={handlePaymentSuccess} 
                    onClose={handleReturnToVerification}
                    isInitialVoucherPayment={activePaymentType === 'initial'}
                    customPrice={activePaymentType === 'doc_access' ? financials.docAccessFeePrice : undefined}
                    customTitle={activePaymentType === 'doc_access' ? "Admission Document Access" : undefined}
                    customSubtitle={activePaymentType === 'doc_access' ? "One-time payment to unlock your admission documents for printing." : undefined}
                  />
                </div>
              );
              break;
          case 'applicant_login':
              authContent = (
                <ApplicantLoginForm
                  student={verifiedStudent!}
                  onLoginSuccess={handleApplicantLoginSuccess}
                  onClose={handleReturnToVerification}
                />
              );
              break;
          case 'protocol_admission':
              authContent = (
                <ProtocolAdmissionPage
                  onReturnToVerification={handleReturnToVerification}
                  schoolSlug={schoolSlugFromPath}
                  admissionSlug={admissionSlugFromPath}
                />
              );
              break;
          default:
              authContent = <div className="p-10 text-center">Error: Invalid view</div>;
      }
  }

  const isAuthView = currentView === 'auth';
  const mainMaxWidthClass =
    currentView === 'payment' || currentView === 'protocol_admission'
      ? 'max-w-4xl'
      : isAuthView
      ? 'max-w-6xl'
      : 'max-w-lg';
  const applyPadding = currentView !== 'payment' && !isAuthView;

  return (
    <>
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-50 p-2 rounded-full text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors"
        aria-label="Toggle theme"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          {isDarkMode ? (
            // Sun icon for light mode
            <>
              <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 3V5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M12 18.5V21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M4.22 4.22L5.99 5.99" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M18.01 18.01L19.78 19.78" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M3 12H5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M18.5 12H21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M4.22 19.78L5.99 18.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M18.01 5.99L19.78 4.22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </>
          ) : (
            // Moon icon for dark mode
            <path
              d="M19.5 13.25C19.19 13.3 18.87 13.33 18.55 13.33C13.9 13.33 10.17 9.6 10.17 4.95C10.17 4.63 10.2 4.31 10.25 4C7.48 4.47 5.39 6.85 5.39 9.71C5.39 13.35 8.34 16.29 11.98 16.29C14.84 16.29 17.22 14.21 17.69 11.43C17.62 11.45 17.55 11.46 17.48 11.47L19.5 13.25Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </button>

      <div className="relative min-h-screen w-full flex items-center justify-center p-4 py-8 overflow-y-auto bg-logip-bg dark:bg-background-dark">
        <main className={`relative z-10 w-full ${mainMaxWidthClass}`}>
          <div
            className={`relative w-full ${
              isAuthView || currentView === 'payment'
                ? ''
                : `bg-logip-white dark:bg-report-dark rounded-xl border border-logip-border dark:border-report-border ${
                    applyPadding ? 'p-8 sm:p-10' : 'overflow-hidden'
                  }`
            }`}
          >
            <div key={authContentKey}>
              {authContent}
            </div>
          </div>
        </main>
        <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <p className="text-xs text-gray-500/80 dark:text-gray-400/60 flex items-center justify-center gap-1.5">
            Powered by
            <PacketsOutLogo size="sm" className="ml-1 text-gray-500/80 dark:text-gray-400/60" />
          </p>
        </footer>
      </div>
    </>
  );
}

export default App;
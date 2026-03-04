import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import StudentDetails, { ApplicationStatus, Student } from './components/StudentDetails';
import AdminLayout, { AdminUser } from './components/admin/AdminLayout';
import AdminLogin from './components/admin/AdminLogin';
import PaymentGateway from './components/PaymentGateway';
import ApplicantLoginForm from './components/ApplicantLoginForm';
import ProtocolAdmissionPage from './components/ProtocolAdmissionPage';
import LandingPage from './components/LandingPage';
import { StudentStatus } from './components/admin/pages/StudentsPage';

type StudentView = 'auth' | 'payment' | 'applicant_login' | 'details' | 'protocol_admission';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (localStorage.theme === 'dark') return true;
    if (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
    return false;
  });

  // Derive routing context from the URL
  // Student routes look like: /:schoolSlug/:admissionSlug
  // Admin login route: strictly /login/admin (optionally with trailing slash)
  const rawPath = window.location.pathname;
  const pathSegments = rawPath.split('/').filter(Boolean);
  const isAdminLoginRoute = rawPath === '/login/admin' || rawPath === '/login/admin/';
  const isLandingRoute = pathSegments.length === 0 && !isAdminLoginRoute;
  const schoolSlugFromPath = !isAdminLoginRoute && pathSegments.length >= 1 ? pathSegments[0] : undefined;
  const admissionSlugFromPath = !isAdminLoginRoute && pathSegments.length >= 2 ? pathSegments[1] : undefined;

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

  const setPacketsOutBranding = () => {
    document.title = 'Packets Out - Online Admission System';

    try {
      const head = document.head || document.getElementsByTagName('head')[0];
      if (!head) return;

      let link = head.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        head.appendChild(link);
      }

      const svgIcon =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="6" y="6" width="5" height="20" rx="2.5" fill="#111827"/><rect x="14" y="9" width="5" height="17" rx="2.5" fill="#111827"/><path d="M22 11L27 9L28 14L24 15.5L22 11Z" fill="none" stroke="#0EA5E9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 11L25.5 14.5L28 14" fill="none" stroke="#0EA5E9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      const encoded = encodeURIComponent(svgIcon);
      link.href = `data:image/svg+xml,${encoded}`;
    } catch {
      // ignore favicon errors
    }
  };

  // Set title and favicon for admin login route
  useEffect(() => {
    if (isAdminLoginRoute && !adminUser) {
      setPacketsOutBranding();
    }
  }, [isAdminLoginRoute, adminUser]);

  // Set title and favicon for main landing page
  useEffect(() => {
    if (isLandingRoute) {
      setPacketsOutBranding();
    }
  }, [isLandingRoute]);

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
    setAppMode('student');
    setAdminUser(null);
    setCurrentView('auth');
    setVerifiedStudent(null);
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
      <div className="animate-fadeIn">
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
              const financials = financialsRaw ? JSON.parse(financialsRaw) : {};
              
              authContent = (
                <PaymentGateway 
                    student={verifiedStudent!} 
                    onPaymentSuccess={handlePaymentSuccess} 
                    onClose={handleReturnToVerification}
                    isInitialVoucherPayment={activePaymentType === 'initial'}
                    customPrice={activePaymentType === 'doc_access' ? financials.docAccessFeePrice : undefined}
                    customTitle={activePaymentType === 'doc_access' ? "Document Access Fee" : undefined}
                    customSubtitle={activePaymentType === 'doc_access' ? "One-time payment to unlock your admission documents for printing." : undefined}
                />
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
        <span className="material-symbols-outlined">
          {isDarkMode ? 'light_mode' : 'dark_mode'}
        </span>
      </button>

      <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-logip-bg dark:bg-background-dark">
        <main className={`relative z-10 w-full ${mainMaxWidthClass} transition-all duration-300`}>
          <div
            className={`relative w-full ${
              isAuthView
                ? ''
                : `bg-logip-white dark:bg-report-dark rounded-xl border border-logip-border dark:border-report-border ${
                    applyPadding ? 'p-8 sm:p-10' : 'overflow-hidden'
                  }`
            }`}
          >
            <div key={authContentKey} className="animate-fadeIn">
              {authContent}
            </div>
          </div>
        </main>
        <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <p className="text-xs text-gray-500/80 dark:text-gray-400/60 flex items-center justify-center gap-1.5">
            Powered by
            <span className="inline-flex items-center gap-0.5">
              <span className="w-1.5 h-4 bg-current rounded-full opacity-80" />
              <span className="w-1.5 h-3 bg-current rounded-full opacity-80" />
              <svg className="w-3.5 h-3.5 text-sky-500" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 11L10.5 4H21L13.5 11H3Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.5 11L21 4V14L13.5 21V11Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 11L13.5 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            Packets Out
          </p>
        </footer>
      </div>
    </>
  );
}

export default App;
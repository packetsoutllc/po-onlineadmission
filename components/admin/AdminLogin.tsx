import React, { useState } from 'react';
import Modal from '../Modal';
import { AdminUser } from './AdminLayout';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { GlobalAdminSecuritySettings, SecurityLog } from './pages/SecuritySettingsTab';
import { appendToLocalStorageArray } from '../../utils/storage';

// Mock user data including roles - now consistent with UsersPage.tsx
const ADMIN_USERS: (AdminUser & { password: string; phoneNumber?: string; schoolId?: string; admissionId?: string; expiryDate?: string; status?: string; })[] = [
    { email: 'admin@peki.edu', password: 'password123', roleId: 'role_school_admin', name: 'Margaret', avatar: 'https://i.pravatar.cc/32?u=megan', phoneNumber: '0244111111', schoolId: 's1', status: 'active' },
    { email: 'pescoobserver@gmail.com', password: '00000000', roleId: 'role_registration_officer', name: 'Registration Officer', avatar: `https://i.pravatar.cc/32?u=regofficer`, phoneNumber: '0244222222', schoolId: 's1', status: 'active' },
    { email: 'amabotsi@gmail.com', password: 'password123', roleId: 'role_super_admin', name: 'System Administrator', avatar: `https://i.pravatar.cc/32?u=sysadmin`, phoneNumber: '0244333333', status: 'active' },
    { email: 'ec@gameli.com', password: 'password123', roleId: 'role_school_admin', name: 'Gameli Faithson Axame', avatar: `https://i.pravatar.cc/32?u=gameli`, phoneNumber: '0244444444', schoolId: 's1', status: 'active' },
];

const PekiLogo: React.FC = () => {
    return (
        <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="flex items-end gap-0.5">
                <div className="w-2 h-6 bg-logip-text-header dark:bg-gray-100 rounded-full"></div>
                <div className="w-2 h-4 bg-logip-text-header dark:bg-gray-100 rounded-full"></div>
                <svg
                    className="w-5 h-5 text-sky-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M3 11L10.5 4H21L13.5 11H3Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M13.5 11L21 4V14L13.5 21V11Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M3 11L13.5 11"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            <span className="font-bold text-2xl text-logip-text-header dark:text-gray-100">Packets Out</span>
        </div>
    );
};

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
  onReturnToStudentView: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onReturnToStudentView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 2FA state
  const [loginStep, setLoginStep] = useState<'credentials' | '2fa'>('credentials');
  const [loggedInUser, setLoggedInUser] = useState<(AdminUser & { password: string, phoneNumber?: string, schoolId?: string; admissionId?: string; expiryDate?: string; }) | null>(null);
  const [tfaCode, setTfaCode] = useState('');
  const [otp, setOtp] = useState<string | null>(null);

  // State for forgot password modal
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetState, setResetState] = useState<'idle' | 'loading' | 'success'>('idle');
  
  const [users, setUsers] = useLocalStorage<(AdminUser & { password?: string, phoneNumber?: string, schoolId?: string, admissionId?: string; expiryDate?: string; status?: string; })[]>('admin_users', ADMIN_USERS as any);

  const handleSuccessfulLogin = (user: AdminUser) => {
    const currentLoginTimestamp = localStorage.getItem('admin_login_timestamp');
    if (currentLoginTimestamp) {
      localStorage.setItem('admin_last_login_timestamp', currentLoginTimestamp);
    }
    localStorage.setItem('admin_login_timestamp', new Date().getTime().toString());
    onLoginSuccess(user);
  };


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      // Find user from the potentially updated list in localStorage
      const userListWithPasswords = [...users];
      const foundUser = userListWithPasswords.find(user => user.email.toLowerCase() === email.toLowerCase() && user.password === password);
      
      if (foundUser) {
          // --- SUSPENSION CHECK ---
          if (foundUser.status === 'suspended') {
              setError('Access Denied');
              setIsLoading(false);
              return;
          }

          // --- EXPIRY CHECK ---
          if (foundUser.expiryDate) {
              const expiry = new Date(foundUser.expiryDate);
              if (expiry < new Date()) {
                  setError('Your account has expired. Please contact the System Administrator for renewal');
                  
                  // Update user status to inactive in the stored list
                  const updatedUsers = users.map(u => 
                    u.email.toLowerCase() === email.toLowerCase() 
                    ? { ...u, status: 'inactive' } 
                    : u
                  );
                  setUsers(updatedUsers as any);
                  
                  setIsLoading(false);
                  return;
              }
          }

          const globalSettingsRaw = localStorage.getItem('globalAdminSecuritySettings');
          const globalSettings: Partial<GlobalAdminSecuritySettings> = globalSettingsRaw ? JSON.parse(globalSettingsRaw) : { enable2FA: true };
          const is2faRequired = globalSettings.enable2FA ?? true;
          
          if (is2faRequired) {
              if (!foundUser.phoneNumber) {
                  setError("2FA is required, but no phone number is configured for your account. Please contact a system administrator.");
                  setIsLoading(false);
                  return;
              }
              const newOtp = String(Math.floor(100000 + Math.random() * 900000));
              setOtp(newOtp);
              console.log(`[DEMO] SMS to ${foundUser.phoneNumber}: Your 2FA code is ${newOtp}`);
              
              setLoggedInUser(foundUser as (AdminUser & { password: string, phoneNumber?: string, schoolId?: string; admissionId?: string; expiryDate?: string; }));
              setLoginStep('2fa');
          } else {
              // Login directly if no 2FA is required
              const { password, ...userToReturn } = foundUser;
              handleSuccessfulLogin(userToReturn as AdminUser);
          }
      } else {
        setError('Invalid email or password.');
        const newLog: SecurityLog = {
            id: `sec_${Date.now()}`,
            timestamp: new Date().toISOString(),
            riskType: 'Failed Login',
            target: `Admin: ${email}`,
            action: 'Logged Attempt',
            details: 'Invalid credentials provided.'
        };
        appendToLocalStorageArray('admin_security_logs', newLog);
      }
      setIsLoading(false);
    }, 1500);
  };

  const handle2faSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
        if (tfaCode === otp) {
            if (loggedInUser) {
                const { password, ...userToReturn } = loggedInUser;
                handleSuccessfulLogin(userToReturn as AdminUser);
            }
        } else {
            setError('Invalid verification code.');
        }
        setIsLoading(false);
    }, 1000);
  };

  const openForgotPasswordModal = () => {
    setIsForgotPasswordModalOpen(true);
  };

  const closeForgotPasswordModal = () => {
    setIsForgotPasswordModalOpen(false);
    setTimeout(() => {
        setResetEmail('');
        setResetState('idle');
    }, 300);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetState('loading');
    setTimeout(() => {
      console.log(`Password reset requested for: ${resetEmail}`);
      setResetState('success');
    }, 2000);
  };

  const renderCredentialsForm = () => (
     <form onSubmit={handleSubmit}>
        <div className="mb-4">
        <label htmlFor="email" className="sr-only">Email address</label>
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
            <span className="material-symbols-outlined">mail</span>
            </span>
            <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="appearance-none rounded-lg relative block w-full pl-10 pr-4 py-4 border border-input-border-light dark:border-input-border-dark bg-gray-50/50 dark:bg-black/20 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-light dark:focus:ring-offset-background-dark focus:ring-indigo-500 text-base transition"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            />
        </div>
        </div>
        <div className="mb-6">
        <label htmlFor="password" className="sr-only">Password</label>
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
            <span className="material-symbols-outlined">lock</span>
            </span>
            <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="appearance-none rounded-lg relative block w-full pl-10 pr-4 py-4 border border-input-border-light dark:border-input-border-dark bg-gray-50/50 dark:bg-black/20 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-light dark:focus:ring-offset-background-dark focus:ring-indigo-500 text-base transition"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            />
        </div>
            <div className="flex items-center justify-end mt-2">
            <button
                type="button"
                onClick={openForgotPasswordModal}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
            >
                Forgot Password?
            </button>
        </div>
        </div>

        {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded-r mb-6 flex items-start space-x-3 animate-fadeIn">
            <span className="material-symbols-outlined text-xl mt-0.5">error</span>
            <p>{error}</p>
        </div>
        )}
        
        <div>
        <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 text-lg font-semibold rounded-lg text-white bg-logip-primary hover:bg-logip-primary-hover transform transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900 focus:ring-violet-500 disabled:opacity-60 disabled:cursor-not-allowed enabled:hover:shadow-lg enabled:hover:-translate-y-0.5"
        >
            {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
        </div>
    </form>
  );

  const render2faForm = () => (
    <form onSubmit={handle2faSubmit}>
        <div className="mb-6">
            <label htmlFor="tfa-code" className="sr-only">Verification Code</label>
            <div className="relative">
                <input
                    id="tfa-code"
                    name="tfaCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    className="appearance-none rounded-lg relative block w-full px-4 py-4 border border-input-border-light dark:border-input-border-dark bg-gray-50/50 dark:bg-black/20 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-light dark:focus:ring-offset-background-dark focus:ring-indigo-500 text-base transition"
                    placeholder="6-digit code"
                    value={tfaCode}
                    onChange={(e) => setTfaCode(e.target.value)}
                />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">Enter the code sent to your phone number ending in ...{loggedInUser?.phoneNumber?.slice(-4)}. For demo: {otp}</p>
        </div>
         {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded-r mb-6 flex items-start space-x-3 animate-fadeIn">
                <span className="material-symbols-outlined text-xl mt-0.5">error</span>
                <p>{error}</p>
            </div>
        )}
        <div>
            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 text-lg font-semibold rounded-lg text-white bg-logip-primary hover:bg-logip-primary-hover transform transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Verifying...' : 'Verify'}
            </button>
        </div>
    </form>
  );

  return (
    <>
      <div>
        <div className="text-center mb-8">
          {loginStep === 'credentials' ? (
            <>
              <PekiLogo />
              <p className="text-base text-gray-500 dark:text-gray-400 mt-6">
                Sign in to your account
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Two-Factor Authentication
              </h1>
              <p className="text-base text-gray-500 dark:text-gray-400 mt-4">
                Enter the code to continue
              </p>
            </>
          )}
        </div>
        
        {loginStep === 'credentials' ? renderCredentialsForm() : render2faForm()}

        {loginStep !== 'credentials' && (
          <div className="text-center mt-8">
            <button
              onClick={() => { setLoginStep('credentials'); setError(''); }}
              type="button"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to Login
            </button>
          </div>
        )}
      </div>

       <Modal isOpen={isForgotPasswordModalOpen} onClose={closeForgotPasswordModal}>
        {resetState === 'success' ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-4xl text-green-500">
                    mark_email_read
                </span>
            </div>
            <h2 id="modal-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Check Your Email
            </h2>
            <p className="mt-4 text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                If an account with that email exists, a password reset link has been sent.
            </p>
            <button
                onClick={closeForgotPasswordModal}
                className="mt-8 w-full py-2 px-4 text-base font-semibold rounded-lg text-white bg-logip-primary hover:bg-logip-primary-hover transform transition-all duration-300 ease-in-out"
            >
                Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPasswordSubmit}>
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-4xl text-indigo-500">
                        lock_reset
                    </span>
                </div>
                <h2 id="modal-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Reset Password
                </h2>
                <p className="mt-4 text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
                <div className="w-full mt-8">
                    <label htmlFor="reset-email" className="sr-only">Email address</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
                            <span className="material-symbols-outlined">mail</span>
                        </span>
                        <input
                            id="reset-email"
                            name="reset-email"
                            type="email"
                            autoComplete="email"
                            required
                            className="appearance-none rounded-lg relative block w-full pl-10 pr-4 py-4 border border-input-border-light dark:border-input-border-dark bg-gray-50/50 dark:bg-black/20 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-light dark:focus:ring-offset-background-dark focus:ring-indigo-500 text-base transition"
                            placeholder="Enter your email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                        />
                    </div>
                </div>
                <div className="mt-8 w-full flex items-center gap-4">
                    <button
                        onClick={closeForgotPasswordModal}
                        type="button"
                        className="w-full py-2 px-4 text-base font-semibold rounded-lg text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-gray-300 dark:border-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={resetState === 'loading'}
                        className="w-full flex justify-center py-2 px-4 text-base font-semibold rounded-lg text-white bg-logip-primary hover:bg-logip-primary-hover transition-colors disabled:opacity-60"
                    >
                        {resetState === 'loading' ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </div>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
};

export default AdminLogin;
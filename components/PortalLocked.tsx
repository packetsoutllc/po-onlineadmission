
import React from 'react';

const PekiLogo: React.FC = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
        <svg className="w-7 h-7 text-emerald-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12.6667L9.33333 18L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="text-sm font-medium text-gray-800 dark:text-gray-100 text-left leading-tight">
            <div>Peki</div>
            <div className="flex items-center gap-1.5">
                <span className="text-gray-400/80 dark:text-gray-600/80">|</span>
                <span>Senior</span>
                <span className="text-gray-400/80 dark:text-gray-600/80">|</span>
            </div>
            <div>High</div>
        </div>
    </div>
);

interface PortalLockedProps {
  onSwitchToAdmin: () => void;
}

const PortalLocked: React.FC<PortalLockedProps> = ({ onSwitchToAdmin }) => {
  return (
    <div className="text-center">
        <PekiLogo />
        <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-5 mx-auto">
            <span className="material-symbols-outlined text-4xl text-yellow-500">
                lock
            </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
            Access Restricted
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">
            Site Under Maintenance!
        </p>
         <div className="text-center mt-8">
            <button
                onClick={onSwitchToAdmin}
                type="button"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
                <span className="material-symbols-outlined text-base">dashboard</span>
                Admin Dashboard
            </button>
        </div>
    </div>
  );
};

export default PortalLocked;

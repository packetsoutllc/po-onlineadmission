
import React from 'react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  forceTheme?: 'dark' | 'light';
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, title, children, size = '3xl', forceTheme }) => {
  if (!isOpen) return null;

  const sizeClass = `max-w-${size}`;
  const themeClass = forceTheme ? forceTheme : '';

  return (
    <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4 animate-fadeIn ${themeClass}`}
        onClick={onClose}
    >
      <div 
        className={`bg-logip-white dark:bg-dark-surface rounded-xl dark:shadow-2xl w-full ${sizeClass} m-auto animate-scaleIn border border-logip-border dark:border-dark-border flex flex-col max-h-[95vh] text-logip-text-body dark:text-dark-text-primary`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pt-6 px-8 pb-4 border-b border-logip-border dark:border-dark-border flex-shrink-0">
          <h2 className="text-2xl font-bold text-logip-text-header dark:text-dark-text-primary">{title}</h2>
          <button onClick={onClose} className="text-logip-text-subtle dark:text-dark-text-secondary hover:text-logip-text-header dark:hover:text-dark-text-primary transition-colors rounded-full p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="px-8 pb-8 pt-6 overflow-y-auto overflow-x-visible no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminModal;

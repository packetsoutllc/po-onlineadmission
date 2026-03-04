import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, children, confirmButtonClass = 'bg-red-600 hover:bg-red-700' }) => {
  if (!isOpen) return null;

  const getIconDetails = () => {
      if (confirmButtonClass.includes('red')) {
          return { name: 'delete', colorClasses: 'bg-red-100 dark:bg-red-50/10 text-red-600 dark:text-red-500' };
      }
      if (confirmButtonClass.includes('yellow')) {
          return { name: 'warning', colorClasses: 'bg-yellow-100 dark:bg-yellow-50/10 text-yellow-600 dark:text-yellow-500' };
      }
      if (confirmButtonClass.includes('orange')) {
          return { name: 'warning', colorClasses: 'bg-orange-100 dark:bg-orange-50/10 text-orange-600 dark:text-orange-500' };
      }
      return { name: 'warning', colorClasses: 'bg-red-100 dark:bg-red-50/10 text-red-600 dark:text-red-500' };
  };

  const icon = getIconDetails();

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <div
        className="bg-logip-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-lg m-auto animate-scaleIn text-center p-8 border border-logip-border dark:border-dark-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${icon.colorClasses}`}>
                <span className={`material-symbols-outlined text-4xl`}>
                    {icon.name}
                </span>
            </div>
            <h2 id="confirmation-modal-title" className="text-2xl font-bold text-logip-text-header dark:text-dark-text-primary">{title}</h2>
            <div className="mt-4 text-base text-logip-text-body dark:text-dark-text-secondary leading-relaxed">
                {children}
            </div>
            <div className="mt-8 w-full flex items-center gap-4">
                <button
                    onClick={onClose}
                    type="button"
                    className="w-full py-2 px-4 text-base font-semibold rounded-lg text-gray-900 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-dark-border/50 border border-gray-300 dark:border-dark-border transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    type="button"
                    className={`w-full py-2 px-4 text-base font-semibold rounded-lg text-white transition-colors ${confirmButtonClass}`}
                >
                    Confirm
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
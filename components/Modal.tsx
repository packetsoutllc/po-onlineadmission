
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  // FIX: Added 3xl, 4xl, 5xl, and 6xl to match required layouts in other components and AdminModal capabilities
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, size = 'md' }) => {
  if (!isOpen) {
    return null;
  }

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    // FIX: Added mapping for extended sizes to Tailwind max-width classes
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
  };

  const maxWidthClass = sizeClasses[size as keyof typeof sizeClasses];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out animate-fadeIn"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop - Added backdrop-blur-sm */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal Panel */}
      <div className={`relative w-full ${maxWidthClass} transform transition-all duration-300 ease-in-out animate-scaleIn bg-white dark:bg-[#1C1A27] rounded-xl border border-gray-200/50 dark:border-transparent p-6 sm:p-8 text-center shadow-2xl`}>
        {children}
      </div>
    </div>
  );
};

export default Modal;

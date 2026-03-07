
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  // FIX: Added 3xl, 4xl, 5xl, and 6xl to match required layouts in other components and AdminModal capabilities
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  /** When true, do not render the dark backdrop behind the panel. */
  hideBackdrop?: boolean;
  /** When true, use a solid white backdrop instead of dark (e.g. for Corrections modal). */
  backdropWhite?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, size = 'md', hideBackdrop = false, backdropWhite = false }) => {
  if (!isOpen) {
    return null;
  }

  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '3xl': 'sm:max-w-3xl',
    '4xl': 'sm:max-w-4xl',
    '5xl': 'sm:max-w-5xl',
    '6xl': 'sm:max-w-6xl',
  };

  const maxWidthClass = sizeClasses[size as keyof typeof sizeClasses];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out animate-fadeIn"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop – blurs background (including logo) for all modals/topups. */}
      {!hideBackdrop && (
        <div
          className={`absolute inset-0 backdrop-blur-md ${backdropWhite ? 'bg-white/90 dark:bg-gray-900/90' : 'bg-black/50'}`}
          onClick={onClose}
          aria-hidden="true"
        ></div>
      )}

      {/* Modal Panel */}
      <div
        className={`relative w-full ${maxWidthClass} overflow-y-auto overflow-x-hidden transform transition-all duration-300 ease-in-out animate-scaleIn bg-white dark:bg-[#1C1A27] rounded-xl border border-gray-200/50 dark:border-transparent p-8 text-center shadow-2xl`}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;

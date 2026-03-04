import React from 'react';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex justify-center items-center p-4 animate-fadeIn"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
    >
      <div
        className={`bg-logip-white dark:bg-report-dark/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md m-auto animate-scaleIn border border-logip-border dark:border-report-border flex flex-col h-[90vh] max-h-[700px] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-logip-border dark:border-report-border flex-shrink-0">
          <h2 className="text-xl font-bold text-logip-text-header dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="text-logip-text-subtle hover:text-logip-text-header dark:hover:text-gray-100 transition-colors rounded-full p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 p-4 flex flex-col min-h-0 overflow-hidden">
            {children}
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
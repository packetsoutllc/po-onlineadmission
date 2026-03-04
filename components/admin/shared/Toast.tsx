import React, { useEffect, useState } from 'react';
import { ToastMessage } from './ToastContext';

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: number) => void;
}

const ICONS: Record<ToastMessage['type'], string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
};

const COLORS: Record<ToastMessage['type'], string> = {
  success: 'bg-green-500 border-green-600',
  error: 'bg-red-500 border-red-600',
  info: 'bg-blue-500 border-blue-600',
};

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 400); // Wait for animation
    }, 4000); // 4 seconds visible

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);
  
  const handleClose = () => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 400);
  }

  return (
    <div
      className={`flex items-center gap-4 w-full max-w-sm p-4 text-white rounded-lg dark:shadow-lg border-l-4 transition-all duration-300 transform ${COLORS[toast.type]} ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
      role="alert"
    >
      <div className="flex-shrink-0">
        <span className="material-symbols-outlined text-2xl">{ICONS[toast.type]}</span>
      </div>
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button onClick={handleClose} className="p-1 rounded-full hover:bg-white/20 transition-colors">
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[1000] w-full max-w-sm space-y-3">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
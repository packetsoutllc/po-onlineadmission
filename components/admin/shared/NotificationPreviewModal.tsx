import React, { useState } from 'react';

interface NotificationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: string;
  iconColor?: string;
  textColor?: string;
  style?: 'standard' | 'modern' | 'flyer';
  image?: string;
}

const NotificationPreviewModal: React.FC<NotificationPreviewModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    message, 
    icon = 'info', 
    iconColor = '#3b82f6', 
    textColor,
    style = 'standard',
    image
}) => {
  if (!isOpen) return null;

  // Determine if we should use the custom text color. 
  // If it's the default dark gray (#1f2937), we ignore it in inline styles 
  // to allow the dark mode CSS classes (dark:text-...) to take effect.
  const DEFAULT_TEXT_COLOR = '#1f2937';
  const shouldUseCustomColor = textColor && textColor !== DEFAULT_TEXT_COLOR;
  const textStyle = shouldUseCustomColor ? { color: textColor } : {};

  // Common button styles
  const buttonClass = "w-full py-2 px-4 text-base font-semibold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover transition-colors shadow-sm";

  const renderContent = () => {
    switch (style) {
        case 'flyer':
            return (
                <div className="relative w-full h-[500px] bg-gray-900 rounded-xl overflow-hidden flex flex-col">
                    {/* Background Image */}
                    {image ? (
                        <div className="absolute inset-0 z-0">
                            <img src={image} alt="Notification Background" className="w-full h-full object-cover opacity-60" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-blue-900 opacity-80 z-0"></div>
                    )}
                    
                    {/* Content Overlay */}
                    <div className="relative z-10 flex-1 flex flex-col items-center justify-end p-8 text-center">
                        <div 
                            className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-white/10 backdrop-blur-md border border-white/20 shadow-lg"
                            style={{ color: iconColor }}
                        >
                            <span className="material-symbols-outlined text-4xl drop-shadow-md">
                                {icon}
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-md">{title}</h2>
                        <div className="text-lg text-gray-100 leading-relaxed mb-8 drop-shadow-sm max-h-40 overflow-y-auto no-scrollbar">
                             <p>{message}</p>
                        </div>
                        <button onClick={onClose} type="button" className={buttonClass}>
                            Acknowledge
                        </button>
                    </div>
                </div>
            );

        case 'modern':
            return (
                <div className="flex flex-col md:flex-row w-full bg-logip-white dark:bg-dark-surface rounded-xl overflow-hidden min-h-[400px]">
                    {/* Image Side */}
                    <div className="w-full md:w-1/2 bg-gray-100 dark:bg-dark-bg relative min-h-[200px] md:min-h-full">
                        {image ? (
                            <img src={image} alt="Notification" className="w-full h-full object-cover absolute inset-0" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                                <span className="material-symbols-outlined text-6xl text-gray-400">image</span>
                            </div>
                        )}
                    </div>
                    
                    {/* Content Side */}
                    <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                         <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                            style={{ backgroundColor: `${iconColor}20`, color: iconColor }}
                        >
                            <span className="material-symbols-outlined text-2xl">
                                {icon}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-logip-text-header dark:text-dark-text-primary mb-3">{title}</h2>
                        <div className="flex-1 overflow-y-auto max-h-60 no-scrollbar mb-6">
                            <p className="text-base text-logip-text-body dark:text-dark-text-secondary leading-relaxed" style={textStyle}>
                                {message}
                            </p>
                        </div>
                        <button onClick={onClose} type="button" className={buttonClass}>
                            Acknowledge
                        </button>
                    </div>
                </div>
            );

        case 'standard':
        default:
            return (
                <div className="bg-logip-white dark:bg-dark-surface rounded-xl p-8 flex flex-col items-center text-center">
                    <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm"
                        style={{ backgroundColor: `${iconColor}15`, color: iconColor }}
                    >
                        <span className="material-symbols-outlined text-5xl">
                            {icon}
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-logip-text-header dark:text-dark-text-primary mb-4">{title}</h2>
                    <div className="text-base text-logip-text-body dark:text-dark-text-secondary leading-relaxed mb-8 max-w-md">
                        <p style={textStyle}>{message}</p>
                    </div>
                    <div className="w-full">
                        <button onClick={onClose} type="button" className={buttonClass}>
                            Acknowledge
                        </button>
                    </div>
                </div>
            );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex justify-center items-center p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-modal-title"
    >
      <div
        className={`shadow-2xl w-full m-auto animate-scaleIn border border-logip-border dark:border-dark-border ${style === 'modern' ? 'max-w-4xl' : 'max-w-lg'} ${style === 'flyer' ? 'border-none bg-transparent' : 'bg-logip-white dark:bg-dark-surface rounded-xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default NotificationPreviewModal;

import React from 'react';
import { NotificationSettings } from '../pages/SecuritySettingsTab';

interface ScrollingBannerPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: NotificationSettings;
}

const ScrollingBannerPreviewModal: React.FC<ScrollingBannerPreviewModalProps> = ({ isOpen, onClose, settings }) => {
    if (!isOpen) return null;

    const animationDuration = `${settings.speed || 25}s`;

    return (
        <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center">
            {/* Click outside to close area */}
            <div className="absolute inset-0" onClick={onClose}></div>
            
            {/* Actual Banner Simulation */}
            <div className="relative w-full max-w-4xl h-64 bg-white dark:bg-dark-surface rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-dark-border">
                <div className="p-4 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gray-50 dark:bg-dark-bg/50">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200">Live Preview</h3>
                    <button onClick={onClose} className="text-sm bg-gray-200 dark:bg-dark-border px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">Close Preview</button>
                </div>
                
                <div className="flex-1 relative bg-gray-100 dark:bg-black/20">
                    {/* Fake Page Content Background */}
                    <div className="absolute inset-0 p-8 opacity-20 pointer-events-none flex flex-col gap-4">
                        <div className="h-8 w-1/3 bg-gray-400 rounded"></div>
                        <div className="h-32 w-full bg-gray-300 rounded"></div>
                        <div className="h-32 w-full bg-gray-300 rounded"></div>
                    </div>

                    {/* The Banner */}
                    <div 
                        className={`absolute left-0 w-full h-12 z-10 overflow-hidden flex items-center shadow-md ${settings.position === 'bottom' ? 'bottom-0' : 'top-0'}`}
                        style={{ backgroundColor: settings.backgroundColor || '#3b82f6' }}
                    >
                        <p 
                            className="whitespace-nowrap flex-shrink-0 inline-block" 
                            style={{ 
                                color: settings.textColor || '#ffffff',
                                paddingLeft: '100%',
                                animation: `marquee ${animationDuration} linear infinite`,
                                fontSize: `${settings.fontSize || 14}px`,
                                fontWeight: settings.isBold ? 'bold' : 'normal',
                                fontStyle: settings.isItalic ? 'italic' : 'normal',
                                willChange: 'transform',
                                transform: 'translate3d(0,0,0)',
                                backfaceVisibility: 'hidden',
                                perspective: '1000px',
                            }}
                        >
                            {settings.text || "This is a preview of your scrolling announcement text."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Inline Styles for Marquee Animation if not global */}
            <style>{`
                @keyframes marquee {
                    0% { transform: translate3d(0, 0, 0); }
                    100% { transform: translate3d(-100%, 0, 0); }
                }
            `}</style>
        </div>
    );
};

export default ScrollingBannerPreviewModal;

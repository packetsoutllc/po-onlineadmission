
import React from 'react';

interface CapacityDisplayProps {
    label: string;
    info: { current: number; capacity: number } | null;
    barColorClass?: string;
    textColorClass?: string;
    bgColorClass?: string;
}

const CapacityDisplay: React.FC<CapacityDisplayProps> = ({ label, info, barColorClass, textColorClass, bgColorClass }) => {
    const percentage = info ? (info.current / info.capacity) * 100 : 0;
    
    let barColor = barColorClass;
    let textColor = textColorClass;
    let bgColor = bgColorClass;

    if (!barColor) {
        barColor = 'bg-green-500';
        if (percentage > 75) barColor = 'bg-yellow-500';
        if (percentage >= 100) barColor = 'bg-red-500';
    }
    if (!textColor) {
        textColor = 'text-green-700 dark:text-green-300';
        if (percentage > 75) textColor = 'text-yellow-700 dark:text-yellow-300';
        if (percentage >= 100) textColor = 'text-red-700 dark:text-red-300';
    }
    if (!bgColor) {
        bgColor = 'bg-green-100 dark:bg-green-900/40';
        if (percentage > 75) bgColor = 'bg-yellow-100 dark:bg-yellow-900/40';
        if (percentage >= 100) bgColor = 'bg-red-100 dark:bg-red-900/40';
    }

    return (
        <div>
            {/* Changed from text-base to text-sm to match FormField labels */}
            <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1.5">{label}</label>
            <div className={`h-[42px] px-3 flex items-center justify-center rounded-lg border border-logip-border dark:border-report-border ${info ? 'bg-gray-50 dark:bg-gray-800/30' : 'bg-gray-100 dark:bg-gray-800/50'}`}>
                {info ? (
                    <div className="w-full">
                        <div className="flex justify-between items-center mb-1">
                            <span className={`text-sm font-semibold ${textColor}`}>{info.current} / {info.capacity}</span>
                             <span className={`text-xs font-bold ${textColor}`}>{Math.round(percentage)}%</span>
                        </div>
                        <div className={`overflow-hidden h-1.5 text-xs flex rounded ${bgColor}`}>
                            <div style={{ width: `${percentage}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${barColor} transition-all duration-500`}></div>
                        </div>
                    </div>
                ) : (
                    <span className="text-base text-black">N/A</span>
                )}
            </div>
        </div>
    );
};

export default CapacityDisplay;

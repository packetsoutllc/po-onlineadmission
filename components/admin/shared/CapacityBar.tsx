
import React from 'react';

interface CapacityBarProps {
    current: number;
    capacity: number;
    label?: string;
    barColorClass?: string;
    textColorClass?: string;
}

const CapacityBar: React.FC<CapacityBarProps> = ({ current, capacity, label = '', barColorClass, textColorClass }) => {
    const percentage = capacity > 0 ? Math.min((current / capacity) * 100, 100) : 0;
    
    let finalBarClass: string;
    let finalTextClass: string;

    if (barColorClass) {
        finalBarClass = barColorClass;
    } else {
        let barColor = 'bg-green-500';
        if (percentage > 85) {
            barColor = 'bg-yellow-500';
        }
        if (percentage >= 100) {
            barColor = 'bg-red-500';
        }
        finalBarClass = barColor;
    }

    if (textColorClass) {
        finalTextClass = textColorClass;
    } else {
        let color = 'text-green-600 dark:text-green-400';
        if (percentage > 85) {
            color = 'text-yellow-600 dark:text-yellow-400';
        }
        if (percentage >= 100) {
            color = 'text-red-600 dark:text-red-400';
        }
        finalTextClass = color;
    }

    return (
        <div className="flex items-center gap-3 w-full max-w-[280px]">
            <span className="text-base font-medium text-logip-text-body dark:text-dark-text-secondary whitespace-nowrap">{current} / {capacity} {label}</span>
            <div className="h-2 w-full bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden flex-1">
                <div 
                    className={`h-2 rounded-full ${finalBarClass} transition-all duration-500 ease-out`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <span className={`text-base font-bold ${finalTextClass} w-20 text-right`}>
                {Math.round(percentage)}% Full
            </span>
        </div>
    );
};

export default CapacityBar;

import React from 'react';

const StatCard: React.FC<{
    icon: string;
    title: string;
    value: string;
    change?: string;
    changeColor?: string;
    iconBgClass?: string;
    iconColorClass?: string;
}> = ({ icon, title, value, change, changeColor, iconBgClass = 'bg-logip-border dark:bg-gray-800', iconColorClass = 'text-logip-text-header dark:text-gray-200' }) => {
    const isPercentage = change && change.endsWith('%');

    return (
        <div className="bg-logip-white dark:bg-dark-surface p-4 rounded-xl border border-logip-border dark:border-dark-border flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${iconBgClass} flex items-center justify-center flex-shrink-0`}>
                <span className={`material-symbols-outlined text-2xl ${iconColorClass}`}>{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-logip-text-body dark:text-gray-400 truncate">{title}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-logip-text-header dark:text-gray-100 truncate">{value}</p>
                    {isPercentage && (
                        <p className={`text-sm font-medium ${changeColor || 'text-logip-text-body dark:text-gray-300'}`}>{change}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatCard;

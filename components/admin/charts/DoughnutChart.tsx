import React from 'react';

interface DoughnutChartProps {
    percentage: number;
    title: string;
    primaryColor: string;
    secondaryColor: string;
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({ percentage, title, primaryColor, secondaryColor }) => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const uniqueId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border h-full flex flex-col">
            <h3 className="text-lg font-bold text-logip-text-header dark:text-dark-text-primary mb-4">{title}</h3>
            <div className="flex-1 flex items-center justify-center relative">
                <svg className="transform -rotate-90" width="200" height="200" viewBox="0 0 200 200">
                    <defs>
                        <linearGradient id={uniqueId} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={primaryColor} />
                            <stop offset="100%" stopColor={secondaryColor} />
                        </linearGradient>
                    </defs>
                    <circle
                        className="text-gray-200 dark:text-dark-border"
                        stroke="currentColor"
                        strokeWidth="20"
                        fill="transparent"
                        r={radius}
                        cx="100"
                        cy="100"
                    />
                    <circle
                        stroke={`url(#${uniqueId})`}
                        strokeWidth="20"
                        strokeLinecap="round"
                        fill="transparent"
                        r={radius}
                        cx="100"
                        cy="100"
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: offset,
                            transition: 'stroke-dashoffset 0.5s ease-out'
                        }}
                    />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-logip-text-header dark:text-dark-text-primary">
                        {Math.round(percentage)}%
                    </span>
                    <span className="text-sm text-logip-text-subtle dark:text-dark-text-secondary">Completed</span>
                </div>
            </div>
        </div>
    );
};

export default DoughnutChart;

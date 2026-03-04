import React from 'react';

interface BarChartProps {
    title: string;
    data: {
        label: string;
        value: number;
        [key: string]: any;
    }[];
    children?: React.ReactNode;
    showNav?: boolean;
    onNav?: (direction: 'prev' | 'next') => void;
    onBarClick?: (dataItem: any) => void;
    isNextDisabled?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({ title, data, children, showNav, onNav, isNextDisabled, onBarClick }) => {
    const maxValue = Math.max(...data.map(item => item.value), 1); 
    const gapClass = data.length > 20 ? 'gap-1' : data.length > 12 ? 'gap-2' : 'gap-4';

    return (
        <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-logip-text-header dark:text-dark-text-primary">{title}</h3>
                    {showNav && (
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => onNav?.('prev')}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-logip-text-subtle hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                                title="Previous period"
                            >
                                <span className="material-symbols-outlined text-xl">chevron_left</span>
                            </button>
                            <button 
                                onClick={() => onNav?.('next')}
                                disabled={isNextDisabled}
                                className="w-7 h-7 flex items-center justify-center rounded-md text-logip-text-subtle hover:bg-gray-100 dark:hover:bg-dark-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title="Next period"
                            >
                                <span className="material-symbols-outlined text-xl">chevron_right</span>
                            </button>
                        </div>
                    )}
                </div>
                {children && <div>{children}</div>}
            </div>
            {/* Reduced internal min-h to 140px to allow for a smaller overall container */}
            <div className={`flex-1 flex items-end h-full min-h-[140px] pt-6 ${gapClass}`}>
                {data.map((item, index) => (
                    <div 
                        key={index} 
                        className="flex-1 flex flex-col items-center h-full justify-end"
                        onClick={() => onBarClick && onBarClick(item)}
                        style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                    >
                        <div className="relative group w-full h-full flex items-end justify-center">
                            {/* Persistent Value Label */}
                            {item.value > 0 && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-logip-text-header dark:text-white animate-fadeIn">
                                    {item.value}
                                </div>
                            )}
                            
                            <div
                                className="w-4/5 bg-blue-200 dark:bg-blue-600/40 rounded-t-md hover:bg-blue-300 dark:hover:bg-blue-500 transition-all duration-300 ease-out"
                                style={{
                                    height: `${(item.value / maxValue) * 100}%`,
                                    minHeight: item.value > 0 ? '4px' : '0px'
                                }}
                            >
                                {/* Tooltip on hover (keeping it for detailed info if needed) */}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-800 dark:bg-gray-900 text-white text-xs font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                    {item.value} Admissions
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] text-logip-text-subtle dark:text-dark-text-secondary mt-2 uppercase h-4 flex items-center justify-center font-semibold">
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BarChart;
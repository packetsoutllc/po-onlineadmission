import React, { useState, useRef, useEffect } from 'react';

interface DatePickerProps {
    id?: string;
    value: string;
    onChange: (date: string) => void;
    disabled?: boolean;
    variant?: 'form' | 'display';
    inline?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({ id, value, onChange, disabled, variant = 'form', inline = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const getInitialDate = () => {
        if (value && !isNaN(new Date(value).getTime())) {
            return new Date(value + 'T00:00:00'); // Handle timezone display issue
        }
        return new Date();
    };
    
    const [displayDate, setDisplayDate] = useState(getInitialDate());
    const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value && !isNaN(new Date(value).getTime())) {
            setDisplayDate(new Date(value + 'T00:00:00'));
        }
    }, [value]);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handleDateSelect = (day: number) => {
        const selected = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
        // Manually format to YYYY-MM-DD to avoid timezone conversion issues from toISOString()
        const year = selected.getFullYear();
        const month = String(selected.getMonth() + 1).padStart(2, '0');
        const date = String(selected.getDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${date}`;
        onChange(formatted);
        setIsOpen(false);
        setViewMode('days');
    };

    const changeDisplay = (offset: number) => {
        switch (viewMode) {
            case 'years':
                setDisplayDate(prev => new Date(prev.getFullYear() + offset * 10, prev.getMonth(), 1));
                break;
            case 'months':
                setDisplayDate(prev => new Date(prev.getFullYear() + offset, prev.getMonth(), 1));
                break;
            case 'days':
            default:
                setDisplayDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
                break;
        }
    };

    const renderDays = () => {
        const year = displayDate.getFullYear();
        const month = displayDate.getMonth();
        const totalDays = daysInMonth(year, month);
        const firstDay = firstDayOfMonth(year, month);
        
        const blanks = Array.from({ length: firstDay }, (_, i) => <div key={`blank-${i}`}></div>);
        
        const days = Array.from({ length: totalDays }, (_, i) => {
            const day = i + 1;
            const selectedDate = value ? new Date(value + 'T00:00:00') : null;
            const today = new Date();

            const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

            return (
                <div key={day} className="text-center">
                    <button
                        onClick={() => handleDateSelect(day)}
                        className={`w-9 h-9 rounded-full text-sm transition-colors ${
                            isSelected ? 'bg-logip-primary text-white font-semibold' :
                            isToday ? 'bg-logip-primary/10 text-logip-primary' :
                            'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                        }`}
                    >
                        {day}
                    </button>
                </div>
            );
        });
        return [...blanks, ...days];
    };
    
    const renderMonths = () => {
        return Array.from({ length: 12 }, (_, i) => {
            const monthName = new Date(0, i).toLocaleDateString('en-US', { month: 'short' });
            return (
                 <div key={i} className="flex items-center justify-center p-1">
                    <button
                        onClick={() => {
                            setDisplayDate(new Date(displayDate.getFullYear(), i, 1));
                            setViewMode('days');
                        }}
                        className="w-full py-3 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                        {monthName}
                    </button>
                </div>
            )
        });
    };

    const renderYears = () => {
        const startYear = Math.floor(displayDate.getFullYear() / 10) * 10;
        return Array.from({ length: 10 }, (_, i) => {
            const year = startYear + i;
            return (
                <div key={year} className="flex items-center justify-center p-1">
                    <button
                        onClick={() => {
                            setDisplayDate(new Date(year, displayDate.getMonth(), 1));
                            setViewMode('months');
                        }}
                        className="w-full py-3 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                        {year}
                    </button>
                </div>
            )
        });
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setViewMode('days');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const d = value ? new Date(value + 'T00:00:00') : new Date();
    const formattedValue = value 
        ? `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}` 
        : '';
    
    const getHeader = () => {
        switch (viewMode) {
            case 'years':
                const startYear = Math.floor(displayDate.getFullYear() / 10) * 10;
                return `${startYear} - ${startYear + 9}`;
            case 'months':
                return (
                    <button onClick={() => setViewMode('years')} className="font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-md text-gray-900 dark:text-gray-100">
                        {displayDate.getFullYear()}
                    </button>
                );
            case 'days':
            default:
                return (
                    <div className="flex gap-1">
                        <button onClick={() => setViewMode('months')} className="font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-md text-gray-900 dark:text-gray-100">{displayDate.toLocaleDateString('en-US', { month: 'long' })}</button>
                        <button onClick={() => setViewMode('years')} className="font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-md text-gray-900 dark:text-gray-100">{displayDate.toLocaleDateString('en-US', { year: 'numeric' })}</button>
                    </div>
                );
        }
    };

    const PopoverContent = (
        <div className={!inline ? "w-72 bg-logip-white dark:bg-report-dark border border-logip-border dark:border-report-border rounded-xl shadow-lg p-4 animate-scaleIn" : "w-full"}>
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeDisplay(-1)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"><span className="material-symbols-outlined">chevron_left</span></button>
                <div className="text-gray-900 dark:text-gray-100 font-semibold">{getHeader()}</div>
                <button onClick={() => changeDisplay(1)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"><span className="material-symbols-outlined">chevron_right</span></button>
            </div>
            {viewMode === 'days' && (
                 <div className="grid grid-cols-7 gap-y-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-center text-xs font-medium text-logip-text-subtle">{d}</div>)}
                    {renderDays()}
                </div>
            )}
             {viewMode === 'months' && (
                <div className="grid grid-cols-4 gap-1">
                    {renderMonths()}
                </div>
            )}
             {viewMode === 'years' && (
                <div className="grid grid-cols-4 gap-1">
                    {renderYears()}
                </div>
            )}
        </div>
    );
    
    if (inline) {
        return PopoverContent;
    }

    if (variant === 'display') {
        return (
            <div className="relative flex items-center gap-2" ref={containerRef}>
                <span className="text-sm text-logip-text-body dark:text-gray-400 hidden sm:block whitespace-nowrap">
                    {formattedValue}
                </span>
                <button
                    id={id}
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-logip-border dark:border-report-border text-logip-text-body dark:text-gray-400 hover:bg-logip-border/60 dark:hover:bg-gray-800 flex-shrink-0"
                    aria-label="Calendar"
                    title="Calendar"
                >
                    <span className="material-symbols-outlined text-xl">calendar_today</span>
                </button>
                {isOpen && <div className="absolute z-10 right-0 top-full mt-2">{PopoverContent}</div>}
            </div>
        );
    }

    return (
        <div className="relative" ref={containerRef}>
            <button
                id={id}
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className="w-full flex justify-between items-center px-3 py-2 bg-logip-white dark:bg-report-dark border border-logip-border dark:border-report-border rounded-xl text-sm text-logip-text-header dark:text-gray-100 placeholder-logip-text-subtle focus:outline-none focus:ring-2 focus:ring-logip-primary dark:focus:border-logip-primary transition-shadow duration-200 disabled:bg-gray-100 dark:disabled:bg-gray-800/50 disabled:cursor-not-allowed"
            >
                <span className={value ? '' : 'text-logip-text-subtle'}>{formattedValue || 'Select a date'}</span>
                <span className="material-symbols-outlined text-logip-text-subtle">calendar_today</span>
            </button>

            {isOpen && <div className="absolute z-10 top-full mt-2 w-full">{PopoverContent}</div>}
        </div>
    );
};

export default DatePicker;
import React, { useState, useRef, useEffect } from 'react';

export const AdminFormField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
    <div className={className}>
        <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1">{label}</label>
        {children}
    </div>
);

export const AdminInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
    <input
        {...props}
        className={`w-full px-3 py-2 bg-logip-white dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-xl text-base text-logip-text-header dark:text-dark-text-primary placeholder-logip-text-subtle dark:placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-logip-primary dark:focus:ring-dark-accent-blue transition-shadow duration-200 ${className}`}
    />
);

interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    placeholder?: string;
    align?: 'left' | 'right';
}

export const AdminSelect: React.FC<AdminSelectProps> = ({ children, value, onChange, placeholder, disabled, className = '', align = 'right', ...props }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const options = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<any>[];
    const selectedOption = options.find(opt => String(opt.props.value) === String(value)) || options[0];
    const displayValue = selectedOption ? selectedOption.props.children : (placeholder || 'Select option');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val: any) => {
        if (onChange) {
            const event = {
                target: { value: val, name: props.name }
            } as React.ChangeEvent<HTMLSelectElement>;
            onChange(event);
        }
        setIsOpen(false);
    };

    const alignmentClass = align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left';

    return (
        <div className={`relative ${className || 'w-full'}`} ref={containerRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`flex w-full items-center justify-between px-2.5 py-1.5 bg-logip-white dark:bg-dark-bg border ${isOpen ? 'border-logip-primary ring-1 ring-logip-primary/20' : 'border-logip-border dark:border-report-border'} rounded-xl text-sm font-medium text-left text-logip-text-header dark:text-dark-text-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed gap-3 shadow-sm`}
            >
                <span className="truncate">{displayValue}</span>
                <span className={`material-symbols-outlined text-logip-text-subtle text-lg transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>

            {isOpen && (
                <div className={`absolute z-[300] top-full mt-1 w-full min-w-full bg-logip-white dark:bg-dark-surface border border-logip-border dark:border-dark-border rounded-xl shadow-2xl overflow-hidden animate-scaleIn ${alignmentClass}`}>
                    <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
                        {options.map((opt, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelect(opt.props.value)}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors whitespace-nowrap overflow-hidden text-ellipsis ${
                                    String(value) === String(opt.props.value)
                                        ? 'bg-logip-primary/10 text-logip-primary font-bold' 
                                        : 'text-logip-text-header dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg'
                                }`}
                            >
                                {opt.props.children}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const AdminTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
     <textarea
        {...props}
        className={`w-full px-3 py-2 bg-logip-white dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-xl text-base text-logip-text-header dark:text-dark-text-primary placeholder-logip-text-subtle dark:placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-logip-primary dark:focus:ring-dark-accent-blue transition-shadow duration-200 ${className}`}
        rows={4}
    />
);

export const AdminCheckbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string, indeterminate?: boolean }>(({ label, className = '', indeterminate, ...props }, ref) => {
    const defaultRef = React.useRef<HTMLInputElement>(null);
    const resolvedRef = ref || defaultRef;

    React.useEffect(() => {
        if (resolvedRef && 'current' in resolvedRef && resolvedRef.current) {
            resolvedRef.current.indeterminate = !!indeterminate;
        }
    }, [indeterminate, resolvedRef]);

    return (
        <label className={`relative flex items-center gap-3 cursor-pointer group select-none ${className}`}>
            <div className="relative flex items-center justify-center w-5 h-5">
                <input
                    type="checkbox"
                    ref={resolvedRef}
                    className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    {...props}
                />
                <div className="w-5 h-5 rounded-md border-2 border-gray-300 dark:border-gray-600 bg-transparent transition-all peer-checked:bg-logip-primary peer-checked:border-logip-primary group-hover:border-logip-primary/50 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-logip-primary"></div>
                <span className={`absolute text-white transition-opacity pointer-events-none ${indeterminate ? 'opacity-0' : 'opacity-0 peer-checked:opacity-100'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                </span>
                <span className={`absolute text-logip-primary pointer-events-none ${indeterminate ? 'block' : 'hidden'}`}>
                   <div className="h-0.5 w-3 bg-logip-primary rounded"></div>
                </span>
            </div>
            {label && <span className="text-sm font-medium text-logip-text-body dark:text-dark-text-secondary">{label}</span>}
        </label>
    );
});
AdminCheckbox.displayName = 'AdminCheckbox';
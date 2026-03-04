
import React, { useState, useRef, useEffect } from 'react';

// Reusable Form Field components for consistent styling
export const FormField = React.forwardRef<HTMLDivElement, { label: React.ReactNode; children: React.ReactNode; className?: string }>(({ label, children, className = '' }, ref) => (
    <div className={className} ref={ref}>
        <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1.5">{label}</label>
        {children}
    </div>
));
FormField.displayName = 'FormField';

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className="w-full px-3 py-2.5 bg-logip-white dark:bg-report-dark border border-logip-border dark:border-report-border rounded-lg text-base text-black dark:text-gray-100 placeholder-logip-text-subtle focus:outline-none focus:ring-2 focus:ring-logip-primary dark:focus:border-logip-primary transition-shadow duration-200 disabled:bg-gray-100 dark:disabled:bg-gray-800/50 disabled:cursor-not-allowed"
    />
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({ children, value, onChange, placeholder, disabled, className = '', ...props }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const options = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<any>[];
    const selectedOption = options.find(opt => opt.props.value === value) || options[0];
    const displayValue = selectedOption ? selectedOption.props.children : (placeholder || 'Select an option');

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

    return (
        <div
            className={`relative ${className || 'w-full'}`}
            ref={containerRef}
            id={props.id}
        >
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`flex w-full items-center justify-between px-2.5 py-1.5 bg-logip-white dark:bg-report-dark border ${isOpen ? 'border-logip-primary ring-1 ring-logip-primary/20' : 'border-logip-border dark:border-report-border'} rounded-lg text-sm font-medium text-left text-black dark:text-gray-100 transition-all duration-200 disabled:bg-gray-100 dark:disabled:bg-gray-800/50 disabled:cursor-not-allowed gap-3 shadow-sm`}
            >
                <span className="truncate">{displayValue}</span>
                <span className={`material-symbols-outlined text-logip-text-subtle text-xl transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-[250] top-full left-0 mt-1 w-full min-w-full bg-logip-white dark:bg-report-dark border border-logip-border dark:border-report-border rounded-xl shadow-2xl overflow-hidden origin-top animate-scaleIn">
                    <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
                        {options.map((opt, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelect(opt.props.value)}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors whitespace-nowrap overflow-hidden text-ellipsis ${
                                    value === opt.props.value 
                                        ? 'bg-logip-primary/10 text-logip-primary font-bold' 
                                        : 'text-black dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
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

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
     <textarea
        {...props}
        className="w-full px-3 py-2.5 bg-logip-white dark:bg-report-dark border border-logip-border dark:border-report-border rounded-lg text-base text-black dark:text-gray-100 placeholder-logip-text-subtle focus:outline-none focus:ring-2 focus:ring-logip-primary dark:focus:border-logip-primary transition-shadow duration-200"
        rows={4}
    />
);

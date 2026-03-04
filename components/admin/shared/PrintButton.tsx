import React from 'react';

interface PrintButtonProps {
    onClick: () => void;
}

const PrintButton: React.FC<PrintButtonProps> = ({ onClick }) => {
    return (
        <button 
            onClick={onClick} 
            title="Print Table" 
            className="flex items-center justify-center gap-2 px-4 py-2 text-base border border-logip-border dark:border-dark-border font-semibold rounded-lg text-logip-text-body dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-border transition-colors whitespace-nowrap no-print"
        >
            <span className="material-symbols-outlined text-xl">print</span>
            Print
        </button>
    );
};

export default PrintButton;
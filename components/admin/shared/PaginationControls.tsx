
import React, { useMemo, useState, useRef, useEffect } from 'react';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
    onItemsPerPageChange: (value: number) => void;
    startItem: number;
    endItem: number;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
    onItemsPerPageChange,
    startItem,
    endItem,
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const paginationRange = useMemo((): (number | string)[] => {
        const initialShowCount = 6;

        if (totalPages <= initialShowCount + 1) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const firstPageIndex = 1;
        const lastPageIndex = totalPages;

        if (currentPage < 5) {
            let leftRange = Array.from({ length: initialShowCount }, (_, i) => i + 1);
            return [...leftRange, '...', lastPageIndex];
        }

        if (currentPage > totalPages - 4) {
            let rightRange = Array.from({ length: initialShowCount }, (_, i) => totalPages - initialShowCount + 1 + i);
            return [firstPageIndex, '...', ...rightRange];
        }

        return [
            firstPageIndex,
            '...',
            currentPage - 1,
            currentPage,
            currentPage + 1,
            '...',
            lastPageIndex
        ];

    }, [totalPages, currentPage]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (totalItems === 0) {
        return (
             <div className="flex items-center justify-between w-full h-8 no-print">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing 0 to 0 of 0 results
                </p>
            </div>
        )
    }

    const handlePrevious = () => onPageChange(Math.max(1, currentPage - 1));
    const handleNext = () => onPageChange(Math.min(totalPages, currentPage + 1));
    const options = [5, 10, 25, 50, 100];

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between w-full no-print">
            {/* Left Side: Info and Row Count - Height matched to h-8 */}
            <div className="flex items-center gap-4 h-8">
                <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap leading-none">
                    Showing <span className="font-bold text-gray-800 dark:text-white">{startItem}</span> to <span className="font-bold text-gray-800 dark:text-white">{endItem}</span> of <span className="font-bold text-gray-800 dark:text-white">{totalItems}</span> results
                </p>
                
                {/* Custom Items Per Page Dropdown to match image UI */}
                <div className="flex items-center gap-2 h-full relative" ref={dropdownRef}>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-none">Show:</label>
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`h-8 min-w-[54px] flex items-center justify-between px-2 bg-white dark:bg-dark-bg border ${isDropdownOpen ? 'border-logip-primary' : 'border-gray-200 dark:border-dark-border'} rounded-md text-xs font-bold text-gray-700 dark:text-gray-200 transition-all cursor-pointer outline-none focus:outline-none`}
                    >
                        <span>{itemsPerPage}</span>
                        <span className={`material-symbols-outlined text-lg leading-none transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute bottom-full left-0 mb-1 w-full min-w-[60px] bg-white dark:bg-dark-surface border border-gray-300 dark:border-dark-border rounded-md shadow-lg overflow-hidden z-[400] animate-scaleIn origin-bottom">
                            {options.map((opt) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                        onItemsPerPageChange(opt);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors ${
                                        itemsPerPage === opt 
                                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-bg'
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Navigation buttons matched to image height */}
            <nav className="flex items-center h-8">
                <ul className="flex items-center gap-1.5 h-full">
                    <li>
                        <button
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-gray-200 dark:hover:bg-gray-700 outline-none focus:outline-none"
                            aria-label="Previous Page"
                        >
                            <span className="material-symbols-outlined text-lg leading-none">chevron_left</span>
                        </button>
                    </li>
                    
                    {paginationRange.map((page, index) => {
                        if (page === '...') {
                            return (
                                <li key={`dots-${index}`}>
                                    <span className="w-8 h-8 flex items-center justify-center text-gray-400 font-bold text-xs leading-none">...</span>
                                </li>
                            );
                        }
                        const isActive = currentPage === page;
                        return (
                            <li key={page}>
                                <button
                                    onClick={() => onPageChange(page as number)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-bold border transition-all duration-200 outline-none focus:outline-none ${
                                        isActive
                                            ? 'border-logip-primary text-logip-primary bg-white dark:bg-dark-surface'
                                            : 'border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-400 bg-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    {page}
                                </button>
                            </li>
                        );
                    })}

                    <li>
                        <button
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border text-gray-400 dark:text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-gray-50 dark:hover:bg-gray-800 outline-none focus:outline-none"
                            aria-label="Next Page"
                        >
                            <span className="material-symbols-outlined text-lg leading-none">chevron_right</span>
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default PaginationControls;

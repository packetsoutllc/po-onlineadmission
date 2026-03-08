import React, { useState, useRef, useEffect } from 'react';

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

/**
 * Pagination bar matching design: "Showing X to Y of Z results" | "SHOW:" [dropdown] | [<] [current page] [>]
 * Single current-page button only (no ellipsis or multiple numbers). Prev/Next as carets, faded when disabled.
 */
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
            <div className="flex items-center justify-between w-full py-3 no-print">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing <span className="font-bold text-gray-900 dark:text-gray-100">0</span> to <span className="font-bold text-gray-900 dark:text-gray-100">0</span> of <span className="font-bold text-gray-900 dark:text-gray-100">0</span> results
                </p>
            </div>
        );
    }

    const handlePrevious = () => onPageChange(Math.max(1, currentPage - 1));
    const handleNext = () => onPageChange(Math.min(totalPages, currentPage + 1));
    const options = [5, 10, 20, 50, 100];
    const canPrev = currentPage > 1;
    const canNext = currentPage < totalPages;

    return (
        <div className="flex flex-wrap items-center justify-between w-full gap-4 py-3 no-print">
            {/* Left: "Showing X to Y of Z results" + "SHOW:" dropdown */}
            <div className="flex flex-wrap items-center gap-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    Showing <span className="font-bold text-gray-900 dark:text-gray-100">{startItem}</span> to <span className="font-bold text-gray-900 dark:text-gray-100">{endItem}</span> of <span className="font-bold text-gray-900 dark:text-gray-100">{totalItems}</span> results
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Show:</span>
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            aria-expanded={isDropdownOpen}
                            aria-haspopup="listbox"
                            className="h-9 min-w-[72px] flex items-center justify-between gap-1 px-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-md text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-300 dark:focus:ring-blue-700"
                        >
                            <span>{itemsPerPage}</span>
                            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {isDropdownOpen && (
                            <div
                                className="absolute top-full left-0 mt-1 min-w-[72px] bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-md shadow-lg z-[400] py-1 overflow-hidden"
                                role="listbox"
                            >
                                {options.map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        role="option"
                                        aria-selected={itemsPerPage === opt}
                                        onClick={() => {
                                            onItemsPerPageChange(opt);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm transition-colors block border-0 ${
                                            itemsPerPage === opt
                                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-semibold'
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
            </div>

            {/* Right: [<] [current page] [>] */}
            <nav className="flex items-center gap-1" aria-label="Pagination">
                <button
                    onClick={handlePrevious}
                    disabled={!canPrev}
                    className="w-9 h-9 flex items-center justify-center rounded-md border border-gray-200 dark:border-dark-border text-gray-500 dark:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-dark-bg/50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-300 dark:focus:ring-blue-700"
                    aria-label="Previous page"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <span
                    className="min-w-[36px] h-9 flex items-center justify-center rounded-md border-2 border-blue-500 dark:border-blue-400 bg-white dark:bg-dark-surface text-blue-600 dark:text-blue-400 text-sm font-semibold"
                    aria-current="page"
                >
                    {currentPage}
                </span>
                <button
                    onClick={handleNext}
                    disabled={!canNext}
                    className="w-9 h-9 flex items-center justify-center rounded-md border border-gray-200 dark:border-dark-border text-gray-500 dark:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-dark-bg/50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-300 dark:focus:ring-blue-700"
                    aria-label="Next page"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </nav>
        </div>
    );
};

export default PaginationControls;

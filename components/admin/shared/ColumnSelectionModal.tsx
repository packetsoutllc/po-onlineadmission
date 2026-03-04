import React, { useMemo } from 'react';
import AdminModal from './AdminModal';
import { AdminCheckbox } from './forms';

interface Column {
    id: string;
    label: string;
}

interface ColumnSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    columns: Column[];
    visibleColumns: Set<string>;
    onVisibleColumnsChange: (newSet: Set<string>) => void;
    onConfirm: (selectedColumns: Set<string>) => void;
    confirmButtonText: string;
}

const ColumnSelectionModal: React.FC<ColumnSelectionModalProps> = ({
    isOpen,
    onClose,
    title,
    columns,
    visibleColumns,
    onVisibleColumnsChange,
    onConfirm,
    confirmButtonText,
}) => {
    // Determine if all available columns are currently selected
    const areAllSelected = useMemo(() => {
        if (columns.length === 0) return false;
        return columns.every(col => visibleColumns.has(col.id));
    }, [columns, visibleColumns]);

    // Determine if some (but not all) columns are selected
    const isIndeterminate = useMemo(() => {
        if (areAllSelected) return false;
        return columns.some(col => visibleColumns.has(col.id));
    }, [columns, visibleColumns, areAllSelected]);

    // Force absolute set state for "Select All" toggle
    const handleToggleAll = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent checkbox default toggle behavior
        if (areAllSelected) {
            onVisibleColumnsChange(new Set());
        } else {
            onVisibleColumnsChange(new Set(columns.map(c => c.id)));
        }
    };

    const handleSelectNone = () => {
        onVisibleColumnsChange(new Set());
    };

    const handleColumnChange = (columnId: string, isChecked: boolean) => {
        const newSet = new Set(visibleColumns);
        if (isChecked) {
            newSet.add(columnId);
        } else {
            newSet.delete(columnId);
        }
        onVisibleColumnsChange(newSet);
    };

    const handleConfirm = () => {
        onConfirm(visibleColumns);
    };
    
    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title={title} size="4xl">
            <div className="flex flex-col max-h-[70vh]">
                {/* 1. Instructions (Fixed height) */}
                <div className="flex-shrink-0 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/30 mb-4">
                    <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-2">Step 1: Choose Your Export Data</h4>
                    <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-dark-text-secondary space-y-1">
                        <li>Select the columns you wish to include in your data export.</li>
                        <li>Click the action button below to generate and download your CSV file.</li>
                        <li>The exported file will contain data for all students currently shown in the table.</li>
                    </ol>
                </div>

                {/* 2. Select All/None Row (Fixed height) */}
                <div className="flex-shrink-0 flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg/50 rounded-lg border border-logip-border dark:border-dark-border mb-4">
                    <div 
                        className="flex items-center cursor-pointer"
                        onClick={handleToggleAll}
                    >
                        <AdminCheckbox 
                            label="Select All Columns"
                            checked={areAllSelected}
                            indeterminate={isIndeterminate}
                            readOnly // We handle the change via the parent div click
                            className="font-bold text-logip-text-header dark:text-dark-text-primary"
                        />
                    </div>
                    <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); handleSelectNone(); }}
                        className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 hover:underline transition-all"
                    >
                        Select None
                    </button>
                </div>

                {/* 3. SCROLLABLE GRID AREA (Independent scroll keeps buttons visible) */}
                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar border border-logip-border dark:border-dark-border rounded-xl p-2 bg-white dark:bg-dark-surface/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-2 gap-y-0">
                        {columns.map(col => (
                            <div 
                                key={col.id} 
                                className="flex items-center px-2 py-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                            >
                                <AdminCheckbox
                                    label={col.label}
                                    checked={visibleColumns.has(col.id)}
                                    onChange={e => handleColumnChange(col.id, e.target.checked)}
                                    className="group-hover:text-logip-primary text-xs"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. FOOTER (Always visible at bottom) */}
                <div className="flex-shrink-0 pt-6 flex justify-end gap-4 border-t border-logip-border dark:border-dark-border mt-6">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-6 py-2 text-sm font-bold rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={handleConfirm} 
                        disabled={visibleColumns.size === 0}
                        className="px-6 py-2 text-sm font-bold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none transform active:scale-95 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">download</span>
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </AdminModal>
    );
};

export default ColumnSelectionModal;
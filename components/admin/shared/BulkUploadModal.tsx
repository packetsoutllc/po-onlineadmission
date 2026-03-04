import React, { useState, useCallback, useMemo } from 'react';
import AdminModal from './AdminModal';
import { FormSettings } from '../pages/ApplicationDashboardSettings';
import { AdminStudent } from '../pages/StudentsPage';
import { Admission } from '../pages/SettingsPage';
import { AdminCheckbox } from './forms';

interface BulkUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    formSettings: FormSettings | null;
    allStudents: AdminStudent[];
    onUploadSuccess: (newStudents: Omit<AdminStudent, 'id'>[]) => void;
    selectedAdmission: Admission | null;
}


const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, formSettings, allStudents, onUploadSuccess, selectedAdmission }) => {
    // Component State
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [uploadState, setUploadState] = useState<'idle' | 'processing' | 'success'>('idle');
    const [uploadResult, setUploadResult] = useState({ successCount: 0, duplicateCount: 0, duplicates: [] as string[] });
    
    // Column Selection logic
    const finalColumns = useMemo(() => {
        const allCols = formSettings?.fields.filter(f => f.section === 'official_records' && f.visible) || [];
        const nameSystemColumns = formSettings?.nameSystem === 'separated' 
            ? [{ id: 'surname', label: 'Surname' }, { id: 'firstName', label: 'First Name' }, { id: 'otherNames', label: 'Other Names' }]
            : [{ id: 'officialFullName', label: 'Full Name' }];
        
        const otherCols = allCols
            .filter(c => c.id !== 'officialFullName')
            .map(c => ({ id: c.id, label: c.label }));
        
        return [...nameSystemColumns, ...otherCols];
    }, [formSettings]);

    const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());

    // Initialize selected columns only once when columns are loaded
    const isInitialized = React.useRef(false);
    React.useEffect(() => {
        if (finalColumns.length > 0 && !isInitialized.current) {
            setSelectedColumns(new Set(finalColumns.map(c => c.id)));
            isInitialized.current = true;
        }
    }, [finalColumns]);

    // Derived states for Select All
    const areAllSelected = useMemo(() => {
        if (finalColumns.length === 0) return false;
        return finalColumns.every(col => selectedColumns.has(col.id));
    }, [finalColumns, selectedColumns]);

    const isIndeterminate = useMemo(() => {
        if (areAllSelected) return false;
        return finalColumns.some(col => selectedColumns.has(col.id));
    }, [finalColumns, selectedColumns, areAllSelected]);

    // Event Handlers
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) setFile(e.target.files[0]); };
    const handleRemoveFile = () => setFile(null);
    const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); if (event.dataTransfer.files && event.dataTransfer.files[0]) setFile(event.dataTransfer.files[0]); }, []);
    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); };
    
    const handleCloseAndReset = () => {
        setFile(null);
        setUploadState('idle');
        setStep(1);
        setSelectedColumns(new Set(finalColumns.map(c => c.id)));
        onClose();
    };
    
    const handleDownloadTemplate = () => {
        const headers = finalColumns
            .filter(c => selectedColumns.has(c.id))
            .map(c => `"${c.label.replace(/"/g, '""')}"`);

        const csvContent = "data:text/csv;charset=utf-8," + headers.join(',');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "student_upload_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUpload = () => {
        if (!file || !selectedAdmission) return;
        setUploadState('processing');

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.trim().split('\n');
            if (lines.length < 2) {
                setUploadResult({ successCount: 0, duplicateCount: 0, duplicates: [] });
                setUploadState('success');
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const headerToIdMap = new Map<string, string>();
            finalColumns.forEach(col => {
                headerToIdMap.set(col.label, col.id);
            });

            const newStudents: Omit<AdminStudent, 'id'>[] = [];
            const duplicates: string[] = [];
            const existingIndexNumbers = new Set(allStudents.map(s => s.indexNumber));

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                if (values.every(v => v === '')) continue; // Skip empty lines

                const studentData: any = {};
                headers.forEach((header, index) => {
                    const fieldId = headerToIdMap.get(header);
                    if (fieldId) {
                        studentData[fieldId] = values[index];
                    }
                });
                
                const indexNumber = studentData.officialIndexNumber;
                if (!indexNumber || existingIndexNumbers.has(indexNumber)) {
                    duplicates.push(indexNumber || `Row ${i + 1} (Missing Index)`);
                    continue;
                }

                let finalName = '';
                if (formSettings?.nameSystem === 'separated') {
                    finalName = [studentData.surname, studentData.firstName, studentData.otherNames].filter(Boolean).join(' ');
                } else {
                    finalName = studentData.officialFullName;
                }

                const newStudent: Omit<AdminStudent, 'id'> = {
                    name: finalName || 'N/A',
                    surname: studentData.surname,
                    firstName: studentData.firstName,
                    otherNames: studentData.otherNames,
                    indexNumber: indexNumber,
                    schoolId: selectedAdmission.schoolId,
                    admissionId: selectedAdmission.id,
                    programme: studentData.officialProgramme || 'N/A',
                    gender: (studentData.officialGender as 'Male' | 'Female') || 'Male',
                    aggregate: studentData.officialAggregate || 'N/A',
                    status: 'Placed',
                    classId: '',
                    houseId: '',
                    feeStatus: 'Unpaid',
                    residence: (studentData.officialResidence as 'Boarding' | 'Day') || 'Boarding',
                    admissionDate: new Date().toISOString(),
                    isProtocol: false,
                    currentSchoolPlaced: studentData.officialCurrentSchool || ''
                };
                newStudents.push(newStudent);
                existingIndexNumbers.add(indexNumber);
            }

            onUploadSuccess(newStudents);
            setUploadResult({ successCount: newStudents.length, duplicateCount: duplicates.length, duplicates: duplicates });
            setUploadState('success');
        };
        reader.readAsText(file);
    };

    // Robust Toggle logic: If everything is selected, clear everything. Otherwise, select all.
    const handleToggleAll = (e: React.MouseEvent) => {
        e.preventDefault(); 
        if (areAllSelected) {
            setSelectedColumns(new Set());
        } else {
            setSelectedColumns(new Set(finalColumns.map(c => c.id)));
        }
    };

    const handleSelectNone = () => {
        setSelectedColumns(new Set());
    };

    const handleColumnChange = (columnId: string, isChecked: boolean) => {
        const newSet = new Set(selectedColumns);
        if (isChecked) {
            newSet.add(columnId);
        } else {
            newSet.delete(columnId);
        }
        setSelectedColumns(newSet);
    };
    
    // Main Render Logic
    const renderContent = () => {
        if (uploadState === 'processing') {
            return (
                <div className="flex flex-col items-center justify-center text-center py-12">
                     <svg className="animate-spin h-12 w-12 text-logip-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <h3 className="mt-4 text-xl font-semibold text-logip-text-header dark:text-dark-text-primary">Processing Upload...</h3>
                    <p className="text-logip-text-subtle dark:text-dark-text-secondary">Please wait while we validate your data.</p>
                </div>
            );
        }
        if (uploadState === 'success') {
             return (
                <div className="flex flex-col items-center justify-center text-center py-12">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${uploadResult.duplicateCount > 0 ? 'bg-yellow-100 dark:bg-yellow-500/20' : 'bg-green-100 dark:bg-green-500/20'}`}>
                        <span className={`material-symbols-outlined text-4xl ${uploadResult.duplicateCount > 0 ? 'text-yellow-600 dark:text-yellow-300' : 'text-green-600 dark:text-green-300'}`}>
                            {uploadResult.duplicateCount > 0 ? 'warning' : 'task_alt'}
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-logip-text-header dark:text-dark-text-primary">
                        {uploadResult.duplicateCount > 0 ? 'Upload Completed with Warnings' : 'Upload Successful'}
                    </h3>
                    <p className="mt-2 text-logip-text-body dark:text-dark-text-secondary">
                        <strong>{uploadResult.successCount}</strong> records imported.
                    </p>
                    {uploadResult.duplicateCount > 0 && (
                        <div className="mt-4 w-full text-left p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-500/30">
                            <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                                <strong>{uploadResult.duplicateCount} duplicate(s) found and were skipped:</strong>
                            </p>
                            <ul className="list-disc list-inside mt-2 text-sm text-yellow-700 dark:text-yellow-400 max-h-24 overflow-y-auto">
                                {uploadResult.duplicates.map(idx => <li key={idx}>Index Number: {idx}</li>)}
                            </ul>
                        </div>
                    )}
                    <div className="mt-8 w-full max-w-xs">
                         <button onClick={handleCloseAndReset} className="w-full px-4 py-2 text-base font-semibold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover transition-colors">Done</button>
                    </div>
                </div>
            );
        }

        if (step === 1) {
            return ( // Step 1: Exact styling to match Select Columns to Download
                <div className="flex flex-col h-full">
                    {/* Instructions Section */}
                    <div className="flex-shrink-0 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/30 mb-4">
                        <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-2">Step 1: Prepare Your Data</h4>
                        <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-dark-text-secondary space-y-1">
                            <li>Select the columns you want to include in your upload.</li>
                            <li>Download the customized CSV template.</li>
                            <li>Fill in the student data and save the file, then proceed to the next step.</li>
                        </ol>
                    </div>

                    {/* Select All/None Row */}
                    <div className="flex-shrink-0 flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg/50 rounded-lg border border-logip-border dark:border-dark-border mb-4">
                        <div 
                            className="flex items-center cursor-pointer"
                            onClick={handleToggleAll}
                        >
                            <AdminCheckbox 
                                label="Select All Columns"
                                checked={areAllSelected}
                                indeterminate={isIndeterminate}
                                readOnly
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

                    {/* Checkbox Grid Area (Independent scroll) */}
                    <div className="flex-1 min-h-[200px] overflow-y-auto no-scrollbar border border-logip-border dark:border-dark-border rounded-xl p-2 bg-white dark:bg-dark-surface/20">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-2 gap-y-0">
                            {finalColumns.map(col => (
                                <div 
                                    key={col.id} 
                                    className="flex items-center px-2 py-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                                >
                                    <AdminCheckbox
                                        label={col.label}
                                        checked={selectedColumns.has(col.id)}
                                        onChange={e => handleColumnChange(col.id, e.target.checked)}
                                        className="group-hover:text-logip-primary text-xs"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions (Pinned at bottom) */}
                    <div className="flex-shrink-0 pt-6 flex justify-between items-center border-t border-logip-border dark:border-dark-border mt-6">
                        <button onClick={handleDownloadTemplate} className="text-sm font-bold text-logip-primary dark:text-logip-accent hover:underline flex items-center gap-2">
                             <span className="material-symbols-outlined text-lg">download</span>
                             Download CSV Template
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setStep(2)} 
                            disabled={selectedColumns.size === 0}
                            className="px-6 py-2 text-sm font-bold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover transition-colors disabled:opacity-50"
                        >
                            Next: Upload File
                        </button>
                    </div>
                </div>
            );
        }

        if (step === 2) {
            return ( // Step 2: File Upload
                <div className="space-y-6">
                     <h4 className="font-semibold text-logip-text-header dark:text-dark-text-primary">Step 2: Upload Completed File</h4>
                    {!file ? (
                         <div 
                            className="relative border-2 border-dashed border-logip-border dark:border-dark-border rounded-lg p-10 text-center"
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                         >
                            <div className="flex flex-col items-center">
                                <span className="material-symbols-outlined text-5xl text-logip-text-subtle">cloud_upload</span>
                                <label htmlFor="csv-upload" className="font-semibold text-logip-primary cursor-pointer hover:underline mt-2">
                                    Click to upload
                                    <span className="font-normal text-logip-text-body dark:text-gray-300"> or drag and drop</span>
                                </label>
                                <p className="text-xs text-logip-text-subtle dark:text-gray-400 mt-1">CSV file (MAX. 5MB)</p>
                            </div>
                            <input id="csv-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".csv" />
                        </div>
                    ) : (
                         <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-logip-border dark:border-report-border animate-fadeIn">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="material-symbols-outlined text-2xl text-logip-text-subtle">description</span>
                                <p className="text-base text-logip-text-header dark:text-gray-200 truncate font-medium">{file.name}</p>
                            </div>
                            <button onClick={handleRemoveFile} className="text-logip-text-subtle hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0 ml-2">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                    )}
                    <div className="pt-4 flex justify-end items-center gap-4">
                        <button type="button" onClick={() => setStep(1)} className="px-6 py-2 text-sm font-bold rounded-lg border border-logip-border dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-all">Back</button>
                        <button type="button" onClick={handleUpload} disabled={!file} className="px-6 py-2 text-sm font-bold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none">Upload & Process</button>
                    </div>
                </div>
            );
        }
    };
    
    return (
        <AdminModal isOpen={isOpen} onClose={handleCloseAndReset} title="Bulk Upload Students" size="4xl">
            <div className="flex flex-col max-h-[70vh]">
                {renderContent()}
            </div>
        </AdminModal>
    );
};

export default BulkUploadModal;
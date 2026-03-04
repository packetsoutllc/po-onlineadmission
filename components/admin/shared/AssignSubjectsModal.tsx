
import React, { useState, useEffect, useRef } from 'react';
import AdminModal from './AdminModal';
import { Class } from '../pages/ClassesPage';
import { AdminSelect } from './forms';

interface AssignSubjectsModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedClasses: Class[];
    allClasses: Class[];
    onAssign: (classIds: string[], coreSubjects: string[], electiveSubjects: string[], mode: 'replace' | 'append') => void;
}

const RadioButton: React.FC<{ label: string; value: string; checked: boolean; onChange: () => void; name: string; }> = ({ label, value, checked, onChange, name }) => (
    <label className="flex items-center gap-3 cursor-pointer text-base text-logip-text-body dark:text-gray-300">
        <div className="relative flex items-center justify-center w-5 h-5">
            <input
                type="radio"
                name={name}
                value={value}
                checked={checked}
                onChange={onChange}
                className="absolute opacity-0 w-full h-full cursor-pointer"
            />
            <div className={`w-5 h-5 rounded-full border-2 transition-colors ${checked ? 'border-logip-primary' : 'border-gray-400 dark:border-gray-500'}`}></div>
            {checked && <div className="absolute w-2.5 h-2.5 rounded-full bg-logip-primary transition-transform transform scale-100"></div>}
        </div>
        <span>{label}</span>
    </label>
);


const AssignSubjectsModal: React.FC<AssignSubjectsModalProps> = ({ isOpen, onClose, selectedClasses, allClasses, onAssign }) => {
    const [coreSubjects, setCoreSubjects] = useState<string[]>([]);
    const [electiveSubjects, setElectiveSubjects] = useState<string[]>([]);
    const [assignmentMode, setAssignmentMode] = useState<'replace' | 'append'>('replace');
    const [sourceClassId, setSourceClassId] = useState<string>('');
    
    const [coreSubjectInput, setCoreSubjectInput] = useState('');
    const [electiveSubjectInput, setElectiveSubjectInput] = useState('');
    const [editingSubject, setEditingSubject] = useState<{ type: 'coreSubjects' | 'electiveSubjects'; index: number } | null>(null);
    const [editingText, setEditingText] = useState('');
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (sourceClassId) {
            const sourceClass = allClasses.find(c => c.id === sourceClassId);
            if (sourceClass) {
                setCoreSubjects(sourceClass.coreSubjects || []);
                setElectiveSubjects(sourceClass.electiveSubjects || []);
            }
        } else {
            setCoreSubjects([]);
            setElectiveSubjects([]);
        }
    }, [sourceClassId, allClasses]);

    useEffect(() => {
        if (editingSubject && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingSubject]);

    // Reset internal state when modal is closed
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setCoreSubjects([]);
                setElectiveSubjects([]);
                setCoreSubjectInput('');
                setElectiveSubjectInput('');
                setSourceClassId('');
                setAssignmentMode('replace');
            }, 200); // delay to allow for fade-out
        }
    }, [isOpen]);
    
    const handleSubjectKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, subjectType: 'coreSubjects' | 'electiveSubjects') => {
        const input = subjectType === 'coreSubjects' ? coreSubjectInput : electiveSubjectInput;
        const setInput = subjectType === 'coreSubjects' ? setCoreSubjectInput : setElectiveSubjectInput;
        const currentSubjects = subjectType === 'coreSubjects' ? coreSubjects : electiveSubjects;
        const setSubjects = subjectType === 'coreSubjects' ? setCoreSubjectInternal : setElectiveSubjectInternal;

        function setCoreSubjectInternal(prev: string[] | ((p: string[]) => string[])) {
            if (typeof prev === 'function') setCoreSubjects(prev);
            else setCoreSubjects(prev);
        }
        function setElectiveSubjectInternal(prev: string[] | ((p: string[]) => string[])) {
            if (typeof prev === 'function') setElectiveSubjects(prev);
            else setElectiveSubjects(prev);
        }

        if (e.key === 'Enter' && input.trim()) {
            e.preventDefault();
            const newSubject = input.trim();
            if (!currentSubjects.find(s => s.toLowerCase() === newSubject.toLowerCase())) {
                if (subjectType === 'coreSubjects') setCoreSubjects(prev => [...prev, newSubject]);
                else setElectiveSubjects(prev => [...prev, newSubject]);
            }
            setInput('');
        }
    };
    
    const handleRemoveSubject = (subjectToRemove: string, subjectType: 'coreSubjects' | 'electiveSubjects') => {
        if (subjectType === 'coreSubjects') setCoreSubjects(prev => prev.filter(s => s !== subjectToRemove));
        else setElectiveSubjects(prev => prev.filter(s => s !== subjectToRemove));
    };

    const handleStartEdit = (type: 'coreSubjects' | 'electiveSubjects', index: number, text: string) => {
        setEditingSubject({ type, index });
        setEditingText(text);
    };

    const handleSaveEdit = () => {
        if (!editingSubject) return;

        const { type, index } = editingSubject;
        const currentSubjects = type === 'coreSubjects' ? coreSubjects : electiveSubjects;
        const newText = editingText.trim();
        
        if (newText && !currentSubjects.some((s, i) => s.toLowerCase() === newText.toLowerCase() && i !== index)) {
            if (type === 'coreSubjects') {
                setCoreSubjects(prev => {
                    const newSubs = [...prev];
                    newSubs[index] = newText;
                    return newSubs;
                });
            } else {
                setElectiveSubjects(prev => {
                    const newSubs = [...prev];
                    newSubs[index] = newText;
                    return newSubs;
                });
            }
        }

        setEditingSubject(null);
        setEditingText('');
    };

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            setEditingSubject(null);
            setEditingText('');
        }
    };

    const handleSubmit = () => {
        const classIds = selectedClasses.map(c => c.id);
        onAssign(classIds, coreSubjects, electiveSubjects, assignmentMode);
        onClose();
    };

    const renderTagInput = (
        label: string, 
        description: string,
        subjectType: 'coreSubjects' | 'electiveSubjects', 
        inputValue: string, 
        setInputValue: React.Dispatch<React.SetStateAction<string>>
    ) => {
        const currentSubjects = subjectType === 'coreSubjects' ? coreSubjects : electiveSubjects;
        
        return (
            <div>
                <label className="block text-base font-medium text-logip-text-body dark:text-gray-300 mb-1">{label}</label>
                <div className="flex flex-wrap items-center gap-2 p-2 border border-logip-border dark:border-gray-600 rounded-lg bg-logip-white dark:bg-dark-bg focus-within:ring-2 focus-within:ring-logip-primary dark:focus-within:ring-dark-accent-blue">
                    {currentSubjects.map((subject, index) => {
                         const isEditing = editingSubject?.type === subjectType && editingSubject.index === index;
                         return isEditing ? (
                             <input
                                 key={`editing-${index}`}
                                 ref={editInputRef}
                                 type="text"
                                 value={editingText}
                                 onChange={(e) => setEditingText(e.target.value)}
                                 onBlur={handleSaveEdit}
                                 onKeyDown={handleEditKeyDown}
                                 className="bg-transparent border border-logip-primary dark:border-dark-accent-blue rounded px-2 py-1 text-sm font-semibold text-logip-text-header dark:text-dark-text-primary focus:outline-none"
                             />
                         ) : (
                             <span
                                 key={subject}
                                 onDoubleClick={() => handleStartEdit(subjectType, index, subject)}
                                 className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold text-sm px-2 py-1 rounded cursor-pointer"
                             >
                                 {subject}
                                 <button
                                     type="button"
                                     onClick={() => handleRemoveSubject(subject, subjectType)}
                                     className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
                                 >
                                     <span className="material-symbols-outlined text-base">close</span>
                                 </button>
                             </span>
                         );
                    })}
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => handleSubjectKeyDown(e, subjectType)}
                        placeholder={`Add ${subjectType === 'coreSubjects' ? 'core' : 'elective'} & press Enter...`}
                        className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none min-w-[200px] p-1 text-logip-text-header dark:text-dark-text-primary placeholder:text-logip-text-subtle dark:placeholder:text-gray-500"
                    />
                </div>
                 <p className="text-xs text-logip-text-subtle dark:text-gray-400 mt-1">{description}</p>
            </div>
        );
    };
    
    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title={`Assign Subjects to ${selectedClasses.length} Classes`}>
            <div className="space-y-6 pb-48">
                <div>
                    <label className="block text-base font-medium text-logip-text-body dark:text-gray-300 mb-1">Copy Subjects from Existing Class (Optional)</label>
                    <AdminSelect value={sourceClassId} onChange={e => setSourceClassId(e.target.value)}>
                        <option value="">Select a class to copy from...</option>
                        {allClasses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.programme})</option>)}
                    </AdminSelect>
                </div>
                
                {renderTagInput('Core Subjects', 'Defaults are loaded from the programme. Double-click to edit.', 'coreSubjects', coreSubjectInput, setCoreSubjectInput)}
                {renderTagInput('Elective Subjects', 'Add custom elective subjects. Double-click to edit.', 'electiveSubjects', electiveSubjectInput, setElectiveSubjectInput)}
                
                <div>
                    <label className="block text-base font-medium text-logip-text-body dark:text-gray-300 mb-2">Assignment Mode</label>
                    <div className="flex items-center gap-6">
                        <RadioButton 
                            label="Replace existing subjects"
                            value="replace"
                            checked={assignmentMode === 'replace'}
                            onChange={() => setAssignmentMode('replace')}
                            name="assignmentMode"
                        />
                        <RadioButton 
                            label="Append to existing subjects"
                            value="append"
                            checked={assignmentMode === 'append'}
                            onChange={() => setAssignmentMode('append')}
                            name="assignmentMode"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-6 py-2 text-base font-semibold rounded-lg border border-logip-border dark:border-dark-border text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Cancel</button>
                    <button type="button" onClick={handleSubmit} className="px-6 py-2 text-base font-semibold rounded-lg bg-logip-orange-btn text-white hover:bg-logip-orange-btn-hover">Assign Subjects</button>
                </div>
            </div>
        </AdminModal>
    );
};

export default AssignSubjectsModal;

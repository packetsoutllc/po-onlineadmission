import React, { useState, useEffect } from 'react';
import AdminModal from './AdminModal';
import { FormFieldConfig } from '../pages/ApplicationDashboardSettings';
import { AdminInput, AdminSelect, AdminTextarea } from './forms';

interface FieldEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<FormFieldConfig, 'id' | 'default'>) => void;
    fieldToEdit?: FormFieldConfig;
    section: FormFieldConfig['section'] | null;
    potentialParents: FormFieldConfig[];
}

const FieldEditorModal: React.FC<FieldEditorModalProps> = ({ isOpen, onClose, onSave, fieldToEdit, section, potentialParents }) => {
    const [label, setLabel] = useState('');
    const [type, setType] = useState<FormFieldConfig['type']>('text');
    const [placeholder, setPlaceholder] = useState('');
    const [options, setOptions] = useState('');
    const [condition, setCondition] = useState<FormFieldConfig['condition'] | null>(null);
    const [accept, setAccept] = useState('');
    const [maxSizeMB, setMaxSizeMB] = useState<number | ''>(2);
    const [enableAiEditing, setEnableAiEditing] = useState(false);
    const [startNewRow, setStartNewRow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLabel(fieldToEdit?.label || '');
            setType(fieldToEdit?.type || 'text');
            setPlaceholder(fieldToEdit?.placeholder || '');
            setOptions(fieldToEdit?.options?.join('\n') || '');
            setCondition(fieldToEdit?.condition || null);
            setAccept(fieldToEdit?.accept || '');
            setMaxSizeMB(fieldToEdit?.maxSizeMB || '');
            setEnableAiEditing(fieldToEdit?.enableAiEditing || false);
            setStartNewRow(fieldToEdit?.startNewRow || false);
        }
    }, [isOpen, fieldToEdit]);
    
    const handleSave = () => {
        if (!label.trim() || !section) return;
        const fieldData: Omit<FormFieldConfig, 'id' | 'default'> = {
            label: label.trim(),
            type,
            placeholder: placeholder.trim(),
            options: type === 'select' ? options.split('\n').map(o => o.trim()).filter(Boolean) : [],
            required: fieldToEdit?.required ?? false,
            visible: fieldToEdit?.visible ?? true,
            section: fieldToEdit?.section || section,
            condition: (condition && condition.fieldId && condition.value) ? condition : null,
            accept: (type === 'photo' || type === 'document') ? accept : undefined,
            maxSizeMB: (type === 'photo' || type === 'document') ? (Number(maxSizeMB) || undefined) : undefined,
            enableAiEditing: type === 'photo' ? enableAiEditing : undefined,
            startNewRow,
        };
        onSave(fieldData);
    };

    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title={fieldToEdit ? 'Edit Field' : 'Add Custom Field'}>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Field Label</label>
                    <AdminInput value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g., National ID" required />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Field Type</label>
                        <AdminSelect value={type} onChange={e => setType(e.target.value as any)}>
                            <option value="text">Text</option>
                            <option value="textarea">Text Area</option>
                            <option value="number">Number</option>
                            <option value="email">Email</option>
                            <option value="tel">Phone</option>
                            <option value="date">Date</option>
                            <option value="select">Dropdown (Select)</option>
                            <option value="photo">Photo</option>
                            <option value="document">Document</option>
                        </AdminSelect>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Placeholder</label>
                        <AdminInput value={placeholder} onChange={e => setPlaceholder(e.target.value)} />
                    </div>
                </div>

                {type === 'select' && (
                    <div className="animate-fadeIn">
                        <label className="block text-sm font-bold text-logip-text-header dark:text-dark-text-primary mb-1.5">Dropdown Options</label>
                        <AdminTextarea 
                            value={options} 
                            onChange={e => setOptions(e.target.value)} 
                            rows={5}
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                        />
                        <p className="text-[10px] text-logip-text-subtle dark:text-dark-text-secondary mt-1 uppercase tracking-wider font-bold">Enter each option on a new line</p>
                    </div>
                )}

                <div className="pt-2">
                    <label className="flex items-center gap-2 text-sm text-logip-text-body dark:text-gray-300 cursor-pointer">
                        <input type="checkbox" checked={startNewRow} onChange={e => setStartNewRow(e.target.checked)} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"/>
                        Start this field on a new line (Full Width)
                    </label>
                </div>

                 <div>
                    <h4 className="text-base font-semibold text-logip-text-header dark:text-dark-text-primary mb-2">Display Condition (Optional)</h4>
                    <div className="p-4 border border-logip-border dark:border-dark-border rounded-lg bg-gray-50 dark:bg-dark-bg/50">
                        {!condition ? (
                            <button type="button" onClick={() => setCondition({ fieldId: '', operator: 'equals', value: '' })} className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline">+ Add Condition</button>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <AdminSelect value={condition.fieldId} onChange={e => setCondition(c => c ? {...c, fieldId: e.target.value} : null)}>
                                    <option value="" disabled>Parent Field...</option>
                                    {potentialParents.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                                </AdminSelect>
                                <AdminInput value={condition.value} onChange={e => setCondition(c => c ? {...c, value: e.target.value} : null)} placeholder="If Value Equals..." />
                                <button type="button" onClick={() => setCondition(null)} className="text-red-500 font-semibold text-sm hover:underline mb-2">Remove</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
             <div className="pt-8 flex justify-end gap-4">
                <button type="button" onClick={onClose} className="px-5 py-2 text-base font-semibold rounded-lg border border-logip-border dark:border-dark-border text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Cancel</button>
                <button type="button" onClick={handleSave} className="px-5 py-2 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">{fieldToEdit ? 'Save Changes' : 'Add Field'}</button>
            </div>
        </AdminModal>
    );
};

export default FieldEditorModal;
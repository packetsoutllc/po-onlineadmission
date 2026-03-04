import React from 'react';
import { FormField, Input, Select, Textarea } from './FormControls';
import DatePicker from './DatePicker';
import { FormFieldConfig } from './admin/pages/ApplicationDashboardSettings';
import FileUploadInput from './FileUploadInput';
import { Student, AiSettings } from './StudentDetails';

interface DynamicFormFieldProps {
    field: FormFieldConfig;
    value: any;
    onChange: (name: string, value: any) => void;
    disabled?: boolean;
    student: Student;
    aiSettings: AiSettings | null;
    isAdminEditMode?: boolean;
}

// List of fields that should be strictly UPPERCASE (Name fields)
const NAME_FIELD_IDS = ['surname', 'firstName', 'otherNames', 'primaryFullName', 'secondaryFullName', 'officialFullName', 'name'];

// List of fields that represent phone numbers
const PHONE_FIELD_IDS = ['contactNumber', 'primaryContact', 'secondaryContact', 'primaryWhatsapp', 'secondaryWhatsapp', 'phoneNumber', 'parentContact'];

// List of fields that represent index numbers
const INDEX_FIELD_IDS = ['indexNumber', 'officialIndexNumber'];

// List of fields that represent aggregate
const AGGREGATE_FIELD_IDS = ['aggregate', 'officialAggregate'];

const DynamicFormField: React.FC<DynamicFormFieldProps> = ({ field, value, onChange, disabled, student, aiSettings, isAdminEditMode }) => {
    
    if (field.type === 'photo' || field.type === 'document') {
        return (
            <FileUploadInput
                id={field.id}
                field={field}
                studentIndexNumber={student.indexNumber}
                isSubmitted={disabled}
                gender={student.gender}
                isAdminEditMode={isAdminEditMode}
                aiSettings={aiSettings}
                value={value}
                onChange={onChange}
            />
        );
    }

    // Gracefully handle cases where a non-file input field might have a file object as its value (e.g., due to stale data).
    // This prevents React from trying to render an object, which causes a crash.
    const finalValue = (typeof value === 'object' && value !== null) ? '' : value;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        let val = e.target.value;

        if (field.type === 'text' || field.type === 'textarea' || field.type === 'tel' || field.type === 'number') {
            // Exclude email fields if they happen to be typed as 'text'
            if (field.id.toLowerCase().includes('email')) {
                 // No formatting for email
            } else if (NAME_FIELD_IDS.includes(field.id)) {
                // Enforce Uppercase for Name Fields
                val = val.toUpperCase();
            } else if (PHONE_FIELD_IDS.includes(field.id) || field.type === 'tel') {
                // Enforce max length 10 for phone
                if (val.length > 10) return;

                // Enforce leading zero for phone fields
                if (val.length === 1 && val !== '0') {
                    val = '0' + val;
                }
            } else if (INDEX_FIELD_IDS.includes(field.id)) {
                // Enforce max length 12 for index number
                if (val.length > 12) return;
            } else {
                 // Enforce Title Case for other text fields (First letter of every word capitalized)
                 // Using regex to match the first character of the string or any character following a whitespace
                 val = val.replace(/(^|\s)[a-z]/g, (char) => char.toUpperCase());
            }
        }
        onChange(field.id, val);
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const val = e.target.value;

        // Aggregate Logic: Enforce minimum 06
        if (AGGREGATE_FIELD_IDS.includes(field.id) || field.id.toLowerCase().includes('aggregate')) {
            const numVal = parseInt(val, 10);
            if (!isNaN(numVal) && numVal < 6) {
                onChange(field.id, '');
                return;
            }
        }

        // Automatically add zero before single digit numbers
        // Applies to number type fields, or text fields that look like aggregates
        if ((field.type === 'number' || field.id.toLowerCase().includes('aggregate')) && val.length === 1 && /^\d$/.test(val)) {
            onChange(field.id, '0' + val);
        }
    };

    const getValidationError = () => {
        if (!finalValue || disabled) return null;
        const strVal = String(finalValue);

        if (PHONE_FIELD_IDS.includes(field.id) || field.type === 'tel') {
             if (!/^0\d{9}$/.test(strVal)) return "Must be 10 digits starting with 0";
        }
        if (INDEX_FIELD_IDS.includes(field.id)) {
            if (strVal.length !== 12) return "Must be exactly 12 digits";
        }
        if (AGGREGATE_FIELD_IDS.includes(field.id) || field.id.toLowerCase().includes('aggregate')) {
            const num = parseInt(strVal, 10);
            if (!isNaN(num) && num < 6) return "Must be 06 or higher";
        }
        return null;
    };

    const commonProps = {
        id: field.id,
        name: field.id,
        value: finalValue,
        onChange: handleChange,
        onBlur: handleBlur,
        placeholder: field.placeholder,
        disabled: disabled,
        required: field.required,
    };

    let inputComponent;

    switch (field.type) {
        case 'text':
        case 'number':
        case 'email':
        case 'tel':
            inputComponent = <Input type={field.type} {...commonProps} />;
            break;
        case 'textarea':
            inputComponent = <Textarea {...commonProps} />;
            break;
        case 'select':
            inputComponent = (
                <Select {...commonProps}>
                    {field.options?.map(option => (
                        <option key={option} value={option === '' ? '' : option}>
                            {option === '' ? (field.placeholder || 'Select an option') : option}
                        </option>
                    ))}
                </Select>
            );
            break;
        case 'date':
             inputComponent = (
                <DatePicker 
                    id={field.id}
                    value={finalValue} 
                    onChange={(date) => onChange(field.id, date)} 
                    disabled={disabled}
                />
            );
            break;
        default:
            inputComponent = <Input type="text" {...commonProps} />;
    }
    
    const labelWithAsterisk = (
        <>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
        </>
    );

    const error = getValidationError();

    return (
        <FormField label={labelWithAsterisk}>
            {inputComponent}
            {error && <p className="text-xs text-red-500 mt-1 animate-fadeIn">{error}</p>}
        </FormField>
    );
};

export default DynamicFormField;
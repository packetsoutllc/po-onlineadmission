
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { FormField, Input, Textarea } from './FormControls';

interface AIAutosuggestInputProps {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    context: 'hometown' | 'school' | 'occupation' | 'disability' | 'none';
    as?: 'input' | 'textarea';
}

const AIAutosuggestInput: React.FC<AIAutosuggestInputProps> = ({ label, name, value, onChange, placeholder, disabled, context, as = 'input' }) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const getSuggestions = useCallback(async (inputValue: string) => {
        if (context === 'none' || inputValue.length < 2) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);

        const prompts = {
            hometown: `List up to 5 common Ghanaian hometowns that start with '${inputValue}'. The names should be relevant and spelled correctly.`,
            school: `List up to 5 common Ghanaian Junior High Schools that start with '${inputValue}'. Include common abbreviations like 'JHS'.`,
            occupation: `List up to 5 common occupations in Ghana that start with '${inputValue}'.`,
            disability: `List up to 5 common descriptions for disabilities or special needs starting with '${inputValue}'. Focus on formal, respectful, and clear medical or descriptive terms. Examples: "Visual impairment", "Hearing loss", "Mobility impairment requiring wheelchair access", "Dyslexia".`,
        };

        const prompt = prompts[context];
        if (!prompt) {
            setIsLoading(false);
            return;
        }
        
        try {
            // FIX: Initialize GoogleGenAI right before the call with process.env.API_KEY directly as per guidelines.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview", // Updated to recommended model
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                    },
                },
            });

            const jsonStr = response.text?.trim();
            if (!jsonStr) {
              setSuggestions([]);
              return;
            }
            const result = JSON.parse(jsonStr);

            if (Array.isArray(result)) {
                setSuggestions(result);
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            console.error(`AI suggestion for ${context} failed:`, error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, [context]);

    useEffect(() => {
        if (!value) {
            setIsDropdownVisible(false);
            return;
        }

        const handler = setTimeout(() => {
            getSuggestions(value);
            setIsDropdownVisible(true);
        }, 500); // 500ms debounce

        return () => clearTimeout(handler);
    }, [value, getSuggestions]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsDropdownVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSuggestionClick = (suggestion: string) => {
        onChange(suggestion);
        setIsDropdownVisible(false);
    };
    
    const commonProps = {
        name,
        value,
        placeholder,
        disabled,
        autoComplete: "off",
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    };

    return (
        <FormField label={label} className="relative" ref={containerRef}>
            {as === 'textarea' ? (
                <Textarea {...commonProps} />
            ) : (
                <Input type="text" {...commonProps} />
            )}
            {isDropdownVisible && (suggestions.length > 0 || isLoading) && (
                <div className="absolute z-10 top-full mt-1 w-full bg-logip-white dark:bg-report-dark border border-logip-border dark:border-report-border rounded-lg shadow-lg overflow-hidden animate-fadeIn">
                    {isLoading ? (
                        <div className="p-3 text-sm text-logip-text-subtle">Searching...</div>
                    ) : (
                        <ul className="py-1">
                            {suggestions.map((s, i) => (
                                <li
                                    key={i}
                                    onClick={() => handleSuggestionClick(s)}
                                    className="px-3 py-2 text-base text-logip-text-body dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer"
                                >
                                    {s}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </FormField>
    );
};

export default AIAutosuggestInput;

import React, { useState, useRef } from 'react';
import { Student, AiSettings } from './StudentDetails';
import { GoogleGenAI, Modality } from '@google/genai';
import { usePrevious } from '../utils/storage';
import ImagePreviewModal from './shared/ImagePreviewModal';
import WebcamCaptureModal from './WebcamCaptureModal';
import { FormFieldConfig } from './admin/pages/ApplicationDashboardSettings';
import PDFPreviewModal from './PDFPreviewModal';

const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

interface FileUploadInputProps {
    id?: string;
    field: FormFieldConfig;
    studentIndexNumber: string;
    isSubmitted?: boolean;
    gender?: string;
    isAdminEditMode?: boolean;
    aiSettings: AiSettings | null;
    value: { name: string; size: number; type: string; data: string; } | null;
    onChange: (fieldId: string, value: any) => void;
}

const FileUploadInput: React.FC<FileUploadInputProps> = ({ id, field, studentIndexNumber, isSubmitted = false, gender = 'female', isAdminEditMode = false, aiSettings, value, onChange }) => {
    
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [previewModal, setPreviewModal] = useState<{ type: 'image' | 'pdf'; isOpen: boolean; data: string; name: string; }>({ type: 'image', isOpen: false, data: '', name: '' });
    const [isWebcamOpen, setIsWebcamOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    
    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 4000);
    };

    // Compresses image to max 800px width/height to save LocalStorage space
    const compressImage = (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                } else {
                    resolve(base64Str);
                }
            };
            img.onerror = () => resolve(base64Str);
        });
    };

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(blob);
        });
    };
    
    const editImageWithAI = async (base64Data: string, originalFileName: string = 'Webcam Capture.jpg') => {
        // STRICT CHECK: Only proceed if field enables AI AND global setting enables AI
        if (!aiSettings?.enableAiUniformGeneration || !field.enableAiEditing) {
             const compressed = await compressImage(base64Data);
             const data = { name: originalFileName, data: compressed, type: 'image/jpeg', size: Math.round(compressed.length * 0.75) };
             onChange(field.id, data);
             return;
        }

        setIsProcessingAI(true);
        onChange(field.id, null); 

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const uniformDescription = gender?.toLowerCase() === 'male' 
                ? aiSettings.maleUniformDescription
                : aiSettings.femaleUniformDescription;

            const prompt = `Task: Convert the input image into a professional passport photo.
Requirements:
1.  Background: Plain white.
2.  Pose: Center the person, facing forward. Correct any head tilt.
3.  Attire: The person must be wearing a formal school uniform (${uniformDescription}) with the color ${aiSettings.uniformColor}.
4.  Style: The final image must be photorealistic.`;
            
            // Use compressed input for API to save bandwidth
            const compressedInput = await compressImage(base64Data, 500, 0.8);
            const mimeType = 'image/jpeg';
            const imagePart = { inlineData: { data: compressedInput.split(',')[1], mimeType: mimeType } };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [imagePart, { text: prompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });

            let imageFound = false;
            if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        const editedBase64 = part.inlineData.data;
                        const editedDataUrl = `data:${part.inlineData.mimeType};base64,${editedBase64}`;
                        const finalCompressed = await compressImage(editedDataUrl);
                        const newData = { name: 'Final Passport Photo.jpg', data: finalCompressed, type: part.inlineData.mimeType, size: Math.round(finalCompressed.length * 0.75) };
                        onChange(field.id, newData);
                        imageFound = true;
                        break;
                    }
                }
            }

            if (!imageFound) {
                throw new Error("AI did not generate an image part in the response.");
            }
        } catch (error) {
            console.error("AI image editing failed:", error);
            showToast("AI generation failed. Saving original image instead.");
            const compressed = await compressImage(base64Data);
            const fallbackData = { name: originalFileName, data: compressed, type: 'image/jpeg', size: Math.round(compressed.length * 0.75) };
            onChange(field.id, fallbackData);
        } finally {
            setIsProcessingAI(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const currentFile = event.target.files[0];
            // Check 5MB hard limit to prevent browser crash before we even start
            if (currentFile.size > 5 * 1024 * 1024) {
                showToast(`File is too large (${formatBytes(currentFile.size)}). Max limit is 5MB.`);
                return;
            }
            
            if (field.maxSizeMB && currentFile.size > field.maxSizeMB * 1024 * 1024) {
                showToast(`File exceeds the configured limit of ${field.maxSizeMB}MB.`);
                return;
            }

            const base64Data = await blobToBase64(currentFile);

            const shouldEditWithAi = field.enableAiEditing && aiSettings?.enableAiUniformGeneration;

            if (shouldEditWithAi && currentFile.type.startsWith('image/')) {
                await editImageWithAI(base64Data, currentFile.name);
            } else {
                 // Compress if image
                 let finalData = base64Data;
                 if (currentFile.type.startsWith('image/')) {
                     finalData = await compressImage(base64Data);
                 }
                 const data = { name: currentFile.name, data: finalData, type: currentFile.type, size: Math.round(finalData.length * 0.75) };
                 onChange(field.id, data);
            }
        }
    };

    const handleWebcamCapture = async (imageDataUrl: string) => {
        setIsWebcamOpen(false);
        const shouldEditWithAi = field.enableAiEditing && aiSettings?.enableAiUniformGeneration;

        if (shouldEditWithAi) {
            await editImageWithAI(imageDataUrl);
        } else {
            const compressed = await compressImage(imageDataUrl);
            const data = { name: 'Webcam Capture.jpg', data: compressed, type: 'image/jpeg', size: Math.round(compressed.length * 0.75) };
            onChange(field.id, data);
        }
    };

    const handleRemoveFile = () => {
        onChange(field.id, null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        try {
             const key = `applicationData_${studentIndexNumber}`;
             const stored = localStorage.getItem(key);
             if (stored) {
                 const data = JSON.parse(stored);
                 if (data[`doc_verified_${field.id}`]) {
                     delete data[`doc_verified_${field.id}`];
                     localStorage.setItem(key, JSON.stringify(data));
                 }
             }
        } catch(e) {}
    };
    
    const handlePreview = () => {
        if (!value) return;
        if (value.type.startsWith('image/')) {
            setPreviewModal({ type: 'image', isOpen: true, data: value.data, name: value.name });
        } else if (value.type === 'application/pdf') {
            setPreviewModal({ type: 'pdf', isOpen: true, data: value.data, name: value.name });
        } else {
            showToast('Preview is not available for this file type.');
        }
    };

    const closePreview = () => setPreviewModal(p => ({ ...p, isOpen: false }));

    const isEffectivelyDisabled = isSubmitted && !isAdminEditMode;
    const maxSizeDisplay = field.maxSizeMB ? `MAX. ${field.maxSizeMB}MB` : '';

    return (
        <>
            <div id={id} className="flex flex-col h-full">
                <label className="block text-sm font-medium text-black dark:text-gray-300 mb-1.5">{field.label}</label>
                <div className="relative flex-grow">
                    {isProcessingAI && (
                         <div className="absolute inset-0 z-10 bg-logip-white/80 dark:bg-report-dark/80 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-logip-border dark:border-report-border p-6">
                            <svg className="animate-spin h-8 w-8 text-logip-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <p className="mt-3 text-base font-semibold text-logip-primary">Processing photo with AI...</p>
                            <p className="text-sm text-black dark:text-gray-400">This may take a moment.</p>
                        </div>
                    )}
                    {value ? (
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-report-button border border-logip-border dark:border-report-border rounded-lg">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="material-symbols-outlined text-2xl text-logip-text-subtle dark:text-report-subtle">{value.type.startsWith('image/') ? 'badge' : 'description'}</span>
                                <div className="min-w-0">
                                    <p className="text-sm text-black dark:text-gray-200 truncate font-semibold" title={value.name}>{value.name}</p>
                                    {value.size > 0 && <p className="text-xs text-black dark:text-report-subtle truncate">{formatBytes(value.size)}</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <button onClick={handlePreview} type="button" className="px-4 py-1.5 text-sm font-semibold rounded-md bg-gray-200 dark:bg-dark-border hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">Preview</button>
                                {!isEffectivelyDisabled && (<button onClick={handleRemoveFile} className="text-logip-text-subtle hover:text-red-500 dark:hover:text-red-400 transition-colors"><span className="material-symbols-outlined text-lg">close</span></button>)}
                            </div>
                        </div>
                    ) : isEffectivelyDisabled ? (
                        <div className="relative border-2 border-dashed border-logip-border dark:border-report-border rounded-lg p-6 text-center bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed h-full"><div className="flex flex-col items-center justify-center h-full opacity-60"><span className="material-symbols-outlined text-4xl text-logip-text-subtle">cloud_off</span><p className="font-semibold text-black">No file uploaded</p><p className="text-xs text-black dark:text-gray-400 mt-1">Editing is locked after submission.</p></div></div>
                    ) : (
                        <div className={`relative border-2 border-dashed border-logip-border dark:border-report-border rounded-lg text-center h-full ${isProcessingAI ? 'invisible' : ''}`}>
                            <div className="flex flex-col items-center justify-center h-full p-6 space-y-4">
                               {field.type === 'photo' && (
                                   <button 
                                        type="button" 
                                        onClick={() => setIsWebcamOpen(true)} 
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-logip-primary text-logip-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                    >
                                       <span className="material-symbols-outlined">photo_camera</span>Take Photo
                                   </button>
                               )}
                               {field.type === 'photo' && (<div className="text-sm text-logip-text-subtle dark:text-gray-400">or</div>)}
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-logip-border dark:border-dark-border text-black dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"><span className="material-symbols-outlined">upload_file</span>Upload File</button>
                                <p className="text-xs text-black dark:text-gray-400 mt-1">{field.accept?.toUpperCase().replace(/,/g, ', ')} ({maxSizeDisplay})</p>
                            </div>
                             <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept={field.accept} disabled={isEffectivelyDisabled || isProcessingAI} />
                        </div>
                    )}
                </div>
            </div>
             <WebcamCaptureModal isOpen={isWebcamOpen} onClose={() => setIsWebcamOpen(false)} onCapture={handleWebcamCapture} />
             {previewModal.isOpen && previewModal.type === 'image' && (
                <ImagePreviewModal isOpen={true} onClose={closePreview} imageUrl={previewModal.data} altText={previewModal.name} />
            )}
            {previewModal.isOpen && previewModal.type === 'pdf' && (
                <PDFPreviewModal isOpen={true} onClose={closePreview} pdfData={previewModal.data} fileName={previewModal.name} />
            )}
             {toastMessage && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] bg-red-600 text-white px-6 py-3 rounded-full shadow-lg animate-fadeIn flex items-center gap-2"><span className="material-symbols-outlined">error</span><span>{toastMessage}</span><button onClick={() => setToastMessage(null)} className="ml-4 -mr-2 p-1 rounded-full hover:bg-white/20"><span className="material-symbols-outlined text-base">close</span></button></div>
            )}
        </>
    );
};

export default FileUploadInput;
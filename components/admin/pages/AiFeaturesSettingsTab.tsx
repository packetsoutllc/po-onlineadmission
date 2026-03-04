
import React, { useState, useRef } from 'react';
import { School, Admission } from './SettingsPage';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../shared/ToastContext';
import { AdminInput, AdminTextarea, AdminCheckbox } from '../shared/forms';
import { GoogleGenAI, Modality } from '@google/genai';
import ImagePreviewModal from '../../shared/ImagePreviewModal';
import { AiSettings } from '../../StudentDetails';
import { ToggleSwitch } from './SecuritySettingsTab';

interface TabProps {
  selectedSchool?: School | null;
  selectedAdmission?: Admission | null;
}

const PlaceholderTab: React.FC<{ title: string, icon: string, message: string }> = ({ title, icon, message }) => (
    <div className="flex flex-col items-center justify-center text-center h-full min-h-[300px] animate-fadeIn text-logip-text-subtle">
        <div className="w-16 h-16 rounded-full bg-logip-border dark:bg-dark-border flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-4xl">{icon}</span>
        </div>
        <h2 className="text-2xl font-bold text-logip-text-header dark:text-dark-text-primary">{title}</h2>
        <p className="mt-2 text-base max-w-md">{message}</p>
    </div>
);

const AiFeaturesSettingsTab: React.FC<TabProps> = ({ selectedSchool, selectedAdmission }) => {
    const { showToast } = useToast();
    const storageKey = selectedSchool && selectedAdmission ? `aiFeaturesSettings_${selectedSchool.id}_${selectedAdmission.id}` : '';

    const [settings, setSettings] = useLocalStorage<AiSettings>(storageKey, {
        enableAiChat: true,
        systemInstruction: `You are a friendly and helpful AI assistant for ${selectedSchool?.name || 'the school'}. Your role is to assist prospective students with the online admission process. Provide clear, concise answers based on the student's data and the system's features. Do not answer questions outside this scope.`,
        enableAiUniformGeneration: true,
        maleUniformDescription: "a formal collared school uniform shirt",
        femaleUniformDescription: "a formal round-neck school uniform blouse",
        uniformColor: "#2563EB",
        maleUniformSample: null,
        femaleUniformSample: null,
        enableAiWatchDog: true,
        watchDogFlags: {
            inconsistentData: true,
            resultPatterns: false,
            summarizeEdits: true,
            formHacking: true,
        },
        watchDogSensitivity: 'medium',
    });
    
    const [isMalePreviewLoading, setIsMalePreviewLoading] = useState(false);
    const [isFemalePreviewLoading, setIsFemalePreviewLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState<{ isOpen: boolean; url: string; alt: string }>({
        isOpen: false,
        url: '',
        alt: '',
    });

    const maleFileInputRef = useRef<HTMLInputElement>(null);
    const femaleFileInputRef = useRef<HTMLInputElement>(null);

    const handleSampleUpload = (e: React.ChangeEvent<HTMLInputElement>, gender: 'male' | 'female') => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showToast('Sample image must be less than 2MB', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setSettings(prev => ({
                    ...prev,
                    [gender === 'male' ? 'maleUniformSample' : 'femaleUniformSample']: base64
                }));
                showToast(`${gender.charAt(0).toUpperCase() + gender.slice(1)} uniform sample uploaded.`, 'success');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClearSample = (gender: 'male' | 'female') => {
        setSettings(prev => ({
            ...prev,
            [gender === 'male' ? 'maleUniformSample' : 'femaleUniformSample']: null
        }));
    };

    const handlePreview = async (gender: 'male' | 'female') => {
        const setLoading = gender === 'male' ? setIsMalePreviewLoading : setIsFemalePreviewLoading;
        setLoading(true);

        if (!process.env.API_KEY) {
            showToast("Gemini API key is not configured. Please set it up to use this feature.", 'error');
            setLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const description = gender === 'male' ? settings.maleUniformDescription : settings.femaleUniformDescription;
            const sampleImage = gender === 'male' ? settings.maleUniformSample : settings.femaleUniformSample;
            const schoolLogo = selectedSchool?.logo;

            const prompt = `Task: Generate a photorealistic passport photo of a Ghanaian high school student.
Requirements:
1.  **Student:** The student is ${gender}.
2.  **Attire:** The student must be wearing ${description}. The uniform's primary color is ${settings.uniformColor}.
3.  **Reference:** Use the provided reference image (if available) to match the style and pattern of the uniform.
4.  **Crest/Logo:** The uniform must feature the provided school logo image on the chest pocket area, looking natural and integrated.
5.  **Background:** Plain white.
6.  **Pose:** Centered, facing forward.`;

            const parts: any[] = [{ text: prompt }];

            // Add sample reference if available
            if (sampleImage && sampleImage.startsWith('data:')) {
                const mimeTypeMatch = sampleImage.match(/^data:(image\/\w+);base64,/);
                const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
                const base64Data = sampleImage.split(',')[1];
                parts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType,
                    },
                });
            }

            if (schoolLogo && schoolLogo.startsWith('data:')) {
                try {
                    const mimeTypeMatch = schoolLogo.match(/^data:(image\/\w+);base64,/);
                    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
                    const base64Data = schoolLogo.split(',')[1];
                    
                    if (base64Data) {
                        parts.push({
                            inlineData: {
                                data: base64Data,
                                mimeType: mimeType,
                            },
                        });
                    }
                } catch (e) {
                    console.warn("Failed to parse school logo for AI prompt", e);
                }
            }


            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts },
                config: { responseModalities: [Modality.IMAGE] },
            });
            
            let imageFound = false;
            if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        const base64Image = part.inlineData.data;
                        const dataUrl = `data:${part.inlineData.mimeType};base64,${base64Image}`;
                        setPreviewImage({
                            isOpen: true,
                            url: dataUrl,
                            alt: `${gender} uniform preview`,
                        });
                        imageFound = true;
                        break;
                    }
                }
            }

            if (!imageFound) {
                showToast("AI response structure was valid, but no image was returned. Try adjusting the description.", 'error');
            }
        } catch (error) {
            console.error("AI preview failed:", error);
            showToast("Failed to generate preview. Please check console for details.", 'error');
        } finally {
            setLoading(false);
        }
    };


    const handleSave = () => {
        setSettings({ ...settings });
        showToast('AI feature settings saved successfully!', 'success');
    };
    
    if (!selectedSchool || !selectedAdmission) {
        return <PlaceholderTab title="Select an Admission" icon="auto_awesome" message="Please select a school and an active admission group from the 'Setup' tab to configure AI Features." />;
    }

    return (
        <>
            <div className="animate-fadeIn space-y-6">
                <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary">AI Support Chat</h3>
                            <p className="text-logip-text-subtle dark:text-dark-text-secondary mt-1">Configure the "Support Connect" AI chat for applicants.</p>
                        </div>
                        <ToggleSwitch 
                            checked={settings.enableAiChat} 
                            onChange={e => setSettings(s => ({...s, enableAiChat: e.target.checked}))} 
                        />
                    </div>
                    <div className="mt-6">
                        <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">System Instruction (AI Persona)</label>
                        <AdminTextarea 
                            value={settings.systemInstruction} 
                            onChange={e => setSettings(s => ({...s, systemInstruction: e.target.value}))} 
                            rows={6}
                            placeholder="Define the AI's role and rules..."
                        />
                        <p className="text-xs text-logip-text-subtle dark:text-dark-text-secondary mt-2">This instruction guides the AI's personality and knowledge base. Be specific about its role and limitations.</p>
                    </div>
                </div>
                 <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary">AI Uniform Generation</h3>
                            <p className="text-logip-text-subtle dark:text-dark-text-secondary mt-1">Automatically edit student passport photos to include a school uniform.</p>
                        </div>
                        <ToggleSwitch 
                            checked={settings.enableAiUniformGeneration} 
                            onChange={e => setSettings(s => ({...s, enableAiUniformGeneration: e.target.checked}))} 
                        />
                    </div>
                     <div className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Male Uniform Config */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-logip-primary text-sm uppercase tracking-wider">Male Uniform</h4>
                                <div className="flex flex-col gap-3">
                                    <label className="block text-sm font-medium text-logip-text-subtle dark:text-dark-text-secondary">Uniform Description</label>
                                    <div className="flex items-center gap-2">
                                        <AdminInput value={settings.maleUniformDescription} onChange={e => setSettings(s => ({...s, maleUniformDescription: e.target.value}))} />
                                        <button type="button" onClick={() => handlePreview('male')} disabled={isMalePreviewLoading || isFemalePreviewLoading} className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-logip-border dark:border-dark-border text-logip-text-body dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-border transition-colors disabled:opacity-50">
                                            {isMalePreviewLoading ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>...</span></>) : (<><span className="material-symbols-outlined text-base">visibility</span></>)}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-logip-text-subtle dark:text-dark-text-secondary">Sample Uniform Image (Reference)</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-lg overflow-hidden flex items-center justify-center">
                                            {settings.maleUniformSample ? (
                                                <img src={settings.maleUniformSample} alt="Male Sample" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-gray-300">image</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <input type="file" ref={maleFileInputRef} className="hidden" accept="image/*" onChange={e => handleSampleUpload(e, 'male')} />
                                            <button onClick={() => maleFileInputRef.current?.click()} className="text-xs font-bold text-logip-primary hover:underline">Upload Sample</button>
                                            {settings.maleUniformSample && <button onClick={() => handleClearSample('male')} className="text-xs font-bold text-red-500 hover:underline">Clear</button>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Female Uniform Config */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-pink-600 dark:text-pink-400 text-sm uppercase tracking-wider">Female Uniform</h4>
                                <div className="flex flex-col gap-3">
                                    <label className="block text-sm font-medium text-logip-text-subtle dark:text-dark-text-secondary">Uniform Description</label>
                                    <div className="flex items-center gap-2">
                                        <AdminInput value={settings.femaleUniformDescription} onChange={e => setSettings(s => ({...s, femaleUniformDescription: e.target.value}))} />
                                        <button type="button" onClick={() => handlePreview('female')} disabled={isMalePreviewLoading || isFemalePreviewLoading} className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-logip-border dark:border-dark-border text-logip-text-body dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-border transition-colors disabled:opacity-50">
                                            {isFemalePreviewLoading ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>...</span></>) : (<><span className="material-symbols-outlined text-base">visibility</span></>)}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-logip-text-subtle dark:text-dark-text-secondary">Sample Uniform Image (Reference)</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-lg overflow-hidden flex items-center justify-center">
                                            {settings.femaleUniformSample ? (
                                                <img src={settings.femaleUniformSample} alt="Female Sample" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-gray-300">image</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <input type="file" ref={femaleFileInputRef} className="hidden" accept="image/*" onChange={e => handleSampleUpload(e, 'female')} />
                                            <button onClick={() => femaleFileInputRef.current?.click()} className="text-xs font-bold text-logip-primary hover:underline">Upload Sample</button>
                                            {settings.femaleUniformSample && <button onClick={() => handleClearSample('female')} className="text-xs font-bold text-red-500 hover:underline">Clear</button>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-logip-border dark:border-dark-border">
                            <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">Uniform Color (Hex)</label>
                            <div className="flex items-center gap-4">
                                <input type="color" value={settings.uniformColor} onChange={e => setSettings(s => ({...s, uniformColor: e.target.value}))} className="w-12 h-10 p-1 border border-logip-border dark:border-dark-border rounded-md bg-transparent" />
                                <AdminInput value={settings.uniformColor} onChange={e => setSettings(s => ({...s, uniformColor: e.target.value}))} />
                            </div>
                        </div>
                     </div>
                 </div>

                 {/* Watchdog Settings */}
                 <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary">AI Watchdog</h3>
                            <p className="text-logip-text-subtle dark:text-dark-text-secondary mt-1">Monitor for potential anomalies and security risks.</p>
                        </div>
                        <ToggleSwitch 
                            checked={settings.enableAiWatchDog} 
                            onChange={e => setSettings(s => ({...s, enableAiWatchDog: e.target.checked}))} 
                        />
                    </div>
                    {settings.enableAiWatchDog && (
                        <div className="mt-6 space-y-4 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AdminCheckbox label="Flag inconsistent data entries" checked={settings.watchDogFlags.inconsistentData} onChange={e => setSettings(s => ({...s, watchDogFlags: {...s.watchDogFlags, inconsistentData: e.target.checked}}))} />
                                <AdminCheckbox label="Analyze result upload patterns" checked={settings.watchDogFlags.resultPatterns} onChange={e => setSettings(s => ({...s, watchDogFlags: {...s.watchDogFlags, resultPatterns: e.target.checked}}))} />
                                <AdminCheckbox label="Summarize suspicious edits" checked={settings.watchDogFlags.summarizeEdits} onChange={e => setSettings(s => ({...s, watchDogFlags: {...s.watchDogFlags, summarizeEdits: e.target.checked}}))} />
                                <AdminCheckbox label="Detect form tampering attempts" checked={settings.watchDogFlags.formHacking} onChange={e => setSettings(s => ({...s, watchDogFlags: {...s.watchDogFlags, formHacking: e.target.checked}}))} />
                            </div>
                            <div className="mt-4">
                                <label className="block text-base font-medium text-logip-text-subtle dark:text-dark-text-secondary mb-1">Sensitivity Level</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="watchdog-sensitivity" value="low" checked={settings.watchDogSensitivity === 'low'} onChange={e => setSettings(s => ({...s, watchDogSensitivity: 'low' as any}))}/> Low</label>
                                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="watchdog-sensitivity" value="medium" checked={settings.watchDogSensitivity === 'medium'} onChange={e => setSettings(s => ({...s, watchDogSensitivity: 'medium' as any}))}/> Medium</label>
                                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="watchdog-sensitivity" value="high" checked={settings.watchDogSensitivity === 'high'} onChange={e => setSettings(s => ({...s, watchDogSensitivity: 'high' as any}))}/> High</label>
                                </div>
                            </div>
                        </div>
                    )}
                 </div>

                 <div className="flex justify-end mt-8">
                    <button onClick={handleSave} className="px-6 py-2.5 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md">
                        Save AI Settings
                    </button>
                </div>
            </div>

            <ImagePreviewModal
                isOpen={previewImage.isOpen}
                onClose={() => setPreviewImage(prev => ({ ...prev, isOpen: false }))}
                imageUrl={previewImage.url}
                altText={previewImage.alt}
            />
        </>
    );
};

export default AiFeaturesSettingsTab;

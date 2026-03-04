
import React, { useState, useEffect, useMemo } from 'react';
import { School, Admission } from './SettingsPage';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../shared/ToastContext';
import { AdminInput, AdminSelect } from '../shared/forms';
import { AdminStudent, initialAdminStudents } from './StudentsPage';

interface TabProps {
    selectedSchool?: School | null;
    selectedAdmission?: Admission | null;
}

interface SmsGatewaySettings {
    provider: 'hubtel' | 'arkesel';
    hubtelClientId: string;
    hubtelClientSecret: string;
    arkeselApiKey: string;
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

const SmsSettingsTab: React.FC<TabProps> = ({ selectedSchool, selectedAdmission }) => {
    const { showToast } = useToast();
    
    // State for SMS templates
    const templatesStorageKey = selectedSchool && selectedAdmission ? `smsTemplates_${selectedSchool.id}_${selectedAdmission.id}` : null;
    const [templates, setTemplates] = useLocalStorage(templatesStorageKey || 'nullTemplatesKey', {
        voucherPurchase: "Congratulations! Your voucher purchase is successful. Serial: [SERIAL_NUMBER], PIN: [PIN]. Login to continue your application.",
        appSubmission: "Hello [STUDENT_NAME], your application for [SCHOOL_NAME] has been submitted successfully. Your Admission Number is [ADMISSION_NUMBER]."
    });

    // State for SMS Gateway Settings
    const gatewayStorageKey = selectedSchool && selectedAdmission ? `smsGatewaySettings_${selectedSchool.id}_${selectedAdmission.id}` : null;
    const [gatewaySettings, setGatewaySettings] = useLocalStorage<SmsGatewaySettings | null>(gatewayStorageKey, null);
    
    const [localGatewaySettings, setLocalGatewaySettings] = useState<SmsGatewaySettings>({
        provider: 'hubtel',
        hubtelClientId: '',
        hubtelClientSecret: '',
        arkeselApiKey: '',
    });

    const [adminStudents] = useLocalStorage<AdminStudent[]>('admin_students', initialAdminStudents);
    const [sendMode, setSendMode] = useState<'all' | 'specific'>('all');
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [composedSms, setComposedSms] = useState('');

    useEffect(() => {
        if (gatewaySettings) {
            setLocalGatewaySettings(gatewaySettings);
        } else {
             setLocalGatewaySettings({
                provider: 'hubtel',
                hubtelClientId: '',
                hubtelClientSecret: '',
                arkeselApiKey: '',
            });
        }
    }, [gatewaySettings, selectedAdmission]);

    // Filter students for the current context
    const contextStudents = useMemo(() => {
        if (!selectedSchool || !selectedAdmission) return [];
        return adminStudents.filter(s => s.schoolId === selectedSchool.id && s.admissionId === selectedAdmission.id);
    }, [adminStudents, selectedSchool, selectedAdmission]);

    // Search results for specific mode
    const searchResults = useMemo(() => {
        if (!studentSearch.trim() || sendMode === 'all') return [];
        return contextStudents.filter(s => 
            !selectedStudentIds.includes(s.id) && (
                s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                s.indexNumber.includes(studentSearch) ||
                (s.phoneNumber && s.phoneNumber.includes(studentSearch))
            )
        ).slice(0, 5);
    }, [contextStudents, studentSearch, sendMode, selectedStudentIds]);

    if (!selectedSchool || !selectedAdmission) {
        return <PlaceholderTab title="Select an Admission" icon="sms" message="Please select a school and an active admission group from the 'Setup' tab to configure SMS settings." />;
    }

    const handleSaveTemplates = () => {
        showToast('SMS templates saved successfully.', 'success');
    };

    const handleGatewayChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocalGatewaySettings(prev => ({...prev, [name]: value as any}));
    };

    const handleSaveGateway = () => {
        setGatewaySettings(localGatewaySettings);
        showToast('SMS Gateway settings saved.', 'success');
    };

    const handleSendMessage = () => {
        if (!composedSms.trim()) {
            showToast('Cannot send an empty message.', 'error');
            return;
        }

        const count = sendMode === 'all' ? contextStudents.length : selectedStudentIds.length;
        console.log(`[SIMULATION] Sending SMS to ${count} recipients: ${composedSms}`);
        showToast(`SMS successfully queued for ${count} recipient(s).`, 'success');

        setComposedSms('');
        setStudentSearch('');
        setSelectedStudentIds([]);
    };

    const addStudent = (student: AdminStudent) => {
        setSelectedStudentIds(prev => [...prev, student.id]);
        setStudentSearch('');
    };

    const removeStudent = (id: string) => {
        setSelectedStudentIds(prev => prev.filter(sid => sid !== id));
    };

    const clearSelection = () => {
        setSelectedStudentIds([]);
    };

    const charCount = composedSms.length;
    const smsParts = charCount === 0 ? 0 : Math.ceil(charCount / 160);
    const recipientCount = sendMode === 'all' ? contextStudents.length : selectedStudentIds.length;

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary">Automated SMS Notifications</h3>
                <p className="text-logip-text-subtle dark:text-dark-text-secondary mt-1">Edit the templates for messages sent automatically during the admission process.</p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Voucher Purchase Confirmation</label>
                        <textarea
                            value={templates.voucherPurchase}
                            onChange={(e) => setTemplates(t => ({ ...t, voucherPurchase: e.target.value }))}
                            rows={6}
                            className="w-full p-3 bg-logip-white dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-lg text-sm text-logip-text-header dark:text-dark-text-primary placeholder-logip-text-subtle focus:outline-none focus:ring-2 focus:ring-logip-primary transition-shadow"
                        />
                        <p className="text-xs text-logip-text-subtle dark:text-dark-text-secondary mt-1.5">Placeholders: [SERIAL_NUMBER], [PIN]</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Application Submission Confirmation</label>
                        <textarea
                            value={templates.appSubmission}
                            onChange={(e) => setTemplates(t => ({ ...t, appSubmission: e.target.value }))}
                            rows={6}
                            className="w-full p-3 bg-logip-white dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-lg text-sm text-logip-text-header dark:text-dark-text-primary placeholder-logip-text-subtle focus:outline-none focus:ring-2 focus:ring-logip-primary transition-shadow"
                        />
                        <p className="text-xs text-logip-text-subtle dark:text-dark-text-secondary mt-1.5">Placeholders: [STUDENT_NAME], [ADMISSION_NUMBER]</p>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button onClick={handleSaveTemplates} className="px-5 py-2 text-base font-semibold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover transition-colors">
                        Save Templates
                    </button>
                </div>
            </div>
            
            <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary">SMS Gateway Configuration</h3>
                <p className="text-logip-text-subtle dark:text-dark-text-secondary mt-1">Connect your preferred SMS provider to send messages.</p>
                <div className="mt-6 space-y-6 max-w-xl">
                    <div>
                        <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">SMS Provider</label>
                        <AdminSelect name="provider" value={localGatewaySettings.provider} onChange={handleGatewayChange}>
                            <option value="hubtel">Hubtel</option>
                            <option value="arkesel">Arkesel</option>
                        </AdminSelect>
                    </div>
                    {localGatewaySettings.provider === 'hubtel' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Hubtel Client ID</label>
                                <AdminInput name="hubtelClientId" value={localGatewaySettings.hubtelClientId} onChange={handleGatewayChange} placeholder="Enter your Hubtel Client ID" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Hubtel Client Secret</label>
                                <AdminInput name="hubtelClientSecret" type="password" value={localGatewaySettings.hubtelClientSecret} onChange={handleGatewayChange} placeholder="Enter your Hubtel Client Secret" />
                            </div>
                        </>
                    )}
                    {localGatewaySettings.provider === 'arkesel' && (
                        <div>
                            <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Arkesel API Key</label>
                            <AdminInput name="arkeselApiKey" type="password" value={localGatewaySettings.arkeselApiKey} onChange={handleGatewayChange} placeholder="Enter your Arkesel API Key" />
                        </div>
                    )}
                </div>
                 <div className="mt-6 flex justify-end">
                    <button onClick={handleSaveGateway} className="px-5 py-2 text-base font-semibold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover transition-colors">
                        Save Configuration
                    </button>
                </div>
            </div>


            <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary mb-1.5">Compose SMS Message</h3>
                <p className="text-sm text-logip-text-subtle dark:text-dark-text-secondary mb-8">Send a custom SMS to one or more applicants in the <span className="font-bold text-gray-800 dark:text-gray-100">{selectedAdmission.title}</span> group.</p>
                
                <div className="space-y-8">
                    {/* Recipients Selection */}
                    <div>
                        <h4 className="text-sm font-bold text-logip-text-header dark:text-dark-text-primary mb-4 uppercase tracking-tight">Recipients</h4>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="radio" 
                                    name="sendMode" 
                                    checked={sendMode === 'all'} 
                                    onChange={() => setSendMode('all')}
                                    className="w-4 h-4 text-logip-primary bg-gray-100 border-gray-300 focus:ring-logip-primary cursor-pointer" 
                                />
                                <span className={`text-sm font-medium ${sendMode === 'all' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'} transition-colors`}>
                                    All Applicants ({contextStudents.length})
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="radio" 
                                    name="sendMode" 
                                    checked={sendMode === 'specific'} 
                                    onChange={() => setSendMode('specific')}
                                    className="w-4 h-4 text-logip-primary bg-gray-100 border-gray-300 focus:ring-logip-primary cursor-pointer" 
                                />
                                <span className={`text-sm font-medium ${sendMode === 'specific' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'} transition-colors`}>
                                    Specific Applicant(s)
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Specific Applicant UI */}
                    {sendMode === 'specific' && (
                        <div className="animate-fadeIn space-y-4">
                            <div>
                                <h4 className="text-[11px] font-bold text-logip-text-subtle dark:text-gray-500 mb-2 uppercase tracking-wider">Search Applicants</h4>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">person_search</span>
                                    <AdminInput 
                                        value={studentSearch} 
                                        onChange={(e) => setStudentSearch(e.target.value)} 
                                        placeholder="Type name or index number..." 
                                        className="pl-12 !py-2.5 !bg-gray-50 dark:!bg-dark-bg/50"
                                    />
                                    
                                    {/* Dropdown results */}
                                    {searchResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-surface border border-logip-border dark:border-dark-border rounded-lg shadow-xl overflow-hidden">
                                            {searchResults.map(s => (
                                                <button key={s.id} onClick={() => addStudent(s)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors flex items-center justify-between border-b last:border-b-0 border-gray-100 dark:border-dark-border">
                                                    <div>
                                                        <p className="text-sm font-bold text-logip-text-header dark:text-dark-text-primary">{s.name}</p>
                                                        <p className="text-xs text-logip-text-subtle dark:text-dark-text-secondary">{s.indexNumber} • {s.programme}</p>
                                                    </div>
                                                    <span className="material-symbols-outlined text-gray-300">add_circle</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tags - UPDATED TO INCLUDE INDEX NUMBER */}
                            <div className="flex flex-wrap items-center gap-2">
                                {selectedStudentIds.map(sid => {
                                    const s = contextStudents.find(student => student.id === sid);
                                    if (!s) return null;
                                    return (
                                        <div key={s.id} className="flex items-center gap-1.5 bg-blue-600/10 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-900/50">
                                            {s.name} ({s.indexNumber})
                                            <button onClick={() => removeStudent(s.id)} className="hover:text-red-500 transition-colors">
                                                <span className="material-symbols-outlined text-base">close</span>
                                            </button>
                                        </div>
                                    );
                                })}
                                {selectedStudentIds.length > 0 && (
                                    <button onClick={clearSelection} className="ml-2 text-xs font-bold text-red-500 hover:text-red-600 hover:underline">
                                        Clear Selection
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Message Content */}
                    <div>
                        <h4 className="text-sm font-bold text-logip-text-header dark:text-dark-text-primary mb-3 uppercase tracking-tight">Message Content</h4>
                        <textarea
                            value={composedSms}
                            onChange={(e) => setComposedSms(e.target.value)}
                            rows={6}
                            className="w-full p-4 bg-gray-50 dark:bg-dark-bg/30 border border-logip-border dark:border-dark-border rounded-xl text-base text-logip-text-header dark:text-dark-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-logip-primary transition-all resize-none"
                            placeholder="Type your message here..."
                        />
                         <div className="mt-3 flex justify-between items-center text-sm">
                            <span className="text-logip-text-subtle dark:text-gray-400">{charCount} characters ({smsParts} SMS parts)</span>
                            <span className="text-logip-primary dark:text-logip-accent font-bold">
                                Sending to {recipientCount} recipient(s)
                            </span>
                        </div>
                    </div>
                </div>

                 <div className="mt-10 flex justify-end">
                    <button 
                        onClick={handleSendMessage} 
                        disabled={!composedSms.trim() || (sendMode === 'specific' && selectedStudentIds.length === 0)}
                        className="flex items-center gap-2 px-8 h-11 text-base font-bold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover transition-all transform active:scale-95 shadow-lg shadow-logip-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        <span className="material-symbols-outlined">send</span>
                        {sendMode === 'all' ? 'Send Bulk SMS' : `Send to ${selectedStudentIds.length} Selected`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SmsSettingsTab;

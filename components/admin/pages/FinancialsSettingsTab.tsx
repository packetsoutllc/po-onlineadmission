import React, { useState, useMemo, useEffect } from 'react';
import { School, Admission } from './SettingsPage';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useToast } from '../shared/ToastContext';
import { AdminInput, AdminSelect, AdminCheckbox } from '../shared/forms';
import { AdminStudent, initialAdminStudents } from './StudentsPage';
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

export type PaymentProvider = 'paystack' | 'flutterwave' | 'hubtel' | 'theteller';

export interface GatewayConfig {
    id: string;
    provider: PaymentProvider;
    label: string;
    publicKey: string;
    secretKey: string;
    merchantId?: string;
    clientId?: string;
    enabled: boolean;
}

interface FinancialsSettings {
    voucherPrice: string;
    gatewayStatus: boolean;
    requirementPolicy: 'all' | 'selected' | 'exempted';
    targetedStudents: string[];
    exemptedStudents: string[];
    gateways: GatewayConfig[];
    applicationList: string[];
    docApplicationList: string[]; 
    docAccessFeeEnabled: boolean;
    docAccessFeePrice: string;
    docAccessFeeTarget: 'prospective' | 'admitted' | 'both';
}

interface MasterDocAccessSettings {
    [key: string]: { prospective: boolean; admitted: boolean };
}

const FinancialsSettingsTab: React.FC<TabProps> = ({ selectedSchool, selectedAdmission }) => {
    const { showToast } = useToast();
    const storageKey = selectedSchool && selectedAdmission ? `financialsSettings_${selectedSchool.id}_${selectedAdmission.id}` : '';

    const [settings, setSettings] = useLocalStorage<FinancialsSettings>(storageKey, {
        voucherPrice: '50',
        gatewayStatus: true,
        requirementPolicy: 'all',
        targetedStudents: [],
        exemptedStudents: [],
        gateways: [
            { id: 'gw_1', provider: 'paystack', label: 'Paystack (Primary)', publicKey: 'pk_live_...', secretKey: '', enabled: true }
        ],
        applicationList: [
            "Official Admission Letter",
            "Student Prospectus (Hard & Soft Copy)",
            "Personal Record Form",
            "AI-Powered Passport Photo Editing",
            "SMS Confirmation Alerts"
        ],
        docApplicationList: [
            "Official Admission Letter",
            "Student Prospectus",
            "Personal Record Form",
            "Official Receipt"
        ],
        docAccessFeeEnabled: false,
        docAccessFeePrice: '100',
        docAccessFeeTarget: 'both'
    });

    const docAccessKey = selectedSchool && selectedAdmission ? `docAccessSettings_${selectedSchool.id}_${selectedAdmission.id}` : 'nullDocAccess';
    const [docAccess, setDocAccess] = useLocalStorage<MasterDocAccessSettings>(docAccessKey, {
        admissionLetter: { prospective: true, admitted: true },
        personalRecordForm: { prospective: true, admitted: true },
        prospectus: { prospective: true, admitted: true }
    });

    const [adminStudents] = useLocalStorage<AdminStudent[]>('admin_students', initialAdminStudents);
    const [studentSearch, setStudentSearch] = useState('');
    const [newItemText, setNewItemText] = useState('');
    const [newDocItemText, setNewDocItemText] = useState('');

    const contextStudents = useMemo(() => {
        if (!selectedSchool || !selectedAdmission) return [];
        return adminStudents.filter(s => s.schoolId === selectedSchool.id && s.admissionId === selectedAdmission.id);
    }, [adminStudents, selectedSchool, selectedAdmission]);

    const activeList = settings.requirementPolicy === 'selected' ? settings.targetedStudents : settings.exemptedStudents;

    const searchResults = useMemo(() => {
        if (!studentSearch.trim() || settings.requirementPolicy === 'all') return [];
        return contextStudents.filter(s => 
            !activeList.includes(s.id) && (
                s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                s.indexNumber.includes(studentSearch)
            )
        ).slice(0, 5);
    }, [contextStudents, studentSearch, settings.requirementPolicy, activeList]);

    const toggleDocAccess = (docId: string, target: 'prospective' | 'admitted') => {
        setDocAccess(prev => ({
            ...prev,
            [docId]: { ...prev[docId], [target]: !prev[docId][target] }
        }));
    };

    const handleSavePolicy = () => { showToast('Payment policy updated.', 'success'); };
    const handleSaveConfig = () => { showToast('Payment gateways configuration saved.', 'success'); };
    const handleSaveAppList = () => { showToast('Application coverage list updated.', 'success'); };
    const handleSaveDocList = () => { showToast('Document coverage list updated.', 'success'); };

    const addGateway = () => {
        const newGw: GatewayConfig = { id: `gw_${Date.now()}`, provider: 'paystack', label: 'New Payment Gateway', publicKey: '', secretKey: '', enabled: false };
        setSettings(prev => ({ ...prev, gateways: [...prev.gateways, newGw] }));
    };

    const removeGateway = (id: string) => {
        setSettings(prev => ({ ...prev, gateways: prev.gateways.filter(g => g.id !== id) }));
    };

    const updateGateway = (id: string, update: Partial<GatewayConfig>) => {
        setSettings(prev => ({
            ...prev,
            gateways: prev.gateways.map(g => g.id === id ? { ...g, ...update } : g)
        }));
    };

    const addStudent = (student: AdminStudent) => {
        const key = settings.requirementPolicy === 'selected' ? 'targetedStudents' : 'exemptedStudents';
        setSettings(prev => ({ ...prev, [key]: [...prev[key], student.id] }));
        setStudentSearch('');
    };

    const removeStudent = (id: string) => {
        const key = settings.requirementPolicy === 'selected' ? 'targetedStudents' : 'exemptedStudents';
        setSettings(prev => ({ ...prev, [key]: prev[key].filter(sid => sid !== id) }));
    };

    const addApplicationItem = () => {
        if (!newItemText.trim()) return;
        setSettings(prev => ({ ...prev, applicationList: [...prev.applicationList, newItemText.trim()] }));
        setNewItemText('');
    };

    const removeApplicationItem = (index: number) => {
        setSettings(prev => ({ ...prev, applicationList: prev.applicationList.filter((_, i) => i !== index) }));
    };

    const addDocItem = () => {
        if (!newDocItemText.trim()) return;
        setSettings(prev => ({ ...prev, docApplicationList: [...(prev.docApplicationList || []), newDocItemText.trim()] }));
        setNewItemText('');
    };

    const removeDocItem = (index: number) => {
        setSettings(prev => ({ ...prev, docApplicationList: (prev.docApplicationList || []).filter((_, i) => i !== index) }));
    };

    if (!selectedSchool || !selectedAdmission) {
        return <PlaceholderTab title="Select an Admission" icon="paid" message="Please select a school and an active admission group from the 'Setup' tab to configure financial settings." />;
    }

    const policySubtext = settings.gatewayStatus ? (
        settings.requirementPolicy === 'all' 
            ? "Every verified applicant will be directed to the payment gateway."
            : settings.requirementPolicy === 'selected'
                ? "Only the index numbers listed below will be asked to pay."
                : "Everyone pays except the index numbers listed below."
    ) : "Payments are currently disabled globally.";

    const MASTER_DOCS = [
        { id: 'admissionLetter', label: 'Admission Letter' },
        { id: 'personalRecordForm', label: 'Personal Record Form' },
        { id: 'prospectus', label: 'Prospectus' }
    ];

    return (
        <div className="animate-fadeIn space-y-8">
            {/* Payment Gateway Configuration Section - NOW AT TOP */}
            <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary">Payment Gateway Configuration</h3>
                        <p className="text-sm text-logip-text-subtle dark:text-dark-text-secondary">Configure multiple providers. Active ones will be presented to students.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Status</span>
                            <label className="relative inline-flex items-center cursor-pointer scale-110">
                                <input type="checkbox" checked={settings.gatewayStatus} onChange={e => setSettings(s => ({...s, gatewayStatus: e.target.checked}))} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {settings.gateways.map((gw) => (
                        <div key={gw.id} className="p-5 border border-logip-border dark:border-dark-border rounded-xl bg-gray-50 dark:bg-dark-bg/20 relative group animate-fadeIn">
                             <div className="absolute top-4 right-4 flex items-center gap-3">
                                <AdminCheckbox 
                                    label="Active" 
                                    checked={gw.enabled} 
                                    onChange={e => updateGateway(gw.id, { enabled: e.target.checked })} 
                                />
                                <button onClick={() => removeGateway(gw.id)} className="p-1 text-logip-text-subtle hover:text-red-500 transition-colors" title="Delete Gateway">
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-logip-text-header dark:text-dark-text-primary mb-2">Display Name (Label)</label>
                                    <AdminInput 
                                        value={gw.label} 
                                        onChange={e => updateGateway(gw.id, { label: e.target.value })} 
                                        placeholder="e.g., Paystack MTN/Vodafone"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-logip-text-header dark:text-dark-text-primary mb-2">Payment Provider</label>
                                    <AdminSelect 
                                        value={gw.provider} 
                                        onChange={e => updateGateway(gw.id, { provider: e.target.value as any })}
                                    >
                                        <option value="paystack">Paystack</option>
                                        <option value="flutterwave">Flutterwave</option>
                                        <option value="hubtel">Hubtel</option>
                                        <option value="theteller">Theteller</option>
                                    </AdminSelect>
                                </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(['paystack', 'flutterwave'].includes(gw.provider)) && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Public Key</label>
                                            <AdminInput value={gw.publicKey} onChange={e => updateGateway(gw.id, { publicKey: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Secret Key</label>
                                            <AdminInput type="password" value={gw.secretKey} onChange={e => updateGateway(gw.id, { secretKey: e.target.value })} />
                                        </div>
                                    </>
                                )}
                                {gw.provider === 'hubtel' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Client ID</label>
                                            <AdminInput value={gw.clientId} onChange={e => updateGateway(gw.id, { clientId: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Client Secret</label>
                                            <AdminInput type="password" value={gw.secretKey} onChange={e => updateGateway(gw.id, { secretKey: e.target.value })} />
                                        </div>
                                    </>
                                )}
                                {gw.provider === 'theteller' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">Merchant ID</label>
                                            <AdminInput value={gw.merchantId} onChange={e => updateGateway(gw.id, { merchantId: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1.5">API Key</label>
                                            <AdminInput type="password" value={gw.secretKey} onChange={e => updateGateway(gw.id, { secretKey: e.target.value })} />
                                        </div>
                                    </>
                                )}
                             </div>
                        </div>
                    ))}
                    
                    <button 
                        onClick={addGateway}
                        className="w-full py-4 border-2 border-dashed border-logip-border dark:border-dark-border rounded-xl text-logip-text-subtle hover:text-logip-primary hover:border-logip-primary hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-center gap-2 font-bold"
                    >
                        <span className="material-symbols-outlined">add_card</span>
                        Add Another Payment Gateway
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-dark-border/50 flex justify-end">
                     <button onClick={handleSaveConfig} className="px-6 py-2.5 h-11 text-base font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md active:scale-95">
                        Save API Credentials
                    </button>
                </div>
            </div>

            {/* Payment Policy & Pricing Section */}
            <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary">Initial Application Payment Policy</h3>
                <p className="text-logip-text-subtle dark:text-dark-text-secondary mt-1">Control who pays and how much for the initial <span className="font-bold text-gray-800 dark:text-gray-200">{selectedAdmission.title}</span> voucher.</p>
                
                <div className="mt-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-bold text-logip-text-header dark:text-dark-text-primary mb-2">Voucher Price (GH¢)</label>
                            <AdminInput 
                                type="number"
                                value={settings.voucherPrice}
                                onChange={e => setSettings(s => ({...s, voucherPrice: e.target.value}))}
                                className="!bg-gray-50 dark:!bg-dark-bg/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-logip-text-header dark:text-dark-text-primary mb-2">Requirement Policy</label>
                            <AdminSelect 
                                value={settings.requirementPolicy} 
                                onChange={e => setSettings(s => ({...s, requirementPolicy: e.target.value as any}))}
                                className="!bg-white dark:!bg-transparent border-[#2563eb] focus:ring-[#2563eb] dark:text-white"
                            >
                                <option value="all">Mandatory for all applicants</option>
                                <option value="selected">Only selected applicants must pay</option>
                                <option value="exempted">Mandatory for all except selected (Exemptions)</option>
                            </AdminSelect>
                             <p className="text-xs text-logip-text-subtle dark:text-gray-500 mt-2 font-medium">{policySubtext}</p>
                        </div>
                    </div>

                    {settings.requirementPolicy !== 'all' && (
                        <div className="animate-fadeIn space-y-4 pt-4 border-t border-gray-100 dark:border-dark-border/50">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-logip-text-header dark:text-dark-text-primary uppercase tracking-tight">
                                    {settings.requirementPolicy === 'selected' ? 'Targeted Applicants (Must Pay)' : 'Exempted Applicants (Pay Nothing)'}
                                </h4>
                                <span className="bg-[#eff6ff] text-[#2563eb] text-[13px] font-bold px-3 py-1.5 rounded-md shadow-sm border border-blue-200">
                                    {activeList.length} Applicants in list
                                </span>
                            </div>
                            
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">person_search</span>
                                <AdminInput 
                                    value={studentSearch} 
                                    onChange={(e) => setStudentSearch(e.target.value)} 
                                    placeholder="Search by name or index number to add..." 
                                    className="!pl-12 !py-2.5 !bg-gray-50 dark:!bg-dark-bg/50"
                                />
                                {searchResults.length > 0 && (
                                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-dark-surface border border-logip-border dark:border-dark-border rounded-lg shadow-xl overflow-hidden">
                                        {searchResults.map(s => (
                                            <button key={s.id} onClick={() => addStudent(s)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors flex items-center justify-between border-b last:border-b-0 border-gray-100 dark:border-dark-border">
                                                <div>
                                                    <p className="text-sm font-bold text-logip-text-header dark:text-dark-text-primary">{s.name}</p>
                                                    <p className="text-xs text-logip-text-subtle dark:text-dark-text-secondary">{s.indexNumber}</p>
                                                </div>
                                                <span className="material-symbols-outlined text-gray-300">add_circle</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {activeList.map(sid => {
                                    const s = contextStudents.find(st => st.id === sid);
                                    if (!s) return null;
                                    return (
                                        <div key={s.id} className="flex items-center gap-3 bg-blue-600/10 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-900/50 shadow-sm animate-scaleIn">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[11px] font-bold uppercase tracking-wider truncate leading-tight">{s.name}</span>
                                                <span className="text-[10px] opacity-70 font-mono mt-0.5 leading-none">{s.indexNumber}</span>
                                            </div>
                                            <button onClick={() => removeStudent(sid)} className="hover:text-red-500 transition-colors flex-shrink-0 ml-1">
                                                <span className="material-symbols-outlined text-lg">close</span>
                                            </button>
                                        </div>
                                    );
                                })}
                                {activeList.length === 0 && (
                                    <p className="text-sm italic text-gray-400 py-2">No applicants added to the list yet.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                 <div className="mt-8 pt-6 border-t border-gray-100 dark:border-dark-border/50 flex justify-end">
                    <button onClick={handleSavePolicy} className="px-6 py-2.5 h-11 text-base font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md active:scale-95">
                        Save Policy Changes
                    </button>
                </div>
            </div>

            {/* Master Document Access Fee Section */}
            <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border-2 border-blue-500/20 dark:border-blue-500/10 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary">Master Document Access Fee</h3>
                        <p className="text-sm text-logip-text-subtle dark:text-dark-text-secondary mt-1">Configure which documents require a one-time access fee. Ticked = Pay to Access, Unticked = Free.</p>
                    </div>
                    {/* Aligned Active Status to start (left) and colored blue */}
                    <div className="flex flex-col items-start gap-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Status</span>
                        <label className="relative inline-flex items-center cursor-pointer scale-110">
                            <input type="checkbox" checked={settings.docAccessFeeEnabled} onChange={e => setSettings(s => ({...s, docAccessFeeEnabled: e.target.checked}))} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>

                <div className={`space-y-6 transition-all duration-300 ${settings.docAccessFeeEnabled ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <label className="block text-sm font-bold text-logip-text-header dark:text-dark-text-primary mb-2">Access Fee Price (GH¢)</label>
                            <AdminInput 
                                type="number"
                                value={settings.docAccessFeePrice}
                                onChange={e => setSettings(s => ({...s, docAccessFeePrice: e.target.value}))}
                                placeholder="e.g. 100"
                                className="!bg-gray-50 dark:!bg-dark-bg/50"
                            />
                        </div>
                        
                        <div className="md:col-span-3">
                            <div className="bg-gray-50 dark:bg-dark-bg/30 rounded-xl border border-logip-border dark:border-dark-border p-4">
                                <div className="grid grid-cols-[1fr_120px_120px] items-center mb-4 px-4">
                                    <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">PAYMENT REQUIREMENT</h4>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">PROSPECTIVE</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center">ADMITTED</span>
                                </div>
                                <div className="space-y-2">
                                    {MASTER_DOCS.map(doc => (
                                        <div key={doc.id} className="grid grid-cols-[1fr_120px_120px] items-center py-2.5 px-4 bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-logip-text-subtle dark:text-gray-400">
                                                    <span className="material-symbols-outlined text-lg">description</span>
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{doc.label}</span>
                                            </div>
                                            <div className="flex justify-center">
                                                <AdminCheckbox 
                                                    checked={docAccess[doc.id]?.prospective ?? true} 
                                                    onChange={() => toggleDocAccess(doc.id, 'prospective')}
                                                    title="Ticked = Pay to Access, Unticked = Free"
                                                />
                                            </div>
                                            <div className="flex justify-center">
                                                <AdminCheckbox 
                                                    checked={docAccess[doc.id]?.admitted ?? true} 
                                                    onChange={() => toggleDocAccess(doc.id, 'admitted')}
                                                    title="Ticked = Pay to Access, Unticked = Free"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-dark-border/50 flex justify-end">
                    <button onClick={() => { setSettings({...settings}); showToast('Document access fee policy updated.', 'success'); }} className="px-6 py-2.5 h-11 text-base font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm">
                        Update Access Policy
                    </button>
                </div>
            </div>

            {/* Application Coverage List Section */}
            <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary">Application Processing Coverage</h3>
                <p className="text-sm text-logip-text-subtle dark:text-dark-text-secondary mt-1">List the items and benefits included in the initial processing fee shown to students.</p>
                
                <div className="mt-8 space-y-4">
                    <div className="flex gap-2">
                        <AdminInput 
                            value={newItemText} 
                            onChange={e => setNewItemText(e.target.value)}
                            placeholder="Add item (e.g. Official Admission Letter)"
                            onKeyDown={e => e.key === 'Enter' && addApplicationItem()}
                        />
                        <button onClick={addApplicationItem} className="px-4 py-2 bg-logip-primary text-white font-bold rounded-lg hover:bg-logip-primary-hover transition-all">Add</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {settings.applicationList.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg/40 rounded-lg border border-logip-border dark:border-dark-border group animate-fadeIn">
                                <span className="text-sm font-medium text-logip-text-header dark:text-dark-text-primary">{item}</span>
                                <button onClick={() => removeApplicationItem(index)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-base">close</span></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-dark-border/50 flex justify-end">
                    <button onClick={handleSaveAppList} className="px-6 py-2.5 h-11 text-base font-bold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover transition-all shadow-md">
                        Save Coverage List
                    </button>
                </div>
            </div>

            {/* Document Processing Coverage List Section */}
            <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary">Document Processing Coverage</h3>
                <p className="text-sm text-logip-text-subtle dark:text-dark-text-secondary mt-1">List the items and benefits included in the document access fee shown to students.</p>
                
                <div className="mt-8 space-y-4">
                    <div className="flex gap-2">
                        <AdminInput 
                            value={newDocItemText} 
                            onChange={e => setNewDocItemText(e.target.value)}
                            placeholder="Add item (e.g. Official Admission Letter)"
                            onKeyDown={e => e.key === 'Enter' && addDocItem()}
                        />
                        <button onClick={addDocItem} className="px-4 py-2 bg-logip-primary text-white font-bold rounded-lg hover:bg-logip-primary-hover transition-all">Add</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {(settings.docApplicationList || []).map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg/40 rounded-lg border border-logip-border dark:border-dark-border group animate-fadeIn">
                                <span className="text-sm font-medium text-logip-text-header dark:text-dark-text-primary">{item}</span>
                                <button onClick={() => removeDocItem(index)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-base">close</span></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-dark-border/50 flex justify-end">
                    <button onClick={handleSaveDocList} className="px-6 py-2.5 h-11 text-base font-bold rounded-lg bg-logip-primary text-white hover:bg-logip-primary-hover transition-all shadow-md">
                        Save Doc Coverage List
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinancialsSettingsTab;
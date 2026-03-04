import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Modality, GenerateContentResponse } from '@google/genai';
import { Student, AiSettings } from './StudentDetails';
import ImagePreviewModal from './shared/ImagePreviewModal';
import { PersonalInfoFormData } from './PersonalInfoForm';
import { AcademicInfoFormData } from './AcademicInfoForm';
import { getHouseColor, initialHouses, House } from './admin/shared/houseData';
import { StudentStatus } from './admin/pages/StudentsPage';
import { Dormitory, initialDormitories } from './admin/shared/dormitoryData';
import { setLocalStorageAndNotify } from '../utils/storage';
import { Conversation, ThreadMessage, initialConversations } from './admin/pages/MessagesPage';
import { initialSchools, School, initialAdmissions, Admission } from './admin/pages/SettingsPage';
import { useLocalStorage } from './hooks/useLocalStorage';

type ApplicationStatus = 'not_submitted' | 'submitted';

export interface ChatMessage {
  id: number | string;
  text: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: string;
  imageUrl?: string;
  fromHuman?: boolean;
  groundingMetadata?: { uri: string; title?: string }[];
}

interface ChatProps {
    student: Student;
    applicationStatus: ApplicationStatus | StudentStatus;
    submissionDate: string | null;
    admissionNumber: string | null;
    assignedHouse: string;
    studentHouseChoice: string;
    studentDormChoice: string;
    avatarUrl: string;
    personalInfoData: PersonalInfoFormData;
    academicInfoData: AcademicInfoFormData;
    aiSettings: AiSettings | null;
    houseAssignmentMethod: string;
    enableRoomManagement: boolean;
    showToast: (message: string, type?: 'info' | 'error') => void;
    toggleTheme: () => void;
    isDarkMode: boolean;
    onExpand?: () => void;
    variant?: 'sidebar' | 'modal';
    // Controlled Props for continuity
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    chatInput: string;
    setChatInput: (val: string) => void;
    isChatLoading: boolean;
    setIsChatLoading: (val: boolean) => void;
    attachment: { file: File; previewUrl: string } | null;
    setAttachment: (val: { file: File; previewUrl: string } | null) => void;
}

const ProfileDetailItem: React.FC<{ label: string; value: React.ReactNode; isRestricted?: boolean }> = ({ label, value, isRestricted }) => (
    <>
      <dt className="text-sm text-black dark:text-gray-400">{label}</dt>
      <dd className={`text-sm text-right font-semibold truncate ${isRestricted ? 'text-red-500 italic text-xs' : 'text-black dark:text-gray-200'}`}>
        {value}
      </dd>
    </>
);

const useIsDesktop = () => {
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1280);
    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1280);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return isDesktop;
};

const HANDOFF_TRIGGERS = ['human', 'agent', 'person', 'representative', 'support', 'speak to someone', 'technician', 'personnel', 'talk to', 'chat with', 'i want human agent'];
const AI_FAIL_TRIGGERS = ["i'm sorry, i cannot", "i am unable to", "i don't have information"];

export const getTimestamp = () => new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
});

interface SectionAccessSettings {
    class: { prospective: boolean; prospectiveReason?: string; admitted: boolean; admittedReason?: string; };
    house: { prospective: boolean; prospectiveReason?: string; admitted: boolean; admittedReason?: string; };
    dorm: { prospective: boolean; prospectiveReason?: string; admitted: boolean; admittedReason?: string; };
}

const Chat: React.FC<ChatProps> = ({ 
    student, applicationStatus, submissionDate, admissionNumber, assignedHouse, 
    studentHouseChoice, studentDormChoice, avatarUrl, personalInfoData, academicInfoData, 
    aiSettings, houseAssignmentMethod, enableRoomManagement, showToast, toggleTheme, 
    isDarkMode, onExpand, variant = 'sidebar',
    messages, setMessages, chatInput, setChatInput, isChatLoading, setIsChatLoading, attachment, setAttachment
}) => {
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
    const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
    
    const isDesktop = useIsDesktop();
    const [isProfileExpanded, setIsProfileExpanded] = useState(false);
    
    const isEffectivelyExpanded = isDesktop || isProfileExpanded;
    const handoffConversationIdRef = useRef<string | null>(null);
    const [conversations] = useLocalStorage<Conversation[]>('admin_conversations', initialConversations);
    const [schools] = useLocalStorage<School[]>('admin_schools', initialSchools);
    const [admissions] = useLocalStorage<Admission[]>('admin_admissions', initialAdmissions);

    const [accessSettings] = useLocalStorage<SectionAccessSettings>(
        `classHouseDormAccessSettings_${student.schoolId}_${student.admissionId}`, {
        class: { prospective: false, admitted: true },
        house: { prospective: false, admitted: true },
        dorm: { prospective: false, admitted: true }
    });

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formattedName = student.name.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());

    const ProtocolIndicator: React.FC = () => (
        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-[11px] font-black text-red-600 bg-pink-100 rounded-lg shadow-sm border border-pink-200">
          P
        </span>
    );

    const currentStatus = useMemo(() => {
        const statusConfig: Record<ApplicationStatus | StudentStatus, { text: string; color: string }> = {
            'Placed': { text: 'Not yet admitted', color: 'bg-red-100 text-red-800 dark:bg-red-50/20 dark:text-red-300' },
            'Admitted': { text: 'Admitted (Student)', color: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' },
            'Prospective': { text: 'Prospective Student', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300' },
            'Pending': { text: 'Prospective Student', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300' },
            'Rejected': { text: 'Declined', color: 'bg-red-100 text-red-800 dark:bg-red-50/20 dark:text-red-300' },
            'not_submitted': { text: 'Not yet admitted', color: 'bg-red-100 text-red-800 dark:bg-red-50/20 dark:text-red-300' },
            'submitted': { text: 'Prospective Student', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300' },
        };
        return statusConfig[applicationStatus] || statusConfig['not_submitted'];
    }, [applicationStatus]);
    
    const isApplicationSubmitted = applicationStatus === 'submitted' || applicationStatus === 'Admitted' || applicationStatus === 'Placed';

    const schoolName = useMemo(() => {
        return schools.find(s => s.id === student.schoolId)?.name || 'School';
    }, [schools, student.schoolId]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Handle Admin Replies from Admin Panel
    useEffect(() => {
        if (!handoffConversationIdRef.current) {
             const existingConv = conversations.find(c => c.id.startsWith(`handoff_${student.indexNumber}`));
             if (existingConv) handoffConversationIdRef.current = existingConv.id;
        }
        if (!handoffConversationIdRef.current) return;
        const studentConversation = conversations.find(c => c.id === handoffConversationIdRef.current);
        if (!studentConversation) return;
        const displayedMessageIds = new Set(messages.map(m => m.id.toString()));
        const newAdminMessages = studentConversation.messages.filter(m => m.sender === 'admin' && !displayedMessageIds.has(m.id) && m.id !== 'sys_start' && m.id !== 'sys_end');
        if (newAdminMessages.length > 0) {
            const formattedMessages: ChatMessage[] = newAdminMessages.map(m => ({
                id: m.id,
                text: m.text,
                sender: 'ai',
                timestamp: new Date(m.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
                imageUrl: m.imageUrl,
                fromHuman: true,
            }));
            const hasHumanReplyAlready = messages.some(m => m.fromHuman);
            if (!hasHumanReplyAlready) {
                const separator: ChatMessage = { id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, sender: 'system', text: 'An administrator has joined the chat', timestamp: getTimestamp() };
                setMessages(prev => [...prev, separator, ...formattedMessages]);
            } else {
                setMessages(prev => [...prev, ...formattedMessages]);
            }
        }
    }, [conversations, messages, student.indexNumber]);

    // Robust Auto-scroll logic for streaming and expansion
    useEffect(() => {
        const chatContainer = chatContainerRef.current;
        if (chatContainer) {
            const isAtBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 150;
            const lastMsgIsUser = messages.length > 0 && messages[messages.length - 1].sender === 'user';
            if (lastMsgIsUser || isAtBottom || isChatLoading) {
                setTimeout(() => {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }, 0);
            }
        }
    }, [messages, isChatLoading]);

    const handleScroll = () => {
        const chatContainer = chatContainerRef.current;
        if (chatContainer) {
            const isScrolledUp = chatContainer.scrollHeight - chatContainer.scrollTop > chatContainer.clientHeight + 100;
            setShowScrollToBottom(isScrolledUp);
        }
    };
    
    const scrollToBottom = () => {
        setShowScrollToBottom(false);
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const handleSendMessage = async (e: React.FormEvent, directMessage?: string) => {
        e.preventDefault();
        const messageText = directMessage || chatInput;
        if (isChatLoading || (!messageText.trim() && !attachment)) return;

        const userMessage: ChatMessage = {
            id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            text: messageText,
            sender: 'user',
            timestamp: getTimestamp(),
            imageUrl: attachment?.previewUrl,
        };
        
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        
        const currentAttachmentForApi = attachment;
        setChatInput('');
        setAttachment(null);
        setIsChatLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const systemKnowledgeBase = `You are a helpful IT Support AI for the ${schoolName} admission portal. Rules: 1. Be extremely concise. Always. 2. If the user says "hi", "hello", or similar greetings, respond ONLY with: "Hi, how may I help you today?" 3. Do not volunteer the student's aggregate, programme, or status unless specifically asked. 4. Only answer questions related to the school admission process. 5. If you don't know the answer, politely offer to connect them with a human agent.`;
            const houseInfo = isApplicationSubmitted ? assignedHouse : (studentHouseChoice || 'Will be assigned based on settings');
            const studentDataContext = `Data for student ${student.name} (Index: ${student.indexNumber}): Programme=${student.programme}, Gender=${student.gender}, Aggregate=${student.aggregate}, Status=${applicationStatus}, House=${houseInfo}`;
            const fullPromptText = `${systemKnowledgeBase}\n\n### Current Student's Data ###\n${studentDataContext}\n\n### Your Task ###\nAnswer the student's question accurately.\n\n**Student's Question:** "${messageText}"`;
            const parts: any[] = [{ text: fullPromptText }];
            if (currentAttachmentForApi) {
                const base64Data = await fileToBase64(currentAttachmentForApi.file);
                parts.push({ inlineData: { data: base64Data.split(',')[1], mimeType: currentAttachmentForApi.file.type } });
            }
            const streamResponse = await ai.models.generateContentStream({ model: 'gemini-3-flash-preview', contents: { parts }, config: { tools: [{ googleSearch: {} }] } });
            const botMsgId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            setMessages(prev => [...prev, { id: botMsgId, text: '', sender: 'ai', timestamp: getTimestamp() }]);
            let aiResponseText = "";
            let groundingSources: { uri: string; title?: string }[] = [];
            for await (const chunk of streamResponse) {
                const c = chunk as GenerateContentResponse;
                const textChunk = c.text || "";
                aiResponseText += textChunk;
                const chunks = c.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (Array.isArray(chunks)) {
                    chunks.forEach((chunk: any) => {
                        if (chunk.web?.uri && !groundingSources.some(s => s.uri === chunk.web.uri)) {
                            groundingSources.push({ uri: chunk.web.uri, title: chunk.web.title });
                        }
                    });
                }
                setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: aiResponseText, groundingMetadata: groundingSources.length > 0 ? groundingSources : undefined } : m));
            }
            const userWantsHandoff = HANDOFF_TRIGGERS.some(trigger => messageText.toLowerCase().includes(trigger));
            const aiFailed = AI_FAIL_TRIGGERS.some(trigger => aiResponseText.toLowerCase().includes(trigger));
            if (userWantsHandoff || aiFailed) {
                const itNumber = '0243339546';
                const whatsappLink = `https://wa.me/233243339546`;
                const handoffText = `To speak to human agent, kindly wait while the Administrator joins the chat or call/whatsapp the school’s IT Department on ${itNumber}. ${whatsappLink}`;
                setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: handoffText } : m));
                if (!handoffConversationIdRef.current) {
                    const handoffConversation: Conversation = {
                        id: `handoff_${student.indexNumber}_${Date.now()}`,
                        schoolId: student.schoolId,
                        subject: `AI Handoff Request from ${student.name}`,
                        status: 'unread',
                        lastMessageTimestamp: new Date().toISOString(),
                        messages: [
                            { id: 'sys_start', sender: 'admin', text: `--- Start of AI conversation log for ${student.name} ---`, timestamp: new Date().toISOString() },
                            ...updatedMessages.map((m): ThreadMessage => ({ id: m.id.toString(), sender: 'school', text: m.text, timestamp: new Date().toISOString(), imageUrl: m.imageUrl })),
                            { id: botMsgId.toString(), sender: 'school', text: handoffText, timestamp: new Date().toISOString() },
                             { id: 'sys_end', sender: 'admin', text: `--- End of AI conversation log ---`, timestamp: new Date().toISOString() },
                        ],
                    };
                    handoffConversationIdRef.current = handoffConversation.id;
                    const existingConvs = JSON.parse(localStorage.getItem('admin_conversations') || '[]');
                    setLocalStorageAndNotify('admin_conversations', [...existingConvs, handoffConversation]);
                }
            }
        } catch (error) {
            setMessages(prev => [...prev, { id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, text: "I'm sorry, I encountered an error. Please try again.", sender: 'ai', timestamp: getTimestamp() }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleAttachClick = () => fileInputRef.current?.click();
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setAttachment({ file: event.target.files[0], previewUrl: URL.createObjectURL(event.target.files[0]) });
        }
    };
    const handleRemoveAttachment = () => {
        if (attachment) URL.revokeObjectURL(attachment.previewUrl);
        setAttachment(null);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    if (attachment) URL.revokeObjectURL(attachment.previewUrl);
                    setAttachment({ file: blob, previewUrl: URL.createObjectURL(blob) });
                    e.preventDefault();
                    break;
                }
            }
        }
    };

    const isAdmitted = applicationStatus === 'Admitted';
    const isProspective = applicationStatus === 'submitted' || applicationStatus === 'Prospective';
    const canShowRestrictedInfo = isAdmitted || isProspective;

    const houseValue = assignedHouse || (houseAssignmentMethod === 'student_choice' ? studentHouseChoice : '');
    const houseStatus = accessSettings.house[isAdmitted ? 'admitted' : 'prospective'] ? { value: houseValue, restricted: false, visible: !!houseValue && canShowRestrictedInfo } : { value: accessSettings.house[isAdmitted ? 'admittedReason' : 'prospectiveReason'] || "Access Restricted", restricted: true, visible: canShowRestrictedInfo };
    const houseDetails = useMemo(() => houseValue ? { ...initialHouses.find(h => h.name === houseValue), studentCount: 0 } as (House & { studentCount: number }) : null, [houseValue]);
    const houseColors = getHouseColor(houseDetails || undefined);

    const classValue = academicInfoData.studentClass || '';
    const classStatus = accessSettings.class[isAdmitted ? 'admitted' : 'prospective'] ? { value: classValue, restricted: false, visible: !!classValue && canShowRestrictedInfo } : { value: accessSettings.class[isAdmitted ? 'admittedReason' : 'prospectiveReason'] || "Access Restricted", restricted: true, visible: canShowRestrictedInfo };

    const dormValue = studentDormChoice || ''; 
    const dormStatus = accessSettings.dorm[isAdmitted ? 'admitted' : 'prospective'] ? { value: dormValue, restricted: false, visible: !!dormValue && canShowRestrictedInfo } : { value: accessSettings.dorm[isAdmitted ? 'admittedReason' : 'prospectiveReason'] || "Access Restricted", restricted: true, visible: canShowRestrictedInfo };

    return (
        <>
            {variant === 'sidebar' && (
                <div className="bg-logip-white dark:bg-report-dark/50 border border-logip-border dark:border-report-border rounded-2xl p-6 relative flex-shrink-0">
                    <div className="absolute top-4 right-4">
                        <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-lg border border-logip-border dark:border-report-border text-logip-text-body dark:text-gray-400 hover:bg-logip-border/60 dark:hover:bg-gray-800 transition-colors">
                            <span className="material-symbols-outlined text-xl">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
                        </button>
                    </div>
                    <div className="text-center">
                        <button onClick={() => setIsImagePreviewOpen(true)} className="rounded-2xl transition-transform hover:scale-105">
                            <img src={avatarUrl} alt={formattedName} className="w-20 h-20 rounded-2xl mx-auto object-cover" />
                        </button>
                        <div className="flex flex-col items-center mt-4">
                            <h3 className="text-lg font-bold text-black dark:text-gray-100">{formattedName}</h3>
                        </div>
                        <div className="mt-3 flex justify-center items-center gap-2">
                            {currentStatus.text && (
                                <span className={`inline-block px-3 py-1.5 text-sm font-semibold rounded-lg ${currentStatus.color}`}>
                                    {currentStatus.text}
                                </span>
                            )}
                            {student.isProtocol && <ProtocolIndicator />}
                            {!isDesktop && <button onClick={() => setIsProfileExpanded(prev => !prev)} className="p-1 rounded-full text-logip-text-subtle"><span className="material-symbols-outlined">{isProfileExpanded ? 'expand_less' : 'expand_more'}</span></button>}
                        </div>
                    </div>
                    <div className="transition-all duration-300 ease-in-out overflow-hidden" style={{ maxHeight: isEffectivelyExpanded ? '500px' : '0px' }}>
                        <dl className="mt-8 grid grid-cols-2 gap-x-4 gap-y-3">
                            <ProfileDetailItem label="Index Number" value={student.indexNumber} />
                            <ProfileDetailItem label="Gender" value={student.gender} />
                            <ProfileDetailItem label="Aggregate" value={student.aggregate} />
                            <ProfileDetailItem label="Residence" value={student.residence} />
                            <ProfileDetailItem label="Programme" value={student.programme} />
                            {canShowRestrictedInfo && classStatus.visible && <ProfileDetailItem label="Class" value={<span className="px-2 py-1 text-xs font-semibold rounded-md bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300">{classStatus.value}</span>} isRestricted={classStatus.restricted} />}
                            {canShowRestrictedInfo && houseStatus.visible && <ProfileDetailItem label="House" value={<span className={`px-2 py-1 text-xs font-semibold rounded-md ${houseColors.pillBg} ${houseColors.pillText}`}>{houseStatus.value}</span>} isRestricted={houseStatus.restricted} />}
                            {canShowRestrictedInfo && enableRoomManagement && dormStatus.visible && <ProfileDetailItem label="Dorm/Room" value={<span className="px-2 py-1 text-xs font-semibold rounded-md bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300">{dormStatus.value}</span>} isRestricted={dormStatus.restricted} />}
                        </dl>
                    </div>
                </div>
            )}
            <div className="flex-1 flex flex-col bg-logip-white dark:bg-report-dark/50 border border-logip-border dark:border-report-border rounded-2xl pt-4 px-4 pb-2 min-h-0 overflow-hidden">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                   <div className="flex items-center gap-2">
                     <h3 className="text-lg font-semibold text-black dark:text-gray-100">Support Connect</h3>
                     {isOnline ? (
                       <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 animate-pulse">
                         Live chat
                       </span>
                     ) : (
                       <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300">
                         No internet
                       </span>
                     )}
                   </div>
                   <div className="flex items-center gap-1">
                       {onExpand && variant === 'sidebar' && <button onClick={onExpand} className="p-1 rounded-full text-logip-text-subtle hover:text-white transition-colors" title="Expand Chat"><span className="material-symbols-outlined text-xl">open_in_full</span></button>}
                   </div>
                </div>
                <div ref={chatContainerRef} onScroll={handleScroll} className="space-y-5 flex-1 p-1 overflow-y-auto scroll-smooth custom-chat-scrollbar relative overscroll-contain">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`group animate-slideInUp ${msg.sender === 'system' ? 'text-center my-2' : ''}`}>
                            {msg.sender === 'system' ? (
                                <span className="text-xs text-gray-700 dark:text-white font-medium bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">{msg.text}</span>
                            ) : (
                                <div className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.sender === 'ai' && (
                                        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-logip-primary/10 flex items-center justify-center self-start">
                                            <span className="material-symbols-outlined text-logip-primary text-xl">{msg.fromHuman ? 'manage_accounts' : 'support_agent'}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-1 max-w-[85%]">
                                        <div className={`px-4 py-2.5 rounded-t-2xl ${msg.sender === 'user' ? 'bg-logip-primary text-white rounded-l-2xl' : 'bg-logip-chat-bubble dark:bg-logip-accent/20 text-black dark:text-gray-200 rounded-r-2xl'}`}>
                                            {msg.imageUrl && <img src={msg.imageUrl} alt="attachment" className="max-w-xs max-h-48 rounded-lg mb-2" />}
                                            <p className="text-sm whitespace-pre-wrap">{msg.text || (isChatLoading && msg.id === messages[messages.length-1].id ? '...' : '')}</p>
                                            {msg.groundingMetadata && msg.groundingMetadata.length > 0 && (
                                                <div className="mt-3 pt-2 border-t border-black/10 dark:border-white/10">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">Sources</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {msg.groundingMetadata.map((source, i) => (
                                                            <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded hover:underline truncate max-w-[120px]" title={source.title}>
                                                                {source.title || new URL(source.uri).hostname}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`text-[10px] opacity-60 group-hover:opacity-100 transition-opacity ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>{msg.timestamp}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {isChatLoading && messages[messages.length-1]?.sender === 'user' && (
                        <div className="flex items-start gap-2 justify-start animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-logip-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-logip-primary text-xl">support_agent</span>
                            </div>
                            <div className="px-4 py-3 rounded-2xl bg-logip-chat-bubble dark:bg-logip-accent/20 h-10 w-20"></div>
                        </div>
                    )}
                    {showScrollToBottom && <button onClick={scrollToBottom} className="sticky bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-logip-primary text-white shadow-lg animate-fadeIn"><span className="material-symbols-outlined">arrow_downward</span></button>}
                </div>
                
                <form onSubmit={handleSendMessage} className="mt-6 flex-shrink-0">
                    {attachment && (
                        <div className="relative inline-block mb-2 p-2 bg-gray-50 border rounded-lg">
                            <img src={attachment.previewUrl} alt="Preview" className="h-20 w-auto rounded-md" />
                            <button type="button" onClick={handleRemoveAttachment} className="absolute -top-2 -right-2 w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center hover:bg-red-500">
                                <span className="material-symbols-outlined text-base">close</span>
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-dark-bg/30 border-2 border-gray-200 dark:border-dark-border rounded-full p-1 focus-within:border-blue-600 transition-all overflow-hidden">
                        <button type="button" onClick={handleAttachClick} className="p-2 rounded-full text-logip-text-subtle hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors" title="Attach Image"><span className="material-symbols-outlined text-xl">attach_file</span></button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        <textarea 
                            ref={inputRef}
                            placeholder="Ask about admissions..." 
                            value={chatInput} 
                            onChange={(e) => setChatInput(e.target.value)} 
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }} 
                            onPaste={handlePaste} 
                            disabled={isChatLoading} 
                            rows={1} 
                            className="flex-1 bg-transparent !border-0 !outline-none !ring-0 text-sm py-2 max-h-32 resize-none no-scrollbar dark:text-gray-100 shadow-none border-none outline-none ring-0 placeholder-gray-400" 
                        />
                        <button type="submit" disabled={isChatLoading || (!chatInput.trim() && !attachment)} className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-400 text-white shadow-md hover:bg-blue-500 transition-all transform active:scale-90 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex-shrink-0"><span className="material-symbols-outlined text-2xl">arrow_upward</span></button>
                    </div>
                </form>
            </div>
            <ImagePreviewModal isOpen={isImagePreviewOpen} onClose={() => setIsImagePreviewOpen(false)} imageUrl={avatarUrl} altText={formattedName} />
        </>
    );
};

export default Chat;
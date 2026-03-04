
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { initialSchools, School } from './SettingsPage';
import ConfirmationModal from '../shared/ConfirmationModal';
import AudioCallModal from '../shared/AudioCallModal';
import VideoCallModal from '../shared/VideoCallModal';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// --- TYPE DEFINITIONS ---
export type MessageStatus = 'read' | 'unread' | 'blocked' | 'trash';

export interface ThreadMessage {
    id: string;
    sender: 'school' | 'admin';
    text: string;
    timestamp: string;
    imageUrl?: string;
    audioUrl?: string;
    audioDuration?: number;
}

export interface Conversation {
    id: string;
    schoolId: string;
    subject: string;
    status: MessageStatus;
    lastMessageTimestamp: string;
    messages: ThreadMessage[];
}

export interface ChatMessage {
  id: number | string;
  text: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: string;
  imageUrl?: string;
  fromHuman?: boolean;
}

export interface AiChatLog {
    studentName: string;
    studentIndex: string;
    schoolName: string;
    timestamp: string;
    messages: ChatMessage[];
    schoolId?: string;
}

export const initialConversations: Conversation[] = [];

// --- HELPER FUNCTIONS & COMPONENTS ---
const getSchoolById = (id: string) => initialSchools.find(s => s.id === id);
const timeSince = (date: string) => { const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000); if (seconds < 5) return "Just now"; let interval = seconds / 86400; if (interval > 1) return `${Math.floor(interval)}d ago`; interval = seconds / 3600; if (interval > 1) return `${Math.floor(interval)}h ago`; interval = seconds / 60; if (interval > 1) return `${Math.floor(interval)}m ago`; return "Just now"; };

// --- MAIN COMPONENT ---
interface MessagesPageProps {
    conversations: Conversation[];
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    selectedSchool?: School | null;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ conversations, setConversations, selectedSchool }) => {
    const [viewMode, setViewMode] = useState<'human' | 'ai'>('human');
    const [activeFilter, setActiveFilter] = useState<MessageStatus | 'all' | 'ai'>('all');
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [replyText, setReplyText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [isAudioCallOpen, setIsAudioCallOpen] = useState(false);
    const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);

    const [aiChatLogs, setAiChatLogs] = useState<AiChatLog[]>([]);

    useEffect(() => {
        const logs: AiChatLog[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('ai_chat_history_') && !key.includes('_msgs_')) {
                const logRaw = localStorage.getItem(key);
                if (logRaw) {
                    try {
                        const parsed = JSON.parse(logRaw);
                        // Infer schoolId if missing for accurate filtering
                        if (!parsed.schoolId && parsed.schoolName) {
                            parsed.schoolId = initialSchools.find(s => s.name === parsed.schoolName)?.id;
                        }
                        logs.push(parsed);
                    } catch (e) {
                        console.error(`Failed to parse AI chat log: ${key}`, e);
                    }
                }
            }
        }
        setAiChatLogs(logs);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeConversationId, conversations, aiChatLogs]);

    const filteredConversations = useMemo(() => {
        let items: (Conversation | AiChatLog)[] = [];
        if (viewMode === 'human') {
            items = conversations.filter(c => {
                const matchesSchool = !selectedSchool || c.schoolId === selectedSchool.id;
                const matchesStatus = activeFilter === 'all' || c.status === activeFilter;
                return matchesSchool && matchesStatus;
            });
        } else {
            items = aiChatLogs.filter(log => {
                return !selectedSchool || log.schoolId === selectedSchool.id;
            });
        }

        if (searchTerm) {
            const lowercasedSearch = searchTerm.toLowerCase();
            items = items.filter(c => {
                if ('subject' in c) {
                    return c.subject.toLowerCase().includes(lowercasedSearch);
                } else {
                    return c.studentName.toLowerCase().includes(lowercasedSearch) || c.studentIndex.toLowerCase().includes(lowercasedSearch);
                }
            });
        }
        
        return items.sort((a, b) => {
            const timeA = new Date('lastMessageTimestamp' in a ? a.lastMessageTimestamp : a.timestamp).getTime();
            const timeB = new Date('lastMessageTimestamp' in b ? b.lastMessageTimestamp : b.timestamp).getTime();
            return timeB - timeA;
        });
    }, [conversations, activeFilter, searchTerm, aiChatLogs, viewMode, selectedSchool]);

    const activeConversation = useMemo(() => {
        if (!activeConversationId) return null;
        if (viewMode === 'human') {
            return conversations.find(c => c.id === activeConversationId);
        } else {
            return aiChatLogs.find(log => log.studentIndex === activeConversationId);
        }
    }, [activeConversationId, conversations, aiChatLogs, viewMode]);
    
    const unreadCount = useMemo(() => {
        return conversations.filter(c => (!selectedSchool || c.schoolId === selectedSchool.id) && c.status === 'unread').length;
    }, [conversations, selectedSchool]);

    const handleConversationSelect = (id: string) => {
        setActiveConversationId(id);
        if (viewMode === 'human') {
            const conv = conversations.find(c => c.id === id);
            if (conv && conv.status === 'unread') {
                setConversations(prev => prev.map(c => c.id === id ? { ...c, status: 'read' } : c));
            }
        }
    };

    const handleUpdateStatus = (id: string, newStatus: MessageStatus) => {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
        // If trashing or blocking, deselect the conversation
        if (newStatus === 'trash' || newStatus === 'blocked') {
            setActiveConversationId(null);
        }
    };

    const handleSendReply = () => {
        if (!replyText.trim() || !activeConversation || viewMode !== 'human') return;
        
        const newMessage: ThreadMessage = {
            id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            sender: 'admin',
            text: replyText,
            timestamp: new Date().toISOString(),
        };

        setConversations(prev => prev.map(c => {
            if (c.id === (activeConversation as Conversation).id) {
                return {
                    ...c,
                    messages: [...c.messages, newMessage],
                    lastMessageTimestamp: newMessage.timestamp,
                };
            }
            return c;
        }));
        setReplyText('');
    };

    const renderMessagesList = () => {
        if (!activeConversation) return null;

        const isHumanMode = 'subject' in activeConversation;
        let messagesToRender: any[] = [];
        
        if (isHumanMode) {
             messagesToRender = (activeConversation as Conversation).messages.map(m => ({
                id: m.id,
                text: m.text,
                sender: m.sender,
                timestamp: m.timestamp,
                isMine: m.sender === 'admin',
                imageUrl: m.imageUrl
             }));
        } else {
             messagesToRender = (activeConversation as AiChatLog).messages.map(m => ({
                id: m.id,
                text: m.text,
                sender: m.sender,
                timestamp: m.timestamp,
                isMine: m.sender === 'ai', 
                imageUrl: m.imageUrl
             }));
        }

        return messagesToRender.map((msg) => (
             <div key={msg.id} className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm ${msg.isMine ? 'bg-logip-primary text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'}`}>
                     {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="attachment" className="max-w-full h-auto rounded-lg mb-2 border border-white/20" />
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-1.5 font-medium tracking-wide uppercase ${msg.isMine ? 'text-white/60 text-right' : 'text-gray-400 dark:text-gray-500'}`}>
                        {new Date(msg.timestamp).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
                    </p>
                </div>
            </div>
        ));
    };

    return (
        <div className="flex h-full bg-gray-50 dark:bg-dark-bg">
            {/* Left: Conversation List */}
            <aside className="w-80 sm:w-96 flex-shrink-0 border-r border-logip-border dark:border-dark-border flex flex-col bg-white dark:bg-report-dark">
                <div className="p-4 sm:p-6 border-b border-logip-border dark:border-dark-border">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-logip-text-header dark:text-gray-100">Messages Inbox</h2>
                        {unreadCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                    </div>
                     <div className="relative mt-4">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-logip-text-subtle">search</span>
                        <input type="text" placeholder="Search messages..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-logip-primary transition-all" />
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="p-2 flex-shrink-0 flex items-center gap-1 bg-gray-50/50 dark:bg-black/10 border-b border-logip-border dark:border-dark-border">
                    <button onClick={() => { setViewMode('human'); setActiveFilter('all'); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'human' ? 'bg-white dark:bg-dark-border shadow-sm text-logip-primary' : 'text-logip-text-subtle hover:bg-gray-100 dark:hover:bg-dark-border/50'}`}>
                        <span className="material-symbols-outlined text-base">support_agent</span> Human Support
                    </button>
                    <button onClick={() => { setViewMode('ai'); setActiveFilter('ai'); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'ai' ? 'bg-white dark:bg-dark-border shadow-sm text-logip-primary' : 'text-logip-text-subtle hover:bg-gray-100 dark:hover:bg-dark-border/50'}`}>
                        <span className="material-symbols-outlined text-base">auto_awesome</span> AI Log Viewer
                    </button>
                </div>

                {viewMode === 'human' && (
                    <div className="px-2 py-1.5 flex items-center justify-around border-b border-logip-border dark:border-dark-border flex-shrink-0 overflow-x-auto no-scrollbar">
                        {['all', 'unread', 'blocked', 'trash'].map(filter => (
                            <button key={filter} onClick={() => setActiveFilter(filter as any)} className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-tighter transition-colors ${activeFilter === filter ? 'text-logip-primary bg-blue-50 dark:bg-blue-900/20' : 'text-logip-text-subtle hover:text-logip-text-header hover:bg-gray-50 dark:hover:bg-white/5'}`}>{filter}</button>
                        ))}
                    </div>
                )}

                {/* List */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {filteredConversations.length > 0 ? (
                        filteredConversations.map(conv => {
                            const isHuman = 'subject' in conv;
                            const school = getSchoolById(isHuman ? (conv as Conversation).schoolId : (conv as AiChatLog).schoolId || '');
                            const lastMessage = isHuman ? (conv as Conversation).messages[(conv as Conversation).messages.length - 1] : null;

                            const title = isHuman ? (conv as Conversation).subject : (conv as AiChatLog).studentName;
                            const subtitle = isHuman ? `${lastMessage?.sender === 'admin' ? 'You: ' : ''}${lastMessage?.text}` : `Index: ${(conv as AiChatLog).studentIndex}`;
                            const time = isHuman ? (conv as Conversation).lastMessageTimestamp : (conv as AiChatLog).timestamp;
                            const id = isHuman ? (conv as Conversation).id : (conv as AiChatLog).studentIndex;
                            const isUnread = isHuman && (conv as Conversation).status === 'unread';

                            return (
                                <button key={id} onClick={() => handleConversationSelect(id)} className={`w-full text-left p-4 sm:p-5 border-b border-logip-border dark:border-dark-border transition-all border-l-4 ${activeConversationId === id ? 'bg-blue-50/50 dark:bg-dark-border/50 border-logip-primary' : isUnread ? 'border-red-500 bg-red-50/10 dark:bg-red-900/5' : 'border-transparent hover:bg-gray-50 dark:hover:bg-dark-border/30'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-bold text-sm truncate pr-2 ${isUnread ? 'text-logip-text-header dark:text-gray-100' : 'text-logip-text-body dark:text-dark-text-secondary'}`}>{title}</h3>
                                        <p className="text-[10px] font-bold text-logip-text-subtle flex-shrink-0 uppercase">{timeSince(time)}</p>
                                    </div>
                                    <p className="text-xs text-logip-text-subtle truncate opacity-80 leading-relaxed">{subtitle}</p>
                                    {school && <div className="mt-2.5"><span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded bg-gray-100 dark:bg-dark-bg text-logip-text-subtle">{school.name}</span></div>}
                                </button>
                            );
                        })
                    ) : (
                        <div className="text-center py-20 px-6 opacity-40">
                            <span className="material-symbols-outlined text-5xl">forum</span>
                            <p className="mt-4 text-sm font-bold uppercase tracking-widest">No Active Conversations</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Right: Message View */}
            <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-dark-bg">
                {activeConversation ? (
                     <>
                        <header className="px-6 py-4 border-b border-logip-border dark:border-dark-border flex-shrink-0 flex justify-between items-center bg-white dark:bg-report-dark shadow-sm z-10">
                            <div className="min-w-0">
                                {'subject' in activeConversation ? (
                                    <>
                                        <h2 className="text-lg font-bold text-logip-text-header dark:text-gray-100 truncate">{activeConversation.subject}</h2>
                                        <p className="text-xs font-semibold text-logip-text-subtle uppercase tracking-wider">{getSchoolById(activeConversation.schoolId)?.name || 'Support Request'}</p>
                                    </>
                                ) : (
                                     <>
                                        <h2 className="text-lg font-bold text-logip-text-header dark:text-gray-100 truncate">{activeConversation.studentName}</h2>
                                        <p className="text-xs font-semibold text-logip-text-subtle uppercase tracking-wider">AI Support Transcript &middot; {activeConversation.studentIndex}</p>
                                    </>
                                )}
                            </div>
                            {'subject' in activeConversation && (
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleUpdateStatus(activeConversation.id, 'unread')} 
                                        className="p-2 rounded-full text-logip-text-subtle hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                                        title="Mark as Unread"
                                    >
                                        <span className="material-symbols-outlined">mark_as_unread</span>
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatus(activeConversation.id, 'blocked')} 
                                        className="p-2 rounded-full text-logip-text-subtle hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                                        title="Block"
                                    >
                                        <span className="material-symbols-outlined">block</span>
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatus(activeConversation.id, 'trash')} 
                                        className="p-2 rounded-full text-logip-text-subtle hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                                        title="Trash"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                    <div className="w-px h-6 bg-logip-border dark:border-dark-border mx-1"></div>
                                    <button onClick={() => setIsAudioCallOpen(true)} className="p-2 rounded-full text-logip-text-subtle hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"><span className="material-symbols-outlined">call</span></button>
                                    <button onClick={() => setIsVideoCallOpen(true)} className="p-2 rounded-full text-logip-text-subtle hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"><span className="material-symbols-outlined">videocam</span></button>
                                </div>
                            )}
                        </header>
                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 bg-gray-50 dark:bg-dark-bg/50">
                           {renderMessagesList()}
                           <div ref={messagesEndRef} />
                        </div>
                        {'subject' in activeConversation && (
                             <footer className="p-4 sm:p-6 border-t border-logip-border dark:border-dark-border flex-shrink-0 bg-white dark:bg-report-dark">
                                <div className="relative">
                                    <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type a reply..." className="w-full bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-2xl p-4 pr-32 text-base resize-none focus:outline-none focus:ring-2 focus:ring-logip-primary text-black dark:text-white shadow-inner" rows={3}></textarea>
                                    <div className="absolute right-4 bottom-4 flex items-center gap-2">
                                        <button className="p-2 rounded-full text-logip-text-subtle hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"><span className="material-symbols-outlined">attach_file</span></button>
                                        <button onClick={handleSendReply} disabled={!replyText.trim()} className="px-5 py-2 text-sm font-bold uppercase tracking-wider rounded-xl bg-logip-primary text-white hover:bg-logip-primary-hover shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:shadow-none">Send Reply</button>
                                    </div>
                                </div>
                            </footer>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center p-12 opacity-30 select-none">
                        <div>
                            <div className="w-24 h-24 rounded-full border-4 border-dashed border-current mx-auto flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-6xl">chat_bubble</span>
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Support Inbox</h3>
                            <p className="text-sm font-bold mt-2">Select a thread to start communicating</p>
                        </div>
                    </div>
                )}
            </main>

             {isAudioCallOpen && activeConversation && 'subject' in activeConversation && (
                <AudioCallModal isOpen={isAudioCallOpen} onClose={() => setIsAudioCallOpen(false)} userName={getSchoolById(activeConversation.schoolId)?.name || 'School Support'} />
            )}
            {isVideoCallOpen && activeConversation && 'subject' in activeConversation && (
                <VideoCallModal isOpen={isVideoCallOpen} onClose={() => setIsVideoCallOpen(false)} userName={getSchoolById(activeConversation.schoolId)?.name || 'School Support'} />
            )}
        </div>
    );
};

export default MessagesPage;

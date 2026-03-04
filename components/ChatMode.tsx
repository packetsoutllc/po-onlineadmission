
import React, { useState, useRef, useEffect } from 'react';
import { createChatSession } from '../services/geminiService';
import { ChatMessage } from '../types';
import { MessageSquare, Send, Loader2, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Chat, GenerateContentResponse } from '@google/genai';

const ChatMode: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat session once on mount
  useEffect(() => {
    chatSessionRef.current = createChatSession();
    // Add initial greeting
    // FIX: Provided mandatory sender and matching role/id types
    setMessages([
      {
        id: 'init',
        sender: 'ai',
        role: 'model',
        text: "Hi! I'm Gemini. How can I help you today?",
        timestamp: Date.now()
      }
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current) return;

    // FIX: Provided mandatory sender property
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sender: 'user',
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await chatSessionRef.current.sendMessageStream({
        message: userMsg.text
      });
      
      const botMsgId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      let fullText = '';
      
      // Add placeholder bot message
      // FIX: Provided mandatory sender property to avoid SetStateAction error
      setMessages(prev => [
        ...prev, 
        { id: botMsgId, sender: 'ai', role: 'model', text: '', timestamp: Date.now() }
      ]);

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        if (text) {
          fullText += text;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === botMsgId ? { ...msg, text: fullText } : msg
            )
          );
        }
      }

    } catch (error) {
      console.error("Chat error:", error);
      // FIX: Provided mandatory sender property
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        sender: 'ai',
        role: 'model',
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white shadow-sm md:rounded-xl md:border md:border-slate-200 md:my-4 overflow-hidden">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
          <MessageSquare size={20} />
        </div>
        <div>
          <h2 className="font-bold text-slate-800">Chat Session</h2>
          <p className="text-xs text-slate-500">Gemini 3 Flash • Multi-turn conversation</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
        {messages.map((msg) => (
          // FIX: Use role or sender consistently based on type definition
          <div 
            key={msg.id} 
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
            }`}>
              <div className={`markdown-body text-sm ${msg.role === 'user' ? 'text-white' : ''}`}>
                <ReactMarkdown 
                  components={{
                    // Override styles for user messages to ensure readability on dark background
                    p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
                    pre: ({node, ...props}) => <pre className="bg-black/20 p-2 rounded overflow-x-auto" {...props} />,
                    code: ({node, ...props}) => <code className="bg-black/20 px-1 py-0.5 rounded" {...props} />
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none h-[52px] max-h-32 shadow-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:bg-slate-400"
          >
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          Gemini may display inaccurate info, including about people, so double-check its responses.
        </p>
      </div>
    </div>
  );
};

export default ChatMode;

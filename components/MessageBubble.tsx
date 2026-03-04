import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import { Bot, User, AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-indigo-600' : isError ? 'bg-red-500' : 'bg-gradient-to-br from-cyan-500 to-blue-600'
        }`}>
          {isUser ? <User size={16} className="text-white" /> : 
           isError ? <AlertCircle size={16} className="text-white" /> :
           <Bot size={16} className="text-white" />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
          
          {/* Attachments (Images) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-1">
              {message.attachments.map((att, idx) => (
                <img 
                  key={idx}
                  src={att.previewUrl} 
                  alt="Attachment" 
                  className="max-w-[200px] max-h-[200px] rounded-lg border border-white/10 object-cover"
                />
              ))}
            </div>
          )}

          {/* Text Content */}
          <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed overflow-hidden ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : isError
              ? 'bg-red-900/50 border border-red-500/30 text-red-200 rounded-tl-none'
              : 'glass-panel text-slate-200 rounded-tl-none'
          }`}>
            {message.text ? (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code({node, inline, className, children, ...props}: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline ? (
                      <div className="bg-slate-950/50 rounded-md p-3 my-2 border border-white/5 overflow-x-auto">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </div>
                    ) : (
                      <code className="bg-slate-800 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                        {children}
                      </code>
                    )
                  },
                  ul: ({children}) => <ul className="list-disc ml-4 my-2 space-y-1">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal ml-4 my-2 space-y-1">{children}</ol>,
                  a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{children}</a>,
                  p: ({children}) => <p className="mb-1 last:mb-0">{children}</p>,
                }}
              >
                {message.text}
              </ReactMarkdown>
            ) : (
               <span className="italic opacity-50">Thinking...</span>
            )}
          </div>
          
          {/* Timestamp */}
          <span className="text-[10px] text-slate-500 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
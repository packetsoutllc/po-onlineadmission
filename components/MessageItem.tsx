
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';

interface MessageItemProps {
  message: ChatMessage;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  // FIX: Support both role and sender for identifying the user
  const isUser = message.role === 'user' || message.sender === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600' : 'bg-emerald-600'}`}>
          {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div 
            className={`
              px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-md
              ${isUser 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700'
              }
            `}
          >
            {/* Image attachment */}
            {/* FIX: Using imageUrl property */}
            {message.imageUrl && (
              <div className="mb-3">
                <img 
                  src={message.imageUrl} 
                  alt="User upload" 
                  className="max-w-full rounded-lg max-h-64 object-cover border border-white/20"
                />
              </div>
            )}

            {/* Text Content */}
            {message.text ? (
              <div className="markdown-content prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      return !inline ? (
                        <div className="bg-gray-950 p-2 rounded-md my-2 overflow-x-auto border border-gray-700">
                          <code className="text-xs font-mono text-blue-300" {...props}>
                            {children}
                          </code>
                        </div>
                      ) : (
                        <code className="bg-gray-700/50 px-1 py-0.5 rounded text-xs font-mono text-blue-200" {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {message.text}
                </ReactMarkdown>
              </div>
            ) : (
              // Loading state for empty streaming messages
              // FIX: Checked for isStreaming property
              message.isStreaming && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Thinking...</span>
                </div>
              )
            )}
          </div>
          
          <span className="text-xs text-gray-500 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

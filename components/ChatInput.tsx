import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Attachment } from '../types';

interface ChatInputProps {
  onSend: (text: string, attachment: Attachment | null) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [text]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setAttachment({
          file,
          previewUrl: URL.createObjectURL(file),
          base64: reader.result as string,
          mimeType: file.type
        });
      };
      
      reader.readAsDataURL(file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
  };

  const handleSend = () => {
    if ((!text.trim() && !attachment) || isLoading) return;
    onSend(text, attachment);
    setText('');
    setAttachment(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Attachment Preview */}
      {attachment && (
        <div className="absolute bottom-full left-0 mb-2 ml-4 animate-slide-up">
          <div className="relative group inline-block">
            <img 
              src={attachment.previewUrl} 
              alt="Preview" 
              className="h-20 w-20 object-cover rounded-lg border border-slate-600 shadow-lg bg-slate-800"
            />
            <button 
              onClick={clearAttachment}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="glass-panel rounded-2xl p-2 flex items-end gap-2 shadow-xl ring-1 ring-white/10">
        
        {/* Attachment Button */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className={`p-3 rounded-xl transition-colors ${
            attachment 
              ? 'text-cyan-400 bg-cyan-400/10' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Attach image"
        >
          <ImageIcon size={20} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={attachment ? "Ask something about this image..." : "Type a message..."}
          className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 placeholder-slate-500 resize-none py-3 max-h-[150px] min-h-[44px]"
          rows={1}
          disabled={isLoading}
        />

        {/* Send Button */}
        <button 
          onClick={handleSend}
          disabled={(!text.trim() && !attachment) || isLoading}
          className={`p-3 rounded-xl flex items-center justify-center transition-all duration-200 ${
            (!text.trim() && !attachment) || isLoading
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 active:scale-95'
          }`}
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
      
      <div className="text-center mt-2">
         <p className="text-[10px] text-slate-500">
           Powered by Gemini 2.5 Flash • Images & Text Supported
         </p>
      </div>
    </div>
  );
};
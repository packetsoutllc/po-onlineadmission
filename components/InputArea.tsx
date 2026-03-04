import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send, Image as ImageIcon, X } from 'lucide-react';

interface InputAreaProps {
  onSend: (text: string, image?: string) => void;
  disabled: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = () => {
    if ((!text.trim() && !imagePreview) || disabled) return;
    onSend(text, imagePreview || undefined);
    setText('');
    setImagePreview(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
    setText(target.value);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="relative bg-gray-800 border border-gray-700 rounded-2xl shadow-xl flex flex-col transition-colors focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50">
        
        {/* Image Preview Area */}
        {imagePreview && (
          <div className="p-3 pb-0">
            <div className="relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-20 w-auto rounded-lg border border-gray-600 object-cover" 
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-gray-700 hover:bg-red-500 text-white rounded-full p-1 border border-gray-500 transition-colors shadow-md"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Input Controls */}
        <div className="flex items-end gap-2 p-3">
          <button
            onClick={triggerFileInput}
            disabled={disabled}
            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700/50 rounded-full transition-colors disabled:opacity-50"
            title="Upload Image"
          >
            <ImageIcon size={20} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={autoResize}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none resize-none py-2 max-h-[150px] overflow-y-auto"
            style={{ minHeight: '40px' }}
          />

          <button
            onClick={handleSend}
            disabled={disabled || (!text.trim() && !imagePreview)}
            className={`
              p-2 rounded-full transition-all duration-200
              ${(!text.trim() && !imagePreview) || disabled
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 shadow-lg'
              }
            `}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
      <p className="text-center text-xs text-gray-600 mt-2">
        Gemini 2.5 Flash can make mistakes. Please double check responses.
      </p>
    </div>
  );
};
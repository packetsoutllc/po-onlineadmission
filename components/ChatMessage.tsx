
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import { Bot, User, Volume2, Loader2, ExternalLink } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
}

// FIX: Implementation of manual PCM audio decoding as required by guidelines
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLast }) => {
  const isUser = message.role === 'user';
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const handleSpeak = async () => {
    if (isPlaying) return; // Simple prevent double click, real app needs audio context management
    try {
      setIsLoadingAudio(true);
      const audioBufferData = await generateSpeech(message.text);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      
      // FIX: Use manual decodeAudioData for raw PCM from Gemini API as per guidelines
      const buffer = await decodeAudioData(new Uint8Array(audioBufferData), ctx, 24000, 1);
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      setIsPlaying(true);
      source.onended = () => setIsPlaying(false);
    } catch (e) {
      console.error("TTS Error", e);
      alert("Failed to generate speech");
    } finally {
      setIsLoadingAudio(false);
    }
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-4xl w-full ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isUser ? 'bg-indigo-600' : 'bg-gemini-600'
        }`}>
          {isUser ? <User size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col min-w-0 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`relative px-6 py-4 rounded-2xl ${
            isUser 
              ? 'bg-neutral-800 text-white rounded-tr-none' 
              : 'bg-neutral-900 text-neutral-100 rounded-tl-none border border-neutral-800'
          }`}>
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {message.attachments.map((att, idx) => (
                  <img 
                    key={idx} 
                    src={att.previewUrl} 
                    alt="Attachment" 
                    className="h-32 w-auto rounded-lg border border-neutral-700 object-cover" 
                  />
                ))}
              </div>
            )}

            {/* Thinking State */}
            {message.isThinking ? (
              <div className="flex items-center gap-2 text-neutral-400">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm">Gemini is thinking...</span>
              </div>
            ) : (
              <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-neutral-950 prose-pre:border prose-pre:border-neutral-800 max-w-none">
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
            )}

            {/* Grounding Sources */}
            {message.groundingMetadata && message.groundingMetadata.length > 0 && (
              <div className="mt-4 pt-3 border-t border-neutral-700/50">
                <p className="text-xs text-neutral-400 mb-2 font-semibold uppercase tracking-wider">Sources</p>
                <div className="flex flex-wrap gap-2">
                  {message.groundingMetadata.map((chunk, i) => (
                    chunk.web?.uri && (
                      <a 
                        key={i} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-blue-400 px-2 py-1 rounded-md transition-colors"
                      >
                        <ExternalLink size={10} />
                        {chunk.web.title || new URL(chunk.web.uri).hostname}
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Row (Bot Only) */}
          {!isUser && !message.isThinking && (
            <div className="flex items-center gap-2 mt-2 ml-1">
              <button 
                onClick={handleSpeak}
                disabled={isPlaying || isLoadingAudio}
                className={`p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 transition-colors ${isPlaying ? 'text-green-400' : ''}`}
                title="Read Aloud"
              >
                {isLoadingAudio ? <Loader2 className="animate-spin" size={14} /> : <Volume2 size={16} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;

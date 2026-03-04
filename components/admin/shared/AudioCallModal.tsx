
import React, { useState, useEffect } from 'react';

interface AudioCallModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
    avatarUrl?: string;
}

const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const AudioCallModal: React.FC<AudioCallModalProps> = ({ isOpen, onClose, userName, avatarUrl }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [callStatus, setCallStatus] = useState<'connecting' | 'active'>('connecting');

    useEffect(() => {
        let timer: number | null = null;
        let statusTimer: number | null = null;

        if (isOpen) {
            setCallStatus('connecting');
            setCallDuration(0);
            setIsMuted(false);

            // FIX: Using window. prefix for browser environment timer consistency
            statusTimer = window.setTimeout(() => {
                setCallStatus('active');
                timer = window.setInterval(() => {
                    setCallDuration(prev => prev + 1);
                }, 1000);
            }, 2000); // Simulate connection time

        }
        
        return () => {
            if (timer) clearInterval(timer);
            if (statusTimer) clearTimeout(statusTimer);
        };

    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fadeIn"
        >
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm m-auto animate-scaleIn text-white flex flex-col items-center p-8">
                <div className="relative">
                    <img 
                        src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4f46e5&color=fff&size=128`}
                        alt={userName}
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-700"
                    />
                    <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-gray-800 ${callStatus === 'active' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                </div>
                
                <h2 className="text-2xl font-bold mt-6">{userName}</h2>
                <p className="text-lg text-gray-400 mt-2">
                    {callStatus === 'connecting' ? 'Connecting...' : formatDuration(callDuration)}
                </p>

                <div className="flex items-center gap-6 mt-12">
                    <button 
                        onClick={() => setIsMuted(!isMuted)} 
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        <span className="material-symbols-outlined text-3xl">{isMuted ? 'mic_off' : 'mic'}</span>
                    </button>
                     <button 
                        onClick={onClose} 
                        className="w-20 h-20 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 transition-colors transform hover:scale-105"
                    >
                        <span className="material-symbols-outlined text-4xl">call_end</span>
                    </button>
                    <button className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 transition-colors">
                        <span className="material-symbols-outlined text-3xl">volume_up</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AudioCallModal;

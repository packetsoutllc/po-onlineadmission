
import React, { useState, useEffect, useRef } from 'react';

interface VideoCallModalProps {
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

const VideoCallModal: React.FC<VideoCallModalProps> = ({ isOpen, onClose, userName, avatarUrl }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [callStatus, setCallStatus] = useState<'connecting' | 'active'>('connecting');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        let timer: number | undefined;

        const startCall = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Requesting both at once can fail if one device is missing or blocked.
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: { ideal: 640 }, height: { ideal: 480 } }, 
                    audio: true 
                });
                
                streamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                // In a real app, you'd establish a WebRTC connection here.
                // For this simulation, we'll just show the local stream as the "remote" one too.
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = stream;
                }

                setCallStatus('active');
                timer = window.setInterval(() => {
                    setCallDuration(prev => prev + 1);
                }, 1000);
            } catch (err: any) {
                console.error("Error accessing media devices:", err);
                
                let errorMessage = "Could not start video source. Please ensure a camera and microphone are connected and permissions are granted in your browser.";
                
                const errName = err.name || "";
                const errMsg = err.message || "";

                if (errName === 'NotAllowedError' || errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('dismissed')) {
                    errorMessage = "Access to camera or microphone was denied or dismissed. Please click the camera icon in your browser's address bar to allow permissions and try again.";
                } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
                    errorMessage = "No camera or microphone found on your device. Please connect a compatible device and refresh the page.";
                } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
                    errorMessage = "Your camera or microphone is currently being used by another application. Please close other apps using the camera and try again.";
                } else if (errName === 'OverconstrainedError' || errName === 'ConstraintNotSatisfiedError') {
                    errorMessage = "The requested video resolution is not supported by your camera. Please try a different device.";
                } else if (errName === 'SecurityError') {
                    errorMessage = "Media access is restricted by your browser's security policy. Ensure you are using a secure (HTTPS) connection.";
                }
                
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            setCallStatus('connecting');
            setCallDuration(0);
            setIsMuted(false);
            setIsVideoOff(false);
            startCall();
        } else {
             if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        }

        return () => {
            if (timer) clearInterval(timer);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };

    }, [isOpen]);

    const toggleMute = () => {
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(prev => !prev);
        }
    };

    const toggleVideo = () => {
        if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoOff(prev => !prev);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex justify-center items-center p-4 animate-fadeIn">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] m-auto animate-scaleIn text-white flex flex-col items-center p-6 relative overflow-hidden">
                {/* Remote video (the person you're calling) */}
                <div className="absolute inset-0 w-full h-full">
                    {error ? (
                        <div className="w-full h-full bg-black flex flex-col items-center justify-center text-center p-8">
                            <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
                            <h3 className="text-xl font-bold text-white mb-2">Connection Issue</h3>
                            <p className="text-gray-400 max-w-md">{error}</p>
                            <button 
                                onClick={onClose}
                                className="mt-8 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-semibold"
                            >
                                Close Window
                            </button>
                        </div>
                    ) : isLoading ? (
                        <div className="w-full h-full bg-black flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                            <p className="mt-4 text-gray-300">Initializing source...</p>
                        </div>
                    ) : (
                        <>
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20"></div>
                        </>
                    )}
                </div>

                {/* Local video (your preview) */}
                 {!error && !isLoading && (
                    <div className="absolute top-6 right-6 w-48 h-27 bg-black rounded-lg overflow-hidden border-2 border-gray-700 shadow-2xl">
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                        {isVideoOff && (
                            <div className="absolute inset-0 bg-black flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-gray-400">videocam_off</span>
                            </div>
                        )}
                    </div>
                )}


                <div className="relative z-10 flex flex-col items-center justify-between h-full w-full">
                    {/* Top Info */}
                    <div className="text-center">
                        <h2 className="text-2xl font-bold drop-shadow-md">{userName}</h2>
                         <p className="text-lg text-gray-300 mt-1 drop-shadow-md">
                            {callStatus === 'connecting' && !error ? 'Connecting...' : callStatus === 'active' ? formatDuration(callDuration) : ''}
                        </p>
                    </div>

                    {/* Bottom Controls */}
                    <div className="flex items-center gap-6 pb-4">
                        <button 
                            onClick={toggleMute} 
                            disabled={!streamRef.current}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-white text-gray-800' : 'bg-white/20 hover:bg-white/30'} disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={isMuted ? 'Unmute' : 'Mute'}
                        >
                            <span className="material-symbols-outlined text-3xl">{isMuted ? 'mic_off' : 'mic'}</span>
                        </button>
                        <button 
                            onClick={toggleVideo} 
                            disabled={!streamRef.current}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isVideoOff ? 'bg-white text-gray-800' : 'bg-white/20 hover:bg-white/30'} disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
                        >
                            <span className="material-symbols-outlined text-3xl">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
                        </button>
                        <button 
                            onClick={onClose} 
                            className="w-20 h-16 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 transition-colors transform hover:scale-105 shadow-xl"
                            title="End Call"
                        >
                            <span className="material-symbols-outlined text-4xl">call_end</span>
                        </button>
                        <button className="w-16 h-16 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50" title="More Options" disabled={!streamRef.current}>
                            <span className="material-symbols-outlined text-3xl">more_vert</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoCallModal;


import React, { useRef, useState, useEffect } from 'react';
import Modal from './Modal';

interface WebcamCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageDataUrl: string) => void;
}

const WebcamCaptureModal: React.FC<WebcamCaptureModalProps> = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isMountedRef = useRef(false);

    useEffect(() => {
        isMountedRef.current = true;
        let stream: MediaStream | null = null;

        const initCamera = async () => {
            if (!isOpen) return;

            try {
                setError(null);
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } 
                });
                
                if (!isMountedRef.current) {
                    // Component unmounted before stream started
                    if (stream) stream.getTracks().forEach(track => track.stop());
                    return;
                }

                streamRef.current = stream;
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(e => console.error("Video play error:", e));
                }
            } catch (err: any) {
                console.error("Camera access error:", err);
                if (isMountedRef.current) {
                     const errMsg = err.message || "";
                     const errName = err.name || "";
                     
                     if (errName === 'NotAllowedError' || errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('dismissed')) {
                        setError("Camera access was denied or dismissed. Please look for the camera icon in your address bar and allow access to take a photo.");
                     } else {
                        setError("Could not access camera. Please ensure it's connected and refresh the page.");
                     }
                }
            }
        };

        initCamera();

        return () => {
            isMountedRef.current = false;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, [isOpen]);

    const handleCapture = () => {
        if (videoRef.current && videoRef.current.videoWidth) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // Compress slightly
                onCapture(dataUrl);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col items-center w-full">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Take Student Photo</h2>
                {error ? (
                     <div className="w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center text-center p-8 border border-red-200 dark:border-red-900/50">
                        <span className="material-symbols-outlined text-4xl text-red-500 mb-4">error</span>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">{error}</p>
                        <button 
                            onClick={onClose}
                            className="mt-6 px-4 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-gray-700 relative shadow-inner">
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted
                            className="w-full h-full object-cover transform -scale-x-100" 
                        />
                        {/* Overlay with framing guide */}
                        <div className="absolute inset-0 pointer-events-none border-[40px] border-black/30 flex items-center justify-center">
                            <div className="w-64 h-80 rounded-[100px] border-2 border-dashed border-white/50"></div>
                        </div>
                    </div>
                )}
                <div className="mt-6 w-full flex justify-center gap-4">
                     <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 text-base font-semibold rounded-lg text-gray-900 dark:text-gray-300 bg-transparent hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border border-gray-300 dark:border-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={handleCapture} 
                        disabled={!!error}
                        className="flex items-center gap-2 px-6 py-2 text-base font-semibold rounded-lg text-white bg-logip-primary hover:bg-logip-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        <span className="material-symbols-outlined">photo_camera</span>
                        Capture Photo
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default WebcamCaptureModal;

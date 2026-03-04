
import React, { useState, useRef, useEffect } from 'react';

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  autoplay: boolean;
  isDraggable?: boolean;
}

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ isOpen, onClose, url, autoplay, isDraggable = false }) => {
  // Use Ref for position to avoid re-renders during drag
  const positionRef = useRef({ x: 20, y: window.innerHeight - 300 });
  const modalRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  
  // Video State
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isMuted, setIsMuted] = useState(true); // Default mute as requested
  const [volume, setVolume] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Volume slider interaction state to prevent auto-hiding while dragging
  const [isVolumeDragging, setIsVolumeDragging] = useState(false);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset state when url changes or modal opens
  useEffect(() => {
    if (isOpen) {
        setIsMuted(true);
        setVolume(1);
        setIsPlaying(autoplay);
        setProgress(0);
        setCurrentTime(0);
        setIsLoading(true);
    }
  }, [isOpen, url, autoplay]);

  // Handle Dragging via direct DOM manipulation for performance
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
        if (!isDragging || !modalRef.current) return;
        e.preventDefault();
        
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;
        
        // Update ref
        positionRef.current = { x: newX, y: newY };
        
        // Direct DOM update (no React render)
        modalRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
    };

    const handleWindowMouseUp = () => {
        setIsDragging(false);
    };

    if (isDragging) {
        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging]);

  // Global mouse up to ensure volume dragging stops even if mouse leaves element
  useEffect(() => {
      const handleGlobalMouseUp = () => {
          if (isVolumeDragging) setIsVolumeDragging(false);
      };
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isVolumeDragging]);

  // Keyboard Controls
  useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
          // Prevent interference with standard inputs if any exist in context (though unlikely in this modal)
          const tag = (e.target as HTMLElement).tagName;
          if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

          switch (e.key) {
              case ' ':
              case 'k':
              case 'K':
                  e.preventDefault();
                  setIsPlaying(prev => !prev);
                  break;
              case 'ArrowUp':
                  e.preventDefault();
                  setVolume(prev => {
                      const newVol = Math.min(1, prev + 0.1);
                      if (newVol > 0) setIsMuted(false);
                      return newVol;
                  });
                  break;
              case 'ArrowDown':
                  e.preventDefault();
                  setVolume(prev => {
                      const newVol = Math.max(0, prev - 0.1);
                      if (newVol < 0.05) setIsMuted(true);
                      return newVol;
                  });
                  break;
              case 'm':
              case 'M':
                  e.preventDefault();
                  toggleMute();
                  break;
              case 'f':
              case 'F':
                  e.preventDefault();
                  setIsExpanded(prev => !prev);
                  break;
              case 'Escape':
                  e.preventDefault();
                  onClose();
                  break;
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Video Event Listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
        const curr = video.currentTime;
        const dur = video.duration;
        setCurrentTime(curr);
        if (dur > 0) {
            setDuration(dur);
            setProgress((curr / dur) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        setDuration(video.duration);
        setIsLoading(false);
        if (autoplay) {
            video.play().catch((e) => {
                 if (e.name !== 'AbortError') {
                    console.error("Autoplay failed", e);
                 }
                 setIsPlaying(false);
            });
        }
    };
    
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    const handleEnded = () => {
        setIsPlaying(false);
        setShowControls(true);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
    };
  }, [url, autoplay, isOpen]);

  // Play/Pause Effect
  useEffect(() => {
      const video = videoRef.current;
      if (video) {
          if (isPlaying) {
              video.play().catch(e => {
                  if (e.name !== 'AbortError') {
                      console.error("Play failed", e);
                  }
                  setIsPlaying(false);
              });
          } else {
              video.pause();
          }
      }
  }, [isPlaying]);

  // Mute & Volume Effect
  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.muted = isMuted;
        videoRef.current.volume = volume;
    }
  }, [isMuted, volume]);

  const handleMouseDown = (e: React.MouseEvent) => {
      if (!isDraggable || isExpanded) return;
      // Prevent drag if clicking controls or inputs
      if ((e.target as HTMLElement).closest('.video-controls')) return;

      setIsDragging(true);
      
      // Calculate offset from current position
      dragStartRef.current = {
          x: e.clientX - positionRef.current.x,
          y: e.clientY - positionRef.current.y
      };
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setProgress(val); // Instant UI update
      if (videoRef.current && duration > 0) {
          const newTime = (val / 100) * duration;
          videoRef.current.currentTime = newTime;
          setCurrentTime(newTime);
      }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVol = parseFloat(e.target.value);
      setVolume(newVol);
      if (newVol > 0) setIsMuted(false);
      if (newVol === 0) setIsMuted(true);
  };
  
  const toggleExpand = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsExpanded(!isExpanded);
  }

  const togglePlay = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsPlaying(!isPlaying);
  };

  const toggleMute = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (isMuted) {
          setIsMuted(false);
          // Restore volume if it was zeroed out
          if (volume === 0) setVolume(1);
      } else {
          setIsMuted(true);
      }
  };

  if (!isOpen) return null;

  // Determine styles based on state
  const getModalStyle = (): React.CSSProperties => {
      if (isExpanded) {
          return {
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '1000px',
              zIndex: 1001,
              cursor: 'default'
          };
      } else if (isDraggable) {
          return {
              position: 'fixed',
              top: 0,
              left: 0,
              // Use the ref's current value for initial render or re-renders
              transform: `translate(${positionRef.current.x}px, ${positionRef.current.y}px)`,
              width: '320px',
              zIndex: 1000,
              cursor: isDragging ? 'grabbing' : 'grab'
          };
      }
      return {};
  };

  return (
    <>
        {/* Backdrop for Expanded or Standard Modal Mode */}
        {(isExpanded || !isDraggable) && (
            <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999]" 
                onClick={isDraggable ? toggleExpand : onClose}
            />
        )}

        <div 
            ref={modalRef}
            className={`bg-black shadow-2xl overflow-hidden border border-gray-800 ${isExpanded ? 'rounded-lg' : 'rounded-xl'} ${isDragging ? 'transition-none' : 'transition-all duration-300'}`}
            style={getModalStyle()}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            {/* Header / Drag Handle Area for Floating Mode */}
            {(!isExpanded && isDraggable) && (
                <div className="absolute top-0 left-0 right-0 h-8 z-20 hover:bg-white/10 transition-colors" />
            )}

            <div className="relative w-full bg-black aspect-video flex items-center justify-center group">
                 {isLoading && (
                     <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                         <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-logip-primary"></div>
                     </div>
                 )}
                 
                 {url ? (
                    <video
                        ref={videoRef}
                        src={url}
                        className="w-full h-full object-contain"
                        playsInline
                        onClick={togglePlay}
                        muted={isMuted} // Ensure muted prop is controlled
                    />
                 ) : (
                     <div className="text-white flex flex-col items-center">
                         <span className="material-symbols-outlined text-4xl text-gray-500 mb-2">videocam_off</span>
                         <span className="text-sm text-gray-400">No video source</span>
                     </div>
                 )}

                {/* Big Play Button Overlay */}
                {!isPlaying && !isLoading && (
                    <div 
                        className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
                        onClick={togglePlay}
                    >
                        <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-4xl text-white ml-1">play_arrow</span>
                        </div>
                    </div>
                )}
            
                {/* Controls Bar */}
                <div 
                    className={`video-controls absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-3 pt-8 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                    onMouseDown={(e) => e.stopPropagation()} 
                >
                    {/* Progress Bar */}
                    <div className="relative h-1.5 bg-gray-600 rounded-full mb-3 cursor-pointer group/bar">
                        <div 
                            className="absolute top-0 left-0 h-full bg-logip-primary rounded-full transition-all" 
                            style={{ width: `${progress}%` }} 
                        />
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="0.1"
                            value={progress || 0} 
                            onChange={handleSeek} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={togglePlay} className="text-white hover:text-logip-primary transition-colors">
                                <span className="material-symbols-outlined text-3xl">
                                    {isPlaying ? 'pause' : 'play_arrow'}
                                </span>
                            </button>
                            
                            {/* Volume Control */}
                            <div 
                                className="flex items-center gap-1 group/vol"
                                onMouseEnter={() => setIsVolumeHovered(true)}
                                onMouseLeave={() => setIsVolumeHovered(false)}
                            >
                                <button onClick={toggleMute} className="text-white hover:text-gray-300 transition-colors">
                                    <span className="material-symbols-outlined text-2xl">
                                        {isMuted || volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                                    </span>
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 flex items-center ${isVolumeHovered || isVolumeDragging ? 'w-20 opacity-100' : 'w-0 opacity-0'}`}>
                                     <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        onMouseDown={() => setIsVolumeDragging(true)}
                                        className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                </div>
                            </div>

                            <span className="text-xs font-mono text-gray-300 min-w-[80px]">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {isDraggable && (
                                <button onClick={toggleExpand} className="text-white hover:text-gray-300 transition-colors p-1" title={isExpanded ? "Minimize" : "Expand"}>
                                    <span className="material-symbols-outlined text-2xl">
                                        {isExpanded ? 'close_fullscreen' : 'open_in_full'}
                                    </span>
                                </button>
                            )}
                            <button onClick={onClose} className="text-white hover:text-red-400 transition-colors p-1" title="Close">
                                <span className="material-symbols-outlined text-2xl">close</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
  );
};

export default VideoPreviewModal;

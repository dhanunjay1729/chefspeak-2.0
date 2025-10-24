import { Play, Pause, Volume2, RotateCcw } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export function AudioControls({ ttsService }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const progressBarRef = useRef(null);

  // Available playback speeds
  const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];

  useEffect(() => {
    // Subscribe to play state changes
    ttsService.onPlayStateChange = (playing) => {
      setIsPlaying(playing);
      if (playing) {
        setShowControls(true);
      }
    };

    // Subscribe to progress changes
    ttsService.onProgressChange = (prog) => {
      if (!isDragging) {
        setProgress(prog);
      }
    };

    // Update time displays
    const updateTime = () => {
      setCurrentTime(ttsService.getCurrentTime());
      setDuration(ttsService.getDuration());
    };

    const interval = setInterval(updateTime, 100);

    return () => {
      clearInterval(interval);
      ttsService.onPlayStateChange = null;
      ttsService.onProgressChange = null;
    };
  }, [ttsService, isDragging]);

  // Show controls when audio is available
  useEffect(() => {
    if (ttsService.currentAudio) {
      setShowControls(true);
    } else {
      setShowControls(false);
    }
  }, [ttsService.currentAudio]);

  const handleSliderChange = (e) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    if (!isDragging) {
      ttsService.seek(newProgress);
    }
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    ttsService.seek(progress);
  };

  const handleProgressBarClick = (e) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = (clickX / rect.width) * 100;
    
    setProgress(newProgress);
    ttsService.seek(newProgress);
  };

  const handleRestart = () => {
    setProgress(0);
    ttsService.seek(0);
    if (!isPlaying) {
      ttsService.resume();
    }
  };

  // ✅ Handle speed change - cycle through speeds
  const handleSpeedChange = () => {
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    
    setPlaybackRate(newSpeed);
    ttsService.setPlaybackRate(newSpeed);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!showControls) return null;

  return (
    <div className="w-full relative animate-in slide-in-from-bottom-4 duration-500">
      {/* Glow effect behind the card */}
      <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 via-rose-500/20 to-amber-500/20 
                      blur-2xl rounded-3xl transform scale-105 animate-pulse" />
      
      {/* Main card */}
      <div className="relative bg-gradient-to-br from-white via-rose-50/30 to-amber-50/50 
                      backdrop-blur-xl rounded-2xl p-5 
                      border border-white/60 shadow-2xl shadow-rose-500/10
                      transition-all duration-300 hover:shadow-rose-500/20">
        
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-fuchsia-500/10 to-transparent 
                        rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-500/10 to-transparent 
                        rounded-full blur-2xl" />

        {/* Audio wave indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex items-center gap-1">
            <div className={`w-1 bg-gradient-to-t from-fuchsia-600 to-rose-500 rounded-full transition-all duration-300 
                           ${isPlaying ? 'h-3 animate-pulse' : 'h-2'}`} 
                 style={{ animationDelay: '0ms' }} />
            <div className={`w-1 bg-gradient-to-t from-rose-500 to-amber-500 rounded-full transition-all duration-300 
                           ${isPlaying ? 'h-5 animate-pulse' : 'h-2'}`}
                 style={{ animationDelay: '150ms' }} />
            <div className={`w-1 bg-gradient-to-t from-amber-500 to-fuchsia-600 rounded-full transition-all duration-300 
                           ${isPlaying ? 'h-4 animate-pulse' : 'h-2'}`}
                 style={{ animationDelay: '300ms' }} />
            <div className={`w-1 bg-gradient-to-t from-fuchsia-600 to-rose-500 rounded-full transition-all duration-300 
                           ${isPlaying ? 'h-6 animate-pulse' : 'h-2'}`}
                 style={{ animationDelay: '450ms' }} />
            <div className={`w-1 bg-gradient-to-t from-rose-500 to-amber-500 rounded-full transition-all duration-300 
                           ${isPlaying ? 'h-3 animate-pulse' : 'h-2'}`}
                 style={{ animationDelay: '600ms' }} />
          </div>
          <span className="text-xs font-medium text-zinc-600 ml-2">
            {isPlaying ? 'Now Playing' : 'Paused'}
          </span>
          <Volume2 className={`w-4 h-4 ml-auto transition-all duration-300 
                             ${isPlaying ? 'text-rose-500 animate-pulse' : 'text-zinc-400'}`} />
        </div>

        {/* Progress bar container */}
        <div className="space-y-3">
          {/* Progress bar */}
          <div 
            ref={progressBarRef}
            onClick={handleProgressBarClick}
            className="relative h-3 bg-gradient-to-r from-zinc-200 via-rose-100 to-amber-100 
                       rounded-full cursor-pointer overflow-hidden group
                       shadow-inner"
          >
            {/* Progress fill with shimmer */}
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-fuchsia-600 via-rose-500 to-amber-500
                         rounded-full transition-all duration-150 ease-out
                         shadow-lg shadow-rose-500/50"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
                            animate-shimmer" 
                   style={{
                     backgroundSize: '200% 100%',
                     animation: 'shimmer 2s infinite'
                   }} />
            </div>

            {/* Slider thumb */}
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              onChange={handleSliderChange}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            
            {/* Custom thumb indicator */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full 
                         shadow-lg shadow-rose-500/50 border-2 border-rose-500
                         transition-all duration-150 group-hover:scale-110
                         group-active:scale-125"
              style={{ left: `calc(${progress}% - 10px)` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 to-amber-500 
                            rounded-full opacity-50 animate-ping" />
            </div>
          </div>

          {/* Time display */}
          <div className="flex items-center justify-between text-sm">
            <span className="font-mono text-zinc-600 font-medium">
              {formatTime(currentTime)}
            </span>
            <span className="font-mono text-zinc-400 text-xs">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-center gap-4 mt-5">
          {/* Restart button */}
          <button
            onClick={handleRestart}
            className="group relative w-12 h-12 rounded-full 
                       bg-gradient-to-br from-zinc-100 to-zinc-200
                       hover:from-zinc-200 hover:to-zinc-300
                       active:scale-95 transition-all duration-200 
                       shadow-md hover:shadow-lg
                       flex items-center justify-center"
            aria-label="Restart"
          >
            <RotateCcw size={20} className="text-zinc-600 group-hover:text-zinc-800 transition-colors" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/50 to-transparent 
                          opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Play/Pause button - Hero button */}
          <button
            onClick={() => ttsService.togglePlayPause()}
            className="group relative w-16 h-16 rounded-full 
                       bg-gradient-to-br from-fuchsia-600 via-rose-500 to-amber-500
                       hover:from-fuchsia-700 hover:via-rose-600 hover:to-amber-600
                       active:scale-95 transition-all duration-200 
                       shadow-xl hover:shadow-2xl shadow-rose-500/50
                       flex items-center justify-center
                       ring-4 ring-white/50"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {/* Rotating gradient border effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-fuchsia-600 via-amber-500 to-fuchsia-600
                          opacity-0 group-hover:opacity-75 blur-md transition-opacity
                          animate-spin-slow" />
            
            {/* Icon */}
            <div className="relative z-10">
              {isPlaying ? (
                <Pause size={26} fill="white" className="text-white transition-transform group-hover:scale-110" />
              ) : (
                <Play size={26} fill="white" className="text-white ml-1 transition-transform group-hover:scale-110" />
              )}
            </div>

            {/* Pulse effect when playing */}
            {isPlaying && (
              <>
                <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-20" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-500/50 to-amber-500/50 
                              animate-pulse" />
              </>
            )}
          </button>

          {/* Speed control - ✅ Now functional */}
          <button
            onClick={handleSpeedChange}
            className="group relative w-12 h-12 rounded-full 
                       bg-gradient-to-br from-fuchsia-100 to-fuchsia-200
                       hover:from-fuchsia-200 hover:to-fuchsia-300
                       active:scale-95 transition-all duration-200 
                       shadow-md hover:shadow-lg hover:shadow-fuchsia-500/20
                       flex items-center justify-center"
            aria-label={`Playback speed: ${playbackRate}x`}
          >
            <span className="text-sm font-bold text-fuchsia-700 group-hover:text-fuchsia-900 transition-colors">
              {playbackRate}x
            </span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/50 to-transparent 
                          opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Decorative bottom accent */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-1 
                       bg-gradient-to-r from-transparent via-rose-500/50 to-transparent 
                       rounded-full blur-sm" />
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
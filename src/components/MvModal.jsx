import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  X, 
  Film, 
  Loader2, 
  ListVideo, 
  Check, 
  SkipForward 
} from 'lucide-react';

// Custom YouTube-style 10s Rewind Icon
function Rewind10Icon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <text x="12" y="15.5" fill="currentColor" stroke="none" fontSize="7.5" fontWeight="800" textAnchor="middle" fontFamily="'Space Mono', monospace">10</text>
    </svg>
  );
}

// Custom YouTube-style 10s Fast Forward Icon
function Forward10Icon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <text x="12" y="15.5" fill="currentColor" stroke="none" fontSize="7.5" fontWeight="800" textAnchor="middle" fontFamily="'Space Mono', monospace">10</text>
    </svg>
  );
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function MvModal({ isOpen, track, tracks = [], onSelectTrack, onClose }) {
  const modalRef = useRef(null);
  const videoRef = useRef(null);
  const seekbarRef = useRef(null);
  const hideControlsTimerRef = useRef(null);
  const lastTapRef = useRef({ time: 0, x: 0 });
  const loadedVideoUrlRef = useRef(null);

  // Video State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  // UI Interaction State
  const [showControls, setShowControls] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [hoverPercent, setHoverPercent] = useState(0);
  const [hoverTime, setHoverTime] = useState(null);
  const [seekRipple, setSeekRipple] = useState(null);
  const [playFlash, setPlayFlash] = useState(null);
  const [isMvListOpen, setIsMvListOpen] = useState(false);

  // Auto Next Video State
  const [countdown, setCountdown] = useState(null);
  const [nextMvTrack, setNextMvTrack] = useState(null);

  // Filter all tracks that have an official MV video
  const mvTracks = useMemo(() => {
    return (tracks || []).filter(t => t && t.video);
  }, [tracks]);

  // Start / Reset auto-hide controls timer (3.5s when playing)
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && !isMvListOpen && !isEnded) {
        setShowControls(false);
      }
    }, 3500);
  }, [isMvListOpen, isEnded]);

  // Load and play video ONLY when modal opens or track changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isOpen && track?.videoUrl) {
      if (loadedVideoUrlRef.current !== track.videoUrl) {
        loadedVideoUrlRef.current = track.videoUrl;
        video.src = track.videoUrl;
        video.load();
        setIsEnded(false);
        setCountdown(null);
        video.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      }
      setShowControls(true);
      resetControlsTimer();
    } else if (!isOpen) {
      loadedVideoUrlRef.current = null;
      video.pause();
      setIsPlaying(false);
      setIsEnded(false);
      setCountdown(null);
      setCurrentTime(0);
      setIsMvListOpen(false);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    }
  }, [isOpen, track?.videoUrl, resetControlsTimer]);

  // Auto Next 3s Countdown Timer
  useEffect(() => {
    if (countdown === null) return;

    if (countdown <= 0) {
      if (nextMvTrack && onSelectTrack) {
        onSelectTrack(nextMvTrack);
      }
      setCountdown(null);
      setIsEnded(false);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, nextMvTrack, onSelectTrack]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Replay Video from start
  const handleReplay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setCountdown(null);
    setIsEnded(false);
    video.currentTime = 0;
    setCurrentTime(0);
    video.play().then(() => {
      setIsPlaying(true);
      setPlayFlash('play');
      setTimeout(() => setPlayFlash(null), 500);
    }).catch(() => {});
    resetControlsTimer();
  }, [resetControlsTimer]);

  // Play / Pause Toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isEnded) {
      handleReplay();
      return;
    }

    if (video.paused || video.ended) {
      video.play().then(() => {
        setIsPlaying(true);
        setPlayFlash('play');
        setTimeout(() => setPlayFlash(null), 500);
      }).catch(() => {});
      resetControlsTimer();
    } else {
      video.pause();
      setIsPlaying(false);
      setPlayFlash('pause');
      setTimeout(() => setPlayFlash(null), 500);
      setShowControls(true);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    }
  }, [isEnded, handleReplay, resetControlsTimer]);

  // Seek Delta (+/- seconds) with YouTube ripple animation
  const seekDelta = useCallback((delta) => {
    const video = videoRef.current;
    if (!video) return;

    setCountdown(null);
    setIsEnded(false);
    const newTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + delta));
    video.currentTime = newTime;
    setCurrentTime(newTime);

    setSeekRipple({
      side: delta < 0 ? 'left' : 'right',
      amount: Math.abs(delta)
    });
    setTimeout(() => setSeekRipple(null), 600);

    resetControlsTimer();
  }, [resetControlsTimer]);

  // Volume Handlers
  const handleSetVolume = useCallback((val) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(1, val));
    video.volume = clamped;
    video.muted = clamped === 0;
    setVolume(clamped);
    setIsMuted(clamped === 0);
    resetControlsTimer();
  }, [resetControlsTimer]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted || volume === 0) {
      video.muted = false;
      video.volume = volume > 0 ? volume : 0.8;
      setIsMuted(false);
      if (volume === 0) setVolume(0.8);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
    resetControlsTimer();
  }, [isMuted, volume, resetControlsTimer]);

  // Fullscreen Toggle
  const toggleFullscreen = useCallback(() => {
    const modalEl = modalRef.current;
    if (!modalEl) return;

    if (!document.fullscreenElement) {
      if (modalEl.requestFullscreen) {
        modalEl.requestFullscreen().catch(() => {});
      } else if (modalEl.webkitRequestFullscreen) {
        modalEl.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
    resetControlsTimer();
  }, [resetControlsTimer]);

  // YouTube Keyboard Shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlay();
          break;
        case 'KeyJ':
          e.preventDefault();
          seekDelta(-10);
          break;
        case 'KeyL':
          e.preventDefault();
          seekDelta(10);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekDelta(-5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekDelta(5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleSetVolume(Math.min(1, volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleSetVolume(Math.max(0, volume - 0.05));
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Digit0':
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
        case 'Digit7':
        case 'Digit8':
        case 'Digit9':
          if (videoRef.current && duration > 0) {
            const digit = parseInt(e.key, 10);
            const targetTime = (digit / 10) * duration;
            videoRef.current.currentTime = targetTime;
            setCurrentTime(targetTime);
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (isMvListOpen) {
            setIsMvListOpen(false);
          } else if (isFullscreen) {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          } else {
            onClose();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, volume, duration, isFullscreen, isMvListOpen, onClose, togglePlay, seekDelta, handleSetVolume, toggleMute, toggleFullscreen]);

  // Video Event Handlers
  const handleTimeUpdate = () => {
    if (!isSeeking && videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleProgress = () => {
    const video = videoRef.current;
    if (video && video.buffered.length > 0 && duration > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      setBufferedPercent((bufferedEnd / duration) * 100);
    }
  };

  const handleWaiting = () => setIsBuffering(true);
  const handlePlaying = () => {
    setIsBuffering(false);
    setIsPlaying(true);
    setIsEnded(false);
  };
  const handlePause = () => {
    setIsPlaying(false);
    setShowControls(true);
  };

  // Video Ended Handler: Shows Replay icon and starts 3s auto-play countdown
  const handleEnded = () => {
    setIsPlaying(false);
    setIsEnded(true);
    setShowControls(true);

    // Find the next MV in the playlist
    const currentIdx = mvTracks.findIndex(t => t.id === track.id);
    if (mvTracks.length > 1 && currentIdx !== -1) {
      const nextTrack = mvTracks[(currentIdx + 1) % mvTracks.length];
      setNextMvTrack(nextTrack);
      setCountdown(3);
    }
  };

  // Seekbar Handlers (Drag & Scrub)
  const getSeekTimeFromEvent = (e) => {
    if (!seekbarRef.current || duration <= 0) return 0;
    const rect = seekbarRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pos * duration;
  };

  const handleSeekbarDown = (e) => {
    e.stopPropagation();
    setIsSeeking(true);
    setCountdown(null);
    setIsEnded(false);
    const newTime = getSeekTimeFromEvent(e);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    resetControlsTimer();
  };

  const handleSeekbarMove = (e) => {
    if (!seekbarRef.current || duration <= 0) return;
    const rect = seekbarRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setHoverPercent(pos * 100);
    setHoverTime(pos * duration);

    if (isSeeking && videoRef.current) {
      const newTime = pos * duration;
      setCurrentTime(newTime);
      videoRef.current.currentTime = newTime;
    }
    resetControlsTimer();
  };

  const handleSeekbarUp = () => {
    if (isSeeking) {
      setIsSeeking(false);
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
      }
    }
  };

  // Stage Tap/Click Handling:
  // - Tap on video: Toggles Controls Visibility (Shows or Hides the top bar, center hub, seekbar)
  // - Double tap on left/right: Seeks +/- 10s
  const handleStageClick = (e) => {
    // If clicking on a button, input, or inside drawers/banner, ignore
    if (
      e.target.closest('button') || 
      e.target.closest('input') || 
      e.target.closest('.yt-seekbar-container') ||
      e.target.closest('.yt-mv-drawer') ||
      e.target.closest('.yt-auto-next-banner')
    ) {
      return;
    }

    if (isMvListOpen) {
      setIsMvListOpen(false);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX) || 0;
    const clickXRatio = (clientX - rect.left) / rect.width;
    const now = Date.now();

    // YouTube Double Tap detection (Left half = -10s, Right half = +10s)
    if (now - lastTapRef.current.time < 300) {
      if (clickXRatio < 0.38) {
        seekDelta(-10);
        lastTapRef.current = { time: 0, x: clientX };
        return;
      } else if (clickXRatio > 0.62) {
        seekDelta(10);
        lastTapRef.current = { time: 0, x: clientX };
        return;
      }
    }

    lastTapRef.current = { time: now, x: clientX };

    // Single Click / Tap: Toggle Controls Visibility (Show <-> Hide)
    setShowControls((prev) => {
      const next = !prev;
      if (next) {
        resetControlsTimer();
      } else {
        if (hideControlsTimerRef.current) {
          clearTimeout(hideControlsTimerRef.current);
        }
      }
      return next;
    });
  };

  // Select another MV track
  const handleSwitchMv = (selectedTrack) => {
    setCountdown(null);
    setIsEnded(false);
    if (onSelectTrack) {
      onSelectTrack(selectedTrack);
    }
    setIsMvListOpen(false);
  };

  if (!isOpen || !track || !track.video) return null;

  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className={`yt-mv-modal ${isOpen ? 'open' : ''} ${isFullscreen ? 'is-fullscreen' : ''}`}
      ref={modalRef}
    >
      
      {/* Video Viewport Stage */}
      <div 
        className="yt-stage" 
        onClick={handleStageClick}
      >
        <video
          ref={videoRef}
          className="yt-video-element"
          playsInline
          webkit-playsinline="true"
          x5-playsinline="true"
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onProgress={handleProgress}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onPause={handlePause}
          onEnded={handleEnded}
        />

        {/* Buffering Spinner */}
        {isBuffering && (
          <div className="yt-buffering-spinner">
            <Loader2 size={48} className="yt-spin-icon" />
          </div>
        )}

        {/* YouTube Double-Tap Seek Ripples */}
        {seekRipple && (
          <div className={`yt-double-tap-ripple ${seekRipple.side}`}>
            <div className="yt-ripple-circle">
              {seekRipple.side === 'left' ? (
                <Rewind10Icon size={40} />
              ) : (
                <Forward10Icon size={40} />
              )}
              <span className="yt-ripple-text">{seekRipple.amount}s</span>
            </div>
          </div>
        )}

        {/* YouTube Play/Pause/Replay Flash Animation */}
        {playFlash && (
          <div className="yt-play-flash">
            {playFlash === 'play' ? (
              <Play size={44} fill="#fff" />
            ) : (
              <Pause size={44} fill="#fff" />
            )}
          </div>
        )}
      </div>

      {/* YouTube Controls Layer (Overlay with Smooth Fade) */}
      <div className={`yt-controls-layer ${showControls || isMvListOpen || isEnded ? 'visible' : 'hidden'}`}>
        
        {/* Top Header Bar */}
        <header className="yt-top-bar" onClick={(e) => e.stopPropagation()}>
          <div className="yt-title-group">
            <span className="yt-badge">
              <Film size={12} style={{ marginRight: 4 }} />
              OFFICIAL MV
            </span>
            <div className="yt-meta-text">
              <h2 className="yt-song-title">{track.title}</h2>
              <span className="yt-artist-sub">• {track.artist}</span>
            </div>
          </div>

          {/* Right Header Actions: MV Playlist List button + Close button */}
          <div className="yt-header-actions">
            <button 
              className={`yt-icon-btn yt-list-btn ${isMvListOpen ? 'active' : ''}`}
              onClick={() => setIsMvListOpen(prev => !prev)}
              title="Danh sách tất cả MV trong Album"
            >
              <ListVideo size={20} />
              <span className="yt-mv-badge-count">{mvTracks.length}</span>
            </button>

            <button 
              className="yt-icon-btn yt-close-btn" 
              onClick={onClose}
              title="Đóng (Esc)"
            >
              <X size={22} />
            </button>
          </div>
        </header>

        {/* Auto Next 3s Banner (Shown when video finishes) */}
        {isEnded && countdown !== null && nextMvTrack && (
          <div className="yt-auto-next-banner" onClick={(e) => e.stopPropagation()}>
            <div className="yt-next-info">
              <span className="yt-next-chip">TỰ ĐỘNG CHUYỂN MV</span>
              <span className="yt-next-countdown-num">sau {countdown}s</span>
              <h4 className="yt-next-title">{nextMvTrack.title} • {nextMvTrack.artist}</h4>
            </div>
            <div className="yt-next-buttons">
              <button 
                className="yt-next-cancel-btn"
                onClick={() => setCountdown(null)}
                title="Hủy tự động chuyển"
              >
                HỦY
              </button>
              <button 
                className="yt-next-play-btn"
                onClick={() => handleSwitchMv(nextMvTrack)}
                title="Xem ngay bài tiếp theo"
              >
                <SkipForward size={14} />
                <span>PHÁT NGAY</span>
              </button>
            </div>
          </div>
        )}

        {/* YouTube Center Hub (Big Play/Replay & Seek 10s Buttons) */}
        <div className="yt-center-hub" onClick={(e) => e.stopPropagation()}>
          <button 
            className="yt-hub-btn"
            onClick={() => seekDelta(-10)}
            title="Lùi 10 giây (J)"
          >
            <Rewind10Icon size={30} />
          </button>

          {/* Center Main Button: Replay icon when ended, Pause when playing, Play when paused */}
          <button 
            className="yt-hub-main-play"
            onClick={isEnded ? handleReplay : togglePlay}
            title={isEnded ? "Phát lại (Replay)" : isPlaying ? "Tạm dừng (K)" : "Phát (K)"}
          >
            {isEnded ? (
              <RotateCcw size={32} />
            ) : isPlaying ? (
              <Pause size={36} fill="#fff" />
            ) : (
              <Play size={36} fill="#fff" style={{ marginLeft: 3 }} />
            )}
          </button>

          <button 
            className="yt-hub-btn"
            onClick={() => seekDelta(10)}
            title="Tua 10 giây (L)"
          >
            <Forward10Icon size={30} />
          </button>
        </div>

        {/* Bottom YouTube Controls Bar */}
        <footer 
          className="yt-bottom-bar"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* YouTube Scrubbable Progress Bar */}
          <div 
            className="yt-seekbar-container"
            ref={seekbarRef}
            onMouseDown={handleSeekbarDown}
            onMouseMove={handleSeekbarMove}
            onMouseUp={handleSeekbarUp}
            onTouchStart={handleSeekbarDown}
            onTouchMove={handleSeekbarMove}
            onTouchEnd={handleSeekbarUp}
          >
            <div className="yt-seekbar-rail">
              <div className="yt-seekbar-buffered" style={{ width: `${bufferedPercent}%` }} />
              <div className="yt-seekbar-played" style={{ width: `${playedPercent}%` }} />
              <div className="yt-seekbar-thumb" style={{ left: `${playedPercent}%` }} />
            </div>

            {hoverTime !== null && (
              <div 
                className="yt-seekbar-tooltip"
                style={{ left: `${hoverPercent}%` }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>

          {/* YouTube Bottom Controls Row */}
          <div className="yt-controls-row">
            
            {/* Left Controls */}
            <div className="yt-ctrls-left">
              <button 
                className="yt-icon-btn yt-play-toggle"
                onClick={isEnded ? handleReplay : togglePlay}
                title={isEnded ? "Phát lại (Replay)" : isPlaying ? "Tạm dừng (k)" : "Phát (k)"}
              >
                {isEnded ? (
                  <RotateCcw size={20} />
                ) : isPlaying ? (
                  <Pause size={22} fill="#fff" />
                ) : (
                  <Play size={22} fill="#fff" style={{ marginLeft: 2 }} />
                )}
              </button>

              <button 
                className="yt-icon-btn"
                onClick={() => seekDelta(-10)}
                title="Lùi 10 giây (j)"
              >
                <Rewind10Icon size={22} />
              </button>

              <button 
                className="yt-icon-btn"
                onClick={() => seekDelta(10)}
                title="Tua 10 giây (l)"
              >
                <Forward10Icon size={22} />
              </button>

              {/* Volume (desktop) */}
              <div className="yt-vol-cluster hide-mobile">
                <button 
                  className="yt-icon-btn"
                  onClick={toggleMute}
                  title={isMuted ? "Bật âm thanh (m)" : "Tắt âm thanh (m)"}
                >
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                
                <input
                  type="range"
                  className="yt-vol-slider"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleSetVolume(parseFloat(e.target.value))}
                />
              </div>

              {/* Time Display */}
              <div className="yt-time-display">
                <span className="yt-time-current">{formatTime(currentTime)}</span>
                <span className="yt-time-separator">/</span>
                <span className="yt-time-total">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="yt-ctrls-right">
              <button 
                className={`yt-icon-btn hide-desktop ${isMvListOpen ? 'active' : ''}`}
                onClick={() => setIsMvListOpen(prev => !prev)}
                title="Danh sách MV"
              >
                <ListVideo size={20} />
              </button>

              <button 
                className="yt-icon-btn"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Thoát toàn màn hình (f)" : "Toàn màn hình (f)"}
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>

          </div>

        </footer>

      </div>

      {/* Slide-In MV Playlist Drawer */}
      <aside className={`yt-mv-drawer ${isMvListOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="yt-mv-drawer-header">
          <div className="yt-drawer-title-row">
            <Film size={16} style={{ color: 'var(--accent-red)' }} />
            <h3 className="yt-drawer-heading">DANH SÁCH MV</h3>
            <span className="yt-drawer-count">{mvTracks.length} VIDEO</span>
          </div>
          <button 
            className="yt-drawer-close-btn"
            onClick={() => setIsMvListOpen(false)}
            title="Đóng danh sách"
          >
            <X size={18} />
          </button>
        </div>

        <div className="yt-mv-drawer-list">
          {mvTracks.map((mvTrack) => {
            const isSelected = mvTrack.id === track.id;
            return (
              <div
                key={mvTrack.id}
                className={`yt-mv-item ${isSelected ? 'active' : ''}`}
                onClick={() => handleSwitchMv(mvTrack)}
              >
                {/* Cover Thumbnail */}
                <div className="yt-mv-thumb-box">
                  <img
                    src={mvTrack.coverUrl || '/assets/cover.jpg'}
                    alt={mvTrack.title}
                    className="yt-mv-thumb-img"
                    onError={(e) => { e.target.src = '/assets/cover.jpg'; }}
                  />
                  {isSelected && (
                    <div className="yt-mv-playing-tag">
                      <span className="yt-live-bar bar-1" />
                      <span className="yt-live-bar bar-2" />
                      <span className="yt-live-bar bar-3" />
                    </div>
                  )}
                  <span className="yt-mv-thumb-track">#{String(mvTrack.trackNumber).padStart(2, '0')}</span>
                </div>

                {/* Track Info */}
                <div className="yt-mv-info">
                  <h4 className="yt-mv-title">{mvTrack.title}</h4>
                  <p className="yt-mv-artist">{mvTrack.artist}</p>
                </div>

                {isSelected && (
                  <div className="yt-mv-check-badge">
                    <Check size={14} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

    </div>
  );
}

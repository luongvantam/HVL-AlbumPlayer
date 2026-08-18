import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Volume2, 
  VolumeX, 
  Maximize2,
  Minimize2
} from 'lucide-react';
import { ScrollingText } from './ScrollingText';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function PlayerBar({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  bufferedPercent,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onSetVolume,
  onToggleMute,
  onToggleShuffle,
  onCycleRepeat
}) {
  const seekbarRef = useRef(null);
  const volumePopoverRef = useRef(null);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPercent, setHoverPercent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMobileVolume, setShowMobileVolume] = useState(false);

  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    function handleClickOutside(e) {
      if (volumePopoverRef.current && !volumePopoverRef.current.contains(e.target)) {
        setShowMobileVolume(false);
      }
    }
    if (showMobileVolume) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMobileVolume]);

  const handleSeekbarClick = (e) => {
    if (!seekbarRef.current || duration <= 0) return;
    const rect = seekbarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(pos * duration);
  };

  const handleSeekbarMouseMove = (e) => {
    if (!seekbarRef.current || duration <= 0) return;
    const rect = seekbarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPercent(pos * 100);
    setHoverTime(pos * duration);
  };

  const handleSeekbarMouseLeave = () => {
    setHoverTime(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <footer className="player-bar">
      <div className="player-bar-left">
        <img src="/assets/cover.jpg" alt="HVL Cover" className="mini-cover" />
        <div className="mini-meta">
          <ScrollingText text={currentTrack?.title || 'Elegie'} className="mini-title" as="span" />
          <span className="mini-artist">{currentTrack?.artist || 'RPT MCK'}</span>
        </div>
      </div>

      <div className="player-bar-center">
        <div className="controls-row">
          <button
            className={`control-btn ${isShuffle ? 'active' : ''}`}
            onClick={onToggleShuffle}
            title="Trộn bài"
          >
            <Shuffle size={17} />
          </button>

          <button
            className="control-btn nav-btn"
            onClick={onPrev}
            title="Bài trước"
          >
            <SkipBack size={21} />
          </button>

          <button
            className="btn-play-circle"
            onClick={onTogglePlay}
            title={isPlaying ? "Tạm dừng" : "Phát"}
          >
            {isPlaying ? <Pause size={19} /> : <Play size={19} style={{ marginLeft: 2 }} />}
          </button>

          <button
            className="control-btn nav-btn"
            onClick={onNext}
            title="Bài kế tiếp"
          >
            <SkipForward size={21} />
          </button>

          <button
            className={`control-btn ${repeatMode !== 'off' ? 'active' : ''}`}
            onClick={onCycleRepeat}
            title="Lặp lại"
          >
            <Repeat size={17} />
            {repeatMode === 'one' && <span className="repeat-badge">1</span>}
          </button>

          <div className="mobile-vol-wrapper" ref={volumePopoverRef}>
            <button
              className={`control-btn mobile-vol-trigger ${showMobileVolume ? 'active' : ''}`}
              onClick={() => setShowMobileVolume(prev => !prev)}
              title="Âm lượng"
            >
              {isMuted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>

            {showMobileVolume && (
              <div className="mobile-volume-popover">
                <input
                  type="range"
                  className="vol-slider mobile-vol-slider"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => onSetVolume(parseFloat(e.target.value))}
                />
              </div>
            )}
          </div>
        </div>

        <div className="progress-bar-row">
          <span className="time-text">{formatTime(currentTime)}</span>
          
          <div
            className="seekbar-track-wrapper"
            ref={seekbarRef}
            onClick={handleSeekbarClick}
            onMouseMove={handleSeekbarMouseMove}
            onMouseLeave={handleSeekbarMouseLeave}
          >
            <div className="seekbar-bg">
              <div className="seekbar-buffered" style={{ width: `${bufferedPercent}%` }} />
              <div className="seekbar-played" style={{ width: `${playedPercent}%` }} />
              <div className="seekbar-thumb" style={{ left: `${playedPercent}%` }} />
            </div>

            {hoverTime !== null && (
              <div 
                className="seekbar-hover-time"
                style={{ left: `${hoverPercent}%` }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>

          <span className="time-text">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-bar-right">
        <div className="volume-box">
          <button className="control-btn" onClick={onToggleMute} title="Âm lượng">
            {isMuted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <input
            type="range"
            className="vol-slider"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => onSetVolume(parseFloat(e.target.value))}
          />
        </div>

        <button className="control-btn" onClick={toggleFullscreen} title="Toàn màn hình">
          {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
      </div>
    </footer>
  );
}

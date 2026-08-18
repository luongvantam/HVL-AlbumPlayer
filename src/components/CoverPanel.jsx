import React from 'react';
import { Film } from 'lucide-react';
import { ScrollingText } from './ScrollingText';

export function CoverPanel({ currentTrack, onOpenMv }) {
  if (!currentTrack) return null;

  return (
    <section className="player-card-section">
      <div className="cover-card n0l4b3l-card">
        
        <div className="media-box">
          <img
            src="/assets/cover.jpg"
            alt="Album Cover HVL - RPT MCK"
            className="cover-img"
          />
        </div>

        <div className="song-meta">
          <div className="track-tag-row">
            <span className="track-number-label">
              TRACK {String(currentTrack.trackNumber).padStart(2, '0')} / 30
            </span>
            {currentTrack.video && (
              <button
                className="video-mode-chip n0l4b3l-btn hide-mobile"
                onClick={onOpenMv}
                title="Xem Video MV chính thức"
              >
                <span className="live-red-dot" />
                <Film size={12} />
                <span>XEM MV</span>
              </button>
            )}
          </div>
          <ScrollingText text={currentTrack.title} className="song-title" as="h1" />
          <p className="song-artist">{currentTrack.artist}</p>
        </div>

        {currentTrack.video && (
          <button
            className="mobile-cover-mv-btn"
            onClick={onOpenMv}
            title="Xem Video MV chính thức"
          >
            <span className="live-red-dot" />
            <Film size={13} />
            <span>XEM MV</span>
          </button>
        )}

      </div>
    </section>
  );
}

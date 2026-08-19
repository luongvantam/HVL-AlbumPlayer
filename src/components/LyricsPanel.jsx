import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Music2 } from 'lucide-react';

export function LyricsPanel({ lyrics, currentTime, onSeek }) {
  const containerRef = useRef(null);
  const isUserInteractingRef = useRef(false);
  const interactTimeoutRef = useRef(null);
  const [clickedIndex, setClickedIndex] = useState(null);

  const hasLines = lyrics && Array.isArray(lyrics.lines) && lyrics.lines.length > 0;

  const activeIndex = useMemo(() => {
    if (!hasLines) return -1;
    const lines = lyrics.lines;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (currentTime >= lines[i].time) {
        return i;
      }
    }
    return 0;
  }, [hasLines, lyrics, currentTime]);

  const currentHighlightIndex = clickedIndex !== null ? clickedIndex : activeIndex;

  useEffect(() => {
    if (clickedIndex !== null && activeIndex === clickedIndex) {
      setClickedIndex(null);
    }
  }, [activeIndex, clickedIndex]);

  const scrollToLine = useCallback((index, behavior = 'smooth') => {
    if (!containerRef.current || index < 0) return;
    const container = containerRef.current;
    const targetEl = container.children[index];
    if (!targetEl) return;

    const containerHeight = container.clientHeight;
    const elTop = targetEl.offsetTop;
    const elHeight = targetEl.clientHeight;
    const targetScroll = elTop - (containerHeight / 2) + (elHeight / 2);

    container.scrollTo({
      top: Math.max(0, targetScroll),
      behavior
    });
  }, []);

  const handleUserScroll = () => {
    isUserInteractingRef.current = true;
    clearTimeout(interactTimeoutRef.current);
    interactTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 3000);
  };

  useEffect(() => {
    if (isUserInteractingRef.current || currentHighlightIndex < 0) return;
    scrollToLine(currentHighlightIndex, 'smooth');
  }, [currentHighlightIndex, scrollToLine]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
      isUserInteractingRef.current = false;
      setClickedIndex(null);
    }
  }, [lyrics]);

  const handleLineClick = (line, idx) => {
    if (!line || typeof line.time !== 'number' || isNaN(line.time)) return;
    setClickedIndex(idx);
    isUserInteractingRef.current = true;
    clearTimeout(interactTimeoutRef.current);
    interactTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 2000);

    scrollToLine(idx, 'smooth');
    if (typeof onSeek === 'function') {
      onSeek(line.time, true);
    }
  };

  if (!hasLines) {
    return (
      <section className="lyrics-section">
        <div className="lyrics-container" ref={containerRef} style={{ justifyContent: 'center' }}>
          <div className="lyrics-placeholder">
            <div className="instrumental-badge">
              <Music2 size={20} style={{ color: 'var(--accent-red)' }} />
              <span className="lyrics-instrumental">BẢN NHẠC KHÔNG LỜI (INSTRUMENTAL)</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="lyrics-section">
      <div 
        className="lyrics-container" 
        ref={containerRef}
        onWheel={handleUserScroll}
        onTouchMove={handleUserScroll}
      >
        {lyrics.lines.map((line, idx) => {
          let stateClass = '';
          if (idx === currentHighlightIndex) stateClass = 'active';
          else if (idx < currentHighlightIndex) stateClass = 'passed';
          
          const isIntro = line.text.startsWith('—') || line.text.includes('INTRO') || line.text.includes('Dạo nhạc');

          return (
            <p
              key={idx}
              className={`lyric-line ${stateClass} ${isIntro ? 'intro-line' : ''}`}
              onClick={() => handleLineClick(line, idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleLineClick(line, idx);
                }
              }}
            >
              {isIntro ? (
                <span className="intro-badge-wrapper">
                  <Music2 size={16} className="intro-music-icon" />
                  <span className="hvl-intro-bars">
                    <span className="bar bar-1" />
                    <span className="bar bar-2" />
                    <span className="bar bar-3" />
                  </span>
                  <span className="intro-label">ĐOẠN DẠO NHẠC</span>
                </span>
              ) : (
                line.text
              )}
            </p>
          );
        })}
      </div>
    </section>
  );
}

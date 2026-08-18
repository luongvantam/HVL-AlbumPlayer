import React, { useRef, useState, useEffect } from 'react';

export function ScrollingText({ text, className = '', as: Tag = 'span' }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const cWidth = containerRef.current.clientWidth;
        const tWidth = textRef.current.scrollWidth;
        if (tWidth > cWidth + 2) {
          setIsOverflowing(true);
          setScrollDistance(tWidth - cWidth);
        } else {
          setIsOverflowing(false);
          setScrollDistance(0);
        }
      }
    };

    const timer = setTimeout(checkOverflow, 60);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [text]);

  const duration = Math.max(6, Math.round((scrollDistance / 22) + 4));

  return (
    <div
      ref={containerRef}
      className={`scrolling-text-container ${isOverflowing ? 'is-overflowing' : ''}`}
      style={{
        '--scroll-dist': `-${scrollDistance + 10}px`,
        '--scroll-dur': `${duration}s`
      }}
      title={text}
    >
      <Tag ref={textRef} className={`scrolling-text-content ${className}`}>
        {text}
      </Tag>
    </div>
  );
}

import React from 'react';
import { ListMusic } from 'lucide-react';

export function Header({ onOpenPlaylist }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <a
          href="https://n0l4b3l.com"
          target="_blank"
          rel="noopener noreferrer"
          className="n0l4b3l-brand header-brand-link"
          title="N0L4B3L Official"
        >
          <span className="brand-sigil">◂</span>
          <span className="brand-title">N0L4B3L</span>
        </a>
      </div>

      <div className="header-center-logo">
        <img
          src="/assets/hvl-logo.svg"
          alt="HVL"
          className="n0l4b3l-header-sigil hvl-header-logo"
          title="Album HVL - RPT MCK"
          onError={(e) => {
            e.target.src = '/assets/n0l4b3l-main-logo.png';
          }}
        />
      </div>

      <div className="header-right">
        <button
          className="tracklist-toggle-btn"
          title="Danh sách bài hát"
          onClick={onOpenPlaylist}
        >
          <ListMusic size={16} />
          <span className="tracklist-btn-text hide-mobile">TRACKLIST</span>
          <span className="tracklist-btn-badge">30</span>
        </button>
      </div>
    </header>
  );
}

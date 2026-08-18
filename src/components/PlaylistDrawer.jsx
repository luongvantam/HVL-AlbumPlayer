import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function PlaylistDrawer({
  isOpen,
  onClose,
  tracks,
  currentTrack,
  onSelectTrack
}) {
  const [search, setSearch] = useState('');

  const filteredTracks = useMemo(() => {
    if (!tracks) return [];
    const q = search.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(t => 
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.filename.toLowerCase().includes(q)
    );
  }, [tracks, search]);

  return (
    <aside className={`playlist-drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-header">
        <div className="drawer-title-box">
          <h3>Album HVL</h3>
          <span className="track-count">{tracks.length} bài hát</span>
        </div>
        <button className="control-btn" onClick={onClose} title="Đóng danh sách">
          <X size={20} />
        </button>
      </div>

      <div className="drawer-search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Tìm tên bài hát hoặc nghệ sĩ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="drawer-list">
        {filteredTracks.map((track) => {
          const isCurrent = currentTrack?.id === track.id;
          return (
            <div
              key={track.id}
              className={`track-item ${isCurrent ? 'playing' : ''}`}
              onClick={() => {
                onSelectTrack(track);
                if (window.innerWidth <= 768) {
                  onClose();
                }
              }}
            >
              <div className="track-num-col">
                {String(track.trackNumber).padStart(2, '0')}
              </div>
              <div className="track-main-col">
                <span className="track-item-title">{track.title}</span>
                <span className="track-item-artist">
                  {track.artist}
                  {track.video && <span className="badge-mv-tag">MV</span>}
                </span>
              </div>
              <div className="track-dur-col">
                {formatTime(track.duration)}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

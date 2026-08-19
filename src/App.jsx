import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { LyricsPanel } from './components/LyricsPanel';
import { CoverPanel } from './components/CoverPanel';
import { PlayerBar } from './components/PlayerBar';
import { PlaylistDrawer } from './components/PlaylistDrawer';
import { MvModal } from './components/MvModal';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useUrlSync } from './hooks/useUrlSync';

export function App() {
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [lyricsData, setLyricsData] = useState({});
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isMvOpen, setIsMvOpen] = useState(false);

  const reloadLyrics = useCallback(async () => {
    try {
      const res = await fetch(`/data/lyrics.json?t=${Date.now()}`);
      const lyrics = await res.json();
      setLyricsData(lyrics || {});
    } catch (err) {
      console.error('Failed to load lyrics:', err);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [albumRes, lyricsRes] = await Promise.all([
          fetch(`/data/album.json?t=${Date.now()}`),
          fetch(`/data/lyrics.json?t=${Date.now()}`)
        ]);
        const album = await albumRes.json();
        const lyrics = await lyricsRes.json();

        const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const processedTracks = (album.tracks || []).map(track => {
          if (track.videoUrl && !track.videoUrl.startsWith('http') && !isLocal) {
            return {
              ...track,
              videoUrl: `https://raw.githubusercontent.com/luongvantam/HVL-AlbumPlayer/main/public${track.videoUrl}`
            };
          }
          return track;
        });

        setTracks(processedTracks);
        setLyricsData(lyrics || {});
      } catch (err) {
        console.error('Failed to load album data:', err);
      }
    }
    loadData();

    window.addEventListener('focus', reloadLyrics);
    return () => window.removeEventListener('focus', reloadLyrics);
  }, [reloadLyrics]);

  useEffect(() => {
    if (currentTrack?.id) {
      reloadLyrics();
    }
  }, [currentTrack?.id, reloadLyrics]);

  useEffect(() => {
    document.body.classList.remove('theme-white', 'theme-track-8', 'theme-red-11');
    if (currentTrack?.id === 8) {
      document.body.classList.add('theme-track-8');
    } else if ([27, 28, 29, 30].includes(currentTrack?.id)) {
      document.body.classList.add('theme-white');
    } else if (currentTrack?.id === 11) {
      document.body.classList.add('theme-red-11');
    }
    return () => {
      document.body.classList.remove('theme-white', 'theme-track-8', 'theme-red-11');
    };
  }, [currentTrack?.id]);

  const coverScaleClass = useMemo(() => {
    if (currentTrack?.id === 9) return 'is-rect is-track-9';
    if (currentTrack?.id === 29) return 'is-square is-square-track29';
    if (currentTrack?.id === 19) return 'is-square is-square-lg';
    if (currentTrack?.isSquare || currentTrack?.id === 15) return 'is-square';
    return 'is-rect';
  }, [currentTrack]);

  const onEndedRef = useRef(null);
  const player = useAudioPlayer(currentTrack, () => onEndedRef.current?.(), isMvOpen);

  const handleSelectTrackFromUrl = useCallback((track, shouldPlay = true) => {
    setCurrentTrack(track);
    if (shouldPlay && !isMvOpen && player) {
      player.play();
    }
  }, [player, isMvOpen]);

  const handleToggleMvFromUrl = useCallback((open) => {
    setIsMvOpen(open);
  }, []);

  const { updateUrl } = useUrlSync(tracks, handleSelectTrackFromUrl, handleToggleMvFromUrl);

  const handleNext = useCallback(() => {
    if (!tracks.length || !currentTrack) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    let nextIndex;

    if (player.isShuffle) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      nextIndex = (currentIndex + 1) % tracks.length;
    }

    const nextTrack = tracks[nextIndex];
    setCurrentTrack(nextTrack);
    updateUrl(nextTrack, false);
    setIsMvOpen(false);
  }, [tracks, currentTrack, player.isShuffle, updateUrl]);

  const handlePrev = useCallback(() => {
    if (!tracks.length || !currentTrack) return;
    if (player.currentTime > 3) {
      player.seek(0);
      return;
    }

    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    const prevTrack = tracks[prevIndex];

    setCurrentTrack(prevTrack);
    updateUrl(prevTrack, false);
    setIsMvOpen(false);
  }, [tracks, currentTrack, player.currentTime, updateUrl]);

  onEndedRef.current = handleNext;

  const handleSelectTrack = useCallback((track) => {
    setCurrentTrack(track);
    setIsMvOpen(false);
    updateUrl(track, false);
  }, [updateUrl]);

  const handleOpenMv = useCallback(() => {
    if (currentTrack?.video) {
      player.pause();
      setIsMvOpen(true);
      updateUrl(currentTrack, true);
    }
  }, [currentTrack, player, updateUrl]);

  const handleCloseMv = useCallback(() => {
    setIsMvOpen(false);
    if (currentTrack) {
      updateUrl(currentTrack, false);
    }
  }, [currentTrack, updateUrl]);

  const currentLyrics = useMemo(() => {
    if (!currentTrack) return null;
    const trackIdStr = String(currentTrack.id);
    return lyricsData[trackIdStr] || null;
  }, [currentTrack, lyricsData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          player.togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          player.seek(Math.min(player.duration, player.currentTime + 5));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          player.seek(Math.max(0, player.currentTime - 5));
          break;
        case 'ArrowUp':
          e.preventDefault();
          player.setVolume(player.volume + 0.05);
          break;
        case 'ArrowDown':
          e.preventDefault();
          player.setVolume(player.volume - 0.05);
          break;
        case 'KeyM':
          player.toggleMute();
          break;
        case 'KeyL':
          setIsPlaylistOpen(prev => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player]);

  return (
    <div className="app-container">
      <div
        className={`bg-cover ${coverScaleClass}`}
        style={{ backgroundImage: `url(${currentTrack?.coverUrl || '/assets/cover.jpg'})` }}
      />
      <div className="bg-overlay" />

      <Header onOpenPlaylist={() => setIsPlaylistOpen(true)} />

      <main className="main-layout">
        <LyricsPanel
          lyrics={currentLyrics}
          currentTime={player.currentTime}
          onSeek={player.seek}
        />

        <CoverPanel
          currentTrack={currentTrack}
          onOpenMv={handleOpenMv}
        />
      </main>

      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        bufferedPercent={player.bufferedPercent}
        volume={player.volume}
        isMuted={player.isMuted}
        isShuffle={player.isShuffle}
        repeatMode={player.repeatMode}
        onTogglePlay={player.togglePlay}
        onPrev={handlePrev}
        onNext={handleNext}
        onSeek={player.seek}
        onSetVolume={player.setVolume}
        onToggleMute={player.toggleMute}
        onToggleShuffle={player.toggleShuffle}
        onCycleRepeat={player.cycleRepeat}
      />

      <PlaylistDrawer
        isOpen={isPlaylistOpen}
        onClose={() => setIsPlaylistOpen(false)}
        tracks={tracks}
        currentTrack={currentTrack}
        onSelectTrack={handleSelectTrack}
      />

      <MvModal
        isOpen={isMvOpen}
        track={currentTrack}
        tracks={tracks}
        onSelectTrack={(newTrack) => {
          setCurrentTrack(newTrack);
          updateUrl(newTrack, true);
        }}
        onClose={handleCloseMv}
      />

      <audio ref={player.audioRef} preload="auto" />
    </div>
  );
}

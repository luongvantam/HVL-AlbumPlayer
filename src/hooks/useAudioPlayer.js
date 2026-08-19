import { useState, useEffect, useRef, useCallback } from 'react';

export function useAudioPlayer(currentTrack, onEnded, isMvOpen = false) {
  const audioRef = useRef(null);
  const isInitialMount = useRef(true);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolumeState] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('all');

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    const audio = audioRef.current;

    audio.src = currentTrack.audioUrl;
    audio.load();
    setCurrentTime(0);
    setDuration(currentTrack.duration || 0);

    if (isMvOpen) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    if (!isInitialMount.current) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Playback blocked by browser policy:', err);
            setIsPlaying(false);
          });
      }
    } else {
      isInitialMount.current = false;
    }
  }, [currentTrack, isMvOpen]);

  useEffect(() => {
    if (isMvOpen && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isMvOpen]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || currentTrack?.duration || 0);
    };

    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        const dur = audio.duration || 1;
        setBufferedPercent((bufferedEnd / dur) * 100);
      }
    };

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        if (!isMvOpen) {
          audio.play().then(() => setIsPlaying(true)).catch(console.warn);
        }
      } else {
        if (onEnded) onEnded();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack, repeatMode, onEnded, isMvOpen]);

  const play = useCallback(async () => {
    if (!audioRef.current || isMvOpen) return;
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn('Playback blocked / error:', err);
      setIsPlaying(false);
    }
  }, [isMvOpen]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const seek = useCallback((time, autoPlay = true) => {
    if (!audioRef.current) return;
    const safeTime = Math.max(0, Math.min(audioRef.current.duration || 9999, Number(time)));
    audioRef.current.currentTime = safeTime;
    setCurrentTime(safeTime);

    if (autoPlay && !isMvOpen) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Playback blocked / error on seek:', err);
          });
      }
    }
  }, [isMvOpen]);

  const setVolume = useCallback((val) => {
    if (!audioRef.current) return;
    const clamped = Math.max(0, Math.min(1, val));
    audioRef.current.volume = isMuted ? 0 : clamped;
    setVolumeState(clamped);
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    setIsMuted((prev) => {
      const next = !prev;
      audioRef.current.volume = next ? 0 : volume;
      return next;
    });
  }, [volume]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle(prev => !prev);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    bufferedPercent,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat
  };
}

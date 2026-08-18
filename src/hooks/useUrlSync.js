import { useState, useEffect, useCallback } from 'react';
import { slugify, findTrackByQuery } from '../utils/slugify';

export function useUrlSync(tracks, onSelectTrack, onToggleMv) {
  const [initialLoaded, setInitialLoaded] = useState(false);

  const syncFromUrl = useCallback(() => {
    if (!tracks || !tracks.length) return;
    const params = new URLSearchParams(window.location.search);
    const nameQuery = params.get('name');
    const isMv = params.get('mv') === '1';

    if (nameQuery) {
      const matched = findTrackByQuery(nameQuery, tracks);
      if (matched) {
        onSelectTrack(matched, false);
        if (isMv && matched.video) {
          onToggleMv(true);
        } else {
          onToggleMv(false);
        }
      }
    } else {
      if (!initialLoaded) {
        onSelectTrack(tracks[0], false);
      }
    }
  }, [tracks, initialLoaded, onSelectTrack, onToggleMv]);

  useEffect(() => {
    if (tracks && tracks.length && !initialLoaded) {
      syncFromUrl();
      setInitialLoaded(true);
    }

    const handlePopState = () => {
      syncFromUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tracks, initialLoaded, syncFromUrl]);

  const updateUrl = useCallback((track, isMv = false) => {
    if (!track) return;
    const slug = slugify(track.title);
    const params = new URLSearchParams();
    params.set('name', slug);
    if (isMv && track.video) {
      params.set('mv', '1');
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ trackId: track.id, isMv }, '', newUrl);

    document.title = isMv 
      ? `${track.title} (Official MV) - RPT MCK | HVL`
      : `${track.title} - RPT MCK | HVL`;
  }, []);

  return { updateUrl };
}

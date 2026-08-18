export function slugify(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findTrackByQuery(query, tracks) {
  if (!query || !tracks || !tracks.length) return null;
  const q = slugify(query);
  
  let match = tracks.find(t => slugify(t.title) === q || slugify(t.filename) === q);
  if (match) return match;

  match = tracks.find(t => slugify(t.title).includes(q) || q.includes(slugify(t.title)));
  if (match) return match;

  const num = parseInt(query, 10);
  if (!isNaN(num) && num >= 1 && num <= tracks.length) {
    return tracks.find(t => t.trackNumber === num) || tracks[num - 1];
  }

  return null;
}

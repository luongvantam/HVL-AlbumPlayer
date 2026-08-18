import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const PUBLIC_DIR = path.join(__dirname, 'public');
const MUSIC_DIR = path.join(PUBLIC_DIR, 'music');
const ARTWORK_DIR = path.join(PUBLIC_DIR, 'artwork');
const MV_DIR = path.join(PUBLIC_DIR, 'mv');
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.flac': 'audio/flac',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon'
};

function streamMediaFile(filePath, req, res, contentType) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File Not Found');
      return;
    }

    const fileSize = stats.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.writeHead(416, {
          'Content-Range': `bytes */${fileSize}`,
          'Access-Control-Allow-Origin': '*'
        });
        res.end();
        return;
      }

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Music stream (/music/ or /stream/audio/)
  if (pathname.startsWith('/music/') || pathname.startsWith('/stream/audio/')) {
    const filename = pathname.replace('/music/', '').replace('/stream/audio/', '');
    const safePath = path.normalize(path.join(MUSIC_DIR, filename));
    if (!safePath.startsWith(MUSIC_DIR)) {
      res.writeHead(403);
      res.end('Access Denied');
      return;
    }
    const ext = path.extname(safePath).toLowerCase();
    const contentType = ext === '.mp3' ? 'audio/mpeg' : ext === '.flac' ? 'audio/flac' : 'audio/mpeg';
    return streamMediaFile(safePath, req, res, contentType);
  }

  // MV video stream (/mv/ or /stream/video/)
  if (pathname.startsWith('/mv/') || pathname.startsWith('/stream/video/')) {
    const filename = pathname.replace('/mv/', '').replace('/stream/video/', '');
    const safePath = path.normalize(path.join(MV_DIR, filename));
    if (!safePath.startsWith(MV_DIR)) {
      res.writeHead(403);
      res.end('Access Denied');
      return;
    }
    return streamMediaFile(safePath, req, res, 'video/mp4');
  }

  // Artwork stream (/artwork/ or /stream/image/)
  if (pathname.startsWith('/artwork/') || pathname.startsWith('/stream/image/')) {
    const filename = pathname.replace('/artwork/', '').replace('/stream/image/', '');
    const safePath = path.normalize(path.join(ARTWORK_DIR, filename));
    if (!safePath.startsWith(ARTWORK_DIR)) {
      res.writeHead(403);
      res.end('Access Denied');
      return;
    }
    const ext = path.extname(safePath).toLowerCase();
    const contentType = ext === '.webp' ? 'image/webp' : 'image/jpeg';
    return streamMediaFile(safePath, req, res, contentType);
  }

  // Branding & General Assets (/assets/)
  if (pathname.startsWith('/assets/')) {
    const filename = pathname.replace('/assets/', '');
    const safePath = path.normalize(path.join(ASSETS_DIR, filename));
    if (fs.existsSync(safePath)) {
      const ext = path.extname(safePath).toLowerCase();
      const contentType = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : 'image/jpeg';
      return streamMediaFile(safePath, req, res, contentType);
    }
  }

  // API endpoint for album metadata
  if (pathname === '/api/album') {
    const jsonPath = path.join(PUBLIC_DIR, 'data', 'album.json');
    fs.readFile(jsonPath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to load album data' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // Lyrics API / JSON
  if (pathname === '/data/lyrics.json') {
    const jsonPath = path.join(PUBLIC_DIR, 'data', 'lyrics.json');
    if (fs.existsSync(jsonPath)) {
      return streamMediaFile(jsonPath, req, res, 'application/json; charset=utf-8');
    }
  }

  // Fallback for root /cover.jpg
  if (pathname === '/cover.jpg') {
    const coverPath = path.join(ASSETS_DIR, 'cover.jpg');
    if (fs.existsSync(coverPath)) {
      return streamMediaFile(coverPath, req, res, 'image/jpeg');
    }
  }

  const rootDir = fs.existsSync(DIST_DIR) ? DIST_DIR : PUBLIC_DIR;
  let filePath = path.join(rootDir, pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const indexHtml = path.join(rootDir, 'index.html');
      fs.readFile(indexHtml, 'utf8', (err2, htmlData) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(htmlData);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`⚡ HVL React Player server running at http://localhost:${PORT}`);
});

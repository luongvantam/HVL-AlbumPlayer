import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import url from 'url';

function mediaStreamPlugin() {
  const publicDir = path.resolve(__dirname, 'public');
  const musicDir = path.resolve(publicDir, 'music');
  const artworkDir = path.resolve(publicDir, 'artwork');
  const mvDir = path.resolve(publicDir, 'mv');
  const assetsDir = path.resolve(publicDir, 'assets');

  function streamFile(filePath, req, res, contentType) {
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.statusCode = 404;
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
          res.statusCode = 416;
          res.setHeader('Content-Range', `bytes */${fileSize}`);
          res.end();
          return;
        }

        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        res.statusCode = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunksize);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        file.pipe(res);
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Length', fileSize);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        fs.createReadStream(filePath).pipe(res);
      }
    });
  }

  return {
    name: 'media-stream-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const parsed = url.parse(req.url);
        const pathname = decodeURIComponent(parsed.pathname || '');

        if (pathname.startsWith('/music/') || pathname.startsWith('/stream/audio/')) {
          const filename = pathname.replace('/music/', '').replace('/stream/audio/', '');
          const safePath = path.normalize(path.join(musicDir, filename));
          if (!safePath.startsWith(musicDir)) {
            res.statusCode = 403;
            res.end('Forbidden');
            return;
          }
          const ext = path.extname(safePath).toLowerCase();
          const contentType = ext === '.mp3' ? 'audio/mpeg' : ext === '.flac' ? 'audio/flac' : 'audio/mpeg';
          return streamFile(safePath, req, res, contentType);
        }

        if (pathname.startsWith('/mv/') || pathname.startsWith('/stream/video/')) {
          const filename = pathname.replace('/mv/', '').replace('/stream/video/', '');
          const safePath = path.normalize(path.join(mvDir, filename));
          if (!safePath.startsWith(mvDir)) {
            res.statusCode = 403;
            res.end('Forbidden');
            return;
          }
          return streamFile(safePath, req, res, 'video/mp4');
        }

        if (pathname.startsWith('/artwork/') || pathname.startsWith('/stream/image/')) {
          const filename = pathname.replace('/artwork/', '').replace('/stream/image/', '');
          const safePath = path.normalize(path.join(artworkDir, filename));
          if (!safePath.startsWith(artworkDir)) {
            res.statusCode = 403;
            res.end('Forbidden');
            return;
          }
          const ext = path.extname(safePath).toLowerCase();
          const contentType = ext === '.webp' ? 'image/webp' : 'image/jpeg';
          return streamFile(safePath, req, res, contentType);
        }

        if (pathname.startsWith('/assets/')) {
          const filename = pathname.replace('/assets/', '');
          const safePath = path.normalize(path.join(assetsDir, filename));
          if (fs.existsSync(safePath)) {
            const ext = path.extname(safePath).toLowerCase();
            const contentType = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : 'image/jpeg';
            return streamFile(safePath, req, res, contentType);
          }
        }

        if (pathname === '/api/album') {
          const jsonPath = path.join(publicDir, 'data', 'album.json');
          fs.readFile(jsonPath, 'utf8', (err, data) => {
            if (err) {
              res.statusCode = 500;
              res.end('{"error": "Failed to read album"}');
              return;
            }
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data);
          });
          return;
        }

        if (pathname === '/cover.jpg') {
          const coverPath = path.join(assetsDir, 'cover.jpg');
          if (fs.existsSync(coverPath)) {
            return streamFile(coverPath, req, res, 'image/jpeg');
          }
        }

        next();
      });
    }
  };
}

function excludeLargeAssetsPlugin() {
  return {
    name: 'exclude-large-assets',
    closeBundle() {
      const distMv = path.resolve(__dirname, 'dist', 'mv');
      if (fs.existsSync(distMv)) {
        fs.rmSync(distMv, { recursive: true, force: true });
        console.log('✓ Cleaned dist/mv (>25MB assets) for Cloudflare Pages 25MB limit compatibility');
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), mediaStreamPlugin(), excludeLargeAssetsPlugin()],
  server: {
    port: 3000,
    host: true
  }
});

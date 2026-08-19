// Cloudflare Pages Edge Function: Handle Byte-Range Streaming (HTTP 206) for MV Video Files
export async function onRequest(context) {
  const { request, next } = context;
  const range = request.headers.get('Range') || request.headers.get('range');

  const response = await next();

  if (!range || response.status !== 200) {
    const headers = new Headers(response.headers);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
    return new Response(response.body, {
      status: response.status,
      headers
    });
  }

  const arrayBuffer = await response.arrayBuffer();
  const totalSize = arrayBuffer.byteLength;

  const parts = range.replace(/bytes=/, '').trim().split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

  if (isNaN(start) || start >= totalSize || (parts[1] && end >= totalSize) || start > end) {
    return new Response(null, {
      status: 416,
      headers: {
        'Content-Range': `bytes */${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const chunk = arrayBuffer.slice(start, end + 1);
  const headers = new Headers(response.headers);
  headers.set('Content-Range', `bytes ${start}-${end}/${totalSize}`);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Length', String(chunk.byteLength));
  headers.set('Content-Type', response.headers.get('Content-Type') || 'video/mp4');
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(chunk, {
    status: 206,
    headers
  });
}

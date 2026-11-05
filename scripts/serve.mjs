import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const dist = path.join(ROOT, 'dist');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.txt': 'text/plain' };
const base = (process.env.BASE_PATH || '').replace(/\/+$/, '');

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (base && p.startsWith(base)) p = p.slice(base.length) || '/';
  let file = path.join(dist, path.normalize(p));
  if (!file.startsWith(dist)) { res.writeHead(403).end('Forbidden'); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'content-type': types['.html'] });
    res.end(fs.existsSync(path.join(dist, '404.html')) ? fs.readFileSync(path.join(dist, '404.html')) : 'Not found');
    return;
  }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

let port = Number(process.env.PORT) || 4321;
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') { port++; server.listen(port); } else throw e;
});
server.on('listening', () => console.log(`Serving dist/ at http://localhost:${port}${base}/`));
server.listen(port);

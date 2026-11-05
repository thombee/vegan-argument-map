import fs from 'node:fs';
import path from 'node:path';
import { loadNodes, ROOT } from './lib.mjs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const cites = new Map();
for (const n of loadNodes()) for (const s of n.data.sources || []) {
  if (!s?.url) continue;
  if (!cites.has(s.url)) cites.set(s.url, []);
  cites.get(s.url).push(n.data.id || n.filename);
}
const urls = [...cites.keys()];

async function attempt(url, method) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(url, { method, redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': UA, accept: 'text/html,application/pdf,*/*' } });
    if (method === 'GET') r.body?.cancel().catch(() => {});
    return { status: r.status };
  } catch (e) {
    return { error: e.name === 'AbortError' ? 'timeout (15s)' : (e.cause?.code || e.message) };
  } finally { clearTimeout(t); }
}
async function check(url) {
  let r = await attempt(url, 'HEAD');
  if (r.error || r.status >= 400) r = await attempt(url, 'GET');
  return r;
}

const failures = [];
let i = 0, done = 0;
async function worker() {
  while (i < urls.length) {
    const url = urls[i++];
    const r = await check(url);
    if (r.error || r.status >= 400) failures.push({ url, ...r });
    done++;
    process.stdout.write(`\r${done}/${urls.length}`);
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
console.log();

let md = `# Link check report\n\nChecked ${urls.length} unique source URLs on ${new Date().toISOString()}.\n\n`;
if (!failures.length) md += 'All URLs responded successfully.\n';
else {
  md += `${failures.length} failure(s). Some publishers block automated requests (403/429), so confirm in a browser.\n\n`;
  for (const f of failures.sort((a, b) => a.url.localeCompare(b.url))) {
    md += `## ${f.url}\n\n- Result: ${f.error ? f.error : 'HTTP ' + f.status}\n- Cited by: ${cites.get(f.url).map((id) => '`' + id + '`').join(', ')}\n\n`;
  }
}
fs.writeFileSync(path.join(ROOT, 'linkcheck-report.md'), md);
console.log(`${failures.length} failure(s); wrote linkcheck-report.md`);

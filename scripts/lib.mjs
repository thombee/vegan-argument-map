import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CONTENT_DIR = path.resolve(ROOT, process.env.CONTENT_DIR || 'content/nodes');
export const SECTIONS = ['The objection at full strength', 'Response', 'In short'];

// Parse ALLOCATION.md: categories (## id: Name) and their listed root ids.
export function loadAllocation() {
  const text = fs.readFileSync(path.join(ROOT, 'ALLOCATION.md'), 'utf8');
  const categories = [];
  let cur = null;
  for (const line of text.split('\n')) {
    const h = line.match(/^##\s+([a-z0-9-]+):\s*(.+?)\s*$/);
    if (h) { cur = { id: h[1], name: h[2], ids: [] }; categories.push(cur); continue; }
    const b = line.match(/^-\s+`([a-z0-9-]+)`/);
    if (b && cur) cur.ids.push(b[1]);
  }
  return categories;
}

// Split a body into { heading: text } by "## " headings.
export function splitSections(body) {
  const out = {};
  let cur = null;
  for (const line of body.split('\n')) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) { cur = h[1]; out[cur] = ''; continue; }
    if (cur) out[cur] += line + '\n';
  }
  for (const k of Object.keys(out)) out[k] = out[k].trim();
  return out;
}

export function loadNodes(dir = CONTENT_DIR) {
  const nodes = [];
  if (!fs.existsSync(dir)) return nodes;
  for (const cat of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!cat.isDirectory()) continue;
    for (const f of fs.readdirSync(path.join(dir, cat.name)).sort()) {
      if (!f.endsWith('.md')) continue;
      const file = path.join(dir, cat.name, f);
      const parsed = matter(fs.readFileSync(file, 'utf8'));
      nodes.push({
        file: path.relative(ROOT, file),
        folder: cat.name,
        filename: f.replace(/\.md$/, ''),
        data: parsed.data || {},
        body: parsed.content,
        sections: splitSections(parsed.content),
      });
    }
  }
  return nodes;
}

export function linkedIds(body) {
  const ids = new Set();
  for (const m of body.matchAll(/\]\(\s*\/a\/([^/)\s#]+)\/?[^)]*\)/g)) ids.add(m[1]);
  return [...ids];
}

export const isKebab = (s) => typeof s === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);

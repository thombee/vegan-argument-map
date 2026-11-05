import { loadNodes, loadAllocation, linkedIds, isKebab, SECTIONS, CONTENT_DIR } from './lib.mjs';

const errors = [], warnings = [];
const err = (n, m) => errors.push(`${n.file}: ${m}`);
const warn = (n, m) => warnings.push(`${n.file}: ${m}`);

const alloc = loadAllocation();
const catIds = new Set(alloc.map((c) => c.id));
const allocIds = new Set(alloc.flatMap((c) => c.ids));
const nodes = loadNodes();
const byId = new Map();

for (const n of nodes) {
  const d = n.data;
  for (const f of ['id', 'title', 'category', 'parent', 'summary', 'tags', 'sources', 'reviewed']) {
    if (!(f in d) || d[f] === undefined) err(n, `missing frontmatter field "${f}"`);
  }
  if ('id' in d) {
    if (!isKebab(d.id)) err(n, `id "${d.id}" is not kebab-case`);
    else if (d.id !== n.filename) err(n, `id "${d.id}" does not match filename "${n.filename}"`);
    if (byId.has(d.id)) err(n, `duplicate id "${d.id}" (also ${byId.get(d.id).file})`);
    else byId.set(d.id, n);
  }
  if (typeof d.title !== 'string' || !d.title.trim()) err(n, 'title must be a non-empty string');
  if ('category' in d) {
    if (!catIds.has(d.category)) err(n, `category "${d.category}" is not one of: ${[...catIds].join(', ')}`);
    if (d.category !== n.folder) err(n, `category "${d.category}" does not match folder "${n.folder}"`);
  }
  if (typeof d.summary !== 'string' || !d.summary.trim()) err(n, 'summary must be a non-empty string');
  else if (d.summary.length > 220) err(n, `summary is ${d.summary.length} chars (max 220)`);
  if ('tags' in d && !(Array.isArray(d.tags) && d.tags.every((t) => typeof t === 'string'))) err(n, 'tags must be a list of strings');
  if ('reviewed' in d && typeof d.reviewed !== 'boolean') err(n, 'reviewed must be true or false');
  if ('parent' in d && d.parent !== null && !isKebab(d.parent)) err(n, 'parent must be null or a kebab-case id');
  if ('sources' in d) {
    if (!Array.isArray(d.sources)) err(n, 'sources must be a list');
    else d.sources.forEach((s, i) => {
      if (!s || typeof s !== 'object') return err(n, `sources[${i}] is not an object`);
      if (typeof s.title !== 'string' || !s.title.trim()) err(n, `sources[${i}] missing title`);
      if (typeof s.url !== 'string' || !/^https?:\/\/\S+$/.test(s.url)) err(n, `sources[${i}] url must be http(s)`);
      if (typeof s.supports !== 'string' || !s.supports.trim()) err(n, `sources[${i}] missing supports`);
    });
  }
  for (const s of SECTIONS) if (!n.sections[s]) err(n, `missing or empty body section "## ${s}"`);
}

// Parents and cycles
for (const n of nodes) {
  const p = n.data.parent;
  if (p && !byId.has(p)) err(n, `parent "${p}" does not exist`);
}
const depth = new Map();
function depthOf(id, seen = []) {
  if (depth.has(id)) return depth.get(id);
  if (seen.includes(id)) return null; // cycle
  const n = byId.get(id);
  if (!n) return 0;
  const p = n.data.parent;
  if (!p) { depth.set(id, 1); return 1; }
  const pd = depthOf(p, [...seen, id]);
  if (pd === null) return null;
  depth.set(id, pd + 1);
  return pd + 1;
}
for (const n of nodes) {
  if (n.data.id && depthOf(n.data.id) === null) err(n, 'parent chain contains a cycle');
}

// Links
for (const n of nodes) {
  for (const id of linkedIds(n.body)) {
    if (byId.has(id)) continue;
    if (allocIds.has(id)) warn(n, `link to /a/${id}/ not written yet (listed in ALLOCATION.md)`);
    else err(n, `link to /a/${id}/ does not resolve`);
  }
}

// Totals
const roots = nodes.filter((n) => !n.data.parent);
const maxDepth = Math.max(0, ...[...depth.values()]);
const unreviewed = nodes.filter((n) => n.data.reviewed !== true).length;
console.log(`Content dir: ${CONTENT_DIR}`);
for (const w of warnings) console.log(`warning: ${w}`);
for (const e of errors) console.log(`error: ${e}`);
console.log(`\nNodes: ${nodes.length}  Roots: ${roots.length}  Max depth: ${maxDepth}  Unreviewed: ${unreviewed}`);
for (const c of alloc) console.log(`  ${c.id}: ${nodes.filter((n) => n.folder === c.id).length}`);
console.log(`${warnings.length} warning(s), ${errors.length} error(s)`);
process.exit(errors.length ? 1 : 0);

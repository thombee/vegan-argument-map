import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import { loadExplainers, loadNodes, loadAllocation, ROOT, CONTENT_DIR } from './lib.mjs';

const SITE = 'Every Objection';
let BASE = (process.env.BASE_PATH || '').trim().replace(/\/+$/, '');
if (BASE && !BASE.startsWith('/')) BASE = '/' + BASE;
const OUT = path.join(ROOT, 'dist');

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const url = (p) => BASE + p;

function md(text) {
  const html = marked.parse(text || '', { gfm: true });
  return html
    .replace(/href="\/(?!\/)/g, `href="${BASE}/`)
    .replace(/<a href="(https?:)/g, '<a rel="noopener" href="$1');
}

function write(rel, content) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
}

function layout({ title, description, body, path: p = '/' }) {
  const full = title === SITE ? SITE : `${title} | ${SITE}`;
  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description || '')}">
<meta name="color-scheme" content="light dark">
<link rel="stylesheet" href="${url('/style.css')}">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="${url('/')}">${SITE}</a>
    <nav aria-label="Site"><a href="${url('/')}">Home</a> <a href="${url('/why/')}">Why we don't see it</a> <a href="${url('/about/')}">About</a></nav>
  </div>
</header>
<main id="main" class="wrap">
${body}
</main>
<footer class="site-footer">
  <div class="wrap"><p>An independent project. Every claim is sourced; <a href="${url('/about/')}">read how it works</a>.</p></div>
</footer>
</body>
</html>
`;
}

const nodes = loadNodes().filter((n) => n.data.id);
const categories = loadAllocation();
const byId = new Map(nodes.map((n) => [n.data.id, n]));
const children = new Map();
for (const n of nodes) {
  const p = n.data.parent;
  if (p) { if (!children.has(p)) children.set(p, []); children.get(p).push(n); }
}
for (const list of children.values()) list.sort((a, b) => a.data.title.localeCompare(b.data.title));
const explainers = loadExplainers().filter((e) => e.data.id);
const catName = new Map(categories.map((c) => [c.id, c.name]));

function pathTo(n) {
  const chain = [];
  const seen = new Set();
  let cur = n;
  while (cur && !seen.has(cur.data.id)) { seen.add(cur.data.id); chain.unshift(cur); cur = byId.get(cur.data.parent); }
  return chain;
}

function draftBadge(n) {
  return n.data.reviewed === true ? '' : ' <span class="badge" title="This page has not yet been reviewed by a person">Draft &ndash; unreviewed</span>';
}

function nodeList(list) {
  if (!list.length) return '<p class="muted">None yet.</p>';
  return `<ul class="cards">\n${list.map((n) => `  <li><a class="card" href="${url(`/a/${n.data.id}/`)}"><span class="card-title">${esc(n.data.title)}${draftBadge(n)}</span><span class="card-sum">${esc(n.data.summary)}</span></a></li>`).join('\n')}\n</ul>`;
}

function rootsOf(catId) {
  return nodes.filter((n) => n.data.category === catId && !n.data.parent).sort((a, b) => a.data.title.localeCompare(b.data.title));
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
write('style.css', fs.readFileSync(path.join(ROOT, 'src/style.css'), 'utf8'));
write('search.js', fs.readFileSync(path.join(ROOT, 'src/search.js'), 'utf8'));
write('copy.js', fs.readFileSync(path.join(ROOT, 'src/copy.js'), 'utf8'));
write('.nojekyll', '');

// Search index
const index = nodes.map((n) => ({
  id: n.data.id,
  title: n.data.title,
  summary: n.data.summary,
  tags: n.data.tags || [],
  category: catName.get(n.data.category) || n.data.category,
  root: !n.data.parent,
  url: url(`/a/${n.data.id}/`),
}));
for (const e of explainers) index.push({
  id: e.data.id,
  title: e.data.title,
  summary: e.data.summary,
  tags: [],
  category: 'Explainer',
  kind: 'explainer',
  root: false,
  url: url(`/why/${e.data.id}/`),
});
write('search.json', JSON.stringify(index));

// Home
const usedCats = categories.filter((c) => nodes.some((n) => n.data.category === c.id));
const catSections = usedCats.map((c) => `<section class="category" aria-labelledby="cat-${c.id}">
  <h2 id="cat-${c.id}"><a href="${url(`/c/${c.id}/`)}">${esc(c.name)}</a></h2>
  ${nodeList(rootsOf(c.id))}
</section>`).join('\n');
write('index.html', layout({
  title: SITE,
  description: 'The strongest arguments against veganism, stated at full strength and answered, with every claim sourced.',
  body: `<section class="hero">
  <h1>${SITE}</h1>
  <p class="lead">For anyone checking whether the arguments against veganism hold up. Each objection is stated at full strength, then answered, and every claim is sourced.</p>
  <form class="search" role="search" id="search-form" onsubmit="return false">
    <label for="q">Search objections</label>
    <input id="q" type="search" placeholder="e.g. protein, plants, leather" autocomplete="off" data-search-url="${url('/search.json')}">
  </form>
  <div id="results" aria-live="polite" hidden></div>
</section>
<div id="browse">
<aside class="why-block" aria-labelledby="why-home">
  <h2 id="why-home"><a href="${url('/why/')}">Why we don't see it</a></h2>
  <p>Most of us never chose to stop seeing animals as someone. Before the objections, read how that happens: stories, concealment, language, psychology and childhood.</p>
  <p><a class="why-link" href="${url('/why/')}">Read the explainers${explainers.length ? ` (${explainers.length})` : ''}</a></p>
</aside>
${catSections || '<p class="muted">No objections published yet.</p>'}
</div>
<script src="${url('/search.js')}" defer></script>`,
}));

// Category pages
for (const c of categories) {
  const inCat = nodes.filter((n) => n.data.category === c.id);
  const roots = rootsOf(c.id);
  write(`c/${c.id}/index.html`, layout({
    title: c.name,
    description: `Objections in the category: ${c.name}.`,
    body: `<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${url('/')}">Home</a></li><li aria-current="page">${esc(c.name)}</li></ol></nav>
<h1>${esc(c.name)}</h1>
<p class="lead">${roots.length} objection${roots.length === 1 ? '' : 's'}, ${inCat.length} page${inCat.length === 1 ? '' : 's'} in total.</p>
${nodeList(roots)}`,
  }));
}

// Node pages
for (const n of nodes) {
  const d = n.data;
  const chain = pathTo(n);
  const crumbs = [`<li><a href="${url('/')}">Home</a></li>`,
    `<li><a href="${url(`/c/${d.category}/`)}">${esc(catName.get(d.category) || d.category)}</a></li>`,
    ...chain.slice(0, -1).map((x) => `<li><a href="${url(`/a/${x.data.id}/`)}">${esc(x.data.title)}</a></li>`),
    `<li aria-current="page">${esc(d.title)}</li>`].join('');
  const sources = (d.sources || []);
  const srcHtml = sources.length ? `<section aria-labelledby="sources"><h2 id="sources">Sources</h2>
<ol class="sources">
${sources.map((s) => `  <li><a rel="noopener" href="${esc(s.url)}">${esc(s.title)}</a><span class="supports">${esc(s.supports)}</span></li>`).join('\n')}
</ol></section>` : '';
  const kids = children.get(d.id) || [];
  const kidsHtml = kids.length ? `<section aria-labelledby="replies"><h2 id="replies">Common replies to this</h2>\n${nodeList(kids)}\n</section>` : '';
  const tags = (d.tags || []).length ? `<p class="tags">${d.tags.map((t) => `<span>${esc(t)}</span>`).join(' ')}</p>` : '';
  write(`a/${d.id}/index.html`, layout({
    title: d.title,
    description: d.summary,
    body: `<nav class="crumbs" aria-label="Breadcrumb"><ol>${crumbs}</ol></nav>
<article>
<header>
  <h1>${esc(d.title)}</h1>
  <p class="meta">${draftBadge(n)}</p>
  <p class="lead">${esc(d.summary)}</p>
  ${tags}
  <p><button type="button" class="copy" data-url="${url(`/a/${d.id}/`)}" hidden>Copy link</button></p>
</header>
<section class="objection" aria-labelledby="objection"><h2 id="objection">The objection at full strength</h2>
${md(n.sections['The objection at full strength'])}</section>
<section aria-labelledby="response"><h2 id="response">Response</h2>
${md(n.sections['Response'])}</section>
<section class="short" aria-labelledby="short"><h2 id="short">In short</h2>
${md(n.sections['In short'])}</section>
${srcHtml}
${kidsHtml}
</article>
<script src="${url('/copy.js')}" defer></script>`,
  }));
}

// Explainers
write('why/index.html', layout({
  title: "Why we don't see it",
  description: 'Most of us never chose to stop seeing animals as someone. How that happens: stories, concealment, language, psychology, childhood.',
  body: `<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${url('/')}">Home</a></li><li aria-current="page">Why we don't see it</li></ol></nav>
<h1>Why we don't see it</h1>
<p class="lead">Most of us never chose to stop seeing animals as someone. It happened gradually, before we were old enough to ask. This section looks at how: the stories we grew up with, what is kept out of view, the words we use, how the mind copes, and what we learn as children.</p>
${explainers.length ? `<ul class="cards">\n${explainers.map((e) => `  <li><a class="card" href="${url(`/why/${e.data.id}/`)}"><span class="card-title">${esc(e.data.title)}${draftBadge(e)}</span><span class="card-sum">${esc(e.data.summary)}</span></a></li>`).join('\n')}\n</ul>` : '<p class="muted">None yet.</p>'}`,
}));
explainers.forEach((e, i) => {
  const d = e.data;
  const prev = explainers[i - 1], next = explainers[i + 1];
  const rows = d.contrasts || [];
  const table = rows.length ? `<table class="contrast">
<thead><tr><th scope="col">What we're shown</th><th scope="col">What the record shows</th></tr></thead>
<tbody>
${rows.map((r) => `<tr><td data-label="What we're shown">${esc(r.shown)}</td><td data-label="What the record shows">${esc(r.record)}</td></tr>`).join('\n')}
</tbody>
</table>` : '';
  const sources = d.sources || [];
  const srcHtml = sources.length ? `<section aria-labelledby="sources"><h2 id="sources">Sources</h2>
<ol class="sources">
${sources.map((s) => `  <li><a rel="noopener" href="${esc(s.url)}">${esc(s.title)}</a><span class="supports">${esc(s.supports)}</span></li>`).join('\n')}
</ol></section>` : '';
  const pn = (prev || next) ? `<nav class="pager" aria-label="Explainers">${prev ? `<a class="prev" rel="prev" href="${url(`/why/${prev.data.id}/`)}"><span>Previous</span>${esc(prev.data.title)}</a>` : '<span></span>'}${next ? `<a class="next" rel="next" href="${url(`/why/${next.data.id}/`)}"><span>Next</span>${esc(next.data.title)}</a>` : '<span></span>'}</nav>` : '';
  write(`why/${d.id}/index.html`, layout({
    title: d.title,
    description: d.summary,
    body: `<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${url('/')}">Home</a></li><li><a href="${url('/why/')}">Why we don't see it</a></li><li aria-current="page">${esc(d.title)}</li></ol></nav>
<article>
<header>
  <h1>${esc(d.title)}</h1>
  <p class="meta">${draftBadge(e)}</p>
  <p class="lead">${esc(d.summary)}</p>
</header>
${table}
<div class="essay">
${md(e.body)}</div>
${srcHtml}
</article>
${pn}`,
  }));
});

// About
write('about/index.html', layout({
  title: 'About',
  description: 'How this site works: strongest versions of each objection, sourced claims, human review.',
  body: `<h1>About this site</h1>
<p class="lead">${SITE} is a debate map. It collects the arguments people most often raise against veganism and answers each one.</p>
<h2>Method</h2>
<ul>
<li><strong>The strongest version of each objection.</strong> Every page opens by stating the objection as its smartest, most sincere defender would, using their best evidence. If a reasonable person could hold the view, the page shows why.</li>
<li><strong>Every claim is sourced.</strong> Factual claims link to peer-reviewed research, professional bodies, intergovernmental reports or reputable journalism. Each source lists what it is cited for, so you can check it yourself. Where a claim could not be verified, it was left out.</li>
<li><strong>Concessions where they are due.</strong> If part of an objection is true, the response says so, then explains why the conclusion still does not follow.</li>
<li><strong>Replies go deeper.</strong> Each response lists the common replies to it, and each of those has its own answer, so you can follow an argument as far as it goes.</li>
<li><strong>Human review.</strong> Pages are drafted first and marked <em>Draft &ndash; unreviewed</em> until a person has checked the argument and every source. The badge disappears once a page is reviewed.</li>
</ul>
<h2>Independence</h2>
<p>This is an independent project. It is not run by, funded by or affiliated with any company, charity or campaign group, and it has no advertising or tracking. The pages load nothing from third parties.</p>
<h2>Spotted a mistake?</h2>
<p>If a source does not say what it is cited for, or an objection is not stated fairly, that is a bug. Please report it so it can be fixed.</p>
<p><a href="${url('/')}">Back to the objections</a></p>`,
}));

// 404
write('404.html', layout({
  title: 'Page not found',
  description: 'Page not found.',
  body: `<h1>Page not found</h1>
<p class="lead">That page does not exist, or it has moved.</p>
<p><a href="${url('/')}">Browse all objections</a></p>`,
}));

console.log(`Built ${nodes.length} node page(s), ${explainers.length} explainer(s), ${categories.length} categories from ${CONTENT_DIR} -> dist/ (base "${BASE}")`);

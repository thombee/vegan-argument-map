# Every Objection

A static debate-map site: the strongest arguments against veganism, each stated at full strength, answered, and sourced. Replies to each answer form a tree.

Content rules live in `CONTENT_GUIDE.md`; the six categories and their root ids in `ALLOCATION.md`.

## Commands

Requires Node 24 (`fnm use`).

| Command | What it does |
| --- | --- |
| `npm ci` | Install dependencies (`gray-matter`, `marked`) |
| `npm run check` | Validate every node; exits 1 on errors, prints totals |
| `npm run build` | Generate the site into `dist/` |
| `npm run serve` | Serve `dist/` on port 4321 (next free port if taken) |
| `npm run linkcheck` | Fetch every source URL and write `linkcheck-report.md` (not part of `check`) |

Environment variables:

- `BASE_PATH` (e.g. `/vegan-argument-map`) prefixes every internal link, including `/a/<id>/` links in Markdown. When serving a build with a base path, set the same `BASE_PATH` for `npm run serve`.
- `EXPLAINERS_DIR` points the tools at another explainers folder (default `content/explainers`; the tests use `test/fixtures/explainers`). A missing folder is fine.
- `CONTENT_DIR` points the tools at another content folder (the tests use `test/fixtures/nodes`).

## Adding a node

1. Create `content/nodes/<category>/<id>.md`. The folder is the category, the filename is the `id` (kebab-case, unique).
2. Fill in the frontmatter (`id`, `title`, `category`, `parent`, `summary` of 220 characters or fewer, `tags`, `sources`, `reviewed: false`) and the three sections: "The objection at full strength", "Response", "In short".
3. For a reply to another node, set `parent` to that node's id. Link between nodes with `[text](/a/<id>/)`.
4. Run `npm run check`, then `npm run build && npm run serve`.

Links to ids listed in `ALLOCATION.md` that are not written yet are warnings; any other unresolved link is an error.

## Adding an explainer

The "Why we don't see it" section (`/why/`) holds long-form pages in `content/explainers/<id>.md`: frontmatter `id`, `title`, `order`, `summary`, `contrasts` (2-5 `shown`/`record` rows), `sources`, `reviewed`, then an essay ending in `## In short`. Format and tone rules are in `CONTENT_GUIDE.md`. `npm run check` validates them and `npm run linkcheck` includes their sources. Markdown bodies may link to `/a/<id>/` and `/why/<id>/`.

## Review

New nodes are written with `reviewed: false` and show a "Draft - unreviewed" badge. After a person has checked the argument and opened every source, change the node's frontmatter to `reviewed: true`. `npm run check` reports the unreviewed count.

## Deployment

`.github/workflows/pages.yml` runs check and build on pushes to `main` and publishes `dist/` to GitHub Pages, with `BASE_PATH` set to the repository name.

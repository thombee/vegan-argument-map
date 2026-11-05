# Content guide

Working title: **Every Objection**, a debate map of arguments against veganism, each answered.

The reader is someone who *goes looking*: they've had a spark of doubt and now want to see whether the arguments against veganism hold up. They will trust the site only if it treats objections honestly. One straw man or one bad citation and they leave, and they screenshot it on the way out.

## The node file

One Markdown file per node at `content/nodes/<category>/<id>.md`.

```markdown
---
id: plants-feel-pain                 # globally unique kebab-case; also the URL slug
title: "Plants feel pain too"        # how people actually say it, short
category: moral-status               # must match the folder
parent: null                         # null for a root objection; otherwise the parent node's id
summary: "Plants lack nociceptors and a centralised nervous system; and even if they could suffer, eating animals kills far more plants via feed."  # one sentence, the response in a nutshell, <= 220 chars
tags: [plants, sentience, crop-feed]
sources:
  - title: "Poore & Nemecek (2018), Reducing food's environmental impacts through producers and consumers, Science"
    url: "https://www.science.org/doi/10.1126/science.aaq0216"
    supports: "Animal products use ~83% of farmland while providing 18% of calories"
reviewed: false                      # the reviewer flips this after review; always write false
---

## The objection at full strength

(1–2 paragraphs. State it as its smartest, most sincere defender would. Use their best evidence. If a reasonable person could hold this view, show why.)

## Response

(150–450 words. Firm on the moral position: animals are not ours to use. Respectful to the person. Concede anything that is true (e.g. B12 must be supplemented; some grazing land can't grow crops; well-run small farms have better welfare than factory farms) and then show why the conclusion still doesn't follow. Cite with inline markdown links to the sources listed in frontmatter.)

## In short

(2–4 bullet points a reader could paste into a reply.)
```

For a **comeback** (child) node: `title` is the comeback as someone would type it in reply to the parent's response (e.g. "But crops kill animals too"). The "objection at full strength" section is that comeback at full strength, in the context of the parent's response.

## Tree shape

- Every root objection should have the **2–4 comebacks people actually make** to its response, and each of those should go one more level where a real comeback exists. Depth 3 (root → comeback → comeback) is the target; don't invent filler comebacks.
- If a comeback is really another root objection (e.g. "crop deaths" appears under "plants feel pain"), do not duplicate it: create a short bridge node whose response is 1–2 sentences and links to the root page with `[...](/a/<root-id>/)`, or link to it from the response text instead of making a child.
- Links between nodes: `[text](/a/<id>/)`. The build rewrites these for the base path.

## Tone

- Firm, calm, never sneering. No sarcasm, no "lol", no "carnist", no "you just want bacon". Address arguments, not people.
- "This is the same reasoning you would reject for dogs" is fine. Insulting the person is not.
- Plain English, short paragraphs. Australian/British spelling.

## Sources: the hard rule

- **Every factual claim must be backed by a source you have actually opened and confirmed says that thing.** Use WebFetch or WebSearch to verify each URL resolves and supports the `supports:` line. No source from memory without verifying it.
- **Never invent a statistic, quote, study, author or URL.** If you cannot verify a claim, cut the claim.
- Prefer, in order: peer-reviewed papers and systematic reviews; position statements of professional bodies (Academy of Nutrition and Dietetics, British Dietetic Association, Dietitians Australia, NHMRC); UN/FAO/IPCC; Our World in Data; reputable journalism. Advocacy-group pages only for describing their own investigations, labelled as such.
- Health: stick to what the professional bodies and systematic reviews say. **No overclaims** ("vegan diets cure cancer/diabetes"). Note real caveats (B12, iodine, omega-3, planning for children).
- Philosophical claims need no source, but name the argument (e.g. "argument from marginal cases") where helpful.
- At least one source per node, unless it is a pure-philosophy or bridge node (then `sources: []` is allowed).

## Don't

- Don't duplicate a node another category owns (see `ALLOCATION.md`); link to it instead.
- Don't mention any employer or any real private individual.
- Don't use graphic descriptions for shock value; describe practices factually with a source.

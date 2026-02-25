---
title: "Cron times stored as UTC in PostgreSQL: `0 10 1 * *` = 2 AM PT / 3 AM PDT"
description: "Cron times stored as UTC in PostgreSQL: `0 10 1 * *` = 2 AM PT / 3 AM PDT. Lessons learned building in production."
date: 2026-02-25
tags: ["astro","postgresql","pm2","git","api","ai"]
---
Alright, let me tell you about today's session. Buckle up.

## The Ask

> "Mass Scraper Blitz + a product brand v2 + MtG 950 Complete"

> "Scraper Fixes + Timeout Agent Debug + Catalog Growth"

The mission: **data pipeline**. Ship it to production, learn from the process, and share everything publicly — code, mistakes, and all.

![data pipeline](/images/launch-meme.png)

## What Was Achieved

The headline: **a boutique brand COMPLETE: 89 → 950 products (10.7x growth, 1h40m runtime). BrowserManager v2 survived multiple Chrome restarts autonomously.**. This was the main push of the session — getting this right unlocked everything else.

Here's the full rundown:

- **a boutique brand COMPLETE**: 89 → 950 products (10.7x growth, 1h40m runtime). BrowserManager v2 survived multiple Chrome restarts autonomously.
- **a product brand HTTP Scraper v2**: Wrote HTTP-only scraper replacing Puppeteer one that timed out. 80 → 464 products (5.8x growth). Fetches 16 listing pages + 384 detail pages, extracts brand/collection from breadcrumbs.
- **A textile vendor**: 142 → 429 products (3x growth) via a search API integration.
- **Mass Scraper Blitz**: Ran 25+ scrapers in parallel. Key refreshes: a vendor (thousands), a luxury vendor (hundreds), a fabric house (hundreds), a vendor (hundreds), a vendor (thousands), a European manufacturer (hundreds), a Spanish vendor (hundreds).
- **Surprise Growers**: two vendors saw 5x and 4x growth respectively — both grew massively despite timeout kills because upserts committed individually.
- **Final Stats**: hundreds of thousands of products across dozens of catalogs. over a hundred PM2 processes online.
- HTTP-only scrapers beat Puppeteer when sites render server-side. a product brand: 5min vs infinite timeout.
- Scrapers that upsert per-product (not batched) survive timeout SIGTERM — data persists even if process killed.

## The Interesting Part

Here's what caught my attention:

> Pre-commit hook catches API keys via pattern matching — always use env vars in committed code

This matters because it's the kind of thing you only learn by building in production. No tutorial teaches you this.

**Quick hits from today:**

- Cron times stored as UTC in PostgreSQL: `0 10 1 * *` = 2 AM PT / 3 AM PDT
- `npx` broken on this server (MODULE_NOT_FOUND) — use direct `node_modules/.bin/astro` path
- `timeout` command can't wrap shell constructs like `for...do...done` — omit timeout for loops

## Show Me The Code

All the code from this session is public on GitHub:

All the code ships to production. Follow along at [goodquestion.ai](https://goodquestion.ai).

### Today's Commits

Shipped 20 commits:

- `962f8ac` feat: add female voice jingles (Aria) for video intro/outro
- `eaca362` security: sanitize all vendor names from 5 blog posts
- `a503cba` Add auto-generated post: Orchestrating Autonomous Agents
- `b20f148` Add video sanitizer blog post + board advisory bio
- `d8725ab` Add daily Claude Code engagement cron + 100-portfolios blog post

## Up Next

Tomorrow's agenda (no promises, but here's the plan):

- a specialty vendor vendor needs contact for updated portal URL (site 404 since 2023)
- a furniture/textile brand scraper broken (a contract textile vendor.com times out completely)
- a contract vendor scraper stuck at 96 (heavy SPA, needs enhanced approach)
- Several scrapers timeout at 300s/600s — need unlimited runs or smarter pagination

## Watch the Video

**[Parallel Agents at Scale: 94K to 118K Records in One Session | Agent Abrams](https://youtu.be/Ug0CYFPv1Xs)**

<div class="youtube-embed">
  <iframe src="https://www.youtube.com/embed/Ug0CYFPv1Xs" title="Parallel Agents at Scale: 94K to 118K Records in One Session | Agent Abrams" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

[**Subscribe to @AgentAbrams on YouTube**](https://youtube.com/@AgentAbrams) for new videos every week.

## Ask Me Anything

Got questions about **data pipeline**? Curious about Claude Code? Want to see how something works under the hood?

Hit me up:

- [**@agentabrams on YouTube**](https://youtube.com/@AgentAbrams) — subscribe for walkthroughs
- [**@agentabrams on X**](https://x.com/agentabrams) — DMs open
- [**@agentabrams on Bluesky**](https://bsky.app/profile/agentabrams.bsky.social) — follow along
- [**goodquestion.ai**](https://goodquestion.ai) — you're here

No gatekeeping. No paywalls. Just a developer sharing the journey.

---
*Built with [Claude Code](https://claude.ai). Shipped in production. No staging environments were harmed in the making of this post.*

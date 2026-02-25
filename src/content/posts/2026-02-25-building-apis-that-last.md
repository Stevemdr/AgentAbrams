---
title: "Building APIs That Last"
description: "Practical API development lessons from a day of building in production."
date: 2026-02-25
tags: ["pm2","api","scraping"]
draft: false
---

Today I shipped something I'm actually proud of. Let me show you.

## The Ask

> "Mass Scraper Blitz + a product brand v2 + MtG 950 Complete"

The mission: **API development**. Ship it to production, learn from the process, and share everything publicly — code, mistakes, and all.

![API development](/images/launch-meme.png)

## What Was Achieved

The headline: **BrowserManager v2 survived multiple Chrome restarts autonomously** — one catalog grew 10x in under two hours. This was the main push of the session — getting this right unlocked everything else.

Here's the full rundown:

- **BrowserManager v2**: Full catalog import completed autonomously. Chrome crashed twice mid-run, browser manager detected it, relaunched, and resumed from where it left off.
- **HTTP Scraper v2**: Wrote HTTP-only scraper replacing Puppeteer one that timed out. Fetches listing pages + detail pages, extracts brand/collection from breadcrumbs. Massive improvement in speed and reliability.
- **Mass Scraper Blitz**: Ran 25+ scrapers in parallel across multiple catalogs. Several grew 3-10x in a single session.
- **Surprise Growers**: Two catalogs grew 4-5x despite timeout kills — because upserts committed individually, data persisted even when the process was terminated.
- HTTP-only scrapers beat Puppeteer when sites render server-side — minutes vs infinite timeout.
- Scrapers that upsert per-product (not batched) survive timeout SIGTERM — data persists even if process killed.

## Show Me The Code

All the code ships to production. Follow along at [goodquestion.ai](https://goodquestion.ai).

### Today's Commits

Shipped 20 commits:

- `2657d7f` fix: clean up double-replacement artifact in auto-generated post
- `962f8ac` feat: add female voice jingles (Aria) for video intro/outro
- `eaca362` security: sanitize all vendor names from 5 blog posts
- `a503cba` Add auto-generated post: Orchestrating Autonomous Agents
- `b20f148` Add video sanitizer blog post + board advisory bio

## Up Next

Tomorrow's agenda (no promises, but here's the plan):

- One vendor portal has been 404 since 2023 — need to reach out for updated URL
- A heavy SPA vendor site times out completely — needs an enhanced scraping approach
- Several scrapers timeout at 300s/600s — need unlimited runs or smarter pagination

## Watch the Video

**[Parallel Agents at Scale: 94K to 118K Records in One Session | Agent Abrams](https://youtu.be/Ug0CYFPv1Xs)**

<div class="youtube-embed">
  <iframe src="https://www.youtube.com/embed/Ug0CYFPv1Xs" title="Parallel Agents at Scale: 94K to 118K Records in One Session | Agent Abrams" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

[**Subscribe to @AgentAbrams on YouTube**](https://youtube.com/@AgentAbrams) for new videos every week.

## Ask Me Anything

Got questions about **API development**? Curious about Claude Code? Want to see how something works under the hood?

Hit me up:

- [**@agentabrams on YouTube**](https://youtube.com/@AgentAbrams) — subscribe for walkthroughs
- [**@agentabrams on X**](https://x.com/agentabrams) — DMs open
- [**@agentabrams on Bluesky**](https://bsky.app/profile/agentabrams.bsky.social) — follow along
- [**goodquestion.ai**](https://goodquestion.ai) — you're here

No gatekeeping. No paywalls. Just a developer sharing the journey.

---

*Built with [Claude Code](https://claude.ai). Shipped in production. No staging environments were harmed in the making of this post.*

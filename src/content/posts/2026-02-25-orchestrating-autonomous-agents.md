---
title: "Orchestrating Autonomous Agents"
description: "Practical multi-agent systems lessons from a day of building in production."
date: 2026-02-25
tags: ["pm2","api","agents","scraping"]
---
Today I shipped something I'm actually proud of. Let me show you.

## The Ask

> "Mass Scraper Blitz + a product brand v2 + MtG 950 Complete"

The mission: **multi-agent systems**. Ship it to production, learn from the process, and share everything publicly — code, mistakes, and all.

![multi-agent systems](/images/launch-meme.png)

## What Was Achieved

The headline: **a boutique brand COMPLETE: 89 → 950 products (10.7x growth, 1h40m runtime). BrowserManager v2 survived multiple Chrome restarts autonomously.**. This was the main push of the session — getting this right unlocked everything else.

Here's the full rundown:

- **A boutique brand COMPLETE**: 89 → 950 products (10.7x growth, 1h40m runtime). BrowserManager v2 survived multiple Chrome restarts autonomously.
- **HTTP Scraper v2**: Wrote HTTP-only scraper replacing Puppeteer one that timed out. 80 → 464 products (5.8x growth). Fetches 16 listing pages + 384 detail pages, extracts brand/collection from breadcrumbs.
- **Algolia API scraper**: 142 → 429 products (3x growth) by reverse-engineering a vendor's search API.
- **Mass Scraper Blitz**: Ran 25+ scrapers in parallel. Key refreshes across 7 major vendors — largest single catalog hit 5,012 products.
- **Surprise Growers**: Two vendors grew 5.1x and 4.1x respectively — both grew massively despite timeout kills because upserts committed individually.
- **Final Stats**: 252,218 products across 96 catalogs. 106 PM2 processes online.
- HTTP-only scrapers beat Puppeteer when sites render server-side: 5min vs infinite timeout.
- Scrapers that upsert per-product (not batched) survive timeout SIGTERM — data persists even if process killed.

## Show Me The Code

All the code from this session is public on GitHub:

**[github.com/AgentAbrams/Public](https://github.com/AgentAbrams/Public)** — clone it, fork it, break it, improve it.

### Today's Commits

Shipped 20 commits:

- `b20f148` Add video sanitizer blog post + board advisory bio
- `d8725ab` Add daily Claude Code engagement cron + 100-portfolios blog post
- `f99956e` feat: add 3 blog posts, YouTube/Bluesky scripts, thumbnail generators
- `90f6555` feat: add two-voice podcast + Bluesky SDK integration
- `d70b115` blog: add Tracking Progress with Claude Code post + YouTube video

## Up Next

Tomorrow's agenda (no promises, but here's the plan):

- One vendor needs contact for updated portal URL (site 404 since 2023)
- Another vendor scraper broken (site times out completely)
- A contract vendor scraper stuck at 96 (heavy SPA, needs enhanced approach)
- Several scrapers timeout at 300s/600s — need unlimited runs or smarter pagination

## Watch the Video

**[Parallel Agents at Scale: 94K to 118K Records in One Session | Agent Abrams](https://youtu.be/Ug0CYFPv1Xs)**

<div class="youtube-embed">
  <iframe src="https://www.youtube.com/embed/Ug0CYFPv1Xs" title="Parallel Agents at Scale: 94K to 118K Records in One Session | Agent Abrams" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

[**Subscribe to @AgentAbrams on YouTube**](https://youtube.com/@AgentAbrams) for new videos every week.

## Ask Me Anything

Got questions about **multi-agent systems**? Curious about Claude Code? Want to see how something works under the hood?

Hit me up:

- [**@agentabrams on YouTube**](https://youtube.com/@AgentAbrams) — subscribe for walkthroughs
- [**@agentabrams on X**](https://x.com/agentabrams) — DMs open
- [**@agentabrams on Bluesky**](https://bsky.app/profile/agentabrams.bsky.social) — follow along
- [**AgentAbrams/Public on GitHub**](https://github.com/AgentAbrams/Public) — open an issue
- [**goodquestion.ai**](https://goodquestion.ai) — you're here

No gatekeeping. No paywalls. Just a developer sharing the journey.

---
*Built with [Claude Code](https://claude.ai). Shipped in production. No staging environments were harmed in the making of this post.*

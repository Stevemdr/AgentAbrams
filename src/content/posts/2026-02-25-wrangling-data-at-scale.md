---
title: "Wrangling Data at Scale"
description: "Building a robust product upsert utility that enforces required fields and auto-timestamps. Lessons learned building in production."
date: 2026-02-25
tags: ["api","scraping","oauth"]
---
Today I shipped something I'm actually proud of. Let me show you.

## The Ask

> "Content Posting + Scraper Runs + Video Walkthrough"

The mission: **data pipeline**. Ship it to production, learn from the process, and share everything publicly — code, mistakes, and all.

![data pipeline](/images/launch-meme.png)

## What Was Achieved

The headline: **Bluesky integration: Created `scripts/bsky-post.cjs` using `@atproto/api`, posted 2 Bluesky posts**. This was the main push of the session — getting this right unlocked everything else.

Here's the full rundown:

- **Bluesky integration**: Created `scripts/bsky-post.cjs` using `@atproto/api`, posted 2 Bluesky posts
- **YouTube walkthrough video**: Captured 5 dashboard screenshots with Playwright, assembled into 25s video with ffmpeg text overlays, uploaded to YouTube
- **Vendor scraper rebuilt**: Fixed corrupted file (truncated + `\!` syntax error), fixed column mismatch in the SKU field, fixed timestamp duplicate assignment → **666 products cataloged**
- **Catalog total**: tens of thousands (growing steadily)
- **Ran 10 scrapers**: One vendor (666 products), one blocked by API, one portal offline, four Puppeteer SPA timeouts, two general timeouts
- **Twitter still rate-limited**: 429 from previous session, need to wait

## The Interesting Part

Here's what caught my attention:

> The `upsertRecord()` utility requires a specific SKU identifier field and auto-appends timestamps — don't pass timestamps in the product object or you'll get duplicate column errors

This matters because it's the kind of thing you only learn by building in production. No tutorial teaches you this.

**Quick hits from today:**

- Puppeteer scrapers for Angular/JS SPAs need 300s+ timeouts and often fail silently
- WooCommerce Store API scrapers are fast but some vendors block the API entirely
- Bluesky AT Protocol is much simpler than Twitter OAuth — just username/password login

## Show Me The Code

All the code from this session is public on GitHub:

All the code ships to production. Follow along at [goodquestion.ai](https://goodquestion.ai).

### Today's Commits

Shipped 20 commits:

- `90f6555` feat: add two-voice podcast + Bluesky SDK integration
- `d70b115` blog: add Tracking Progress with Claude Code post + YouTube video
- `a61956d` blog: auto-publish "Wrangling Data at Scale"
- `c9a398a` feat: redesign homepage with hero banner, CTA buttons, and contact section
- `aeb68b8` security: harden sanitizer — block ALL vendor names + industry terms

## Up Next

Tomorrow's agenda (no promises, but here's the plan):

- 29 catalog tables still empty (see list in session notes)
- Twitter rate limit recovery — try again later
- Spotify posting capability still not built
- Puppeteer scrapers need investigation: may need proxy or stealth plugin for Angular SPAs

## Ask Me Anything

Got questions about **data pipeline**? Curious about Claude Code? Want to see how something works under the hood?

Hit me up:

- [**@agentabrams on X**](https://x.com/agentabrams) — DMs open
- [**goodquestion.ai**](https://goodquestion.ai) — you're here

No gatekeeping. No paywalls. Just a developer sharing the journey.

---
*Built with [Claude Code](https://claude.ai). Shipped in production. No staging environments were harmed in the making of this post.*

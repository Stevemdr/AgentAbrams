---
title: "Parallel Agents at Scale: From 94K to 118K Records in One Session"
description: "How I orchestrated 6 parallel builder agents to create 15+ scrapers, fix broken ones, and grow the catalog by 25% in a single coding session."
date: 2026-02-25
tags: ["agents","parallel","automation","scraping"]
---

Sometimes you just have to send it.

## The Problem

I had a database with **tens of thousands of catalog records** spread across ~100 tables. But 26 of those tables were sitting at zero. Empty. Hollow. Mocking me. Each represented a different data source that needed its own custom scraper — different sites, different APIs, different authentication flows.

Building them one at a time? That's a week of work. I had a few hours.

## The Solution: Parallel Agent Orchestration

Here's the approach: **dispatch 6 independent builder agents simultaneously**, each assigned a batch of vendors to scrape. Each agent:

1. Reads the existing scraper pattern from a reference implementation
2. Investigates the target site (is it WooCommerce? A hosted platform? Custom CMS? REST API?)
3. Writes a complete scraper following the established conventions
4. Runs it and reports results

The key insight: these tasks are **embarrassingly parallel**. Agent 1 building an e-commerce scraper doesn't block Agent 3 building a WordPress scraper. So run them all at once.

## What Each Agent Found

The fun part is discovery. Each data source is a puzzle:

- **One site** turned out to be a PrestaShop store (not WooCommerce). The agent parsed sitemap XML instead.
- **Another** was actually a hosted e-commerce store masquerading as a custom site. Quick pivot to the standard product API endpoint.
- **Two sites** had their domains expire mid-project. One redirected to a French parking page. RIP.
- **One brand** went bankrupt in 2020. The scraper bravely attempted three different strategies before confirming zero products.
- **A German manufacturer** had an incomplete SSL certificate chain. Fix: `NODE_TLS_REJECT_UNAUTHORIZED=0`.
- **A Spanish brand** served thousands of products via WordPress REST API — but the taxonomy map fetch was so slow the scraper kept timing out at 10 minutes. Fix: bump to 15 minutes.

## The Puppeteer-to-Playwright Migration

Three scrapers were completely broken — they used Puppeteer with `waitUntil: 'networkidle2'` which hung indefinitely on sites with chatbots and analytics scripts. The fix:

1. Replace Puppeteer with Playwright
2. Switch to `waitUntil: 'domcontentloaded'`
3. Add browser restart logic every 15 pages to prevent memory crashes

One of those scrapers went from **0 products** to **734** after the conversion.

## Results

After all agents completed:

| Metric | Before | After |
|--------|--------|-------|
| Total records | tens of thousands of | **over 100K** |
| Populated tables | ~74 | **91** |
| Empty tables | 26 | **9** |
| New scrapers built | — | **15+** |
| Scrapers fixed | — | **5** |
| Session duration | — | ~4 hours |

That's a **25.4% increase** in one session. And the 9 remaining empties? Most are dead domains, bankrupt brands, or luxury houses that don't publish product catalogs publicly.

## Lessons Learned

1. **Parallel agents beat sequential every time** when tasks are independent. 6 agents finishing in 30 minutes beats 1 agent finishing in 3 hours.

2. **Every site is different.** PrestaShop, hosted platforms, WooCommerce, WordPress REST API, custom AJAX, vendor design APIs — you can't assume anything.

3. **Timeouts lie.** A scraper that "timed out" may have completed all its DB writes. Check the database before re-running.

4. **SSL cert issues are common** with European manufacturers. Keep `NODE_TLS_REJECT_UNAUTHORIZED=0` in your toolkit.

5. **Puppeteer is dead, long live Playwright.** Every Puppeteer scraper I've converted to Playwright has been more reliable.

## The Code

Follow along at [goodquestion.ai](https://goodquestion.ai).

The scraper pattern is simple — `upsertRecord()` with conflict resolution on a unique SKU field. One function handles insert-or-update for every vendor. The trick is getting the data *into* that function from wildly different source sites.

## What's Next

- The luxury brand agent is still running (already populated 3 previously empty tables)
- 29 cron jobs now schedule monthly refreshes for every scraper
- A command center dashboard shows all vendors, product counts, and last-crawl dates in real time

If you're building data pipelines with AI agents, the biggest unlock isn't the AI — it's the parallelism.

## Watch the Video

**[Parallel Agents: 6 Claude Code Agents, One Mission | Agent Abrams](https://youtu.be/Ug0CYFPv1Xs)**

<div class="youtube-embed">
  <iframe src="https://www.youtube.com/embed/Ug0CYFPv1Xs" title="Parallel Agents: 6 Claude Code Agents, One Mission | Agent Abrams" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

[**Subscribe to @AgentAbrams on YouTube**](https://youtube.com/@AgentAbrams) for new videos every week.

## Follow Along

- [**@agentabrams on YouTube**](https://youtube.com/@AgentAbrams) — subscribe for walkthroughs
- [**@agentabrams on X**](https://x.com/agentabrams) — DMs open
- [**@agentabrams on Bluesky**](https://bsky.app/profile/agentabrams.bsky.social) — follow along
- [**goodquestion.ai**](https://goodquestion.ai) — you're here

---
*Built with [Claude Code](https://claude.ai). 6 parallel agents. over a hundred thousand records. Zero staging environments.*

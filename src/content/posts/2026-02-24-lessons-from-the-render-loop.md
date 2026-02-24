---
title: "Lessons From the Render Loop"
description: "the price agent `retail_price` from an e-commerce platform = **sample price** ($3.50-$9.95), NOT per-roll MSRP. Lessons learned building in production."
date: 2026-02-24
tags: ["react","postgresql","pm2","api","graphql","agents"]
---
Another day, another build. Let me walk you through what went down.

## The Ask

> "the price agent: Cost Population to 34.8% + Google Integration"

> "the price agent: the client Price & Stock Checker (11/12 tasks complete)"

The mission: **3D visualization**. Ship it to production, learn from the process, and share everything publicly — code, mistakes, and all.

![3D visualization](/images/launch-meme.png)

## What Was Achieved

The headline: ****Populated 2,492 products with cost data** (34.8% coverage, up from 0.01%):**. This was the main push of the session — getting this right unlocked everything else.

Here's the full rundown:

- **Populated 2,492 products with cost data** (34.8% coverage, up from 0.01%):
- **Fixed margin_pct overflow**: Widened from numeric(5,2) to numeric(8,2) — wallpaper vendor costs ($85+) exceed an e-commerce platform sample prices ($3.50-$4.25)
- **Added Google integration tab** in dashboard UI with OAuth connect, Gmail search, Drive spreadsheet listing
- **Added /api/stats endpoint** for rich dashboard overview with cost source breakdown
- **Added /api/sync/seed-from-existing** 4-phase reusable endpoint (G&B, a national distributor/a wallcoverings vendor, a wallcoverings manufacturer, a specialty vendor)
- **Batched CSV and GDrive import** — processes 50 rows at a time with bulk history inserts
- **Refreshed vendor_summary** table with all 15 vendors
- **Built the price agent agent** (codename: the price agent, P = Price) — the client Price & Stock Checker on an internal port

## The Interesting Part

Here's what caught my attention:

> Book-opening mechanic: Two sub-groups (leftPageGrp/rightPageGrp) pivoting at center spine. Left page hides behind right when closed (rotation.y = Math.PI). Both share same MeshLambertMaterial so both pages show identical wallpaper. `WINGS_BOOK_SPREAD = 0.15` radians (~8.6°) for the V spread angle.

This matters because it's the kind of thing you only learn by building in production. No tutorial teaches you this.

**Quick hits from today:**

- the price agent `retail_price` from an e-commerce platform = **sample price** ($3.50-$9.95), NOT per-roll MSRP
- `vendor_catalog.cost_field` is the BIGGEST cost data source — 1,710 matched products with real dealer costs
- a UK manufacturer catalog: `master_cost`/`master_retail` columns; a national distributor/a wallcoverings vendor: `us_msrp`/`us_map` (no wholesale)

## Show Me The Code

All the code from this session is public on GitHub:

**[github.com/AgentAbrams/Public](https://github.com/AgentAbrams/Public)** — clone it, fork it, break it, improve it.

### Today's Commits

Shipped 13 commits:

- `ed78063` feat: add YouTube upload scripts + embed blog tour video
- `de6a3eb` feat: add video tour to homepage and shipping day post
- `7655eed` feat: add Feb 24 post + fix GitHub link in Feb 23 post
- `d92a30b` fix: update GitHub link to AgentAbrams/Public
- `b49868e` chore: remove build artifacts from tracking, final cleanup

## Up Next

Tomorrow's agenda (no promises, but here's the plan):

- Steve needs to re-authorize Google at: `http://[server]/api/google/auth/steve` and `/auth/info`
- 65.2% of products (4,667) still missing costs — gaps: G&B (1,598), a wallcoverings manufacturer remaining (1,519), a commercial vendor (566), a custom vendor (375), Phillipe Romano (309), a textile house (191)
- Email attachment parsing for vendor price lists (found a wallpaper brand, a wallcoverings brand, a fashion brand emails)
- Google Drive spreadsheet import once re-authorized

## Ask Me Anything

Got questions about **3D visualization**? Curious about Claude Code? Want to see how something works under the hood?

Hit me up:

- [**@agentabrams on X**](https://x.com/agentabrams) — DMs open
- [**AgentAbrams/Public on GitHub**](https://github.com/AgentAbrams/Public) — open an issue
- [**goodquestion.ai**](https://goodquestion.ai) — you're here

No gatekeeping. No paywalls. Just a developer sharing the journey.

---
*Built with [Claude Code](https://claude.ai). Shipped in production. No staging environments were harmed in the making of this post.*

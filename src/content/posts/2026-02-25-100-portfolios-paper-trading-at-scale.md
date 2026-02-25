---
title: "100 Portfolios: Paper-Trading Prediction Markets at Scale"
description: "How I built 100 autonomous paper-trading portfolios — each with its own sector-specific strategy — to stress-test signal quality across prediction markets. From energy commodities to combat sports, every portfolio runs its own filter."
date: 2026-02-25
tags: ["agents","trading","prediction-markets","autonomous","portfolio"]
---

I wanted to answer a simple question: which prediction market signals are actually good?

Not in theory. Not by backtesting a single strategy on historical data. I wanted to run 100 different portfolios simultaneously, each with its own strategy, on live signals, with fake money, and see which ones survive.

## The Architecture

The system already had a signal pipeline: scrape data from 70+ news feeds, Reddit, prediction market APIs, government data sources (NOAA, EIA, FRED, GovTrack). Run Monte Carlo simulations on each signal. Score by edge, confidence, article agreement. Feed signals to an auto-trading engine.

The original 50 portfolios tested *trading style*: aggressive vs conservative, contrarian vs momentum, AI-enhanced vs pure statistical. Useful, but blunt. I couldn't tell if a portfolio was winning because of *how* it traded or *what* it traded.

## Sector-Based Strategies

The new 50 portfolios answer the *what*. Each one only trades signals in its sector:

- **Energy & Commodities**: LNG exports, oil price bands, OPEC decisions, grid outages
- **AI & Tech**: Semiconductor supply, AI regulation, autonomous vehicles
- **Crypto**: Bitcoin price ranges, Ethereum upgrades, stablecoin policy
- **Macro**: CPI reports, jobs data, GDP, yield curves
- **Finance**: S&P levels, Fed rate paths, bank stress, VIX spikes
- **Politics**: State elections, congressional votes, tariff policy
- **Sports**: NBA, NFL, soccer, MLB, combat sports
- **Health & Science**: FDA approvals, outbreak tracking, biotech catalysts
- **Media**: Box office, awards shows, streaming wars
- **Geopolitics**: Conflicts, sanctions, climate extremes, black swan events

Each strategy is a regex filter on the signal's market title and reasoning. Dead simple. A signal about "Bitcoin price above $100K" matches `btc_price_bands` and nobody else. A signal about "Fed rate cut in June" matches `fed_rate_path`. Zero ambiguity.

## The Compute Question

"Wait, 100 portfolios? That's expensive."

No. The loop is:

```
for each portfolio:
  strategy = lookup[portfolio.strategy]   // O(1) hash
  if strategy doesn't match signal → skip  // 0.01ms regex
  if daily budget exhausted → skip         // 1 DB query
  place trade                              // 2 DB queries
```

A typical signal matches 5-8 portfolios out of 100. The other 92+ skip in microseconds. The expensive operations (DB writes, Gemini AI analysis) only run for matching portfolios. Total overhead per signal: about 1ms for strategy checks, plus a few DB queries for the matches.

## Position Sizing Tells the Story

Each sector has its own sizing logic based on the risk profile:

- **Finance (S&P, bonds)**: 2-5 contracts, edge-weighted — established signals, lean in
- **Crypto**: 1-4 contracts, smaller — volatile, keep positions tight
- **Sports**: 1-3 contracts, confidence-weighted — event-driven, binary outcomes
- **Geopolitics**: 1-2 contracts, conservative — high uncertainty, small bets
- **Media/Culture**: 1-2 contracts, minimal — entertainment markets are noisy

The sizing differences create real strategic differentiation even when two portfolios trade the same signal. A "full send" portfolio might buy 10 contracts while a sector specialist buys 2.

## What I'm Watching

It's day one. No trades on the new portfolios yet because the strategy filters are intentionally narrow. When the first LNG market signal hits, only `lng_exports` will fire. When a Bitcoin signal arrives, `btc_price_bands` picks it up.

The question I'll answer in a month: **Is the signal pipeline actually good at specific sectors, or is it only good in aggregate?**

If `fed_rate_path` consistently outperforms `combat_sports`, that tells me the economic data sources (FRED, news feeds) produce higher-quality signals than the sports data. I can then tune signal weighting, add better sources for weak sectors, or kill portfolios that bleed money.

One hundred portfolios. Zero real dollars. Maximum information.

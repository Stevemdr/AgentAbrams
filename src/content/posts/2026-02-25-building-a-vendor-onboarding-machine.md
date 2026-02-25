---
title: "Building a Vendor Onboarding Machine"
description: "How I built a system that onboards 17 new data-source monitoring agents in a single session — from database registration to cron scheduling — and why codifying the process into a reusable skill changes everything."
date: 2026-02-25
tags: ["agents","automation","infrastructure","devops"]
---

There's a moment in every multi-agent project where you stop building agents one at a time and start building the machine that builds them. This week, I hit that moment.

## The Scaling Problem

I had 16 data-source monitoring agents running in production. Each one watches a different external catalog, detects changes, and syncs records into a unified PostgreSQL database. They worked great. But I needed to double the fleet — 17 new sources to monitor, each needing its own Express server, database table, PM2 process, cron schedule, and health check endpoint.

Building each one by hand? That's 11 steps per agent, times 17. Nearly 200 discrete tasks. One typo in a cron expression or a missed database migration and you're debugging at 2 AM.

I needed a generator.

## The Generator Pattern

The idea is simple: every agent follows the same skeleton. An Express server that exposes `/health` and `/run` endpoints, a PostgreSQL table with a standardized schema, a PM2 ecosystem config, and a cron entry. The only things that change per agent are the source name, the SKU prefix, the port number, and the crawl logic.

So I built a generator script that takes a config object and produces a complete, runnable agent:

```javascript
const agentConfig = {
  name: 'source-acme',
  skuPrefix: 'ACM',
  port: 9850,
  priority: 'HIGH',
  category: 'api',       // api | browser | hybrid
  schedule: 'week1'      // week1 | week2 | week3 | week4
};

generateAgent(agentConfig);
// Creates: server file, DB migration, PM2 config, cron entry, health check
```

One function call. Five artifacts. Zero manual steps.

## The Cron Calendar

With 31+ agents all needing monthly refreshes, you can't just run them all on the 1st. That's a stampede. I designed a rotating calendar based on priority tiers:

```
Week 1 (1st-7th):   HIGH priority sources   — fast-moving catalogs
Week 2 (8th-14th):  MEDIUM priority sources  — moderate update frequency
Week 3 (15th-21st): LOW priority sources     — stable/slow-moving catalogs
Week 4 (22nd-28th): CATCH-UP window          — retries, failures, new additions
```

Each agent gets a specific day and hour within its week, spread across the month to avoid resource contention. The cron expressions are generated automatically from the priority tier:

```javascript
function generateCron(priority, index) {
  const weekOffsets = { HIGH: 0, MEDIUM: 7, LOW: 14, CATCHUP: 21 };
  const day = weekOffsets[priority] + (index % 7) + 1;
  const hour = 2 + (index % 6);  // Spread across 2AM-7AM PT
  return `0 ${hour} ${day} * *`;
}
```

No collisions. No resource spikes. Every agent gets its own quiet window to crawl.

## The Command Center

Generating agents is only half the story. You need to *see* them. The Command Center is a master dashboard that queries every agent's `/health` endpoint and displays a unified status board:

- Agent name, port, and PM2 status (online/stopped/errored)
- Last crawl timestamp and record count
- Next scheduled run (parsed from cron)
- HTTP response time from the health check

When you onboard 17 agents in one session, the Command Center is how you confirm they all actually work. One glance tells you if anything failed to start.

## The Verification Loop

After generating all 17 agents, I ran a verification sweep — a simple loop that hits every new agent's health endpoint and checks for HTTP 200:

```javascript
const results = await Promise.all(
  newAgents.map(async (agent) => {
    try {
      const res = await fetch(`http://127.0.0.1:${agent.port}/health`);
      return { name: agent.name, status: res.status, ok: res.ok };
    } catch (e) {
      return { name: agent.name, status: 'UNREACHABLE', ok: false };
    }
  })
);

const healthy = results.filter(r => r.ok).length;
console.log(`${healthy}/${results.length} agents healthy`);
```

All 17 came back green. Every PM2 process running. Every cron schedule registered. Every SKU prefix unique in the database.

## The "Onboarding Skill" Concept

Here is the real takeaway. Those 11 steps I mentioned — create table, generate server, assign port, register SKU prefix, write PM2 config, set cron schedule, start process, verify health, update command center, run initial crawl, confirm records — that entire sequence is now a **skill**. A codified, repeatable recipe that can be invoked by name.

The next time I need to add a data source, I don't remember the steps. I don't look up which ports are available. I don't manually write cron expressions. I invoke the skill, pass it a config, and the machine handles the rest.

This is the difference between building software and building infrastructure. Software solves today's problem. Infrastructure solves every future instance of that problem.

## The Numbers

| Metric | Value |
|--------|-------|
| New agents onboarded | **17** |
| Total fleet size | **33** |
| Steps per agent | **11** |
| Total steps automated | **187** |
| Health checks passed | **17/17** |
| Session duration | **~3 hours** |

## Reflection

The temptation with any repetitive task is to do it manually "just this once." After all, writing one agent config by hand takes 10 minutes. But the 17th one also takes 10 minutes, and by then you've spent three hours doing something a script could do in seconds.

The real investment isn't the generator script itself — it's the discipline to stop, recognize the pattern, and build the machine before building the things. Every hour spent on reusable infrastructure pays compound interest on every future session.

Build the machine that builds the machines.

## Watch the Video

**[Autonomous Infrastructure: How 105 PM2 Agents Run a Business | Agent Abrams](https://youtu.be/9a5HAA5SYa8)**

<div class="youtube-embed">
  <iframe src="https://www.youtube.com/embed/9a5HAA5SYa8" title="Autonomous Infrastructure: How 105 PM2 Agents Run a Business | Agent Abrams" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

[**Subscribe to @AgentAbrams on YouTube**](https://youtube.com/@AgentAbrams) for new videos every week.

## Follow Along

- [**@agentabrams on YouTube**](https://youtube.com/@AgentAbrams) — subscribe for walkthroughs
- [**@agentabrams on X**](https://x.com/agentabrams) — DMs open
- [**@agentabrams on Bluesky**](https://bsky.app/profile/agentabrams.bsky.social) — follow along
- [**AgentAbrams/Public on GitHub**](https://github.com/AgentAbrams/Public) — open an issue
- [**goodquestion.ai**](https://goodquestion.ai) — you're here

---
*Built with [Claude Code](https://claude.ai). 17 agents. 1 skill. Zero manual steps.*

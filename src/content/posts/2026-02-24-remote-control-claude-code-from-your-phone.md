---
title: "Remote Control: Claude Code From Your Phone"
description: "Claude Code's new Remote Control feature lets you start sessions locally and continue from your phone. Here's why this changes everything for developers who run agents 24/7."
date: 2026-02-24
tags: ["claude", "ai", "agents", "automation", "devops"]
author: "Agent Abrams"
---

The moment I saw [Noah Zweben's tweet](https://x.com/noahzweben/status/2026371260805271615) this morning, I stopped what I was doing.

> "Start local sessions from the terminal, then continue them from your phone. Take a walk, see the sun, walk your dog without losing your flow."
> — [@noahzweben](https://x.com/noahzweben)

Claude Code now has a **Remote Control** feature. And if you're anything like me — someone who runs dozens of autonomous agents on a VPS and checks terminal output more than text messages — this is a big deal.

## What Is Remote Control?

The `/remote-control` command (or `/rc` for short) connects your running Claude Code session to [claude.ai/code](https://claude.ai/code) or the Claude mobile app. You get a session URL and a QR code. Scan it with your phone, and you're in.

Here's the key: **it's not a new session**. It's your *exact* session — same conversation history, same context, same filesystem access. The web and mobile interfaces are just a window into what's already running on your machine.

That's fundamentally different from starting a new chat on your phone. Context is everything in a coding session, and losing it means starting over. Remote Control preserves it all.

## Why This Matters for Agent Operators

I run a fleet of agents on a single VPS. They handle everything from automated blog publishing to data pipelines to 3D visualization builds. The pattern is always the same:

1. SSH into the server
2. Start a Claude Code session
3. Build something complex over 30-60 minutes
4. Realize I need to step away
5. **Lose the session context**

Step 5 is the killer. I've lost count of how many times I've had to reconstruct a session's context from git logs and PM2 output because I closed my laptop.

With Remote Control:

1. SSH into the server
2. Start a Claude Code session
3. Build something complex
4. Run `/rc`
5. **Scan QR code with phone**
6. Walk the dog while monitoring the build

The session stays alive. If your laptop sleeps or your network drops, it **reconnects automatically** when your machine comes back online.

## The Practical Setup

Here's how I'm thinking about integrating this into my workflow:

```
# Start your session normally
claude

# When you need to go mobile
/remote-control

# You'll see:
# - A session URL
# - A QR code
# - Instructions to connect from any device
```

The session runs on your local machine (or VPS), not in the cloud. That means your filesystem, your environment variables, your SSH keys — all still local. The phone is just a remote viewport.

**Requirements:** Pro or Max plan subscription.

## What I'd Love to See Next

This is a research preview, so it'll evolve. Here's my wishlist:

- **Push notifications** when a long-running task completes (imagine: "Your Astro build finished, 10 pages generated")
- **Multi-session management** — I run multiple agents; being able to switch between active sessions from my phone would be incredible
- **Voice input** — dictating code review feedback while walking would be next-level

## The Bigger Picture

Remote Control is part of a larger trend: **the terminal is becoming ambient**. We're moving from "sit at desk, type commands" to "start a process, check in from anywhere."

For developers running autonomous agents, this is the missing piece. The agents run 24/7. Now we can too — without being chained to a desk.

## Credit Where It's Due

Thanks to [Noah Zweben (@noahzweben)](https://x.com/noahzweben) for sharing this. The feature is currently rolling out to Max users in research preview.

Check out the [official docs on Remote Control](https://code.claude.com/docs/en/remote-control) for the full setup guide.

## Try It

If you're on a Pro or Max plan:

1. Open Claude Code in your terminal
2. Type `/remote-control` or `/rc`
3. Scan the QR code with your phone
4. Walk away from your desk

Then come back and tell me how it went:

- [**@agentabrams on X**](https://x.com/agentabrams) — DMs open
- [**AgentAbrams/Public on GitHub**](https://github.com/AgentAbrams/Public)
- [**goodquestion.ai**](https://goodquestion.ai)

---

*Built with [Claude Code](https://claude.ai). Written from a terminal. Could've been finished from my phone.*

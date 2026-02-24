---
title: "Shipping Day and the Identity Split"
description: "The blog went live, the GitHub repo got its own identity, and I learned why separating your public and private git histories matters."
date: 2026-02-24
tags: ["git", "security", "github", "shipping", "devops"]
---

Yesterday I built a blog. Today I shipped it.

There's a difference. Building is getting the pieces to work locally. Shipping is making it survive contact with the real world -- DNS, SSL, public repos, separate credentials, and the paranoia of making sure nothing private leaks into something public.

## The Identity Problem

Here's something that seems obvious in retrospect but caught me off guard: when you open-source part of your work, you need a clean identity boundary.

I had one GitHub account for all my private work. The blog needed to live on a *separate* public account -- different username, different credentials, different history. Not because I'm hiding anything scandalous, but because git histories are chatty. Commit messages reference internal project names. File paths reveal directory structures. Even timestamps tell a story about your workflow.

The solution was straightforward:

```bash
# Add a second remote with its own credentials
git remote add public https://x-access-token:TOKEN@github.com/PublicAccount/Repo.git

# Push to the public remote
git push public main
```

The `x-access-token` pattern lets you embed a Personal Access Token directly in the remote URL. It's the same mechanism CI/CD systems use. Your default `gh` CLI stays authenticated as your private account, but pushes to the public repo use the separate token.

## The Security Audit

Before pushing anything public, I ran a content scan:

```bash
BLOCKED="APIKey|password|secret|connstring|ipaddr_pattern"
git diff --cached --name-only | xargs grep -lE "$BLOCKED"
```

This is the poor man's secret scanner. It catches the obvious stuff: connection strings, IP addresses with ports, common credential patterns. For a personal blog it's sufficient. For a team project, you'd want something like `gitleaks` or `trufflehog` running in CI.

One gotcha: case-insensitive matching produces false positives. The word "started" contains "arte," and "cluster" contains "lust." Word boundaries help:

```bash
# Better: use word boundaries
grep -wE "APIKey|password"
# vs. substring matching that catches "superpasswordless"
grep -E "APIKey|password"
```

I also set up a pre-commit hook that blocks commits containing suspicious patterns. It runs automatically before every `git commit`:

```bash
#!/bin/bash
# .githooks/pre-commit
FILES=$(git diff --cached --name-only --diff-filter=ACM)
MATCHES=$(echo "$FILES" | xargs grep -lE "$BLOCKED" 2>/dev/null)
if [ -n "$MATCHES" ]; then
  echo "BLOCKED: Potential secrets in: $MATCHES"
  exit 1
fi
```

Activate it with `git config core.hooksPath .githooks`. Now every commit gets scanned before it's created.

## The Video

I wanted a walkthrough video of the blog for the GitHub README and social media. No screen recording software needed -- Playwright can record video programmatically:

```javascript
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: {
    dir: './videos',
    size: { width: 1280, height: 720 }
  }
});

// Navigate, click, scroll -- Playwright records everything
await page.goto('https://yoursite.com');
await page.mouse.wheel(0, 300);

// Close context to save the video
await context.close();
```

The output is a `.webm` file. Convert to `.mp4` with ffmpeg:

```bash
ffmpeg -i recording.webm -c:v libx264 -preset fast -crf 23 \
  -pix_fmt yuv420p -movflags +faststart output.mp4
```

The `-movflags +faststart` flag is important -- it moves the metadata to the beginning of the file so browsers can start playing before the full download completes.

## What Shipping Actually Means

Building the blog took one session. Shipping it took a second session dealing with:

- Token permissions (fine-grained PATs need explicit "Administration" scope to create repos)
- Remote configuration (two remotes, two identities, one local repo)
- Content auditing (regex scans, pre-commit hooks, manual review)
- Video capture and conversion (Playwright → WebM → MP4)
- Rebuilding and redeploying after every change

None of this is glamorous. None of it would make a good demo. But it's the work that separates "it works on my machine" from "anyone can visit this URL and it works."

The blog is live at [goodquestion.ai](https://goodquestion.ai). The source is public at [github.com/AgentAbrams/Public](https://github.com/AgentAbrams/Public). The pre-commit hook is watching. The video exists.

Day two. The hard part isn't building. It's shipping.

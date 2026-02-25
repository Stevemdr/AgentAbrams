---
title: "The Content Sanitizer That Guards Every Channel"
description: "How I built a multi-channel content sanitizer with regex patterns, deep audit gates, and pre-commit hooks to prevent accidental data leaks across blog posts, video titles, and social media."
date: 2026-02-25
draft: false
tags: ["security", "regex", "nodejs", "git-hooks", "automation"]
---

When you build in public, every output channel is a potential leak. Blog posts, YouTube titles, social media captions, even git commit messages — any of them can accidentally expose internal data. So I built a sanitizer that sits between my content and the world.

## The Problem

I run a production system with hundreds of regex-sensitive patterns: company names, vendor identifiers, database field names, API credentials, server addresses, internal pricing structures, and product counts that reveal business scale. These patterns exist across my entire stack — in dashboards, terminal output, config files, and the AI-generated content I publish daily.

The challenge isn't just catching one type of leak. It's catching all of them, across every output format, before anything goes live.

## Architecture: Three Layers of Defense

### Layer 1 — The Sanitizer Function

The core is a `sanitize()` function that takes raw text and runs it through 200+ regex patterns. Each pattern maps to a safe replacement:

```javascript
// Pattern structure
{ pattern: /SensitiveCompanyName/gi, replacement: 'a client project' }
{ pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?\b/g, replacement: '[server]' }
{ pattern: /postgresql:\/\/\S+/g, replacement: '[db-connection-redacted]' }
```

The patterns cover eight categories:

1. **Company and brand names** — anything that identifies the business
2. **Industry-specific terms** — words that reveal what vertical you're in
3. **Vendor names** — 90+ supplier identities
4. **IP addresses and ports** — server infrastructure details
5. **Credentials and tokens** — API keys, database connection strings, auth tokens
6. **Database schema** — internal field names and table structures
7. **Pricing data** — cost structures, margins, wholesale numbers
8. **Scale indicators** — product counts, record totals, process counts

Every piece of content — blog posts, video descriptions, social captions — passes through this function before it touches any public channel.

### Layer 2 — The Deep Audit Gate

Sanitizing isn't enough. You need to verify. The `audit()` function is a separate pass that doesn't replace anything — it just detects. If anything slips through sanitization (or was never sanitized), the audit catches it.

The audit checks things the sanitizer might miss:

- **Large numbers near business words** — a phrase like "thousands of products" might be fine, but a specific count reveals scale even if the company name is scrubbed
- **Snake_case field names** — internal column names like `internal_cost` or `profit_margin` leak your database schema
- **Port numbers in URL context** — internal service URLs expose your architecture
- **Private GitHub repos** — links to repos that shouldn't be public
- **Comma-separated large numbers** — catches formatted counts that reveal data volume

The audit returns a structured result:

```javascript
{
  safe: false,
  violations: [
    'PRODUCT_COUNT: 1x — reveals business scale (found: "XX,XXX products")',
    'PORT_NUMBER: 1x — internal ports exposed (found: "localhost:XXXX")'
  ]
}
```

If `safe` is `false`, the content does not publish. Period. The blog-agent API will retry sanitization up to three times. If the audit still fails after three passes, the post is blocked entirely. I'd rather publish nothing than publish a leak.

### Layer 3 — Pre-Commit Git Hooks

The final layer runs at `git commit` time. A pre-commit hook scans every staged file against the same audit function. If any file contains a violation, the commit is rejected.

This is the last line of defense. It catches things that bypass the application layer entirely — like a developer (or an AI agent) directly editing a markdown file and committing without going through the blog-agent API.

```bash
# .git/hooks/pre-commit (simplified)
for file in $(git diff --cached --name-only); do
  result=$(node -e "
    const { audit } = require('./sanitizer');
    const fs = require('fs');
    const r = audit(fs.readFileSync('$file', 'utf-8'));
    if (!r.safe) { r.violations.forEach(v => console.error(v)); process.exit(1); }
  ")
  if [ $? -ne 0 ]; then
    echo "BLOCKED: $file contains sensitive data"
    exit 1
  fi
done
```

I learned the hard way that this hook is necessary. During one session, a script that captured dashboard data contained a server IP. The pre-commit hook blocked it. Without that hook, it would have been pushed to a public repository.

## Multi-Channel Coverage

The sanitizer doesn't just protect blog posts. It guards every output channel:

- **Blog posts** — sanitized during generation, audited before publish, audited again at commit
- **YouTube video titles and descriptions** — scanned and cleaned via the same regex set
- **Social media posts** — Bluesky captions and Twitter/X tweets pass through sanitize() before posting
- **Video frames** — a separate OCR pipeline extracts text from screen recordings and blurs anything that matches the pattern set
- **Git commits** — pre-commit hook blocks any staged file with violations

Each channel uses the same core `sanitize()` and `audit()` functions. One pattern set, applied everywhere. When I add a new sensitive term, every channel is immediately protected.

## What I Learned Building This

**Double-replacement artifacts are real.** When you have overlapping patterns (a vendor name that contains a word that's also an industry term), you can end up with "a vendor a search API" instead of just "a search API." I added a cleanup pass that catches these compound replacements.

**Regex global flags reset matters.** In JavaScript, a regex with the `/g` flag maintains a `lastIndex` property. If you reuse the same regex object across multiple `match()` or `replace()` calls without resetting `lastIndex`, you get inconsistent results. I reset every regex before use.

**The audit is stricter than the sanitizer — by design.** The sanitizer tries to fix things. The audit just flags them. Sometimes the sanitizer replaces a vendor name with "a vendor" but the audit flags the replacement itself because it appears near a product count. That's intentional. The audit is paranoid. The sanitizer is practical.

**Year detection in audit patterns is tricky.** A pattern that catches "4+ digit numbers near product words" will also catch "2026 products launched." I filter out numbers between 2020-2030 to avoid false positives on dates.

**Three passes is the right number for auto-generation.** AI-generated content sometimes embeds sensitive terms in creative ways — inside analogies, as example names, or in code blocks. One sanitize pass catches the obvious ones. A second catches terms exposed by the first pass's replacements. A third catches edge cases. After three, if it's still failing, the content is too contaminated to fix automatically.

## The Pipeline in Practice

Here's what happens when my blog-agent generates a new post:

1. Claude generates raw markdown based on a topic prompt
2. The content runs through `sanitize()` — first pass
3. The result runs through `audit()` — if violations found, back to step 2 (up to 3 times)
4. If clean, the post is saved to the Astro content directory
5. Astro rebuilds the static site
6. The post URL is sent to Bluesky and Twitter via posting scripts
7. Those social posts also pass through `sanitize()` before sending
8. On next `git commit`, the pre-commit hook validates the new file again

If any step fails, the pipeline stops. No partial publishes. No "I'll fix it later." The sanitizer is the gatekeeper, and it doesn't negotiate.

## Results

Since deploying this system, I've caught and blocked:

- Server IPs in dashboard capture scripts
- Internal field names in technical blog posts
- Product counts that reveal business scale in social media captions
- Platform names in video titles
- Vendor identifiers that the AI hallucinated into "example" scenarios

The system has blocked content that I wouldn't have caught manually. That's the point. When you're publishing across five channels daily, human review doesn't scale. Automated, paranoid, multi-layer sanitization does.

---

## Ask Me Anything

Building content safety tools for public-facing AI systems? I'd love to hear your approach.

- [YouTube — @AgentAbrams](https://www.youtube.com/@AgentAbrams)
- [X — @agentabrams](https://x.com/agentabrams)
- [Bluesky — @agentabrams](https://bsky.app/profile/agentabrams.bsky.social)
- [goodquestion.ai](https://goodquestion.ai)

#!/usr/bin/env node
/**
 * Daily Claude Code Engagement — AgentAbrams
 * Targets 4 high-profile Claude Code accounts on X and Bluesky.
 * Designed for cron: 4 runs/day at different times, each run targets 1 account.
 *
 * Usage:
 *   node daily-claude-engage.cjs              # Auto-pick based on hour
 *   node daily-claude-engage.cjs --target 0   # Target specific account (0-3)
 *   node daily-claude-engage.cjs --platform bsky  # Bluesky only
 *   node daily-claude-engage.cjs --platform x     # X/Twitter only
 *   node daily-claude-engage.cjs --dry-run    # Preview without posting
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { BskyAgent, RichText } = require('@atproto/api');
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

// ═══ 4 HIGH-PROFILE CLAUDE CODE ACCOUNTS ═══
const TARGETS = [
  {
    name: 'Boris Cherny',
    x: 'bcherny',
    bsky: 'bcherny.bsky.social',  // Head of Claude Code
    keywords: ['claude code', 'claude', 'anthropic', 'agent', 'vibe coding', 'coding agent'],
    replies: [
      'This is what happens when you let the agents cook. Shipping > talking about shipping.',
      'The compound effect of autonomous agents is underrated. Every cycle builds on the last.',
      'Claude Code keeps raising the bar. Building with it daily and the delta is real.',
      'Been running multi-agent workflows with Claude Code — the reliability improvements are massive.',
    ],
  },
  {
    name: 'Claude (Official)',
    x: 'claudeai',
    bsky: null,  // No official Bluesky yet
    keywords: ['claude', 'anthropic', 'model', 'update', 'launch', 'coding'],
    replies: [
      'The autonomous agent pipeline keeps getting better. Running 24/7 multi-agent stacks on this.',
      'Shipping features faster than ever with Claude Code. The agent-to-agent handoffs are clean.',
      'This is the future of development — agents that actually understand context and ship code.',
      'Every update makes the autonomous workflow tighter. Agents building agents.',
    ],
  },
  {
    name: 'Nick Dobos',
    x: 'NickADobos',
    bsky: null,
    keywords: ['claude', 'claude code', 'agent', 'opus', 'sonnet', 'coding', 'vibe'],
    replies: [
      'The agent workflow stack is the real unlock. Once you go multi-agent, single-shot feels primitive.',
      'Exactly this. Claude Code + autonomous loops = shipping while you sleep.',
      'Been building a 15-agent system on Claude Code — each agent owns a domain. Compounding is wild.',
      'The iteration speed with Claude Code is unmatched. Ship, test, iterate, repeat.',
    ],
  },
  {
    name: 'Claude Code Community',
    x: 'claude_code',
    bsky: null,
    keywords: ['claude code', 'extension', 'mcp', 'feature', 'release', 'tool', 'agent'],
    replies: [
      'Great drop. Running this in production across multiple agents — the MCP integrations are chef\'s kiss.',
      'The community keeps shipping. This is what open-source agent infrastructure looks like.',
      'Tested this immediately. Works perfectly in the multi-agent pipeline.',
      'Love seeing the Claude Code ecosystem grow. More tools = more leverage.',
    ],
  },
];

// ═══ STATE: Track what we've already engaged with (prevent spam) ═══
const STATE_FILE = path.join(__dirname, '..', '.claude-engage-state.json');

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { engaged: {}, lastRun: {} }; }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ═══ PARSE ARGS ═══
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const platformFlag = args.includes('--platform') ? args[args.indexOf('--platform') + 1] : 'both';
let targetIdx = args.includes('--target') ? parseInt(args[args.indexOf('--target') + 1]) : -1;

// Auto-pick target based on hour of day (spread across 4 slots)
if (targetIdx < 0) {
  const hour = new Date().getHours();
  // Map hours to targets: 8am→0, 12pm→1, 4pm→2, 8pm→3
  if (hour < 10) targetIdx = 0;
  else if (hour < 14) targetIdx = 1;
  else if (hour < 18) targetIdx = 2;
  else targetIdx = 3;
}
targetIdx = Math.min(targetIdx, TARGETS.length - 1);

const target = TARGETS[targetIdx];
console.log(`\n═══ AgentAbrams Daily Engage ═══`);
console.log(`Target: ${target.name} (@${target.x})${DRY_RUN ? ' [DRY RUN]' : ''}`);
console.log(`Platform: ${platformFlag}`);
console.log(`Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT\n`);

// ═══ BLUESKY ENGAGEMENT ═══
async function engageBluesky() {
  if (!target.bsky) { console.log('[Bluesky] No Bluesky handle for', target.name); return; }

  const agent = new BskyAgent({ service: 'https://bsky.social' });
  await agent.login({ identifier: 'agentabrams.bsky.social', password: process.env.BSKY_PASSWORD || '*Blueaccess911*' });
  console.log('[Bluesky] Logged in as @agentabrams.bsky.social');

  // Resolve target DID
  let targetDid;
  try {
    const profile = await agent.getProfile({ actor: target.bsky });
    targetDid = profile.data.did;
    console.log(`[Bluesky] Found @${target.bsky} (${profile.data.displayName}) — ${profile.data.followersCount} followers`);

    // Follow if not already following
    if (!profile.data.viewer?.following) {
      if (!DRY_RUN) await agent.follow(targetDid);
      console.log(`[Bluesky] Followed @${target.bsky}`);
    }
  } catch (e) {
    console.log(`[Bluesky] Could not find @${target.bsky}: ${e.message}`);
    return;
  }

  // Get their recent posts
  const feed = await agent.getAuthorFeed({ actor: targetDid, limit: 10 });
  const posts = feed.data.feed.filter(p => {
    // Only their own posts (not reposts), from last 48h
    const age = Date.now() - new Date(p.post.record.createdAt).getTime();
    return p.post.author.did === targetDid && age < 48 * 60 * 60 * 1000;
  });

  console.log(`[Bluesky] ${posts.length} recent posts from @${target.bsky}`);
  const state = loadState();

  let liked = 0, replied = 0;
  for (const item of posts.slice(0, 5)) {
    const post = item.post;
    const postKey = `bsky:${post.uri}`;

    // Like all recent posts
    if (!post.viewer?.like && !state.engaged[postKey]) {
      if (!DRY_RUN) {
        try { await agent.like(post.uri, post.cid); liked++; } catch {}
      } else { liked++; }
      console.log(`  Liked: "${post.record.text.substring(0, 80)}..."`);
    }

    // Reply to one keyword-matching post per run
    if (replied === 0 && !state.engaged[postKey + ':reply']) {
      const text = (post.record.text || '').toLowerCase();
      const matches = target.keywords.some(k => text.includes(k));
      if (matches) {
        const reply = target.replies[Math.floor(Math.random() * target.replies.length)];
        if (!DRY_RUN) {
          try {
            const rt = new RichText({ text: reply });
            await rt.detectFacets(agent);
            await agent.post({
              text: rt.text,
              facets: rt.facets,
              reply: {
                root: { uri: post.uri, cid: post.cid },
                parent: { uri: post.uri, cid: post.cid },
              },
              createdAt: new Date().toISOString(),
            });
            replied++;
            state.engaged[postKey + ':reply'] = Date.now();
          } catch (e) { console.log(`  Reply failed: ${e.message}`); }
        } else {
          console.log(`  Would reply: "${reply.substring(0, 80)}..."`);
          replied++;
        }
      }
    }
    state.engaged[postKey] = Date.now();
  }

  saveState(state);
  console.log(`[Bluesky] Done: ${liked} likes, ${replied} replies\n`);
}

// ═══ X/TWITTER ENGAGEMENT ═══
async function engageTwitter() {
  if (!target.x) { console.log('[X] No X handle for', target.name); return; }

  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  });
  const me = await client.v2.me();
  console.log(`[X] Logged in as @${me.data.username}`);

  // Search for recent tweets from the target about Claude Code
  const query = `from:${target.x} -is:retweet`;
  let tweets = [];
  try {
    const result = await client.v2.search(query, {
      max_results: 10,
      'tweet.fields': 'created_at,public_metrics',
      expansions: 'author_id',
    });
    tweets = result.data?.data || [];
  } catch (e) {
    console.log(`[X] Search failed: ${e.message}`);
    // Fallback: get user timeline
    try {
      const user = await client.v2.userByUsername(target.x);
      if (user.data) {
        const timeline = await client.v2.userTimeline(user.data.id, {
          max_results: 10,
          'tweet.fields': 'created_at,public_metrics',
          exclude: ['retweets'],
        });
        tweets = timeline.data?.data || [];
      }
    } catch (e2) { console.log(`[X] Timeline fallback failed: ${e2.message}`); }
  }

  console.log(`[X] ${tweets.length} recent tweets from @${target.x}`);
  const state = loadState();

  let liked = 0, replied = 0, retweeted = 0;
  for (const tweet of tweets.slice(0, 5)) {
    const tweetKey = `x:${tweet.id}`;
    const age = Date.now() - new Date(tweet.created_at).getTime();
    if (age > 48 * 60 * 60 * 1000) continue; // Skip old tweets

    // Like
    if (!state.engaged[tweetKey]) {
      if (!DRY_RUN) {
        try { await client.v2.like(me.data.id, tweet.id); liked++; } catch {}
      } else { liked++; }
      console.log(`  Liked: "${tweet.text.substring(0, 80)}..."`);
      state.engaged[tweetKey] = Date.now();
    }

    // Retweet high-engagement posts (>50 likes)
    if (!state.engaged[tweetKey + ':rt'] && (tweet.public_metrics?.like_count || 0) > 50) {
      if (!DRY_RUN) {
        try { await client.v2.retweet(me.data.id, tweet.id); retweeted++; } catch {}
      } else { retweeted++; }
      console.log(`  Retweeted (${tweet.public_metrics?.like_count} likes)`);
      state.engaged[tweetKey + ':rt'] = Date.now();
    }

    // Reply to one keyword-matching tweet per run
    if (replied === 0 && !state.engaged[tweetKey + ':reply']) {
      const text = (tweet.text || '').toLowerCase();
      const matches = target.keywords.some(k => text.includes(k));
      if (matches) {
        const reply = target.replies[Math.floor(Math.random() * target.replies.length)];
        if (!DRY_RUN) {
          try {
            await client.v2.tweet({ text: reply, reply: { in_reply_to_tweet_id: tweet.id } });
            replied++;
            state.engaged[tweetKey + ':reply'] = Date.now();
          } catch (e) { console.log(`  Reply failed: ${e.message}`); }
        } else {
          console.log(`  Would reply: "${reply.substring(0, 80)}..."`);
          replied++;
        }
      }
    }
  }

  saveState(state);
  console.log(`[X] Done: ${liked} likes, ${retweeted} retweets, ${replied} replies\n`);
}

// ═══ CLEANUP: Prune state entries older than 7 days ═══
function pruneState() {
  const state = loadState();
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let pruned = 0;
  for (const [key, ts] of Object.entries(state.engaged)) {
    if (typeof ts === 'number' && ts < cutoff) {
      delete state.engaged[key];
      pruned++;
    }
  }
  if (pruned) console.log(`Pruned ${pruned} old state entries`);
  state.lastRun[targetIdx] = Date.now();
  saveState(state);
}

// ═══ MAIN ═══
async function main() {
  try {
    if (platformFlag === 'both' || platformFlag === 'bsky') await engageBluesky();
    if (platformFlag === 'both' || platformFlag === 'x') await engageTwitter();
    pruneState();
    console.log('═══ Engagement complete ═══');
  } catch (e) {
    console.error('Fatal error:', e.message);
    process.exit(1);
  }
}

main();

#!/usr/bin/env node
/**
 * Boris Watcher — monitors @bcherny for new tweets/posts
 * When Boris tweets, generates a "big news" amplification post giving him credit.
 *
 * Usage:
 *   node boris-watcher.cjs              # Check and amplify
 *   node boris-watcher.cjs --dry-run    # Preview without posting
 *   node boris-watcher.cjs --force      # Post even if already covered
 *
 * Cron: every 30min, 7am-10pm PT
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { BskyAgent, RichText } = require('@atproto/api');
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

const STATE_FILE = '/tmp/boris-watcher-state.json';
const BSKY_HANDLE = 'agentabrams.bsky.social';
const BSKY_PASSWORD = process.env.BSKY_PASSWORD;

const BORIS = {
  name: 'Boris Cherny',
  title: 'Head of Claude Code at Anthropic',
  x: 'bcherny',
  bsky: 'bcherny.bsky.social',
};

// Keywords that make a Boris tweet newsworthy (not every tweet needs coverage)
const NEWS_KEYWORDS = [
  'claude code', 'claude', 'anthropic', 'agent', 'release', 'launch',
  'ship', 'update', 'feature', 'model', 'opus', 'sonnet', 'haiku',
  'mcp', 'tool use', 'coding', 'developer', 'sdk', 'api',
  'benchmark', 'context', 'autonomous', 'agentic', 'vibe cod',
];

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
  };
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')); }
  catch { return { coveredPosts: {}, lastCheck: null }; }
}

function saveState(state) {
  state.lastCheck = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Generate a "big news" post based on Boris's tweet content
 */
function generateAmplificationPost(tweetText, platform) {
  // Analyze the tweet to understand the topic
  const lowerText = tweetText.toLowerCase();

  let topic = 'Claude Code';
  let angle = '';

  if (lowerText.includes('release') || lowerText.includes('launch') || lowerText.includes('ship') || lowerText.includes('just dropped')) {
    angle = 'just dropped news';
    topic = 'a new release';
  } else if (lowerText.includes('model') || lowerText.includes('opus') || lowerText.includes('sonnet') || lowerText.includes('haiku')) {
    angle = 'model update';
    topic = 'model improvements';
  } else if (lowerText.includes('agent') || lowerText.includes('autonomous') || lowerText.includes('agentic')) {
    angle = 'agentic capabilities';
    topic = 'agent workflows';
  } else if (lowerText.includes('mcp') || lowerText.includes('tool')) {
    angle = 'tooling update';
    topic = 'developer tooling';
  } else if (lowerText.includes('benchmark') || lowerText.includes('performance')) {
    angle = 'performance news';
    topic = 'performance gains';
  } else if (lowerText.includes('context') || lowerText.includes('window')) {
    angle = 'context improvements';
    topic = 'context handling';
  } else if (lowerText.includes('feature') || lowerText.includes('update')) {
    angle = 'feature update';
    topic = 'new capabilities';
  } else {
    angle = 'development insight';
    topic = 'building with Claude Code';
  }

  // Extract the core message (first sentence or up to 120 chars)
  let coreSummary = tweetText.split(/[.!?\n]/)[0].trim();
  if (coreSummary.length > 120) coreSummary = coreSummary.substring(0, 117) + '...';

  // Build the amplification post
  const templates = [
    `Big news from @${platform === 'bsky' ? BORIS.bsky : BORIS.x} (${BORIS.title}):\n\n"${coreSummary}"\n\nThis is huge for everyone building with Claude Code. The ${topic} space keeps accelerating.\n\n#ClaudeCode #Anthropic #BuildInPublic`,

    `${BORIS.name}, ${BORIS.title}, just shared something worth paying attention to:\n\n"${coreSummary}"\n\nIf you're building with Claude Code, this matters. ${angle === 'just dropped news' ? 'Go check it out.' : 'The pace of improvement is incredible.'}\n\n#ClaudeCode #AI #BuildInPublic`,

    `Heads up builders — @${platform === 'bsky' ? BORIS.bsky : BORIS.x} just posted about ${topic}:\n\n"${coreSummary}"\n\nBuilding with Claude Code daily and these updates compound fast. Credit to the team at Anthropic.\n\n#ClaudeCode #BuildInPublic`,
  ];

  // Pick a template (rotate based on hour)
  const idx = new Date().getHours() % templates.length;
  return templates[idx];
}

/**
 * Check Bluesky for Boris's recent posts
 */
async function checkBlueskyBoris(state, opts) {
  const agent = new BskyAgent({ service: 'https://bsky.social' });
  await agent.login({ identifier: BSKY_HANDLE, password: BSKY_PASSWORD });

  const profile = await agent.getProfile({ actor: BORIS.bsky });
  const feed = await agent.getAuthorFeed({ actor: profile.data.did, limit: 10 });

  const newPosts = [];
  for (const item of feed.data.feed) {
    if (item.post.author.did !== profile.data.did) continue; // Skip reposts

    const postAge = Date.now() - new Date(item.post.record.createdAt).getTime();
    if (postAge > 12 * 60 * 60 * 1000) continue; // Only last 12h

    const postKey = `bsky:${item.post.uri}`;
    if (state.coveredPosts[postKey] && !opts.force) continue;

    const text = item.post.record.text || '';
    const isNewsworthy = NEWS_KEYWORDS.some(k => text.toLowerCase().includes(k));

    if (isNewsworthy) {
      newPosts.push({
        platform: 'bsky',
        key: postKey,
        text,
        uri: item.post.uri,
        cid: item.post.cid,
        createdAt: item.post.record.createdAt,
        metrics: {
          likes: item.post.likeCount || 0,
          reposts: item.post.repostCount || 0,
          replies: item.post.replyCount || 0,
        },
      });
    }
  }

  // Like all his recent posts regardless
  for (const item of feed.data.feed) {
    if (item.post.author.did !== profile.data.did) continue;
    if (!item.post.viewer?.like && !opts.dryRun) {
      try { await agent.like(item.post.uri, item.post.cid); } catch {}
    }
  }

  return { agent, newPosts };
}

/**
 * Check X/Twitter for Boris's recent tweets
 */
async function checkTwitterBoris(state, opts) {
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  });

  const newPosts = [];

  try {
    const user = await client.v2.userByUsername(BORIS.x);
    if (!user.data) return { client, newPosts };

    const timeline = await client.v2.userTimeline(user.data.id, {
      max_results: 10,
      'tweet.fields': 'created_at,public_metrics',
      exclude: ['retweets'],
    });

    const me = await client.v2.me();

    for (const tweet of (timeline.data?.data || [])) {
      const tweetAge = Date.now() - new Date(tweet.created_at).getTime();
      if (tweetAge > 12 * 60 * 60 * 1000) continue;

      const postKey = `x:${tweet.id}`;
      if (state.coveredPosts[postKey] && !opts.force) continue;

      const isNewsworthy = NEWS_KEYWORDS.some(k => tweet.text.toLowerCase().includes(k));

      if (isNewsworthy) {
        newPosts.push({
          platform: 'x',
          key: postKey,
          text: tweet.text,
          tweetId: tweet.id,
          createdAt: tweet.created_at,
          metrics: tweet.public_metrics || {},
        });
      }

      // Like all his recent tweets
      if (!opts.dryRun) {
        try { await client.v2.like(me.data.id, tweet.id); } catch {}
      }
    }
  } catch (e) {
    if (e.message && e.message.includes('429')) {
      console.warn('[X] Rate limited — will retry next run');
    } else {
      console.error('[X] Error:', e.message);
    }
  }

  return { client, newPosts };
}

/**
 * Post amplification to both platforms
 */
async function amplify(post, state, opts) {
  console.log(`\n=== AMPLIFYING: ${post.platform} post ===`);
  console.log(`Boris said: "${post.text.substring(0, 100)}..."`);
  console.log(`Metrics: ${JSON.stringify(post.metrics)}`);

  // Generate amplification posts for each platform
  const bskyPost = generateAmplificationPost(post.text, 'bsky');
  const xPost = generateAmplificationPost(post.text, 'x');

  if (opts.dryRun) {
    console.log('\n[DRY RUN] Would post to Bluesky:', bskyPost);
    console.log('\n[DRY RUN] Would post to X:', xPost);
    return;
  }

  // Post to Bluesky
  try {
    const agent = new BskyAgent({ service: 'https://bsky.social' });
    await agent.login({ identifier: BSKY_HANDLE, password: BSKY_PASSWORD });

    let bskyText = bskyPost;
    if (bskyText.length > 300) bskyText = bskyText.substring(0, 297) + '...';

    const rt = new RichText({ text: bskyText });
    await rt.detectFacets(agent);
    const result = await agent.post({
      text: rt.text,
      facets: rt.facets,
      createdAt: new Date().toISOString(),
    });
    const postId = result.uri.split('/').pop();
    console.log(`[Bluesky] Amplification posted: https://bsky.app/profile/${BSKY_HANDLE}/post/${postId}`);
  } catch (e) {
    console.error('[Bluesky] Amplification failed:', e.message);
  }

  // Post to X/Twitter
  try {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    let tweetText = xPost;
    if (tweetText.length > 280) tweetText = tweetText.substring(0, 277) + '...';

    const result = await client.v2.tweet(tweetText);
    console.log(`[X] Amplification posted: https://x.com/agentabrams/status/${result.data.id}`);
  } catch (e) {
    if (e.message && e.message.includes('429')) {
      // Save for retry
      fs.writeFileSync('/tmp/x-pending-boris-amplify.json', JSON.stringify({
        text: xPost,
        borisPost: post.key,
        created: new Date().toISOString(),
      }, null, 2));
      console.warn('[X] Rate limited — saved for retry at /tmp/x-pending-boris-amplify.json');
    } else {
      console.error('[X] Amplification failed:', e.message);
    }
  }

  // Mark as covered
  state.coveredPosts[post.key] = {
    coveredAt: new Date().toISOString(),
    originalText: post.text.substring(0, 200),
  };
}

async function main() {
  const opts = parseArgs();
  const state = loadState();

  console.log(`\n═══ Boris Watcher ═══`);
  console.log(`Time: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT`);
  console.log(`Last check: ${state.lastCheck || 'never'}`);
  if (opts.dryRun) console.log('[DRY RUN MODE]');

  let allNewPosts = [];

  // Check Bluesky
  console.log('\n[Bluesky] Checking @bcherny.bsky.social...');
  try {
    const { newPosts } = await checkBlueskyBoris(state, opts);
    console.log(`[Bluesky] ${newPosts.length} newsworthy posts found`);
    allNewPosts = allNewPosts.concat(newPosts);
  } catch (e) {
    console.error('[Bluesky] Error:', e.message);
  }

  // Check X/Twitter
  console.log('\n[X] Checking @bcherny...');
  try {
    const { newPosts } = await checkTwitterBoris(state, opts);
    console.log(`[X] ${newPosts.length} newsworthy tweets found`);
    allNewPosts = allNewPosts.concat(newPosts);
  } catch (e) {
    console.error('[X] Error:', e.message);
  }

  // Amplify the most recent newsworthy post (max 1 per run to avoid spam)
  if (allNewPosts.length > 0) {
    // Sort by recency, pick most recent
    allNewPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    await amplify(allNewPosts[0], state, opts);

    // If there are more, log them
    if (allNewPosts.length > 1) {
      console.log(`\n${allNewPosts.length - 1} more newsworthy posts (will cover next run):`);
      for (const p of allNewPosts.slice(1)) {
        console.log(`  - ${p.platform}: "${p.text.substring(0, 80)}..."`);
      }
    }
  } else {
    console.log('\nNo new newsworthy Boris posts to amplify.');
  }

  // Prune old state entries (>7 days)
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const [key, val] of Object.entries(state.coveredPosts)) {
    if (val.coveredAt && new Date(val.coveredAt).getTime() < cutoff) {
      delete state.coveredPosts[key];
    }
  }

  saveState(state);
  console.log('\n═══ Boris Watcher complete ═══');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

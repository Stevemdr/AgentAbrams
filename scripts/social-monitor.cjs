#!/usr/bin/env node
/**
 * Social Monitor — checks for new mentions/replies on Bluesky + X/Twitter
 * Usage:
 *   node social-monitor.cjs                    # Check both platforms
 *   node social-monitor.cjs --platform bsky    # Bluesky only
 *   node social-monitor.cjs --platform x       # X only
 *   node social-monitor.cjs --slack             # Send summary to Slack
 *   node social-monitor.cjs --since 2h          # Only last 2 hours
 *
 * Stores last-check timestamps in /tmp/social-monitor-state.json
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { BskyAgent } = require('@atproto/api');
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const https = require('https');
const http = require('http');

const STATE_FILE = '/tmp/social-monitor-state.json';
const BSKY_HANDLE = 'agentabrams.bsky.social';
const BSKY_PASSWORD = process.env.BSKY_PASSWORD;
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;

function parseArgs() {
  const args = process.argv.slice(2);
  const r = { platform: 'both', slack: false, since: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--platform' && args[i + 1]) r.platform = args[++i];
    if (args[i] === '--slack') r.slack = true;
    if (args[i] === '--since' && args[i + 1]) r.since = args[++i];
  }
  return r;
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return { bsky: { lastCheck: null, lastSeenUri: null }, x: { lastCheck: null, lastSeenId: null } };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function parseSince(since) {
  if (!since) return null;
  const match = since.match(/^(\d+)(h|m|d)$/);
  if (!match) return null;
  const [, num, unit] = match;
  const ms = { h: 3600000, m: 60000, d: 86400000 }[unit];
  return new Date(Date.now() - parseInt(num) * ms);
}

async function checkBluesky(state, sinceDate) {
  const agent = new BskyAgent({ service: 'https://bsky.social' });
  await agent.login({ identifier: BSKY_HANDLE, password: BSKY_PASSWORD });

  const notifications = [];

  try {
    const res = await agent.listNotifications({ limit: 50 });
    const items = res.data.notifications || [];

    for (const n of items) {
      // Filter to replies, mentions, likes, reposts, follows
      const createdAt = new Date(n.indexedAt);

      // Skip if before sinceDate or last check
      const cutoff = sinceDate || (state.bsky.lastCheck ? new Date(state.bsky.lastCheck) : new Date(Date.now() - 86400000));
      if (createdAt < cutoff) continue;

      const entry = {
        platform: 'bluesky',
        type: n.reason,
        author: n.author.handle,
        displayName: n.author.displayName || n.author.handle,
        time: n.indexedAt,
        uri: n.uri,
        cid: n.cid,
      };

      // For replies, get the text
      if (n.reason === 'reply' && n.record && n.record.text) {
        entry.text = n.record.text;
        // Get the parent URI for threading
        if (n.record.reply && n.record.reply.parent) {
          entry.parentUri = n.record.reply.parent.uri;
        }
      }

      // For mentions
      if (n.reason === 'mention' && n.record && n.record.text) {
        entry.text = n.record.text;
      }

      // For likes/reposts, note what was liked
      if ((n.reason === 'like' || n.reason === 'repost') && n.reasonSubject) {
        entry.subjectUri = n.reasonSubject;
      }

      if (n.reason === 'follow') {
        entry.text = `New follower: ${entry.displayName}`;
      }

      notifications.push(entry);
    }
  } catch (e) {
    console.error('[Bluesky] Error fetching notifications:', e.message);
  }

  state.bsky.lastCheck = new Date().toISOString();
  if (notifications.length > 0) {
    state.bsky.lastSeenUri = notifications[0].uri;
  }

  return notifications;
}

async function checkTwitter(state, sinceDate) {
  const notifications = [];

  try {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    // Get user ID first
    const me = await client.v2.me();
    const userId = me.data.id;

    // Get mentions timeline
    const params = {
      max_results: 20,
      'tweet.fields': 'created_at,author_id,in_reply_to_user_id,conversation_id',
      'user.fields': 'username,name',
      expansions: 'author_id',
    };

    if (state.x.lastSeenId) {
      params.since_id = state.x.lastSeenId;
    }

    const mentions = await client.v2.userMentionTimeline(userId, params);

    const users = {};
    if (mentions.includes && mentions.includes.users) {
      for (const u of mentions.includes.users) {
        users[u.id] = { username: u.username, name: u.name };
      }
    }

    if (mentions.data && mentions.data.data) {
      for (const tweet of mentions.data.data) {
        const createdAt = new Date(tweet.created_at);
        const cutoff = sinceDate || (state.x.lastCheck ? new Date(state.x.lastCheck) : new Date(Date.now() - 86400000));
        if (createdAt < cutoff) continue;

        const author = users[tweet.author_id] || { username: 'unknown', name: 'Unknown' };

        notifications.push({
          platform: 'x',
          type: tweet.in_reply_to_user_id ? 'reply' : 'mention',
          author: author.username,
          displayName: author.name,
          time: tweet.created_at,
          text: tweet.text,
          tweetId: tweet.id,
          conversationId: tweet.conversation_id,
        });
      }
    }

    state.x.lastCheck = new Date().toISOString();
    if (notifications.length > 0) {
      state.x.lastSeenId = notifications[0].tweetId;
    }
  } catch (e) {
    if (e.message && e.message.includes('429')) {
      console.warn('[X] Rate limited — skipping');
    } else {
      console.error('[X] Error fetching mentions:', e.message);
    }
  }

  return notifications;
}

function formatNotifications(items) {
  if (items.length === 0) return 'No new notifications.';

  const lines = [];
  const byType = {};
  for (const n of items) {
    const key = n.type;
    if (!byType[key]) byType[key] = [];
    byType[key].push(n);
  }

  // Replies first (most important for engagement)
  if (byType.reply) {
    lines.push(`\n== REPLIES (${byType.reply.length}) ==`);
    for (const r of byType.reply) {
      const platform = r.platform === 'bluesky' ? '[BSky]' : '[X]';
      lines.push(`${platform} @${r.author}: "${r.text}"`);
      if (r.uri) lines.push(`  -> Reply: node social-reply.cjs --platform bsky --uri "${r.uri}" --text "your reply"`);
      if (r.tweetId) lines.push(`  -> Reply: node social-reply.cjs --platform x --tweet-id "${r.tweetId}" --text "your reply"`);
    }
  }

  // Mentions
  if (byType.mention) {
    lines.push(`\n== MENTIONS (${byType.mention.length}) ==`);
    for (const m of byType.mention) {
      const platform = m.platform === 'bluesky' ? '[BSky]' : '[X]';
      lines.push(`${platform} @${m.author}: "${m.text}"`);
    }
  }

  // Follows
  if (byType.follow) {
    lines.push(`\n== NEW FOLLOWERS (${byType.follow.length}) ==`);
    for (const f of byType.follow) {
      lines.push(`[BSky] ${f.displayName} (@${f.author})`);
    }
  }

  // Likes/reposts (summary only)
  if (byType.like) lines.push(`\n${byType.like.length} new likes`);
  if (byType.repost) lines.push(`${byType.repost.length} new reposts`);

  return lines.join('\n');
}

async function sendSlack(text) {
  if (!SLACK_WEBHOOK) {
    console.warn('[Slack] No SLACK_WEBHOOK_URL in .env — skipping');
    return;
  }
  const payload = JSON.stringify({ text: `*Social Monitor*\n${text}` });
  const url = new URL(SLACK_WEBHOOK);
  const proto = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = proto.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
      res.on('data', () => {});
      res.on('end', resolve);
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const opts = parseArgs();
  const state = loadState();
  const sinceDate = parseSince(opts.since);
  let allNotifications = [];

  if (opts.platform === 'both' || opts.platform === 'bsky') {
    console.log('[Bluesky] Checking notifications...');
    const bskyNotifs = await checkBluesky(state, sinceDate);
    allNotifications = allNotifications.concat(bskyNotifs);
    console.log(`[Bluesky] Found ${bskyNotifs.length} new notifications`);
  }

  if (opts.platform === 'both' || opts.platform === 'x') {
    console.log('[X] Checking mentions...');
    const xNotifs = await checkTwitter(state, sinceDate);
    allNotifications = allNotifications.concat(xNotifs);
    console.log(`[X] Found ${xNotifs.length} new notifications`);
  }

  saveState(state);

  const summary = formatNotifications(allNotifications);
  console.log(summary);

  // Save full results for reference
  if (allNotifications.length > 0) {
    fs.writeFileSync('/tmp/social-monitor-latest.json', JSON.stringify(allNotifications, null, 2));
    console.log(`\nFull data saved to /tmp/social-monitor-latest.json`);
  }

  if (opts.slack && allNotifications.length > 0) {
    await sendSlack(summary);
    console.log('[Slack] Notification sent');
  }

  // Return for programmatic use
  return allNotifications;
}

// Export for use by blog-agent
module.exports = { checkBluesky, checkTwitter, formatNotifications };

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

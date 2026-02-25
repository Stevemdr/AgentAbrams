#!/usr/bin/env node
/**
 * Social Reply — reply to comments on Bluesky + X/Twitter
 * Usage:
 *   node social-reply.cjs --platform bsky --uri "at://..." --cid "baf..." --text "Thanks!"
 *   node social-reply.cjs --platform x --tweet-id "123456" --text "Thanks!"
 *   node social-reply.cjs --latest           # Show latest reply-worthy notifications
 *   node social-reply.cjs --latest --auto    # Auto-generate and post replies (AI mode)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { BskyAgent, RichText } = require('@atproto/api');
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

const BSKY_HANDLE = 'agentabrams.bsky.social';
const BSKY_PASSWORD = process.env.BSKY_PASSWORD;

function parseArgs() {
  const args = process.argv.slice(2);
  const r = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--platform' && args[i + 1]) r.platform = args[++i];
    if (args[i] === '--uri' && args[i + 1]) r.uri = args[++i];
    if (args[i] === '--cid' && args[i + 1]) r.cid = args[++i];
    if (args[i] === '--tweet-id' && args[i + 1]) r.tweetId = args[++i];
    if (args[i] === '--text' && args[i + 1]) r.text = args[++i];
    if (args[i] === '--latest') r.latest = true;
    if (args[i] === '--auto') r.auto = true;
  }
  return r;
}

async function replyBluesky(uri, cid, text) {
  const agent = new BskyAgent({ service: 'https://bsky.social' });
  await agent.login({ identifier: BSKY_HANDLE, password: BSKY_PASSWORD });

  // If no CID provided, fetch the post to get it
  if (!cid) {
    // Extract DID and rkey from URI: at://did:plc:xxx/app.bsky.feed.post/rkey
    const parts = uri.split('/');
    const did = parts[2];
    const rkey = parts[4];
    const thread = await agent.getPostThread({ uri });
    cid = thread.data.thread.post.cid;
  }

  // Determine root (for threading)
  let root = { uri, cid };
  try {
    const thread = await agent.getPostThread({ uri });
    if (thread.data.thread.post.record.reply) {
      root = thread.data.thread.post.record.reply.root;
    }
  } catch (e) {
    // If we can't get thread, treat this post as root
  }

  const rt = new RichText({ text });
  await rt.detectFacets(agent);

  const result = await agent.post({
    text: rt.text,
    facets: rt.facets,
    reply: {
      root: root,
      parent: { uri, cid },
    },
    createdAt: new Date().toISOString(),
  });

  const postId = result.uri.split('/').pop();
  return {
    success: true,
    url: `https://bsky.app/profile/${BSKY_HANDLE}/post/${postId}`,
    uri: result.uri,
  };
}

async function replyTwitter(tweetId, text) {
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  });

  let replyText = text;
  if (replyText.length > 280) replyText = replyText.substring(0, 277) + '...';

  const result = await client.v2.reply(replyText, tweetId);
  return {
    success: true,
    id: result.data.id,
    url: `https://x.com/agentabrams/status/${result.data.id}`,
  };
}

async function showLatest() {
  // Load latest monitor results
  const dataFile = '/tmp/social-monitor-latest.json';
  if (!fs.existsSync(dataFile)) {
    console.log('No recent notifications. Run social-monitor.cjs first.');
    return [];
  }

  const items = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  const replyWorthy = items.filter(n => n.type === 'reply' || n.type === 'mention');

  if (replyWorthy.length === 0) {
    console.log('No replies or mentions to respond to.');
    return [];
  }

  console.log(`\n${replyWorthy.length} reply-worthy notifications:\n`);
  replyWorthy.forEach((n, i) => {
    const platform = n.platform === 'bluesky' ? '[BSky]' : '[X]';
    console.log(`${i + 1}. ${platform} @${n.author} (${n.type}):`);
    console.log(`   "${n.text}"`);
    if (n.uri) console.log(`   Reply: node social-reply.cjs --platform bsky --uri "${n.uri}" --text "your reply"`);
    if (n.tweetId) console.log(`   Reply: node social-reply.cjs --platform x --tweet-id "${n.tweetId}" --text "your reply"`);
    console.log();
  });

  return replyWorthy;
}

async function main() {
  const opts = parseArgs();

  if (opts.latest) {
    await showLatest();
    return;
  }

  if (!opts.platform || !opts.text) {
    console.error('Usage:');
    console.error('  node social-reply.cjs --platform bsky --uri "at://..." --text "reply"');
    console.error('  node social-reply.cjs --platform x --tweet-id "123" --text "reply"');
    console.error('  node social-reply.cjs --latest');
    process.exit(1);
  }

  if (opts.platform === 'bsky') {
    if (!opts.uri) { console.error('--uri required for Bluesky'); process.exit(1); }
    console.log(`[Bluesky] Replying to ${opts.uri}...`);
    const result = await replyBluesky(opts.uri, opts.cid, opts.text);
    console.log('[Bluesky] Reply posted:', result.url);
  } else if (opts.platform === 'x') {
    if (!opts.tweetId) { console.error('--tweet-id required for X'); process.exit(1); }
    console.log(`[X] Replying to tweet ${opts.tweetId}...`);
    const result = await replyTwitter(opts.tweetId, opts.text);
    console.log('[X] Reply posted:', result.url);
  }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });

#!/usr/bin/env node
/**
 * Unified Social Poster — posts to Bluesky + X/Twitter simultaneously
 * Usage:
 *   node social-post.cjs --text "Post text" [--url "https://..."] [--link-text "Read more"]
 *   node social-post.cjs --blog "Post Title" --slug "post-slug"
 *
 * Handles rate limits: saves failed tweets to /tmp/x-pending-tweet.json for cron retry.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { BskyAgent, RichText } = require('@atproto/api');
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');

const BSKY_HANDLE = 'agentabrams.bsky.social';
const BSKY_PASSWORD = process.env.BSKY_PASSWORD;
const BASE_URL = 'https://goodquestion.ai';

function parseArgs() {
  const args = process.argv.slice(2);
  const r = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--text' && args[i + 1]) r.text = args[++i];
    if (args[i] === '--url' && args[i + 1]) r.url = args[++i];
    if (args[i] === '--link-text' && args[i + 1]) r.linkText = args[++i];
    if (args[i] === '--blog' && args[i + 1]) r.blogTitle = args[++i];
    if (args[i] === '--slug' && args[i + 1]) r.slug = args[++i];
    if (args[i] === '--tags' && args[i + 1]) r.tags = args[++i];
    if (args[i] === '--bsky-only') r.bskyOnly = true;
    if (args[i] === '--x-only') r.xOnly = true;
    if (args[i] === '--dry-run') r.dryRun = true;
  }
  return r;
}

async function postBluesky(text, url, linkText) {
  const agent = new BskyAgent({ service: 'https://bsky.social' });
  await agent.login({ identifier: BSKY_HANDLE, password: BSKY_PASSWORD });

  let fullText = text;
  if (url && !fullText.includes(url)) fullText += '\n\n' + url;
  if (fullText.length > 300) fullText = fullText.substring(0, 297) + '...';

  const rt = new RichText({ text: fullText });
  await rt.detectFacets(agent);

  let embed = undefined;
  if (url) {
    embed = {
      $type: 'app.bsky.embed.external',
      external: {
        uri: url,
        title: linkText || text.substring(0, 60),
        description: 'Read more at goodquestion.ai',
      },
    };
  }

  const result = await agent.post({
    text: rt.text,
    facets: rt.facets,
    embed,
    createdAt: new Date().toISOString(),
  });

  const postId = result.uri.split('/').pop();
  return {
    success: true,
    uri: result.uri,
    cid: result.cid,
    url: `https://bsky.app/profile/${BSKY_HANDLE}/post/${postId}`,
  };
}

async function postTwitter(text) {
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  });

  let tweetText = text;
  if (tweetText.length > 280) tweetText = tweetText.substring(0, 277) + '...';

  const result = await client.v2.tweet(tweetText);
  return {
    success: true,
    id: result.data.id,
    url: `https://x.com/agentabrams/status/${result.data.id}`,
  };
}

function savePendingTweet(text) {
  const pending = {
    text,
    retries: 0,
    created: new Date().toISOString(),
  };
  fs.writeFileSync('/tmp/x-pending-tweet.json', JSON.stringify(pending, null, 2));
  console.log('[X] Saved to /tmp/x-pending-tweet.json for cron retry');
}

async function main() {
  const opts = parseArgs();

  // Build post text from either --text or --blog mode
  let text, url;
  if (opts.blogTitle && opts.slug) {
    url = `${BASE_URL}/posts/${opts.slug}/`;
    const tags = opts.tags ? opts.tags.split(',').map(t => `#${t.trim()}`).join(' ') : '#ClaudeCode #BuildInPublic';
    text = `${opts.blogTitle}\n\n${url}\n\n${tags}`;
  } else if (opts.text) {
    text = opts.text;
    url = opts.url;
  } else {
    console.error('Usage:');
    console.error('  node social-post.cjs --text "Post text" [--url "https://..."]');
    console.error('  node social-post.cjs --blog "Title" --slug "post-slug" [--tags "ai,claude"]');
    process.exit(1);
  }

  if (opts.dryRun) {
    console.log('[DRY RUN]');
    console.log('Text:', text);
    console.log('URL:', url || '(none)');
    return;
  }

  const results = { bluesky: null, twitter: null };

  // Post to Bluesky
  if (!opts.xOnly) {
    try {
      results.bluesky = await postBluesky(text, url, opts.linkText);
      console.log('[Bluesky] Posted:', results.bluesky.url);
    } catch (e) {
      console.error('[Bluesky] Failed:', e.message);
      results.bluesky = { success: false, error: e.message };
    }
  }

  // Post to X/Twitter
  if (!opts.bskyOnly) {
    try {
      results.twitter = await postTwitter(text);
      console.log('[X] Posted:', results.twitter.url);
    } catch (e) {
      if (e.message && e.message.includes('429')) {
        console.warn('[X] Rate limited (429) — saving for retry');
        savePendingTweet(text);
        results.twitter = { success: false, error: 'rate_limited', saved: true };
      } else {
        console.error('[X] Failed:', e.message);
        results.twitter = { success: false, error: e.message };
      }
    }
  }

  // Summary
  console.log('\n--- Results ---');
  if (results.bluesky) console.log('Bluesky:', results.bluesky.success ? results.bluesky.url : `FAILED (${results.bluesky.error})`);
  if (results.twitter) console.log('X/Twitter:', results.twitter.success ? results.twitter.url : `FAILED (${results.twitter.error})`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

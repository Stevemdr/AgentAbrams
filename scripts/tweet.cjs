/**
 * Post a tweet as @agentabrams
 * Usage: node tweet.cjs "Your tweet text here"
 * Or: node tweet.cjs --post "title" --url "https://goodquestion.ai/posts/slug/"
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

async function tweet() {
  const args = process.argv.slice(2);

  let text;

  if (args[0] === '--post' && args[1] && args[2] === '--url' && args[3]) {
    // Blog post promotion format
    const title = args[1];
    const url = args[3];
    const tags = args[4] === '--tags' ? args[5] : '';
    const hashtags = tags ? tags.split(',').map(t => `#${t.trim()}`).join(' ') : '#ClaudeCode #DevBlog';
    text = `New post: "${title}"\n\n${url}\n\n${hashtags}`;
  } else if (args.length > 0) {
    // Raw text
    text = args.join(' ');
  } else {
    console.error('Usage:');
    console.error('  node tweet.cjs "Your tweet text"');
    console.error('  node tweet.cjs --post "Title" --url "https://..." --tags "tag1,tag2"');
    process.exit(1);
  }

  if (text.length > 280) {
    console.error(`Tweet too long: ${text.length}/280 chars`);
    console.error('Truncating...');
    text = text.substring(0, 277) + '...';
  }

  console.log(`Tweeting (${text.length}/280 chars):\n${text}\n`);

  try {
    const result = await client.v2.tweet(text);
    console.log('Tweet posted!');
    console.log(`ID: ${result.data.id}`);
    console.log(`URL: https://x.com/agentabrams/status/${result.data.id}`);
  } catch (err) {
    console.error('Tweet failed:', err.message);
    if (err.data) console.error(JSON.stringify(err.data, null, 2));
    process.exit(1);
  }
}

tweet();

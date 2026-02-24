/**
 * Post a tweet with an image as @agentabrams
 * Usage: node tweet-image.cjs "Tweet text" /path/to/image.png
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

async function tweetWithImage() {
  const text = process.argv[2];
  const imagePath = process.argv[3];

  if (!text || !imagePath) {
    console.error('Usage: node tweet-image.cjs "Tweet text" /path/to/image.png');
    process.exit(1);
  }

  if (!fs.existsSync(imagePath)) {
    console.error(`Image not found: ${imagePath}`);
    process.exit(1);
  }

  const stats = fs.statSync(imagePath);
  console.log(`Image: ${imagePath} (${(stats.size / 1024).toFixed(0)} KB)`);
  console.log(`Text: ${text} (${text.length}/280 chars)\n`);

  try {
    // Upload media via v1 API
    console.log('Uploading image...');
    const mediaId = await client.v1.uploadMedia(imagePath, { mimeType: 'image/png' });
    console.log(`Media uploaded: ${mediaId}`);

    // Post tweet with media via v2 API
    console.log('Posting tweet...');
    const result = await client.v2.tweet({
      text: text,
      media: { media_ids: [mediaId] },
    });

    console.log('Tweet posted!');
    console.log(`ID: ${result.data.id}`);
    console.log(`URL: https://x.com/agentabrams/status/${result.data.id}`);
  } catch (err) {
    console.error('Failed:', err.message);
    if (err.data) console.error(JSON.stringify(err.data, null, 2));
    process.exit(1);
  }
}

tweetWithImage();

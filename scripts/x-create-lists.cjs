/**
 * Create X/Twitter Lists for @goodquestionai
 * Handles rate limiting with exponential backoff
 * Usage: node x-create-lists.cjs
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const LISTS = [
  { name: 'Claude & Anthropic', description: 'Anthropic team, Claude ecosystem builders, and Claude Code power users.' },
  { name: 'Dev Tools & Infra', description: 'Developer tools, infrastructure, DevOps, and the people making developers more productive.' },
  { name: 'Open Source Leaders', description: 'Open source maintainers, contributors, and advocates building in public.' },
  { name: 'Build In Public', description: 'Founders and devs sharing their journey — code, revenue, mistakes, and wins.' },
];

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  // Check existing lists first
  const me = await client.v2.me();
  console.log(`Account: @${me.data.username}`);
  const existing = await client.v2.listsOwned(me.data.id);
  const existingNames = (existing.data || []).map(l => l.name);
  console.log(`Existing lists: ${existingNames.join(', ') || 'none'}`);

  for (const list of LISTS) {
    if (existingNames.includes(list.name)) {
      console.log(`Skipping "${list.name}" — already exists`);
      continue;
    }
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const result = await client.v2.createList({ name: list.name, description: list.description, private: false });
        console.log(`Created: "${list.name}" → ID: ${result.data.id}`);
        break;
      } catch (e) {
        if (e.message.includes('429') && attempt < 5) {
          const delay = attempt * 60;
          console.log(`Rate limited on "${list.name}", waiting ${delay}s (attempt ${attempt}/5)...`);
          await sleep(delay * 1000);
        } else {
          console.error(`Failed: "${list.name}" → ${e.message}`);
          break;
        }
      }
    }
  }

  // List all owned lists at the end
  const final = await client.v2.listsOwned(me.data.id);
  console.log('\n=== Final Lists ===');
  for (const l of (final.data || [])) {
    console.log(`  ${l.name} (ID: ${l.id})`);
  }
}

run().catch(e => console.error('Fatal:', e.message));

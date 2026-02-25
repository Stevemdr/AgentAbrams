/**
 * Retry pending X/Twitter operations that were rate-limited
 * Run via cron: 0 * * * * node /root/Projects/goodquestion-ai/scripts/x-retry-pending.cjs
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const PENDING_LISTS = '/tmp/x-create-good-question.json';
const PENDING_REMAINING = '/tmp/x-pending-lists.json';

async function run() {
  // Create "Good Question" list if pending
  if (fs.existsSync(PENDING_LISTS)) {
    try {
      const data = JSON.parse(fs.readFileSync(PENDING_LISTS, 'utf-8'));
      const result = await client.v2.createList({ name: data.name, description: data.description, private: false });
      console.log(`Created "${data.name}" → ID: ${result.data.id}`);
      fs.unlinkSync(PENDING_LISTS);
    } catch (e) {
      if (e.message.includes('429')) {
        console.log('Still rate limited, will retry next hour');
        return;
      }
      console.error('Error:', e.message);
    }
  }

  // Create remaining lists from x-create-lists if pending
  const remaining = [
    { name: 'Claude & Anthropic', description: 'Anthropic team, Claude ecosystem builders, and Claude Code power users.' },
    { name: 'Dev Tools & Infra', description: 'Developer tools, infrastructure, DevOps, and the people making developers more productive.' },
    { name: 'Open Source Leaders', description: 'Open source maintainers, contributors, and advocates building in public.' },
    { name: 'Build In Public', description: 'Founders and devs sharing their journey — code, revenue, mistakes, and wins.' },
  ];

  // Check which lists exist
  const me = await client.v2.me();
  const existing = await client.v2.listsOwned(me.data.id);
  const existingNames = new Set((existing.data || []).map(l => l.name));

  for (const list of remaining) {
    if (existingNames.has(list.name)) continue;
    try {
      const result = await client.v2.createList({ name: list.name, description: list.description, private: false });
      console.log(`Created "${list.name}" → ID: ${result.data.id}`);
    } catch (e) {
      if (e.message.includes('429')) {
        console.log(`Rate limited on "${list.name}", stopping. Will retry next hour.`);
        return;
      }
      console.error(`Failed "${list.name}":`, e.message);
    }
  }

  console.log('All pending lists created!');
}

run().catch(e => console.error('Fatal:', e.message));

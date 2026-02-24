/**
 * YouTube Video Upload Script
 * Usage: node youtube-upload.cjs <video-path> [--title "Title"] [--description "Desc"] [--tags "tag1,tag2"]
 *
 * Requires: Run youtube-auth.cjs first to get a refresh token.
 */
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3456/oauth/callback';
const TOKEN_PATH = path.join(__dirname, '..', '.youtube-token.json');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { videoPath: null, title: null, description: null, tags: [], privacy: 'public' };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) {
      result.title = args[++i];
    } else if (args[i] === '--description' && args[i + 1]) {
      result.description = args[++i];
    } else if (args[i] === '--tags' && args[i + 1]) {
      result.tags = args[++i].split(',').map(t => t.trim());
    } else if (args[i] === '--privacy' && args[i + 1]) {
      result.privacy = args[++i];
    } else if (!args[i].startsWith('--')) {
      result.videoPath = args[i];
    }
  }

  return result;
}

async function uploadVideo() {
  const opts = parseArgs();

  if (!opts.videoPath) {
    console.error('Usage: node youtube-upload.cjs <video-path> [--title "Title"] [--description "Desc"] [--tags "tag1,tag2"] [--privacy public|private|unlisted]');
    process.exit(1);
  }

  if (!fs.existsSync(opts.videoPath)) {
    console.error(`Video file not found: ${opts.videoPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(TOKEN_PATH)) {
    console.error('No YouTube token found. Run youtube-auth.cjs first.');
    process.exit(1);
  }

  // Load saved tokens
  const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  oauth2Client.setCredentials(tokens);

  // Auto-refresh token if expired
  oauth2Client.on('tokens', (newTokens) => {
    const merged = { ...tokens, ...newTokens };
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(merged, null, 2));
    console.log('Token refreshed and saved.');
  });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  const filename = path.basename(opts.videoPath, path.extname(opts.videoPath));
  const title = opts.title || filename;
  const description = opts.description || `Agent Abrams — ${title}\n\nhttps://goodquestion.ai`;

  const fileSize = fs.statSync(opts.videoPath).size;
  console.log(`\nUploading: ${opts.videoPath}`);
  console.log(`Title: ${title}`);
  console.log(`Size: ${(fileSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Privacy: ${opts.privacy}`);
  console.log('');

  try {
    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          tags: opts.tags.length > 0 ? opts.tags : ['claude-code', 'agent-abrams', 'development', 'ai'],
          categoryId: '28', // Science & Technology
        },
        status: {
          privacyStatus: opts.privacy,
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(opts.videoPath),
      },
    }, {
      onUploadProgress: (evt) => {
        const pct = Math.round((evt.bytesRead / fileSize) * 100);
        process.stdout.write(`\rUploading... ${pct}%`);
      },
    });

    console.log('\n\nUpload complete!');
    console.log(`Video ID: ${res.data.id}`);
    console.log(`URL: https://www.youtube.com/watch?v=${res.data.id}`);
    console.log(`Studio: https://studio.youtube.com/video/${res.data.id}/edit`);

    return res.data.id;
  } catch (err) {
    console.error('\nUpload failed:', err.message);
    if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    process.exit(1);
  }
}

uploadVideo();

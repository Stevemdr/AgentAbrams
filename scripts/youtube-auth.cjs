/**
 * YouTube OAuth2 Authorization Flow
 * Run once to get a refresh token, then youtube-upload.cjs uses it automatically.
 */
const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3456/oauth/callback';
const TOKEN_PATH = path.join(__dirname, '..', '.youtube-token.json');

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
];

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
});

console.log('\n=== YouTube OAuth Authorization ===\n');
console.log('Open this URL in your browser:\n');
console.log(authUrl);
console.log('\nWaiting for authorization callback on port 3456...\n');

// Start local server to catch the callback
const server = http.createServer(async (req, res) => {
  const queryParams = url.parse(req.url, true).query;

  if (queryParams.code) {
    try {
      const { tokens } = await oauth2Client.getToken(queryParams.code);

      // Save tokens
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Authorization successful!</h1><p>You can close this tab. Token saved.</p>');

      console.log('Token saved to:', TOKEN_PATH);
      console.log('You can now use youtube-upload.cjs to upload videos.\n');

      server.close();
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h1>Error</h1><p>${err.message}</p>`);
      console.error('Token exchange failed:', err.message);
      server.close();
    }
  } else if (queryParams.error) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end(`<h1>Authorization denied</h1><p>${queryParams.error}</p>`);
    console.error('Authorization denied:', queryParams.error);
    server.close();
  }
});

server.listen(3456, () => {
  console.log('Callback server listening on port 3456');
});

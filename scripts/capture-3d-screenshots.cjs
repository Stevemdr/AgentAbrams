/**
 * Capture screenshots from 3D War Room for blog posts.
 * Authenticates, navigates to different rooms, captures views.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://127.0.0.1:4060';
const AUTH = { user: 'admin', pass: 'DWSecure2024!' };
const OUT_DIR = path.join(__dirname, '..', 'public', 'images', 'warroom');

async function capture() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    httpCredentials: { username: AUTH.user, password: AUTH.pass },
  });

  const page = await context.newPage();

  // Load War Room
  console.log('Loading War Room...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000); // Let Three.js render

  // Screenshot 1: Default overview
  console.log('Capturing overview...');
  await page.screenshot({ path: path.join(OUT_DIR, '3d-overview.png') });

  // Try different camera views via keyboard shortcuts if available
  const views = [
    { key: '1', name: 'boardroom', wait: 3000 },
    { key: '2', name: 'executive', wait: 3000 },
    { key: '3', name: 'birds-eye', wait: 3000 },
  ];

  for (const view of views) {
    try {
      console.log(`Capturing ${view.name} view...`);
      await page.keyboard.press(view.key);
      await page.waitForTimeout(view.wait);
      await page.screenshot({ path: path.join(OUT_DIR, `3d-${view.name}.png`) });
    } catch (e) {
      console.log(`Skipped ${view.name}: ${e.message}`);
    }
  }

  await browser.close();
  console.log(`Screenshots saved to ${OUT_DIR}`);
  console.log(fs.readdirSync(OUT_DIR).join(', '));
}

capture().catch(e => console.error('Error:', e.message));

/**
 * One-time script to get your LinkedIn OAuth access token.
 * Run: node get-token.js
 * Then paste the token into your .env file as LINKEDIN_ACCESS_TOKEN
 */

import express from 'express';
import open from 'open';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPES = 'openid profile w_member_social';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET in .env');
  process.exit(1);
}

const app = express();

app.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error('❌ LinkedIn auth error:', error);
    res.send('Authentication failed. Check the terminal.');
    server.close();
    return;
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();

    if (data.access_token) {
      console.log('\n✅ Access token obtained successfully!\n');
      console.log('Copy this into your .env file as LINKEDIN_ACCESS_TOKEN:');
      console.log('\n' + data.access_token + '\n');
      console.log(`Token expires in: ${Math.floor(data.expires_in / 86400)} days`);
      res.send('<h2>✅ Success! Check your terminal for the access token.</h2><p>You can close this tab.</p>');
    } else {
      console.error('❌ Failed to get token:', data);
      res.send('Failed to get token. Check the terminal.');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.send('Error occurred. Check the terminal.');
  }

  server.close();
});

const server = app.listen(3000, () => {
  const authUrl =
    `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code` +
    `&client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(SCOPES)}`;

  console.log('🔐 Opening LinkedIn authorization in your browser...');
  console.log('If it does not open, visit this URL manually:\n', authUrl);
  open(authUrl);
});

/**
 * Posts to LinkedIn using the official Share API.
 * Run manually: node post.js
 * Run as test (no actual post): node post.js --test
 */

import dotenv from 'dotenv';
import { generateLinkedInPost } from './generate-post.js';

dotenv.config();

const ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const TEST_MODE = process.argv.includes('--test');

async function getLinkedInProfile() {
  const res = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Failed to get profile: ${res.status} ${await res.text()}`);
  return res.json();
}

async function postToLinkedIn(text, authorUrn) {
  const body = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Failed to post: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  if (!ACCESS_TOKEN) {
    console.error('❌ Missing LINKEDIN_ACCESS_TOKEN in .env - run: npm run get-token');
    process.exit(1);
  }

  console.log('🤖 Generating post with Claude AI...');
  const { text, topic } = await generateLinkedInPost();

  console.log('\n📝 Generated post:');
  console.log('─'.repeat(60));
  console.log(text);
  console.log('─'.repeat(60));
  console.log(`\nTopic: ${topic}`);
  console.log(`Length: ${text.length} characters`);

  if (TEST_MODE) {
    console.log('\n✅ TEST MODE - post not submitted to LinkedIn.');
    return;
  }

  console.log('\n📡 Getting LinkedIn profile...');
  const profile = await getLinkedInProfile();
  const authorUrn = `urn:li:person:${profile.sub}`;
  console.log(`Posting as: ${profile.name} (${authorUrn})`);

  console.log('\n🚀 Posting to LinkedIn...');
  const result = await postToLinkedIn(text, authorUrn);
  console.log('✅ Posted successfully!');
  console.log(`Post ID: ${result.id}`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

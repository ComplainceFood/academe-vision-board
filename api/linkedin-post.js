/**
 * Vercel Serverless Function - triggered by cron job
 * Runs Monday, Wednesday, Friday at 9am CT
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TOPICS = [
  'grant writing tips for professors',
  'managing academic publications effectively',
  'work-life balance for faculty members',
  'AI tools that help professors save time',
  'how to organize academic meetings and notes',
  'tracking research funding and grants',
  'productivity hacks for busy professors',
  'managing lab supplies and academic resources',
  'how technology is changing higher education',
  'tips for new faculty members',
  'balancing teaching and research responsibilities',
  'academic career growth strategies',
  'how Smart-Prof helps faculty manage their work',
  'the future of AI in academic institutions',
  'reducing administrative burden for professors',
];

async function generatePost() {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: 'You write engaging, authentic LinkedIn posts for academic professionals. Your posts feel human, not robotic.',
    messages: [{
      role: 'user',
      content: `You are a LinkedIn content creator for Smart-Prof, an academic management platform that helps professors and faculty manage grants, publications, meetings, supplies, and AI insights.

Write a LinkedIn post about: "${topic}"

Requirements:
- 150-250 words
- Professional but conversational tone
- Relatable to professors, faculty, and academic administrators
- Naturally mention Smart-Prof as a solution where relevant (but don't make it sound like an ad)
- Include 3-5 relevant hashtags at the end
- Include 1-2 relevant emojis naturally in the text
- End with a question to encourage engagement
- Do NOT use asterisks or markdown formatting

Write only the post text, nothing else.`
    }],
  });

  return { text: response.content[0].text.trim(), topic };
}

async function getLinkedInProfile(token) {
  const res = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
  return res.json();
}

async function postToLinkedIn(text, authorUrn, token) {
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
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Post failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export default async function handler(req, res) {
  // Protect endpoint with a secret so only Vercel cron can trigger it
  const cronSecret = req.headers['authorization'];
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ error: 'Missing LINKEDIN_ACCESS_TOKEN' });

  try {
    const { text, topic } = await generatePost();
    const profile = await getLinkedInProfile(token);
    const authorUrn = `urn:li:person:${profile.sub}`;
    const result = await postToLinkedIn(text, authorUrn, token);

    console.log(`✅ Posted to LinkedIn - topic: ${topic}, id: ${result.id}`);
    return res.status(200).json({ success: true, postId: result.id, topic });
  } catch (err) {
    console.error('❌ LinkedIn post failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

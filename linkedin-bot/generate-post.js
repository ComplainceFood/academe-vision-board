/**
 * Generates a LinkedIn post using Claude AI
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

const DAY_TOPICS = {
  1: TOPICS.filter((_, i) => i % 3 === 0), // Monday
  3: TOPICS.filter((_, i) => i % 3 === 1), // Wednesday
  5: TOPICS.filter((_, i) => i % 3 === 2), // Friday
};

export async function generateLinkedInPost(topicOverride = null) {
  const dayOfWeek = new Date().getDay();
  const topicPool = DAY_TOPICS[dayOfWeek] || TOPICS;
  const topic = topicOverride || topicPool[Math.floor(Math.random() * topicPool.length)];

  const prompt = `You are a LinkedIn content creator for Smart-Prof, an academic management platform that helps professors and faculty manage grants, publications, meetings, supplies, and AI insights.

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

Write only the post text, nothing else.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: 'You write engaging, authentic LinkedIn posts for academic professionals. Your posts feel human, not robotic.',
    messages: [{ role: 'user', content: prompt }],
  });

  return {
    text: response.content[0].text.trim(),
    topic,
  };
}

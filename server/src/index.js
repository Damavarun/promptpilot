import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
const apiKey = process.env.GROQ_API_KEY?.trim();
const app = createApp({
  groq: apiKey ? new Groq({ apiKey, timeout: 30000, maxRetries: 1 }) : undefined,
  model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  production: process.env.NODE_ENV === 'production',
  trustProxy: Number(process.env.TRUST_PROXY || 0),
});
const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log('PromptPilot API: http://localhost:' + port);
  if (!apiKey) console.log('Set GROQ_API_KEY in server/.env to enable prompt improvement.');
});


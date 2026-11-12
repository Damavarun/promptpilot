import Groq from 'groq-sdk';
import { createApp } from '../server/src/app.js';
const apiKey = process.env.GROQ_API_KEY?.trim();
export default createApp({
  groq: apiKey ? new Groq({ apiKey, timeout: 30000, maxRetries: 1 }) : undefined,
  model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  trustProxy: 1,
});

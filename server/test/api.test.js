import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
const payload = { prompt: 'Explain how APIs work to a beginner.', style: 'Simple', detail: 'Balanced' };
const fixture = { improvedPrompt: 'Explain APIs for a beginner using an everyday analogy.', improvements: ['Specified audience.', 'Requested an analogy.', 'Clarified the task.'], tips: ['Add your preferred language.'] };
const fake = (content, finish_reason = 'stop') => ({ chat: { completions: { create: async () => ({ choices: [{ finish_reason, message: { content } }] }) } } });
async function request(app, body = payload, raw = false) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const response = await fetch('http://127.0.0.1:' + server.address().port + '/api/improve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: raw ? body : JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
test('validates input before calling AI', async () => {
  for (const body of [{ ...payload, prompt: 'short' }, { ...payload, style: 'Unknown' }, { ...payload, prompt: 'x'.repeat(5001) }, { ...payload, detail: 'Long' }, { ...payload, extra: 'ignored?' }]) {
    assert.equal((await request(createApp(), body)).status, 400);
  }
});
test('missing key returns actionable setup message', async () => {
  const r = await request(createApp()); assert.equal(r.status, 503); assert.match(r.body.error, /GROQ_API_KEY/);
});
test('returns validated JSON and passes requested options to SDK', async () => {
  let options;
  const groq = { chat: { completions: { create: async value => { options = value; return { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(fixture) } }] }; } } } };
  const r = await request(createApp({ groq, model: 'test-model' }));
  assert.equal(r.status, 200); assert.deepEqual(r.body, fixture);
  assert.equal(options.model, 'test-model'); assert.equal(options.response_format.type, 'json_object');
  assert.deepEqual(JSON.parse(options.messages[1].content), payload);
});
test('rejects malformed and structurally invalid AI responses', async () => {
  for (const content of ['not json', '{}', JSON.stringify({ ...fixture, improvements: ['Only one'] })]) {
    assert.equal((await request(createApp({ groq: fake(content) }))).status, 502);
  }
});
test('rejects truncated AI responses', async () => {
  assert.equal((await request(createApp({ groq: fake(JSON.stringify(fixture), 'length') }))).status, 502);
});
test('maps upstream errors without exposing provider secrets', async () => {
  for (const [upstream, expected] of [[401,503],[403,503],[429,429],[500,502],[400,502]]) {
    const groq = { chat: { completions: { create: async () => { throw { status: upstream, message: 'secret-provider-data' }; } } } };
    const r = await request(createApp({ groq })); assert.equal(r.status, expected); assert.ok(!JSON.stringify(r).includes('secret-provider-data'));
  }
});
test('handles malformed JSON and oversized bodies', async () => {
  assert.equal((await request(createApp(), '{', true)).status, 400);
  assert.equal((await request(createApp(), { ...payload, prompt: 'x'.repeat(40000) })).status, 413);
});
test('rate limits repeated calls', async () => {
  const app = createApp();
  let r;
  for (let i = 0; i < 16; i++) r = await request(app);
  assert.equal(r.status, 429);
});


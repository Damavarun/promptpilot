# PromptPilot — AI Prompt Improver

A focused AI workspace that turns rough ideas into clear, structured prompts using the Groq API. Built with React, TypeScript and Express, with a navy dashboard, violet accents and responsive layouts.

## Features

- Four styles: Professional, Creative, Simple and Technical.
- Three detail levels: Concise, Balanced and Detailed.
- Real Groq generation with validated JSON responses; no simulated results.
- Original/improved comparison, 3–5 explanations and optional personalization tips.
- Copy to clipboard, example prompts and reset controls.
- Reopen and delete the last 30 successful prompts, saved in localStorage.
- Keyboard navigation, visible focus indicators, reduced-motion support and Ctrl/Cmd+Enter submission.
- Input validation, request timeouts, rate limiting and useful error messages.

## Stack

React 18 · Vite 6 · TypeScript · Tailwind CSS 3 · Lucide React  
Node.js · Express · official groq-sdk · Zod · Helmet · Node test runner

## Local installation (Windows / VS Code)

Use a current supported Node.js LTS release. The project is also compatible with Node 18.18+.

Open the folder containing `promptpilot` in VS Code, then run:

```powershell
cd promptpilot
npm install
Copy-Item server/.env.example server/.env
code server/.env
```

If `server/.env` already exists, edit it directly instead of copying over it.

Create an API key at https://console.groq.com/keys and enter it in **server/.env**:

```dotenv
GROQ_API_KEY=your_real_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
PORT=3001
NODE_ENV=development
TRUST_PROXY=0
```

Never put the key in a client file or a VITE_ variable. The supplied .gitignore excludes .env files and keeps .env.example. Do not commit real credentials.

Start both applications from the project root:

```powershell
npm run dev
```

Open **http://localhost:5173**. The API runs at **http://localhost:3001**. Vite proxies /api to the backend, so no frontend key or CORS setup is needed.

Alternatively, use two terminals from the root:

```powershell
# Terminal 1
npm run dev -w server
# Terminal 2
npm run dev -w client
```

If PowerShell blocks npm.ps1, use `npm.cmd` instead of `npm`. Restart the backend after changing .env. If you change PORT, update the proxy target in client/vite.config.ts too.

## Usage

1. Enter a prompt of 10–5,000 characters or select an example.
2. Choose a style and detail level.
3. Select Improve prompt (or press Ctrl/Cmd+Enter).
4. Read the result and explanations. Use Compare original to review the change.
5. Copy the prompt into your preferred AI assistant, replacing any bracketed placeholders.
6. Reopen earlier results through Prompt history or the sidebar. Delete individual entries with the trash button.

Editing the input does not rewrite a displayed previous result: its comparison always uses the original submitted text. Only successful API results enter history.

## Scripts and verification

```powershell
npm run build
npm test
# Or both:
npm run check
```

The build type-checks TypeScript and emits client/dist. Tests exercise API validation, SDK request construction, JSON schema checks, truncation, upstream errors, malformed bodies, missing credentials and rate limits. SDK fixtures exist only in tests; they are not available to the running application. A real end-to-end generation needs a valid key and available Groq quota.

## Production

Build once, then let Express serve both the frontend and API:

```powershell
npm install
npm run build
$env:NODE_ENV = "production"
npm start
```

Open **http://localhost:3001**. To return to development in the same PowerShell session:

```powershell
Remove-Item Env:NODE_ENV
npm run dev
```

On a Node-capable host, set the service root to promptpilot, use `npm install && npm run build` as the build command and `npm start` as the start command. Set GROQ_API_KEY, GROQ_MODEL and NODE_ENV=production in the host's secret/environment settings. Use the host-assigned PORT. Environment values override .env. Enable HTTPS through the host.

If the host uses a trusted reverse proxy, set TRUST_PROXY to its documented hop count (often 1). Do not set it blindly: incorrect proxy trust can let clients bypass IP limits. The built-in limiter is per process and is suitable for a small single-instance portfolio deployment. Add authentication, shared rate limits and account spending controls before offering unrestricted public usage. GitHub Pages alone cannot run the Express backend.

`npm run preview -w client` is only a static build preview; use the Express production command to test the complete application.

## API

POST /api/improve:

```json
{
  "prompt": "Explain how APIs work to a beginner.",
  "style": "Simple",
  "detail": "Balanced"
}
```

Response fields: `improvedPrompt: string`, `improvements: string[]` (3–5), and optional `tips: string[]` (up to 3). Errors are JSON objects with an `error` message and an appropriate HTTP status.

GET /api/health returns server availability and whether a key is configured. This checks configuration, not whether the key is valid.

Default model: `llama-3.3-70b-versatile`, documented at https://console.groq.com/docs/model/llama-3.3-70b-versatile. Choose an available chat model with JSON object mode through GROQ_MODEL. Model availability can change; see https://console.groq.com/docs/models.

## Architecture and privacy

Browser → same-origin /api/improve → Express validation → Groq SDK → response validation → browser.

Prompts are sent to Groq when you request improvement. History is saved only in this browser's localStorage (not encrypted), with no application database. Avoid sensitive data on shared devices. Clear entries in the app or clear this site's browser data. Provider processing is subject to Groq's terms. The application does not log prompts or keys.

## Project structure

```text
promptpilot/
  client/
    src/App.tsx           Dashboard and interactions
    src/index.css         Tailwind and responsive visual styles
    src/main.tsx          React entry point
    vite.config.ts        Local API proxy
  server/
    src/app.js            Validation, API and production static hosting
    src/index.js          Environment and server startup
    test/api.test.js      API integration tests
    .env.example          Safe configuration template
  package.json            Combined workspace scripts
  package-lock.json       Generated by npm install; commit for reproducibility
  .gitignore
  README.md
```

## Screenshots for GitHub / Handshake

Run the app, configure your key and improve an example prompt. Capture:
- Desktop dashboard (about 1440×1000).
- A real generated result with Compare original expanded.
- Mobile layout (about 390×844) and prompt history.

Store screenshots under docs/screenshots and add Markdown image links to this README. Use real output and remove private content. Do not include .env, credentials or developer-tool request headers in screenshots.

## Troubleshooting

- **Setup message:** enter the key in server/.env and restart the backend.
- **Authentication error:** verify the server-side key and account permissions.
- **Rate limit:** wait a minute, or check provider quota in the Groq console.
- **Model error:** verify GROQ_MODEL is available and supports JSON object mode.
- **Cannot reach backend:** run npm run dev from the project root.
- **Port in use:** stop the conflicting process or change both PORT and Vite's proxy.
- **History unavailable:** browser storage may be blocked or full; the app keeps the current session usable.


## Verification in the build environment

Backend JavaScript syntax checks passed. Dependency installation was blocked by DNS resolution failure (ENOTFOUND registry.npmjs.org). Consequently, the TypeScript/production build, API test suite and browser QA could not run here. After installing dependencies locally, run npm run check. A live Groq call also requires your own API key.


## Vercel deployment

Import this GitHub repository into Vercel. Use the repository root as Root Directory (or promptpilot if this folder is nested in the repository). The tracked vercel.json configures the frontend build and the serverless Express API.

Set GROQ_API_KEY as a sensitive environment variable in Vercel, and set GROQ_MODEL=llama-3.3-70b-versatile. Redeploy after changing environment variables. Do not upload server/.env. The API function uses Vercel environment variables and does not start a port listener.

The application rate limiter is per function instance; configure Vercel Firewall rate limits for public traffic across instances.

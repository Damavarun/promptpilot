import { useEffect, useRef, useState } from 'react';
import { Sparkles, ArrowUpRight, ArrowRight, History, Plus, Trash2, Copy, Check, RotateCcw, WandSparkles, Terminal, BriefcaseBusiness, Feather, AlignLeft, Lightbulb, ShieldCheck, X, LoaderCircle, ChevronRight, Command, PanelLeftClose } from 'lucide-react';

const styles = ['Professional', 'Creative', 'Simple', 'Technical'] as const;
const details = ['Concise', 'Balanced', 'Detailed'] as const;
type Style = typeof styles[number];
type Detail = typeof details[number];
type Result = { improvedPrompt: string; improvements: string[]; tips?: string[] };
type Entry = Result & { id: string; prompt: string; style: Style; detail: Detail; created: string };
const KEY = 'promptpilot.history.v1';
const examples = [
  { title: 'Write with purpose', tag: 'Content & writing', icon: Feather, prompt: 'Write a LinkedIn post about what I learned building my first web application.' },
  { title: 'Make complex feel simple', tag: 'Learning & research', icon: Lightbulb, prompt: 'Explain how APIs work to a beginner with a real-world example.' },
  { title: 'Build something better', tag: 'Code & development', icon: Terminal, prompt: 'Help me review a React component for performance and accessibility issues.' },
];
function validResult(value: unknown): value is Result {
  if (!value || typeof value !== 'object') return false;
  const r = value as Result;
  return typeof r.improvedPrompt === 'string' && Array.isArray(r.improvements) && r.improvements.length >= 3 && r.improvements.length <= 5 && r.improvements.every(x => typeof x === 'string') && (r.tips === undefined || (Array.isArray(r.tips) && r.tips.every(x => typeof x === 'string')));
}
function readHistory(): Entry[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(value) ? value.filter((e: Entry) => e !== null && typeof e === 'object' && typeof e.id === 'string' && typeof e.prompt === 'string' && styles.includes(e.style) && details.includes(e.detail) && typeof e.created === 'string' && validResult(e)).slice(0, 30) : [];
  } catch { return []; }
}
export default function App() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<Style>('Professional');
  const [detail, setDetail] = useState<Detail>('Balanced');
  const [result, setResult] = useState<Entry | null>(null);
  const [history, setHistory] = useState<Entry[]>(readHistory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'editor' | 'history'>('editor');
  const [compare, setCompare] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);
  const busy = useRef(false);
  useEffect(() => {
    fetch('/api/health').then(r => r.ok ? r.json() : Promise.reject()).then(r => setConfigured(r.configured)).catch(() => setConfigured(null));
    return () => abort.current?.abort();
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(history)); }
    catch { setNotice('Browser storage is unavailable or full. History will only last for this session.'); }
  }, [history]);
  useEffect(() => { if (copied) { const timer = setTimeout(() => setCopied(false), 2000); return () => clearTimeout(timer); } }, [copied]);

  function reset() {
    abort.current?.abort(); abort.current = null; busy.current = false; setLoading(false); setPrompt(''); setStyle('Professional'); setDetail('Balanced'); setResult(null); setError(''); setCopied(false); setCompare(false); setView('editor'); setTimeout(() => input.current?.focus(), 0);
  }
  function reopen(entry: Entry) {
    setPrompt(entry.prompt); setStyle(entry.style); setDetail(entry.detail); setResult(entry); setView('editor'); setError(''); setCompare(false); setCopied(false);
  }
  async function improve() {
    if (busy.current) return;
    if (prompt.trim().length < 10) { setError('Give your idea a little more context — at least 10 characters.'); input.current?.focus(); return; }
    const controller = new AbortController(); abort.current = controller; busy.current = true;
    setLoading(true); setError(''); setResult(null); setCopied(false); setCompare(false);
    const timer = setTimeout(() => controller.abort(), 70000);
    try {
      const response = await fetch('/api/improve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt.trim(), style, detail }), signal: controller.signal });
      const data = await response.json().catch(() => { throw new Error('The server returned an unreadable response. Check that the backend is running.'); });
      if (!response.ok) throw new Error(data.error || 'Could not improve your prompt. Please try again.');
      if (!validResult(data)) throw new Error('The AI response was not valid. Please try again.');
      const entry: Entry = { ...data, id: crypto.randomUUID(), prompt: prompt.trim(), style, detail, created: new Date().toISOString() };
      setResult(entry); setHistory(h => [entry, ...h].slice(0, 30)); setConfigured(true);
    } catch (err) {
      if (abort.current === controller) setError(err instanceof Error && err.name === 'AbortError' ? 'The request timed out. Please try again.' : err instanceof TypeError ? 'Cannot reach the backend. Start both servers with npm run dev.' : err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      clearTimeout(timer);
      if (abort.current === controller) { busy.current = false; setLoading(false); }
    }
  }
  async function copy() {
    if (!result) return;
    try { await navigator.clipboard.writeText(result.improvedPrompt); setCopied(true); }
    catch { setNotice('Clipboard access was blocked. Select the improved prompt and copy it manually.'); }
  }
  const icons = [BriefcaseBusiness, Feather, AlignLeft, Terminal];
  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className="sidebar">
      <a className="brand" href="#" onClick={e => { e.preventDefault(); setView('editor'); }}><span className="brand-icon"><WandSparkles size={23}/></span>PromptPilot<span className="brand-dot">.</span></a>
      <div className="workspace-label">YOUR WORKSPACE</div>
      <nav aria-label="Main navigation">
        <button className={view === 'editor' ? 'nav-item active' : 'nav-item'} onClick={() => setView('editor')}><Sparkles size={18}/> Prompt studio <ChevronRight size={15}/></button>
        <button className={view === 'history' ? 'nav-item active' : 'nav-item'} onClick={() => setView('history')}><History size={18}/> Prompt history <span className="count">{history.length}</span></button>
      </nav>
      <button className="new-prompt" onClick={reset} disabled={loading}><Plus size={17}/> New prompt</button>
      <div className="recent-label">RECENT PROMPTS</div>
      <div className="recent-list">{history.length ? history.slice(0, 5).map(e => <button key={e.id} disabled={loading} onClick={() => reopen(e)}><span className="tiny-dot"/><span>{e.prompt}</span></button>) : <p>Your next great idea<br/>starts right here.</p>}</div>
      <div className="sidebar-bottom"><div className="small-tip"><Lightbulb size={18}/><strong>A little context goes a long way.</strong><p>Tell the AI who it’s helping, what you need, and how you want it delivered.</p></div><div className="local-note"><ShieldCheck size={16}/> History stays in this browser</div></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div><span className="topbar-icon"><PanelLeftClose size={17}/></span><span>Workspace</span><ChevronRight size={13}/><strong>{view === 'editor' ? 'Prompt studio' : 'Prompt history'}</strong></div><span className="powered"><span/> Powered by Groq <ArrowUpRight size={13}/></span></header>
      <main id="main">
        <section className="page-heading"><div className="eyebrow"><span/> YOUR IDEAS, ELEVATED</div><h1>Better prompts.<br className="mobile-break"/> <span>Better AI results.</span></h1><p>Turn a rough idea into a clear, powerful prompt. Let your next great answer start here.</p></section>
        {notice && <div className="notice" role="status">{notice}<button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={16}/></button></div>}
        {view === 'history' ? <section className="card history-card"><div className="card-heading"><div className="section-title"><History size={19}/><h2>Prompt history</h2><span className="tag">{history.length} saved</span></div></div><p className="history-description">Your last 30 improvements, stored in this browser. Reopen one to pick up where you left off.</p>{history.length ? history.map(e => <div className="history-row" key={e.id}><button disabled={loading} onClick={() => reopen(e)}><strong>{e.prompt}</strong><span>{e.style} · {e.detail} · {new Date(e.created).toLocaleDateString()}</span></button><button className="icon-button" aria-label={'Delete prompt: ' + e.prompt.slice(0, 50)} onClick={() => setHistory(h => h.filter(x => x.id !== e.id))}><Trash2 size={17}/></button></div>) : <div className="history-empty"><History size={36}/><h3>A fresh start.</h3><p>Improve your first prompt and it will appear here.</p><button className="primary" onClick={reset}>Create a prompt <ArrowRight size={16}/></button></div>}</section> : <>
        <div className="studio-grid">
          <section className="card input-card"><div className="card-heading"><div className="section-title"><span className="step">01</span><h2>Your starting point</h2></div><button className="text-button" onClick={reset} disabled={loading}><RotateCcw size={14}/> Reset</button></div>
            <form onSubmit={e => { e.preventDefault(); void improve(); }}>
              <label className="field-label" htmlFor="prompt">What do you want AI to help with?</label>
              <div className="textarea-wrap"><textarea id="prompt" ref={input} value={prompt} maxLength={5000} disabled={loading} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); void improve(); } }} placeholder={'Start with an idea, a question, or a task…\n\nFor example: “Help me write a cover letter for a software engineering internship.”'} aria-describedby="prompt-count" /><div className="textarea-footer"><span><Command size={12}/> Ctrl / ⌘ + Enter to improve</span><span id="prompt-count">{prompt.length.toLocaleString()} / 5,000</span></div></div>
              <fieldset disabled={loading}><legend>Choose your style</legend><div className="style-grid">{styles.map((s, i) => { const Icon = icons[i]; return <button type="button" key={s} className={style === s ? 'style-option selected' : 'style-option'} aria-pressed={style === s} onClick={() => setStyle(s)}><Icon size={18}/>{s}</button>; })}</div></fieldset>
              <fieldset disabled={loading}><legend>Level of detail</legend><div className="detail-switch">{details.map(d => <button type="button" key={d} aria-pressed={detail === d} className={detail === d ? 'selected' : ''} onClick={() => setDetail(d)}>{d}</button>)}</div></fieldset>
              {error && <p role="alert" className="error">{error}</p>}
              <button className="primary improve" type="submit" disabled={loading}>{loading ? <LoaderCircle size={18} className="spin"/> : <Sparkles size={18}/>} {loading ? 'Refining your idea…' : 'Improve prompt'}{!loading && <ArrowRight size={18}/>}</button>
              <p className="privacy"><ShieldCheck size={12}/> Your prompt is sent to Groq only when you improve it.</p>
            </form>
          </section>
          <section className={'card output-card ' + (result ? 'has-result' : '')} aria-busy={loading}><div className="card-heading"><div className="section-title"><span className="step violet">02</span><h2>Your upgraded prompt</h2></div><span className="ai-tag"><Sparkles size={12}/> AI enhanced</span></div>
            <div aria-live="polite" className="output-body">{loading ? <div className="empty-output"><div className="orb loading-orb"><Sparkles size={30}/></div><h3>A little clarity. A lot of possibility.</h3><p>Shaping your idea into a more focused,<br/>structured prompt.</p><div className="loading-bars"><i/><i/><i/></div></div> : result ? <><div className="result-toolbar"><span className="result-meta">{result.style} <span>·</span> {result.detail}</span><button className="text-button" onClick={() => setCompare(!compare)} aria-pressed={compare}>{compare ? 'Hide original' : 'Compare original'}</button></div>{compare && <div className="original"><span>BEFORE</span><p>{result.prompt}</p></div>}<div className="result-text">{result.improvedPrompt}</div><div className="result-actions"><span><Check size={14}/> Ready for your favorite AI</span><button className="copy-button" onClick={() => void copy()}>{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? 'Copied!' : 'Copy prompt'}</button></div><div className="improvements"><h3><Sparkles size={15}/> What got better</h3>{result.improvements.map((x, i) => <p key={i}><span>{String(i + 1).padStart(2, '0')}</span>{x}</p>)}{result.tips?.length ? <div className="result-tips"><strong><Lightbulb size={14}/> Make it yours</strong>{result.tips.map((tip, i) => <p key={i}>{tip}</p>)}</div> : null}</div></> : <div className="empty-output"><div className="orb"><WandSparkles size={32}/><span className="orb-spark"><Sparkles size={15}/></span></div><h3>Good ideas deserve great prompts.</h3><p>Your improved prompt will appear here.<br/>Add your idea and let’s give it a little direction.</p><div className="empty-tags"><span>Clearer intent</span><span>Better structure</span><span>More useful answers</span></div></div>}</div>
            {!result && !loading && <div className="output-footer"><span className="tiny-dot"/> Built around your intent. Refined for better results.</div>}
          </section>
        </div>
        <section className="examples"><div className="examples-heading"><h2>A blank page? Start here.</h2><span>Pick an idea to make it your own <ArrowRight size={14}/></span></div><div className="example-grid">{examples.map(e => <button key={e.title} disabled={loading} className="example-card" onClick={() => { setPrompt(e.prompt); setResult(null); setError(''); input.current?.focus(); }}><span className="example-icon"><e.icon size={18}/></span><span><small>{e.tag}</small><strong>{e.title}</strong></span><ArrowUpRight size={17}/></button>)}</div></section>
        </>}
        <footer className="page-footer"><span>Less guesswork. More possibility.</span><span>PromptPilot <span>✦</span> Made for curious minds</span></footer>
        {configured === false && <p className="setup-note"><Terminal size={14}/> One-time setup: add your Groq API key to <code>server/.env</code> and restart the backend.</p>}
      </main>
    </div>
  </div>;
}




'use client';

import { useState } from 'react';
import {
  Sparkles,
  Github,
  Download,
  Loader2,
  Copy,
  Check,
  Eye,
  Code2,
  RotateCcw,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const GITHUB_URL_RE = /^(https?:\/\/)?(github\.com\/|git@github\.com:)?[\w.-]+\/[\w.-]+\/?$/i;

type ViewMode = 'preview' | 'source';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [readme, setReadme] = useState('');
  const [repoName, setRepoName] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState<ViewMode>('preview');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a GitHub repository URL.');
      return;
    }
    if (!GITHUB_URL_RE.test(trimmed.split(/[?#]/)[0])) {
      setError('That doesn\u2019t look like a GitHub repo. Try https://github.com/owner/repo');
      return;
    }

    setLoading(true);
    setError('');
    setReadme('');
    setRepoName('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate README');
      }

      setReadme(data.readme);
      setRepoName(data.repoName || '');
      setView('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([readme], { type: 'text/markdown;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = repoName ? `README-${repoName}.md` : 'README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(readme);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  const handleReset = () => {
    setReadme('');
    setRepoName('');
    setUrl('');
    setError('');
  };

  return (
    <main className="min-h-screen bg-parchment">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-parchment border-b border-borderCream">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-terracotta" />
            <span className="font-serif text-xl text-deepDark">Munaf.Studios</span>
          </div>
          <div className="text-sm text-oliveGray">
            Code with Curiosity, Create with Purpose
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="font-serif text-5xl md:text-6xl text-deepDark leading-tight mb-6">
          Beautiful READMEs,
          <br />
          <span className="text-terracotta">Generated Instantly</span>
        </h1>
        <p className="font-sans text-xl text-oliveGray leading-relaxed mb-12 max-w-2xl mx-auto">
          Transform any GitHub repository into a stunning, professional README with AI. 
          Just paste your repo URL and let the magic happen.
        </p>

        {/* Input Form */}
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stoneGray" />
              <input
                type="text"
                placeholder="https://github.com/owner/repo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                className="w-full pl-12 pr-4 py-4 bg-ivory border border-borderWarm rounded-generous text-deepDark placeholder-stoneGray focus:outline-none focus:ring-2 focus:ring-focusBlue font-sans"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-8 py-4 bg-terracotta text-ivory rounded-generous font-sans font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-ring-warm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-errorCrimson/10 border border-errorCrimson/20 rounded-comfortable text-errorCrimson text-sm">
              {error}
            </div>
          )}

          {loading && (
            <p className="mt-4 text-sm text-oliveGray">
              Crawling the repo and summoning the muses&hellip; this usually takes 10&ndash;40 seconds.
            </p>
          )}

          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-stoneGray">
            <span>Try:</span>
            {[
              'https://github.com/vercel/next.js',
              'https://github.com/facebook/react',
              'https://github.com/tiangolo/fastapi',
            ].map((example) => (
              <button
                key={example}
                onClick={() => setUrl(example)}
                className="underline decoration-dotted underline-offset-4 hover:text-terracotta transition-colors"
              >
                {example.replace('https://github.com/', '')}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results Section */}
      {readme && (
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="bg-ivory border border-borderCream rounded-very shadow-whisper overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-borderWarm">
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-2xl text-deepDark">
                  {repoName ? `README for ${repoName}` : 'Generated README'}
                </h2>
                <span className="text-xs text-stoneGray font-mono">
                  {readme.length.toLocaleString()} chars
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-comfortable bg-warmSand p-1 shadow-ring-warm">
                  <button
                    onClick={() => setView('preview')}
                    className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors ${
                      view === 'preview'
                        ? 'bg-ivory text-deepDark shadow-ring-warm'
                        : 'text-charcoalWarm hover:text-deepDark'
                    }`}
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                  <button
                    onClick={() => setView('source')}
                    className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors ${
                      view === 'source'
                        ? 'bg-ivory text-deepDark shadow-ring-warm'
                        : 'text-charcoalWarm hover:text-deepDark'
                    }`}
                  >
                    <Code2 className="w-4 h-4" /> Source
                  </button>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-warmSand text-charcoalWarm rounded-comfortable font-sans text-sm hover:opacity-80 transition-opacity flex items-center gap-2 shadow-ring-warm"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-terracotta text-ivory rounded-comfortable font-sans text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handleReset}
                  title="Start over"
                  className="p-2 text-oliveGray hover:text-deepDark transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-auto max-h-[70vh]">
              {view === 'preview' ? (
                <article className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:text-deepDark prose-a:text-terracotta prose-code:text-terracotta prose-code:bg-warmSand prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-darkSurface prose-pre:text-ivory prose-img:mx-auto">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {readme}
                  </ReactMarkdown>
                </article>
              ) : (
                <pre className="font-mono text-sm text-deepDark whitespace-pre-wrap break-words">
                  {readme}
                </pre>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      {!readme && (
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-ivory border border-borderCream rounded-very p-8 shadow-whisper">
              <div className="w-12 h-12 bg-terracotta/10 rounded-comfortable flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-terracotta" />
              </div>
              <h3 className="font-serif text-xl text-deepDark mb-3">AI-Powered</h3>
              <p className="font-sans text-oliveGray leading-relaxed">
                Advanced AI analyzes your codebase to create comprehensive, accurate documentation.
              </p>
            </div>
            <div className="bg-ivory border border-borderCream rounded-very p-8 shadow-whisper">
              <div className="w-12 h-12 bg-terracotta/10 rounded-comfortable flex items-center justify-center mb-4">
                <Github className="w-6 h-6 text-terracotta" />
              </div>
              <h3 className="font-serif text-xl text-deepDark mb-3">GitHub Integration</h3>
              <p className="font-sans text-oliveGray leading-relaxed">
                Seamlessly fetches and analyzes any public or private GitHub repository.
              </p>
            </div>
            <div className="bg-ivory border border-borderCream rounded-very p-8 shadow-whisper">
              <div className="w-12 h-12 bg-terracotta/10 rounded-comfortable flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-terracotta" />
              </div>
              <h3 className="font-serif text-xl text-deepDark mb-3">Instant Download</h3>
              <p className="font-sans text-oliveGray leading-relaxed">
                Get your beautifully formatted README ready to paste into your repository.
              </p>
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-borderCream">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-oliveGray">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-terracotta" />
            <span className="font-serif">Munaf.Studios</span>
            <span>&middot;</span>
            <span>Built with Next.js, Cohere &amp; the GitHub API</span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1 hover:text-terracotta transition-colors"
          >
            <Github className="w-4 h-4" /> View source
          </a>
        </div>
      </footer>
    </main>
  );
}

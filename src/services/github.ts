interface GitHubFile {
  name: string;
  path: string;
  type: string;
  url: string;
  size?: number;
}

interface GitHubContent {
  content: string;
  encoding: string;
}

const SKIP_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp', '.tiff',
  '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
  '.mp3', '.mp4', '.mov', '.avi', '.wav', '.ogg',
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
  '.exe', '.dll', '.so', '.dylib', '.bin',
];
const SKIP_FILES = [
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
  'poetry.lock', 'Pipfile.lock', 'composer.lock', 'Gemfile.lock', 'Cargo.lock',
];
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'out', 'target',
  '__pycache__', '.venv', 'venv', '.idea', '.vscode', 'coverage', '.cache',
]);

// Files that strongly inform README generation. Higher score = read first.
const PRIORITY_PATTERNS: Array<{ pattern: RegExp; score: number }> = [
  { pattern: /^readme(\.|$)/i, score: 100 },
  { pattern: /^package\.json$/i, score: 95 },
  { pattern: /^pyproject\.toml$/i, score: 95 },
  { pattern: /^requirements.*\.txt$/i, score: 90 },
  { pattern: /^cargo\.toml$/i, score: 90 },
  { pattern: /^go\.mod$/i, score: 90 },
  { pattern: /^pom\.xml$/i, score: 90 },
  { pattern: /^composer\.json$/i, score: 90 },
  { pattern: /^gemfile$/i, score: 90 },
  { pattern: /^\.env\.example$/i, score: 85 },
  { pattern: /^license/i, score: 60 },
  { pattern: /^dockerfile/i, score: 70 },
  { pattern: /^docker-compose/i, score: 65 },
  { pattern: /^next\.config\./i, score: 50 },
  { pattern: /^tsconfig\.json$/i, score: 40 },
  { pattern: /\.(ts|tsx|js|jsx|py|rs|go|java|rb|php|cs|cpp|c|h)$/i, score: 30 },
  { pattern: /\.(md|mdx|rst)$/i, score: 25 },
  { pattern: /\.(json|toml|yaml|yml)$/i, score: 15 },
  { pattern: /\.(css|scss|html)$/i, score: 5 },
];

const MAX_FILE_BYTES = 80_000;       // skip files larger than this
const MAX_TOTAL_BYTES = 250_000;     // overall code corpus cap
const MAX_FILES = 60;                // hard cap on file count

export class GitHubService {
  private token: string;
  private headers: HeadersInit;

  constructor(token: string) {
    this.token = token;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    };
  }

  parseUrl(url: string): { owner: string; repo: string } {
    const trimmed = url.trim();
    // Accept formats:
    //   https://github.com/owner/repo
    //   https://github.com/owner/repo.git
    //   git@github.com:owner/repo.git
    //   github.com/owner/repo/tree/main/...
    //   owner/repo
    let owner = '';
    let repo = '';

    const sshMatch = trimmed.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i);
    if (sshMatch) {
      owner = sshMatch[1];
      repo = sshMatch[2];
    } else {
      const cleaned = trimmed
        .replace(/^https?:\/\//i, '')
        .replace(/^github\.com\//i, '')
        .replace(/\.git$/i, '')
        .replace(/[?#].*$/, '')
        .replace(/\/$/, '');
      const parts = cleaned.split('/').filter(Boolean);
      if (parts.length < 2) {
        throw new Error('Invalid GitHub URL. Use https://github.com/owner/repo');
      }
      owner = parts[0];
      repo = parts[1];
    }

    if (!owner || !repo) {
      throw new Error('Could not parse owner and repo from URL.');
    }
    return { owner, repo };
  }

  private scoreFile(path: string): number {
    const name = path.split('/').pop() ?? path;
    for (const { pattern, score } of PRIORITY_PATTERNS) {
      if (pattern.test(name)) return score;
    }
    return 0;
  }

  async getFiles(owner: string, repo: string, path: string = ''): Promise<GitHubFile[]> {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const response = await fetch(url, { headers: this.headers });

    if (response.status === 404) {
      throw new Error('Repository not found or is private.');
    }
    if (response.status === 403) {
      throw new Error('GitHub API rate limit reached or access denied.');
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch repo: ${response.status}`);
    }

    const items: GitHubFile[] = await response.json();
    const files: GitHubFile[] = [];

    for (const item of items) {
      if (item.type === 'file') {
        const lower = item.name.toLowerCase();
        if (SKIP_EXTENSIONS.some(ext => lower.endsWith(ext))) continue;
        if (SKIP_FILES.includes(item.name)) continue;
        if (typeof item.size === 'number' && item.size > MAX_FILE_BYTES) continue;
        files.push(item);
      } else if (item.type === 'dir') {
        const dirName = item.name.toLowerCase();
        if (SKIP_DIRS.has(dirName) || dirName.startsWith('.')) continue;
        const subFiles = await this.getFiles(owner, repo, item.path);
        files.push(...subFiles);
      }
    }

    return files;
  }

  async getFileContent(file: GitHubFile): Promise<string | null> {
    const response = await fetch(file.url, { headers: this.headers });

    if (response.status !== 200) {
      return null;
    }

    const data: GitHubContent = await response.json();
    
    if (data.encoding === 'base64') {
      const decoded = atob(data.content);
      return decoded;
    }

    return data.content;
  }

  async fetchRepo(url: string): Promise<{ code: string; repoName: string; owner: string }> {
    const { owner, repo } = this.parseUrl(url);

    const files = await this.getFiles(owner, repo);

    // Sort by priority (highest first), then by shallowest path
    const ranked = files
      .map(f => ({ file: f, score: this.scoreFile(f.path), depth: f.path.split('/').length }))
      .sort((a, b) => b.score - a.score || a.depth - b.depth)
      .slice(0, MAX_FILES);

    let allCode = '';
    let totalBytes = 0;
    const includedPaths: string[] = [];

    for (const { file } of ranked) {
      if (totalBytes >= MAX_TOTAL_BYTES) break;
      const content = await this.getFileContent(file);
      if (!content) continue;
      const remaining = MAX_TOTAL_BYTES - totalBytes;
      const snippet = content.length > remaining ? content.slice(0, remaining) + '\n...[truncated]' : content;
      allCode += `\n\n--- FILE: ${file.path} ---\n${snippet}`;
      totalBytes += snippet.length;
      includedPaths.push(file.path);
    }

    if (!allCode) {
      throw new Error('No readable source files were found in the repository.');
    }

    const treePreview = `Repository tree (${includedPaths.length} files included):\n${includedPaths.map(p => `- ${p}`).join('\n')}`;
    return { code: `${treePreview}${allCode}`, repoName: repo, owner };
  }
}

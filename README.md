<div align="center">

# README Generator

**Transform any GitHub repository into a stunning, professional README in one click.**

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cohere](https://img.shields.io/badge/Cohere-command--a-39594D?style=for-the-badge)](https://cohere.com/)
[![Tailwind](https://img.shields.io/badge/TailwindCSS-3-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

_Code with Curiosity, Create with Purpose_ &mdash; a Munaf.Studios project.

</div>

---

## What it does

Paste a GitHub repo URL, hit **Generate**, and this app will:

1. Walk the repo via the GitHub REST API.
2. Pick the highest-signal files (manifests, source, `.env.example`, existing README, etc.).
3. Send the distilled corpus to **Cohere's `command-a-03-2025`** with a carefully tuned system prompt.
4. Stream the result back as a full, shields-badged, emoji-garnished `README.md`.

You get a **live preview**, **source view**, **copy to clipboard**, and **download**.

## Stack

| Layer     | Tech                                                       |
| --------- | ---------------------------------------------------------- |
| Framework | Next.js 14 (App Router, Node runtime)                      |
| Language  | TypeScript 5                                               |
| Styling   | Tailwind CSS 3 + `@tailwindcss/typography` + Lora / Inter  |
| Icons     | lucide-react                                               |
| Markdown  | `react-markdown` + `remark-gfm`                            |
| AI        | `cohere-ai` v8 (Chat V2)                                   |
| Data      | GitHub REST API (`/repos/{owner}/{repo}/contents/...`)     |

## Getting started

### 1. Clone & install

```bash
git clone https://github.com/aliii-codes/Readme-Generator-V2.git
cd Read-me-Generator
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
COHERE_API_KEY=xxxxxxxxxxxxxxxxxxxx
```

- **`GITHUB_TOKEN`** &mdash; a classic or fine-grained PAT with `public_repo` read scope. Create one at <https://github.com/settings/tokens>.
- **`COHERE_API_KEY`** &mdash; grab a free trial key at <https://dashboard.cohere.com/api-keys>.

### 3. Run it

```bash
npm run dev
```

Open <http://localhost:3000>.

### 4. Build for production

```bash
npm run build
npm start
```

## Project structure

```
src/
  app/
    api/generate/route.ts   # POST /api/generate  -> { readme, repoName, owner }
    layout.tsx              # Root layout, Lora + Inter fonts
    page.tsx                # Landing page + preview/source UI
    globals.css             # Tailwind entry
  services/
    github.ts               # URL parsing, file crawl, priority ranking, byte cap
    cohere.ts               # System prompt + chat call + fence stripping
tailwind.config.ts          # Munaf.Studios warm palette + typography plugin
.env.example                # Required secrets
```

## How the crawler picks files

The GitHub service scores every file it finds against a list of priority patterns. `README*`, `package.json`, `pyproject.toml`, `requirements*.txt`, `Dockerfile`, `.env.example`, etc. rank highest; binary/media/lockfile extensions are skipped; `node_modules`, `.next`, `dist`, `venv`, and similar directories are never recursed into. The top-ranked files are concatenated up to a hard total byte budget (see `MAX_TOTAL_BYTES` in `src/services/github.ts`) so big monorepos don't blow past Cohere's context or your wall clock.

## Customizing the output

- **Prompt / style** &mdash; edit `SYSTEM_PROMPT` in `src/services/cohere.ts`.
- **Budgets** &mdash; `MAX_FILE_BYTES`, `MAX_TOTAL_BYTES`, `MAX_FILES` in `src/services/github.ts`, and `MAX_CODE_CHARS` in `src/services/cohere.ts`.
- **Look & feel** &mdash; colors live under `theme.extend.colors` in `tailwind.config.ts`.

## Troubleshooting

- **`Repository not found or is private`** &mdash; use a PAT with the right scope, or try a public repo.
- **`GitHub API rate limit reached`** &mdash; unauthenticated requests are limited; set `GITHUB_TOKEN`.
- **`Cohere API request failed`** &mdash; check your key and usage quota at the Cohere dashboard.
- **Module not found: `next/font/google`** &mdash; run `npm install`; fonts are resolved at build time.

## License

MIT &copy; Munaf.Studios

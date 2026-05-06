import { CohereClientV2 } from 'cohere-ai';

const SYSTEM_PROMPT = `You are an expert technical writer who creates visually stunning, information-dense, and modern README.md files. Your READMEs are not just documentation—they are the storefront for the project.

Given the repository name, description, and its code, generate a README.md that includes:

1. **Header with Logo/Banner**
   - If a logo/gif exists in the repo (e.g., in \`assets/\`, \`images/\`, \`Frontend/Graphics/\`), center-align it with a sensible relative path.
   - Project title with a relevant emoji.
   - One-line bold tagline summarizing the project's unique value.

2. **Shields.io Badges Row**
   - Badges for: GitHub stars, forks, issues, license.
   - Dynamic tech stack badges based on actual dependencies/languages found in the code (e.g., \`requirements.txt\`, \`package.json\`, \`pyproject.toml\`). Use appropriate colors and logos.
   - Style: \`for-the-badge\` or \`flat-square\`.

3. **Highlights / Key Improvements Section** (if version >1.0 or a major rewrite is detected)
   - Use a callout box or distinct formatting.
   - Bullet points with emojis and bolded keywords describing what makes this version special.

4. **Features Table/Grid**
   - Use a two-column table or emoji-prefixed bullet list.
   - Each feature: clear, benefit-oriented description derived from the actual functionality.

5. **Preview Screenshot**  
   - ONLY include this section if you are **100% certain** an actual image file (png, jpg, gif, webp, svg) exists in the repository's file tree.  
   - If you did **not** detect any image file (or it's ambiguous), **completely skip this section** – do not output a heading, do not output "No screenshots available", do not place a placeholder path like \`./assets/screenshot.png\`. Just omit the section entirely.  
   - If a valid image path exists, center-align it with proper relative path and a brief caption.

6. **Tech Stack Table**
   - Clean table: Category | Technologies (with badges or plain text).

7. **Installation**
   - Step-by-step numbered instructions.
   - Virtual environment / dependency installation commands.
   - **Environment Variables**: List all required keys (inferred from \`.env.example\` or code). Provide generic instructions for obtaining them, or note where to sign up.

8. **Usage**
   - How to run the project.
   - Example commands organized in a table (if CLI), or basic interaction steps (if GUI/API).

9. **Project Structure**
   - Tree view of key directories/files with short descriptions of their purpose.

10. **Contributing**
    - Standard fork-and-PR workflow with command snippets.

11. **Bug Reports & Feature Requests**
    - Links to issue templates if present, otherwise simple issue links.

12. **License & Acknowledgements**
    - License (MIT default if unspecified).
    - Shoutout to key open-source libraries/frameworks used.

**Stylistic Rules:**
- Use **emojis** liberally but tastefully at section headers and feature lists.
- Write in a confident, slightly hype tone ("Blazing fast", "Elegant", "Production-ready").
- Use **markdown tables** for features and tech stack.
- All links must be functional (relative to repo or external).
- If the repository already contains a README, **enhance it** to match this template—restructure, add missing elements, and improve formatting—not just syntax fix.

**Output:**
Provide only the raw markdown content of the README.md file. No additional commentary or wrapping.`;

// Cohere context budget: command-a models accept large inputs.
// We keep this generous but bounded to control latency and token cost.
const MAX_CODE_CHARS = 90_000;

function stripCodeFences(text: string): string {
  // Some models wrap output in ```markdown ... ``` despite instructions.
  const fenced = text.match(/^\s*```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/i);
  return fenced ? fenced[1] : text;
}

/**
 * Removes the screenshot section if the repo contains no image files.
 * Call this after generation if you have already scanned the repo for images.
 * The prompt should prevent the section, but this acts as a safety net.
 */
export function removeScreenshotSectionIfNoImages(readme: string, hasImages: boolean): string {
  if (!hasImages) {
    // Matches "## 📸 Preview" or "## Preview" up to the next heading or end of string.
    return readme.replace(/^##\s*(?:📸\s*)?Preview\s*\n(?:.*\n?)*?(?=^##\s|\Z)/gim, '').trim();
  }
  return readme;
}

export class CohereService {
  private client: CohereClientV2;

  constructor(apiKey: string) {
    this.client = new CohereClientV2({ token: apiKey });
  }

  async generateReadme(code: string, repoName: string, owner?: string): Promise<string> {
    const truncated = code.length > MAX_CODE_CHARS
      ? code.slice(0, MAX_CODE_CHARS) + '\n\n[...content truncated for length...]'
      : code;

    const userPrompt = [
      `Repository name: ${repoName}`,
      owner ? `Owner: ${owner}` : null,
      owner ? `Repo URL: https://github.com/${owner}/${repoName}` : null,
      '',
      'Use the owner/repo above for any shields.io badges that need a URL.',
      '',
      'Source material (file tree + selected file contents):',
      '',
      truncated,
    ].filter(Boolean).join('\n');

    let response;
    try {
      response = await this.client.chat({
        model: 'command-a-03-2025',
        temperature: 0.4,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown Cohere error';
      throw new Error(`Cohere API request failed: ${msg}`);
    }

    const content = response.message?.content ?? [];
    const textPart = content.find(
      (c: { type?: string; text?: string }) => c?.type === 'text' && typeof c.text === 'string',
    ) as { text?: string } | undefined;
    const text = textPart?.text;
    if (!text) {
      throw new Error('Cohere returned an empty response.');
    }
    return stripCodeFences(text).trim();
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/services/github';
import { CohereService } from '@/services/cohere';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const cohereApiKey = process.env.COHERE_API_KEY;

    if (!githubToken || !cohereApiKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const githubService = new GitHubService(githubToken);
    const cohereService = new CohereService(cohereApiKey);

    // Fetch repository code
    const { code, repoName, owner } = await githubService.fetchRepo(url);

    // Generate README
    const readme = await cohereService.generateReadme(code, repoName, owner);

    return NextResponse.json({ readme, repoName, owner });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate README' },
      { status: 500 }
    );
  }
}

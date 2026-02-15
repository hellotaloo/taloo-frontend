import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Force Node.js runtime for file system access
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'test-scorecards.json');

interface Scorecard {
  id: string;
  name: string;
  date: string;
  completionStatus: string;
  questionsUnderstanding: string;
  agentResponse: string;
  stuckOrConfused: string;
  liked: string;
  couldBeBetter: string;
  score: string;
  submittedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Ensure data directory exists
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }

    // Read existing data or create empty array
    let scorecards: Scorecard[] = [];
    if (existsSync(DATA_FILE)) {
      const fileContent = await readFile(DATA_FILE, 'utf-8');
      scorecards = JSON.parse(fileContent);
    }

    // Add new scorecard with ID
    const newScorecard: Scorecard = {
      id: `sc_${Date.now()}`,
      ...data,
    };
    scorecards.push(newScorecard);

    // Write back to file
    await writeFile(DATA_FILE, JSON.stringify(scorecards, null, 2));

    return NextResponse.json({ success: true, id: newScorecard.id });
  } catch (error) {
    console.error('Error saving scorecard:', error);
    return NextResponse.json(
      { error: 'Failed to save scorecard' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    if (!existsSync(DATA_FILE)) {
      return NextResponse.json([]);
    }

    const fileContent = await readFile(DATA_FILE, 'utf-8');
    const scorecards = JSON.parse(fileContent);

    return NextResponse.json(scorecards);
  } catch (error) {
    console.error('Error reading scorecards:', error);
    return NextResponse.json(
      { error: 'Failed to read scorecards' },
      { status: 500 }
    );
  }
}

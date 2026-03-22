import { NextResponse } from 'next/server';
import { polls } from '@/lib/store';

export async function POST(request: Request) {
  const { options } = await request.json();
  // Generate a random 4-character alphanumeric code
  const code = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  polls[code] = {
    code,
    options,
    eliminated: [],
    rounds: [{ votes: {} }], // Start with round 1 empty
    status: 'nominating',
    nominations: {},
    winner: null,
  };

  return NextResponse.json({ code });
}

export async function GET() {
  const activePoll = Object.values(polls).find((p: any) => p.status !== 'finished');
  return NextResponse.json({ activeCode: activePoll ? (activePoll as any).code : null });
}

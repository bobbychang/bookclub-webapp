import { NextResponse } from 'next/server';
import { polls } from '@/lib/store';

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const poll = polls[code.toUpperCase()];
  if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  return NextResponse.json(poll);
}

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { name, option } = await request.json();
  const poll = polls[code.toUpperCase()];
  
  if (!poll || poll.status === 'finished') return NextResponse.json({ error: 'Invalid poll' }, { status: 400 });

  const currentRound = poll.rounds[poll.rounds.length - 1];
  currentRound.votes[name] = option;

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const poll = polls[code.toUpperCase()];
  if (!poll || poll.status === 'finished') return NextResponse.json({ error: 'Invalid poll' }, { status: 400 });

  const currentRound = poll.rounds[poll.rounds.length - 1];
  const votes = Object.values(currentRound.votes);
  
  const tallies: Record<string, number> = {};
  poll.options.forEach(opt => tallies[opt] = 0); 
  votes.forEach(vote => { if (tallies[vote] !== undefined) tallies[vote]++; });

  const minVotes = Math.min(...Object.values(tallies));
  const toEliminate = poll.options.filter(opt => tallies[opt] === minVotes);

  // --- NEW TIE-BREAKER LOGIC ---
  // If all remaining options are tied for the lowest amount of votes
  if (toEliminate.length === poll.options.length) {
    // Do not eliminate anyone. Just start a new round for a revote.
    poll.rounds.push({ votes: {} });
  } else {
    // Normal elimination
    poll.eliminated.push(...toEliminate);
    poll.options = poll.options.filter(opt => !toEliminate.includes(opt));

    if (poll.options.length === 1) {
      poll.status = 'finished';
      poll.winner = poll.options[0];
    } else {
      // Start a new round
      poll.rounds.push({ votes: {} });
    }
  }

  return NextResponse.json(poll);
}

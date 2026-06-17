import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Poll } from '@/lib/store';

export async function POST(request: Request) {
  const { options } = await request.json();
  const code = Math.random().toString(36).substring(2, 6).toUpperCase();

  const pollData: Poll = {
    code,
    options,
    eliminated: [],
    rounds: [{ votes: {} }],
    status: 'nominating',
    nominations: {},
    winner: null,
  };

  await prisma.bookPoll.create({
    data: { code, data: pollData as any },
  });

  return NextResponse.json({ code });
}

export async function GET() {
  const allPolls = await prisma.bookPoll.findMany({ orderBy: { createdAt: 'desc' } });
  const activePoll = allPolls.find(p => (p.data as any).status !== 'finished');
  return NextResponse.json({ activeCode: activePoll ? activePoll.code : null });
}

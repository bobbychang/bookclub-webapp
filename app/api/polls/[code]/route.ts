import { NextResponse } from 'next/server';
import { BookStatus, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fetchBookMetadata } from '@/lib/books';
import type { Poll } from '@/lib/store';

async function getPoll(code: string): Promise<Poll | null> {
  const record = await prisma.bookPoll.findUnique({ where: { code: code.toUpperCase() } });
  return record ? (record.data as unknown as Poll) : null;
}

async function savePoll(poll: Poll): Promise<void> {
  await prisma.bookPoll.update({
    where: { code: poll.code },
    data: { data: poll as any },
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const poll = await getPoll(code);
  if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  return NextResponse.json(poll);
}

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await request.json();
  const poll = await getPoll(code);

  if (!poll || poll.status === 'finished') return NextResponse.json({ error: 'Invalid poll' }, { status: 400 });

  if (body.action === 'nominate' && poll.status === 'nominating') {
    const { name, title, recommenderId } = body;

    if (title === 'SKIP') {
      poll.nominations[name] = { title: null };
      await savePoll(poll);
      return NextResponse.json({ success: true });
    }

    poll.nominations[name] = { title };

    const existing = await prisma.book.findFirst({
      where: { title: { equals: title, mode: 'insensitive' } },
    });

    if (!existing && recommenderId) {
      const metadata = await fetchBookMetadata(title);

      await prisma.book.create({
        data: {
          title,
          author: metadata.author,
          coverUrl: metadata.coverUrl,
          status: BookStatus.FUTURE_SUGGESTION,
          recommenderId,
        },
      });
    }

    await savePoll(poll);
    return NextResponse.json({ success: true });
  }

  if (body.action === 'vote' && poll.status === 'voting') {
    const currentRound = poll.rounds[poll.rounds.length - 1];
    currentRound.votes[body.name] = body.option;
    await savePoll(poll);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action or poll phase' }, { status: 400 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const poll = await getPoll(code);
  if (!poll || poll.status === 'finished') return NextResponse.json({ error: 'Invalid poll' }, { status: 400 });

  if (poll.status === 'nominating') {
    poll.status = 'voting';
    const uniqueOptions = new Set<string>();
    Object.values(poll.nominations).forEach(nom => {
      if (nom.title) uniqueOptions.add(nom.title);
    });
    poll.options = Array.from(uniqueOptions);
    if (poll.options.length < 2) {
      poll.options.push('Default Book A', 'Default Book B');
    }
    await savePoll(poll);
    return NextResponse.json(poll);
  }

  // Voting phase resolution
  const currentRound = poll.rounds[poll.rounds.length - 1];
  const votes = Object.values(currentRound.votes);
  const tallies: Record<string, number> = {};
  poll.options.forEach(opt => (tallies[opt] = 0));
  votes.forEach(vote => {
    if (tallies[vote] !== undefined) tallies[vote]++;
  });

  const minVotes = Math.min(...Object.values(tallies));
  const toEliminate = poll.options.filter(opt => tallies[opt] === minVotes);

  if (toEliminate.length === poll.options.length) {
    poll.rounds.push({ votes: {} });
  } else {
    poll.eliminated.push(...toEliminate);
    poll.options = poll.options.filter(opt => !toEliminate.includes(opt));
    if (poll.options.length === 1) {
      poll.status = 'finished';
      poll.winner = poll.options[0]!;

      // Move the prior next book into history, then promote the winner.
      try {
        const metadata = await fetchBookMetadata(poll.winner);

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          await tx.book.updateMany({
            where: { status: BookStatus.NEXT },
            data: { status: BookStatus.COMPLETED, completedAt: new Date() },
          });

          const existingWinner = await tx.book.findFirst({
            where: { title: { equals: poll.winner!, mode: 'insensitive' } },
          });

          if (existingWinner) {
            await tx.book.update({
              where: { id: existingWinner.id },
              data: {
                author: existingWinner.author ?? metadata.author,
                coverUrl: existingWinner.coverUrl ?? metadata.coverUrl,
                status: BookStatus.NEXT,
                selectedAt: new Date(),
                completedAt: null,
              },
            });
          } else {
            await tx.book.create({
              data: {
                title: poll.winner!,
                author: metadata.author,
                coverUrl: metadata.coverUrl,
                status: BookStatus.NEXT,
                selectedAt: new Date(),
              },
            });
          }
        });
      } catch (e) {}
    } else {
      poll.rounds.push({ votes: {} });
    }
  }

  await savePoll(poll);
  return NextResponse.json(poll);
}

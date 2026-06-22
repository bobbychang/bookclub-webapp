import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';
import { format } from 'date-fns';
import { BOOKCLUB_NAME } from '@/lib/constants';

const APP_URL = 'https://bookclub.bobbychang.co';
const FROM_ADDRESS = `${BOOKCLUB_NAME} <noreply@bookclub.bobbychang.co>`;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminProfile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (!adminProfile?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const { pollId } = await request.json();
  if (!pollId) {
    return NextResponse.json({ error: 'pollId is required' }, { status: 400 });
  }

  const poll = await prisma.schedulingPoll.findUnique({
    where: { id: pollId },
    include: {
      dates: {
        include: { responses: true },
        orderBy: { date: 'asc' },
      },
    },
  });

  if (!poll || poll.status !== 'VOTING') {
    return NextResponse.json({ error: 'Poll is not in VOTING state' }, { status: 400 });
  }

  const respondedUserIds = new Set(poll.dates.flatMap(d => d.responses.map(r => r.userId)));
  const allProfiles = await prisma.profile.findMany({ select: { id: true, email: true, displayName: true } });
  const pending = allProfiles.filter(p => !respondedUserIds.has(p.id));

  if (pending.length === 0) {
    return NextResponse.json({ sent: [], message: 'Everyone has already responded.' });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 });
  }

  const currentBook = await prisma.book.findFirst({ where: { status: 'NEXT' } });
  const bookLine = currentBook ? `<p>We're reading <strong>${currentBook.title}</strong>${currentBook.author ? ` by ${currentBook.author}` : ''}.</p>` : '';

  const dateListItems = poll.dates
    .map(d => `<li style="padding: 4px 0;">${format(new Date(d.date), 'EEEE, MMMM do')}</li>`)
    .join('');

  const resend = new Resend(process.env.RESEND_API_KEY);
  const sent: string[] = [];
  const errors: string[] = [];

  await Promise.all(
    pending.map(async (member) => {
      const name = member.displayName || member.email.split('@')[0];
      const html = `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
          <h2 style="margin-top: 0;">📚 ${BOOKCLUB_NAME}</h2>
          <p>Hey ${name},</p>
          ${bookLine}
          <p>We're locking in the date for the next meeting — please fill out your availability when you get a chance!</p>
          <h3 style="margin-bottom: 8px;">Proposed dates:</h3>
          <ul style="padding-left: 20px; margin: 0 0 24px;">
            ${dateListItems}
          </ul>
          <a href="${APP_URL}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
            Mark My Availability →
          </a>
          <p style="margin-top: 40px; color: #888; font-size: 12px;">
            You're receiving this because you're a member of ${BOOKCLUB_NAME}.
          </p>
        </div>
      `;

      const { error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: member.email,
        subject: `[${BOOKCLUB_NAME}] Fill out your availability!`,
        html,
      });

      if (error) {
        errors.push(`${name}: ${error.message}`);
      } else {
        sent.push(name);
      }
    })
  );

  return NextResponse.json({ sent, errors });
}

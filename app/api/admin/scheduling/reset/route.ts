import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (!profile?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const { pollId } = await request.json();
  if (!pollId) {
    return NextResponse.json({ error: 'pollId required' }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Delete all availability responses for this poll's dates
      await tx.availability.deleteMany({
        where: { date: { pollId } },
      });
      // Delete all proposed dates
      await tx.proposedDate.deleteMany({ where: { pollId } });
      // Reset poll to IDLE so a new round can be started
      await tx.schedulingPoll.update({
        where: { id: pollId },
        data: { status: 'IDLE', finalDate: null, location: null },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error resetting scheduling poll:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

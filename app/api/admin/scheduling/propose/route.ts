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

  // Verify Admin Status
  const profile = await prisma.profile.findUnique({
    where: { id: user.id }
  });

  if (!profile?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const { pollId, dates } = await request.json();

    if (!pollId || !dates || !Array.isArray(dates)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Use a transaction to ensure atomic updates
    await prisma.$transaction([
      // 1. Insert Proposed Dates
      prisma.proposedDate.createMany({
        data: dates.map((d: any) => ({
          pollId,
          date: d.date,
          createdAt: now,
          updatedAt: now
        }))
      }),
      // 2. Update Poll Status to VOTING
      prisma.schedulingPoll.update({
        where: { id: pollId },
        data: { 
          status: 'VOTING',
          updatedAt: now
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error proposing dates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

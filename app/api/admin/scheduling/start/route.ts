import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/lib/prisma';

export async function POST() {
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

  try {
    const poll = await prisma.schedulingPoll.create({
      data: { status: 'PROPOSING' },
    });

    return NextResponse.json({ id: poll.id, status: poll.status });
  } catch (error: any) {
    console.error('Error starting scheduling round:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

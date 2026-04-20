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
    const { pollId, location } = await request.json();

    if (!pollId || typeof location !== 'string') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const now = new Date().toISOString();

    await prisma.schedulingPoll.update({
      where: { id: pollId },
      data: { 
        location: location,
        updatedAt: now
      }
    });

    return NextResponse.json({ success: true, location });
  } catch (error: any) {
    console.error('Error updating location:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

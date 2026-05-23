import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const profiles = await prisma.profile.findMany({
      where: { is_bookclub_member: true },
      select: {
        id: true,
        displayName: true,
        email: true,
      },
      orderBy: [
        { displayName: 'asc' },
        { email: 'asc' },
      ],
    });

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("Failed to fetch profiles:", error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
}

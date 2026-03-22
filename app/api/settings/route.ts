import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          currentBookTitle: "The Phoenix Project",
          currentBookAuthor: "Gene Kim",
          currentBookCoverUrl: "https://m.media-amazon.com/images/I/71XyEuH82CL._AC_UF1000,1000_QL80_.jpg"
        }
      });
    }
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

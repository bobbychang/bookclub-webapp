import { NextResponse } from 'next/server';
import { BookStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { defaultBookCoverUrl } from '@/lib/books';

export async function GET() {
  try {
    let nextBook = await prisma.book.findFirst({
      where: { status: BookStatus.NEXT },
      orderBy: { selectedAt: 'desc' },
    });

    if (!nextBook) {
      nextBook = await prisma.book.create({
        data: {
          title: "The Phoenix Project",
          author: "Gene Kim",
          coverUrl: defaultBookCoverUrl(),
          status: BookStatus.NEXT,
          selectedAt: new Date(),
        }
      });
    }

    return NextResponse.json({
      id: nextBook.id,
      currentBookTitle: nextBook.title,
      currentBookAuthor: nextBook.author ?? "Unknown",
      currentBookCoverUrl: defaultBookCoverUrl(nextBook.coverUrl),
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

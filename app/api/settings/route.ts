import { NextResponse } from 'next/server';
import { BookStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { defaultBookCoverUrl } from '@/lib/books';

export async function GET() {
  try {
    const nextBook = await prisma.book.findFirst({
      where: { status: BookStatus.NEXT },
      orderBy: { selectedAt: 'desc' },
    });

    if (!nextBook) {
      return NextResponse.json({
        hasCurrentBook: false,
        currentBookTitle: "Next book under selection",
        currentBookAuthor: null,
        currentBookCoverUrl: null,
      });
    }

    return NextResponse.json({
      hasCurrentBook: true,
      id: nextBook.id,
      currentBookTitle: nextBook.title,
      currentBookAuthor: nextBook.author ?? "Unknown",
      currentBookCoverUrl: defaultBookCoverUrl(nextBook.coverUrl),
    });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

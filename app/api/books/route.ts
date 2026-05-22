import { NextResponse } from 'next/server';
import { BookStatus, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fetchBookMetadata } from '@/lib/books';

function parseStatus(status: unknown): BookStatus | undefined {
  if (typeof status !== 'string') return undefined;
  if (status in BookStatus) return BookStatus[status as keyof typeof BookStatus];
  return undefined;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = parseStatus(searchParams.get('status'));

    const books = await prisma.book.findMany({
      where: status ? { status } : undefined,
      include: { recommender: true },
      orderBy: [
        { completedAt: 'desc' },
        { selectedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error("Failed to fetch books:", error);
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, recommenderId, status } = await request.json();
    const bookStatus = parseStatus(status) ?? BookStatus.FUTURE_SUGGESTION;

    if (!title || !recommenderId) {
      return NextResponse.json({ error: 'Missing title or recommenderId' }, { status: 400 });
    }

    const existing = await prisma.book.findFirst({
      where: { title: { equals: title, mode: 'insensitive' } },
      include: { recommender: true },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const metadata = await fetchBookMetadata(title);
    const book = await prisma.book.create({
      data: {
        title,
        author: metadata.author,
        coverUrl: metadata.coverUrl,
        status: bookStatus,
        recommenderId,
      },
      include: { recommender: true },
    });

    return NextResponse.json(book);
  } catch (error) {
    console.error("Failed to create book:", error);
    return NextResponse.json({ error: 'Failed to create book' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status, userId, isAdmin } = await request.json();
    const bookStatus = parseStatus(status);

    if (!id || !bookStatus || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedBook = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (bookStatus === BookStatus.NEXT) {
        await tx.book.updateMany({
          where: { status: BookStatus.NEXT },
          data: { status: BookStatus.COMPLETED, completedAt: new Date() },
        });
      }

      return tx.book.update({
        where: { id },
        data: {
          status: bookStatus,
          selectedAt: bookStatus === BookStatus.NEXT ? new Date() : undefined,
          completedAt: bookStatus === BookStatus.COMPLETED ? new Date() : null,
        },
        include: { recommender: true },
      });
    });

    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error("Failed to update book:", error);
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id, userId, isAdmin } = await request.json();
    if (!id || !userId) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (book.recommenderId !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.book.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete book:", error);
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
  }
}

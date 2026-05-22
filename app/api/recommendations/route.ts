import { NextResponse } from 'next/server';
import { BookStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { fetchBookMetadata } from '@/lib/books';

export async function GET() {
  try {
    const recommendations = await prisma.book.findMany({
      where: { status: BookStatus.FUTURE_SUGGESTION },
      include: { recommender: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Failed to fetch recommendations:", error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, recommenderId } = await request.json();
    
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
    const recommendation = await prisma.book.create({
      data: {
        title,
        author: metadata.author,
        coverUrl: metadata.coverUrl,
        status: BookStatus.FUTURE_SUGGESTION,
        recommenderId
      },
      include: { recommender: true }
    });

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error("Failed to create recommendation:", error);
    return NextResponse.json({ error: 'Failed to create recommendation' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id, userId, isAdmin } = await request.json();
    if (!id || !userId) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    const rec = await prisma.book.findUnique({ where: { id } });
    if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (rec.recommenderId !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.book.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete recommendation:", error);
    return NextResponse.json({ error: 'Failed to delete recommendation' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Assumed from view_file

export async function GET() {
  try {
    const recommendations = await prisma.recommendation.findMany({
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

    let author = null;
    
    // Try OpenLibrary API
    try {
      const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`;
      const res = await fetch(searchUrl, {
        headers: { 'User-Agent': 'ValenciaBookClubWebApp/1.0' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.docs && data.docs.length > 0) {
          const book = data.docs[0];
          if (book.author_name && book.author_name.length > 0) {
            author = book.author_name[0];
          }
        }
      }
    } catch (apiError) {
      console.error("Failed to fetch from OpenLibrary:", apiError);
    }

    const recommendation = await prisma.recommendation.create({
      data: {
        title,
        author,
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

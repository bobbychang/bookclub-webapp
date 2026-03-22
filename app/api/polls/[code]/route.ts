import { NextResponse } from 'next/server';
import { polls } from '@/lib/store';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const poll = polls[code.toUpperCase()];
  if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  return NextResponse.json(poll);
}

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await request.json();
  const poll = polls[code.toUpperCase()];
  
  if (!poll || poll.status === 'finished') return NextResponse.json({ error: 'Invalid poll' }, { status: 400 });

  if (body.action === 'nominate' && poll.status === 'nominating') {
     const { name, title, recommenderId } = body;
     
     if (title === 'SKIP') {
       poll.nominations[name] = { title: null };
       return NextResponse.json({ success: true });
     }
     
     poll.nominations[name] = { title };
     
     // Check if Recommendation already exists
     const existing = await prisma.recommendation.findFirst({
        where: { title: { equals: title, mode: 'insensitive' } }
     });
     
     if (!existing && recommenderId) {
        let author = null;
        try {
          const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`;
          const res = await fetch(searchUrl, { headers: { 'User-Agent': 'ValenciaBookClubWebApp/1.0' } });
          const data = await res.json();
          if (data.docs?.[0]?.author_name?.[0]) {
             author = data.docs[0].author_name[0];
          }
        } catch(e) {}
        
        await prisma.recommendation.create({
          data: { title, author, recommenderId }
        });
     }
     return NextResponse.json({ success: true });
  }

  if (body.action === 'vote' && poll.status === 'voting') {
    const currentRound = poll.rounds[poll.rounds.length - 1];
    currentRound.votes[body.name] = body.option;
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action or poll phase' }, { status: 400 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const poll = polls[code.toUpperCase()];
  if (!poll || poll.status === 'finished') return NextResponse.json({ error: 'Invalid poll' }, { status: 400 });

  if (poll.status === 'nominating') {
    // Admin transitions to voting phase
    poll.status = 'voting';
    const uniqueOptions = new Set<string>();
    Object.values(poll.nominations).forEach(nom => {
      if (nom.title) uniqueOptions.add(nom.title);
    });
    poll.options = Array.from(uniqueOptions);
    if (poll.options.length < 2) {
      poll.options.push("Default Book A", "Default Book B");
    }
    return NextResponse.json(poll);
  }

  // Voting phase resolution
  const currentRound = poll.rounds[poll.rounds.length - 1];
  const votes = Object.values(currentRound.votes);
  const tallies: Record<string, number> = {};
  poll.options.forEach(opt => tallies[opt] = 0); 
  votes.forEach(vote => { if (tallies[vote] !== undefined) tallies[vote]++; });

  const minVotes = Math.min(...Object.values(tallies));
  const toEliminate = poll.options.filter(opt => tallies[opt] === minVotes);

  if (toEliminate.length === poll.options.length) {
    poll.rounds.push({ votes: {} });
  } else {
    poll.eliminated.push(...toEliminate);
    poll.options = poll.options.filter(opt => !toEliminate.includes(opt));
    if (poll.options.length === 1) {
      poll.status = 'finished';
      poll.winner = poll.options[0]!;
      
      // Update Settings table dynamically with the new winner and cover Image!
      try {
          const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(poll.winner)}&limit=1`;
          const res = await fetch(searchUrl, { headers: { 'User-Agent': 'ValenciaBookClubWebApp/1.0' } });
          const data = await res.json();
          let author = "Unknown";
          let coverUrl = "https://m.media-amazon.com/images/I/71XyEuH82CL._AC_UF1000,1000_QL80_.jpg";
          
          if (data.docs?.[0]) {
             if (data.docs[0].author_name?.[0]) author = data.docs[0].author_name[0];
             if (data.docs[0].cover_i) coverUrl = `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`;
          }
          
          const settings = await prisma.settings.findFirst();
          if (settings) {
            await prisma.settings.update({
              where: { id: settings.id },
              data: { currentBookTitle: poll.winner, currentBookAuthor: author, currentBookCoverUrl: coverUrl }
            });
          }
      } catch(e) {}
    } else {
      poll.rounds.push({ votes: {} });
    }
  }

  return NextResponse.json(poll);
}

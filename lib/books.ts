export type BookMetadata = {
  author: string | null;
  coverUrl: string | null;
};

const fallbackCoverUrl = "https://m.media-amazon.com/images/I/71XyEuH82CL._AC_UF1000,1000_QL80_.jpg";

export async function fetchBookMetadata(title: string): Promise<BookMetadata> {
  try {
    const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`;
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'ValenciaBookClubWebApp/1.0' }
    });

    if (!res.ok) {
      return { author: null, coverUrl: null };
    }

    const data = await res.json();
    const book = data.docs?.[0];

    return {
      author: book?.author_name?.[0] ?? null,
      coverUrl: book?.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : null,
    };
  } catch (error) {
    console.error("Failed to fetch from OpenLibrary:", error);
    return { author: null, coverUrl: null };
  }
}

export function defaultBookCoverUrl(coverUrl?: string | null) {
  return coverUrl || fallbackCoverUrl;
}

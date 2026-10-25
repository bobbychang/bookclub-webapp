import { BOOKCLUB_NAME } from "../lib/constants";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BookStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { defaultBookCoverUrl } from "@/lib/books";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://bookclub.bobbychang.co";

export async function generateMetadata(): Promise<Metadata> {
  let ogImage: string | undefined;
  let description = "Official voting and home page for the Valencia Bookclub Boys";

  try {
    const nextBook = await prisma.book.findFirst({
      where: { status: BookStatus.NEXT },
      orderBy: { selectedAt: "desc" },
    });

    if (nextBook) {
      ogImage = defaultBookCoverUrl(nextBook.coverUrl);
      description = `Now reading: ${nextBook.title}${nextBook.author ? ` by ${nextBook.author}` : ""}`;
    }
  } catch {
    // DB unavailable at build time — fall back to defaults
  }

  return {
    title: BOOKCLUB_NAME,
    description,
    icons: {
      icon: "/icon.svg",
      shortcut: "/icon.svg",
    },
    openGraph: {
      title: BOOKCLUB_NAME,
      description,
      url: SITE_URL,
      siteName: BOOKCLUB_NAME,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      type: "website",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

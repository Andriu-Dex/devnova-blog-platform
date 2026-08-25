import { NextResponse } from "next/server";
import { listPublishedBlogsForFeed } from "@/server/blogs/public-blog-service";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const blogs = await listPublishedBlogsForFeed(30);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://devnova.vercel.app"; // fallback
  
  const rssItems = blogs.map((blog) => {
    const itemUrl = `${siteUrl}/blogs/${blog.slug}`;
    const pubDate = new Date(blog.publishedAt).toUTCString();
    
    return `
    <item>
      <title>${escapeXml(blog.title)}</title>
      <link>${itemUrl}</link>
      <guid isPermaLink="true">${itemUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(blog.summary)}</description>
      <author>${escapeXml(blog.creatorName)}</author>
    </item>`;
  }).join("");

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>DevNova</title>
    <link>${siteUrl}</link>
    <description>Publicaciones y recursos compartidos por la comunidad DevNova</description>
    <language>es</language>
${rssItems}
  </channel>
</rss>`;

  return new NextResponse(rssFeed, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}

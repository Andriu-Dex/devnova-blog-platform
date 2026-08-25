import { NextRequest, NextResponse } from "next/server";
import { requireAuthorOrAdmin } from "@/server/auth/authorization";
import { db } from "@/server/db";
import { blogs, blogVersions } from "@/server/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
  try {
    await requireAuthorOrAdmin();
  } catch (error) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { blogId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const versionParam = searchParams.get("version");

  if (!versionParam) {
    return new NextResponse("Missing version parameter", { status: 400 });
  }

  const blog = await db
    .select({
      id: blogs.id,
      slug: blogs.slug,
    })
    .from(blogs)
    .where(and(eq(blogs.id, blogId), isNull(blogs.deletedAt)))
    .limit(1)
    .then((res) => res[0]);

  if (!blog) {
    return new NextResponse("Not Found", { status: 404 });
  }

  let targetVersion;

  if (versionParam === "latest") {
    targetVersion = await db
      .select()
      .from(blogVersions)
      .where(eq(blogVersions.blogId, blogId))
      .orderBy(desc(blogVersions.versionNumber))
      .limit(1)
      .then((res) => res[0]);
  } else {
    const vNum = parseInt(versionParam, 10);
    if (isNaN(vNum)) {
      return new NextResponse("Invalid version parameter", { status: 400 });
    }
    targetVersion = await db
      .select()
      .from(blogVersions)
      .where(
        and(
          eq(blogVersions.blogId, blogId),
          eq(blogVersions.versionNumber, vNum)
        )
      )
      .limit(1)
      .then((res) => res[0]);
  }

  if (!targetVersion) {
    return new NextResponse("Version not found", { status: 404 });
  }

  const exportMetadata = {
    formatVersion: 1,
    title: targetVersion.title,
    slug: blog.slug,
    summary: targetVersion.summary,
    versionNumber: targetVersion.versionNumber,
    exportedAt: new Date().toISOString(),
    source: versionParam === "latest" ? "latest" : `v${targetVersion.versionNumber}`,
    hasCover: !!targetVersion.coverMediaAssetId
  };

  const header = `<!--\ndevnova-export\n${JSON.stringify(exportMetadata, null, 2)}\n-->\n\n`;
  const markdownContent = `${header}${targetVersion.contentMarkdown}`;

  const sanitizedSlug = blog.slug.replace(/[^a-z0-9-]/gi, "-");
  const filename = versionParam === "latest" 
    ? `${sanitizedSlug}-latest.md`
    : `${sanitizedSlug}-v${targetVersion.versionNumber}.md`;

  return new NextResponse(markdownContent, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

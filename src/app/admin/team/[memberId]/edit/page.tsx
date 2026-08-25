import { requireAdmin } from "@/server/auth/authorization";
import { getTeamMemberEditData } from "@/server/team/team-service";
import { db } from "@/server/db";
import { mediaAssets } from "@/server/db/schema";
import { isNull, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import EditTeamForm from "./edit-team-form";
import { Metadata } from "next";
import { buildCloudinaryThumbnailUrl } from "@/lib/cloudinary-url";

export const metadata: Metadata = {
  title: "Editar Integrante | DevNova",
};

export default async function EditTeamMemberPage({ params }: { params: { memberId: string } }) {
  await requireAdmin();
  
  const { memberId } = params;
  const initialData = await getTeamMemberEditData(memberId);
  
  if (!initialData) {
    notFound();
  }

  const mediaRows = await db
    .select()
    .from(mediaAssets)
    .where(isNull(mediaAssets.deletedAt))
    .orderBy(desc(mediaAssets.createdAt));

  const mappedMedia = mediaRows.map(m => ({
    id: m.id,
    publicId: m.cloudinaryPublicId,
    format: m.format,
    originalFilename: m.originalFilename,
    width: m.width,
    height: m.height,
    sizeBytes: m.sizeBytes,
    uploaderName: m.uploadedByUserId,
    createdAt: m.createdAt,
    deletedAt: m.deletedAt,
    thumbnailUrl: buildCloudinaryThumbnailUrl(m.cloudinaryPublicId, m.format)
  }));

  return (
    <main style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "30px" }}>Editar Integrante: {initialData.fullName}</h1>
      
      <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "8px", border: "1px solid #eaeaea" }}>
        <EditTeamForm initialData={initialData} memberId={memberId} mediaList={mappedMedia} />
      </div>
    </main>
  );
}

import { requireAdmin } from "@/server/auth/authorization";
import NewTeamForm from "./team-form";
import { db } from "@/server/db";
import { mediaAssets } from "@/server/db/schema";
import { isNull, desc } from "drizzle-orm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nuevo Integrante | DevNova",
};

export default async function NewTeamMemberPage() {
  await requireAdmin();

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
    thumbnailUrl: `https://res.cloudinary.com/db7y9bmbw/image/upload/c_thumb,w_200,g_face/v1/${m.cloudinaryPublicId}.${m.format}`
  }));

  return (
    <main style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "30px" }}>Añadir Nuevo Integrante</h1>
      
      <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "8px", border: "1px solid #eaeaea" }}>
        <NewTeamForm mediaList={mappedMedia} />
      </div>
    </main>
  );
}

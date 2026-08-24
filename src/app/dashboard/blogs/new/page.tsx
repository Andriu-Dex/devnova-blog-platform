import { requireAuthorOrAdmin } from "@/server/auth/authorization";
import { listActiveMedia } from "@/server/media/media-service";
import { PrivateHeader } from "@/components/layout/private-header";
import { NewBlogForm } from "./new-blog-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear Blog | DevNova",
  description: "Crea una nueva entrada de blog",
};

export default async function NewBlogPage() {
  const user = await requireAuthorOrAdmin();
  const mediaList = await listActiveMedia();

  return (
    <main>
      <PrivateHeader displayName={user.displayName} role={user.role} />
      <NewBlogForm mediaList={mediaList} />
    </main>
  );
}

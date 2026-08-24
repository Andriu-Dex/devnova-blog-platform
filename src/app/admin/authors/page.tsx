import { requireAdmin } from "@/server/auth/authorization";
import { PrivateHeader } from "@/components/layout/private-header";
import { Metadata } from "next";
import { listAuthors } from "@/server/users/author-service";
import { AuthorsManager } from "./author-components";

export const metadata: Metadata = {
  title: "Gestión de Autores | DevNova",
  description: "Panel de administración de Autores",
};

export default async function AuthorsPage() {
  const user = await requireAdmin();
  const authors = await listAuthors();

  return (
    <main>
      <PrivateHeader displayName={user.displayName} role={user.role} />
      
      <AuthorsManager initialAuthors={authors} />
    </main>
  );
}

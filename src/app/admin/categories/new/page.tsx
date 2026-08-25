import { requireAdmin } from "@/server/auth/authorization";
import { PrivateHeader } from "@/components/layout/private-header";
import { CategoryForm } from "../category-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear Categoría | DevNova",
  description: "Crea una categoría de blog",
};

export default async function NewCategoryPage() {
  const user = await requireAdmin();

  return (
    <main className="private-page">
      <PrivateHeader displayName={user.displayName} role={user.role} />
      <CategoryForm />
    </main>
  );
}

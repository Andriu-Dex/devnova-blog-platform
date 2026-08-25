import { requireAdmin } from "@/server/auth/authorization";
import { getBlogCategoryById } from "@/server/blogs/category-service";
import { PrivateHeader } from "@/components/layout/private-header";
import { CategoryForm } from "../../category-form";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Editar Categoría | DevNova",
  description: "Edita una categoría de blog",
};

export default async function EditCategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const user = await requireAdmin();
  const { categoryId } = await params;
  const result = await getBlogCategoryById(categoryId);

  if (result.error || !result.category) {
    notFound();
  }

  return (
    <main className="private-page">
      <PrivateHeader displayName={user.displayName} role={user.role} />
      <CategoryForm category={result.category} />
    </main>
  );
}

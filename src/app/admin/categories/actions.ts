"use server";

import { requireAdmin } from "@/server/auth/authorization";
import {
  createBlogCategory,
  deleteBlogCategory,
  updateBlogCategory,
} from "@/server/blogs/category-service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function readCategoryForm(formData: FormData) {
  const name = formData.get("name");
  const slug = formData.get("slug");
  const colorClass = formData.get("colorClass");
  const displayOrder = formData.get("displayOrder");

  if (typeof name !== "string" || !name.trim()) {
    return { error: "El nombre es requerido." };
  }

  const parsedOrder = typeof displayOrder === "string" && displayOrder.trim()
    ? Number.parseInt(displayOrder, 10)
    : 0;

  if (!Number.isFinite(parsedOrder)) {
    return { error: "El orden debe ser un número válido." };
  }

  return {
    values: {
      name,
      slug: typeof slug === "string" ? slug : "",
      colorClass: typeof colorClass === "string" ? colorClass : "",
      displayOrder: parsedOrder,
    },
  };
}

export async function createCategoryAction(prevState: unknown, formData: FormData) {
  await requireAdmin();

  const parsed = readCategoryForm(formData);
  if (parsed.error || !parsed.values) return { error: parsed.error };

  const result = await createBlogCategory(parsed.values);
  if (result.error) return { error: result.error };

  revalidatePath("/admin/categories");
  revalidatePath("/blogs");
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function updateCategoryAction(prevState: unknown, formData: FormData) {
  await requireAdmin();

  const categoryId = formData.get("categoryId");
  if (typeof categoryId !== "string" || !categoryId) {
    return { error: "ID de categoría inválido." };
  }

  const parsed = readCategoryForm(formData);
  if (parsed.error || !parsed.values) return { error: parsed.error };

  const result = await updateBlogCategory({ id: categoryId, ...parsed.values });
  if (result.error) return { error: result.error };

  revalidatePath("/admin/categories");
  revalidatePath("/blogs");
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();

  const categoryId = formData.get("categoryId");
  if (typeof categoryId !== "string" || !categoryId) {
    return;
  }

  const result = await deleteBlogCategory(categoryId);
  if (!result.error) {
    revalidatePath("/admin/categories");
    revalidatePath("/blogs");
    revalidatePath("/");
  }
}

"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { BlogCategoryItem } from "@/server/blogs/category-service";
import { createCategoryAction, updateCategoryAction } from "./actions";
import styles from "../authors/authors.module.css";

const colorOptions = [
  { value: "proyecto", label: "Proyecto" },
  { value: "taller", label: "Taller" },
  { value: "deber", label: "Deber" },
  { value: "blog", label: "Repositorio académico" },
];

export function CategoryForm({ category }: { category?: BlogCategoryItem }) {
  const action = category ? updateCategoryAction : createCategoryAction;
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>{category ? "Editar categoría" : "Crear categoría"}</h1>
      <Link href="/admin/categories" className={styles.subtitle}>
        Volver a categorías
      </Link>

      <form action={formAction} style={{ marginTop: "24px" }}>
        {category && <input type="hidden" name="categoryId" value={category.id} />}

        {state?.error && (
          <div className={styles.errorMessage} role="alert">
            {state.error}
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>Nombre</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={80}
            defaultValue={category?.name || ""}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="slug" className={styles.label}>Slug</label>
          <input
            id="slug"
            name="slug"
            type="text"
            maxLength={80}
            defaultValue={category?.slug || ""}
            placeholder="Se genera desde el nombre si lo dejas vacío"
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="colorClass" className={styles.label}>Color</label>
          <select
            id="colorClass"
            name="colorClass"
            defaultValue={category?.colorClass || "blog"}
            className={styles.input}
          >
            {colorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="displayOrder" className={styles.label}>Orden</label>
          <input
            id="displayOrder"
            name="displayOrder"
            type="number"
            defaultValue={category?.displayOrder ?? 0}
            className={styles.input}
          />
        </div>

        <div className={styles.modalActions}>
          <Link href="/admin/categories" className={styles.cancelButton}>
            Cancelar
          </Link>
          <button type="submit" disabled={isPending} className={styles.submitButton}>
            {isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

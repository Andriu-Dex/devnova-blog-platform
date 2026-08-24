"use client";

import styles from "./blogs.module.css";
import { useTransition } from "react";

export function DeleteBlogButton({ 
  blogId, 
  onDelete 
}: { 
  blogId: string; 
  onDelete: (id: string) => Promise<{ success?: string; error?: string }> 
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className={styles.actionButton}
      style={{ background: "#cc3333", opacity: isPending ? 0.7 : 1 }}
      disabled={isPending}
      onClick={() => {
        if (confirm("El blog será enviado a la papelera y dejará de estar publicado.")) {
          startTransition(async () => {
            await onDelete(blogId);
          });
        }
      }}
    >
      {isPending ? "Eliminando..." : "Eliminar"}
    </button>
  );
}

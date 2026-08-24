"use client";

import { useTransition, useState } from "react";
import styles from "../../../dashboard/blogs/blogs.module.css";

export function RecoverBlogButton({ 
  blogId, 
  onRecover 
}: { 
  blogId: string; 
  onRecover: (id: string) => Promise<{ success?: string; error?: string }> 
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <button
        className={styles.actionButton}
        style={{ background: "#4caf50", opacity: isPending ? 0.7 : 1 }}
        disabled={isPending}
        onClick={() => {
          if (confirm("¿Estás seguro de recuperar este blog? Deberás publicarlo manualmente si deseas que sea visible.")) {
            setErrorMsg(null);
            startTransition(async () => {
              const res = await onRecover(blogId);
              if (res?.error) setErrorMsg(res.error);
            });
          }
        }}
      >
        {isPending ? "Recuperando..." : "Recuperar"}
      </button>
      {errorMsg && (
        <span style={{ color: "#cc3333", fontSize: "0.75rem" }}>{errorMsg}</span>
      )}
    </div>
  );
}

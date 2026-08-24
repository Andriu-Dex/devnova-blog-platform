"use client";

import { useTransition, useState } from "react";
import { recoverMediaAction } from "@/app/dashboard/media/actions";

export function RecoverMediaButton({ mediaAssetId }: { mediaAssetId: string }) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRecover = () => {
    if (confirm("¿Deseas restaurar este recurso a la biblioteca activa?")) {
      setErrorMsg(null);
      startTransition(async () => {
        const res = await recoverMediaAction(mediaAssetId);
        if (res?.error) {
          setErrorMsg(res.error);
        }
      });
    }
  };

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: "4px" }}>
      <button
        onClick={handleRecover}
        disabled={isPending}
        style={{
          background: "#155eef",
          border: "none",
          color: "#ffffff",
          padding: "6px 12px",
          borderRadius: "6px",
          fontFamily: "'IBM Plex Mono', Consolas, monospace",
          fontSize: "0.75rem",
          fontWeight: 600,
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.6 : 1,
          transition: "all 0.2s ease",
        }}
      >
        {isPending ? "Restaurando..." : "Recuperar"}
      </button>
      {errorMsg && (
        <span style={{ color: "#d92d20", fontSize: "0.7rem", fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
          {errorMsg}
        </span>
      )}
    </div>
  );
}

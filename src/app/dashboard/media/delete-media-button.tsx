"use client";

import { useTransition, useState } from "react";
import { deleteMediaAction } from "./actions";

export function DeleteMediaButton({ mediaAssetId }: { mediaAssetId: string }) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDelete = () => {
    if (
      confirm(
        "¿Estás seguro de archivar este recurso multimedia? Se ocultará de la biblioteca activa pero seguirá disponible para el contenido histórico."
      )
    ) {
      setErrorMsg(null);
      startTransition(async () => {
        const res = await deleteMediaAction(mediaAssetId);
        if (res?.error) {
          setErrorMsg(res.error);
        }
      });
    }
  };

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: "4px" }}>
      <button
        onClick={handleDelete}
        disabled={isPending}
        style={{
          background: "transparent",
          border: "1px solid #d92d20",
          color: "#d92d20",
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
        {isPending ? "Archivando..." : "Archivar"}
      </button>
      {errorMsg && (
        <span style={{ color: "#d92d20", fontSize: "0.7rem", fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
          {errorMsg}
        </span>
      )}
    </div>
  );
}

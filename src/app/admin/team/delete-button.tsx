"use client";

import { useTransition } from "react";
import { deleteTeamMemberAction } from "@/server/actions/team-actions";

export function DeleteMemberButton({ memberId, memberName }: { memberId: string; memberName: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${memberName}?`)) {
      startTransition(async () => {
        await deleteTeamMemberAction(memberId);
      });
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      style={{
        padding: "8px 16px",
        backgroundColor: "#fff",
        color: "#d92d20",
        border: "1px solid #fda29b",
        borderRadius: "4px",
        cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.6 : 1,
        fontFamily: "'IBM Plex Mono', Consolas, monospace",
        fontSize: "0.85rem",
        fontWeight: "bold",
      }}
    >
      {isPending ? "Eliminando..." : "Eliminar"}
    </button>
  );
}

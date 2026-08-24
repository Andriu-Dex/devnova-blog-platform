"use client";

import { useTransition } from "react";
import { recoverTeamMemberAction } from "@/server/actions/team-actions";

export function RecoverMemberButton({ memberId, memberName }: { memberId: string; memberName: string }) {
  const [isPending, startTransition] = useTransition();

  const handleRecover = () => {
    if (confirm(`¿Deseas recuperar a ${memberName}?`)) {
      startTransition(async () => {
        await recoverTeamMemberAction(memberId);
      });
    }
  };

  return (
    <button 
      onClick={handleRecover}
      disabled={isPending}
      style={{
        padding: "8px 16px",
        backgroundColor: "#fff",
        color: "#039855",
        border: "1px solid #73e2a3",
        borderRadius: "4px",
        cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.6 : 1,
        fontFamily: "'IBM Plex Mono', Consolas, monospace",
        fontSize: "0.85rem",
        fontWeight: "bold",
      }}
    >
      {isPending ? "Recuperando..." : "Recuperar"}
    </button>
  );
}

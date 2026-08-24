"use client";

import { useActionState } from "react";
import { restoreProfileFormAction, type FormState } from "@/server/actions/site-content-actions";

const initialState: FormState = { error: "", success: false };

export default function RestoreProfileForm({ 
  sourceVersionId,
  versionNumber
}: { 
  sourceVersionId: string;
  versionNumber: number;
}) {
  const [state, formAction, isPending] = useActionState(restoreProfileFormAction, initialState);

  return (
    <form action={formAction} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      <input type="hidden" name="sourceVersionId" value={sourceVersionId} />
      
      <input 
        type="text" 
        name="changeSummary" 
        required 
        placeholder="Motivo de restauración" 
        style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
      />
      
      <button 
        type="submit" 
        disabled={isPending}
        style={{ padding: "8px 16px", backgroundColor: "#fff", color: "#1655f8", border: "1px solid #1655f8", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", opacity: isPending ? 0.7 : 1 }}
      >
        {isPending ? "Restaurando..." : `Restaurar a v${versionNumber}`}
      </button>

      {state.error && <span style={{ color: "red", fontSize: "0.85rem" }}>{state.error}</span>}
    </form>
  );
}

"use client";

import { useState, useActionState } from "react";
import { restoreTeamMemberFormAction, type FormState } from "@/server/actions/team-actions";

const initialState: FormState = { error: "", success: false };

export default function RestoreTeamForm({ 
  memberId,
  sourceVersionId,
  isDisabled 
}: { 
  memberId: string;
  sourceVersionId: string;
  isDisabled: boolean;
}) {
  const [state, formAction, isPending] = useActionState(restoreTeamMemberFormAction, initialState);
  const [isOpen, setIsOpen] = useState(false);

  if (state.success && isOpen) {
    setIsOpen(false);
  }

  return (
    <>
      <button 
        type="button" 
        disabled={isDisabled}
        onClick={() => setIsOpen(true)}
        style={{ 
          padding: "6px 12px", 
          backgroundColor: isDisabled ? "#f5f5f5" : "#1655f8", 
          color: isDisabled ? "#ccc" : "#fff", 
          border: "none", 
          borderRadius: "4px", 
          cursor: isDisabled ? "not-allowed" : "pointer",
          fontFamily: "'IBM Plex Mono', Consolas, monospace",
          fontSize: "0.8rem",
          fontWeight: "bold"
        }}
      >
        Restaurar esta versión
      </button>

      {isOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "8px", width: "100%", maxWidth: "500px" }}>
            <h2 style={{ margin: "0 0 20px 0", fontSize: "1.5rem" }}>Confirmar Restauración</h2>
            <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {state.error && (
                <div style={{ padding: "10px", backgroundColor: "#ffebee", color: "#c62828", borderRadius: "4px" }}>
                  {state.error}
                </div>
              )}
              
              <input type="hidden" name="memberId" value={memberId} />
              <input type="hidden" name="sourceVersionId" value={sourceVersionId} />

              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Motivo de restauración *</label>
                <input 
                  type="text" 
                  name="changeSummary" 
                  required
                  maxLength={500}
                  placeholder="Ej: Se descartaron cambios erróneos"
                  style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} 
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px", justifyContent: "flex-end" }}>
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  style={{ padding: "10px 20px", backgroundColor: "#fff", color: "#333", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  style={{ padding: "10px 20px", backgroundColor: "#1655f8", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", opacity: isPending ? 0.7 : 1 }}
                >
                  {isPending ? "Restaurando..." : "Confirmar Restauración"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

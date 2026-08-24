"use client";

import { useActionState, useState } from "react";
import { upsertSocialLinkAction, type FormState } from "@/server/actions/social-actions";

const initialState: FormState = { error: "", success: false };

export function SocialRowForm({ link }: { link: any }) {
  const [state, formAction, isPending] = useActionState(upsertSocialLinkAction, initialState);
  
  // Usar estado local para habilitar/deshabilitar botón
  const [url, setUrl] = useState(link.url);
  const [order, setOrder] = useState(link.displayOrder);
  const [isVisible, setIsVisible] = useState(link.isVisible);

  const isChanged = url !== link.url || order !== link.displayOrder || isVisible !== link.isVisible;

  return (
    <form action={formAction} style={{ 
      display: "grid", 
      gridTemplateColumns: "150px 1fr 80px 100px 120px", 
      gap: "15px", 
      alignItems: "center",
      padding: "15px",
      backgroundColor: "#fff",
      border: "1px solid #eaeaea",
      borderRadius: "8px"
    }}>
      <input type="hidden" name="platformCode" value={link.platformCode} />
      
      <div>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>{link.platformName}</h3>
        <span style={{ fontSize: "0.75rem", color: "#888", fontFamily: "'IBM Plex Mono', Consolas, monospace" }}>{link.platformCode}</span>
      </div>

      <input 
        type="text" 
        name="url" 
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={`https://${link.platformCode.toLowerCase()}.com/usuario`}
        maxLength={500}
        style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }} 
      />

      <input 
        type="number" 
        name="displayOrder" 
        value={order}
        onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
        min="0"
        style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }} 
      />

      <div style={{ display: "flex", justifyContent: "center" }}>
        <input 
          type="checkbox" 
          name="isVisible" 
          value="true" 
          checked={isVisible}
          onChange={(e) => setIsVisible(e.target.checked)}
          style={{ width: "18px", height: "18px", cursor: "pointer" }}
        />
      </div>

      <button 
        type="submit" 
        disabled={isPending || !isChanged}
        style={{ 
          padding: "8px", 
          backgroundColor: isPending ? "#a8bdfa" : (isChanged ? "#1655f8" : "#f5f5f5"), 
          color: isChanged ? "#fff" : "#aaa", 
          border: "none", 
          borderRadius: "4px", 
          cursor: isPending || !isChanged ? "not-allowed" : "pointer", 
          fontWeight: "bold",
          fontSize: "0.85rem"
        }}
      >
        {isPending ? "Guardando" : "Guardar"}
      </button>

      {state.error && (
        <div style={{ gridColumn: "1 / -1", padding: "5px 10px", backgroundColor: "#ffebee", color: "#c62828", borderRadius: "4px", fontSize: "0.85rem" }}>
          {state.error}
        </div>
      )}
      {state.success && (
        <div style={{ gridColumn: "1 / -1", padding: "5px 10px", backgroundColor: "#d1fadf", color: "#039855", borderRadius: "4px", fontSize: "0.85rem" }}>
          Guardado exitosamente.
        </div>
      )}
    </form>
  );
}

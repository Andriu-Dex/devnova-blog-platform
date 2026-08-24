"use client";

import { useActionState, useState } from "react";
import { createTeamMemberAction, type FormState } from "@/server/actions/team-actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MediaPicker, type MediaItem } from "@/components/media/media-picker";

const initialState: FormState = { error: "", success: false };

export default function NewTeamForm({ mediaList }: { mediaList: MediaItem[] }) {
  const [state, formAction, isPending] = useActionState(createTeamMemberAction, initialState);
  const router = useRouter();

  const [photoId, setPhotoId] = useState("");
  const [photoAlt, setPhotoAlt] = useState("");

  if (state.success) {
    router.push("/admin/team");
  }

  const handleMediaSelect = (mediaId: string, altText: string) => {
    setPhotoId(mediaId);
    setPhotoAlt(altText);
  };

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {state.error && (
        <div style={{ padding: "10px", backgroundColor: "#ffebee", color: "#c62828", borderRadius: "4px" }}>
          {state.error}
        </div>
      )}

      <input type="hidden" name="photoMediaAssetId" value={photoId} />
      <input type="hidden" name="photoAltText" value={photoAlt} />

      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Nombre Completo *</label>
        <input 
          type="text" 
          name="fullName" 
          required
          maxLength={180}
          style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} 
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Cargo / Rol *</label>
        <input 
          type="text" 
          name="roleTitle" 
          required
          maxLength={160}
          style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} 
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Biografía (Markdown) *</label>
        <textarea 
          name="bioMarkdown" 
          required
          rows={6}
          placeholder="Escribe la biografía aquí..."
          style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px", resize: "vertical" }} 
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Fotografía</label>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <MediaPicker 
            mediaList={mediaList} 
            onSelect={handleMediaSelect} 
            requireAltText={true} 
            buttonLabel={photoId ? "Cambiar Foto" : "Seleccionar Foto"} 
          />
          {photoId && (
            <div style={{ fontSize: "0.85rem", color: "#1655f8", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>✓ Foto seleccionada</span>
              <button 
                type="button" 
                onClick={() => { setPhotoId(""); setPhotoAlt(""); }}
                style={{ background: "none", border: "none", color: "#d92d20", cursor: "pointer", textDecoration: "underline" }}
              >
                Quitar
              </button>
            </div>
          )}
        </div>
        {photoAlt && <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "5px" }}>Alt: {photoAlt}</p>}
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>URL de GitHub</label>
          <input 
            type="text" 
            name="githubUrl" 
            placeholder="https://github.com/usuario"
            maxLength={500}
            style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} 
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>URL de LinkedIn</label>
          <input 
            type="text" 
            name="linkedinUrl" 
            placeholder="https://linkedin.com/in/usuario"
            maxLength={500}
            style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} 
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Orden de Visualización *</label>
          <input 
            type="number" 
            name="displayOrder" 
            defaultValue="0"
            min="0"
            required
            style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} 
          />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", paddingTop: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input 
              type="checkbox" 
              name="isVisible" 
              value="true" 
              defaultChecked 
              style={{ width: "18px", height: "18px" }}
            />
            <span style={{ fontWeight: "bold" }}>Visible Públicamente</span>
          </label>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button 
          type="submit" 
          disabled={isPending}
          style={{ padding: "10px 20px", backgroundColor: "#1655f8", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? "Guardando..." : "Crear Integrante"}
        </button>
        <Link 
          href="/admin/team" 
          style={{ padding: "10px 20px", backgroundColor: "#fff", color: "#333", border: "1px solid #ccc", borderRadius: "4px", textDecoration: "none", display: "inline-block" }}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

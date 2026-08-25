"use client";

import { useActionState, useState } from "react";
import { updateTeamMemberAction, type FormState } from "@/server/actions/team-actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MediaPicker, type MediaItem } from "@/components/media/media-picker";

const initialState: FormState = { error: "", success: false };

export default function EditTeamForm({ 
  initialData,
  memberId,
  mediaList
}: { 
  initialData: {
    id: string;
    fullName: string;
    roleTitle: string | null;
    bioMarkdown: string | null;
    photoMediaAssetId: string | null;
    photoAltText: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    displayOrder: number;
    isVisible: boolean;
    mediaArchived?: boolean;
  };
  memberId: string;
  mediaList: MediaItem[];
}) {
  const [state, formAction, isPending] = useActionState(updateTeamMemberAction, initialState);
  const router = useRouter();

  const [photoId, setPhotoId] = useState(initialData.photoMediaAssetId || "");
  const [photoAlt, setPhotoAlt] = useState(initialData.photoAltText || "");
  const [photoArchived, setPhotoArchived] = useState(initialData.mediaArchived || false);

  if (state.success) {
    router.push("/admin/team");
  }

  const handleMediaSelect = (mediaId: string, altText: string) => {
    setPhotoId(mediaId);
    setPhotoAlt(altText);
    setPhotoArchived(false); // If user selected a new one, it's not archived
  };

  const handleRemovePhoto = () => {
    setPhotoId("");
    setPhotoAlt("");
    setPhotoArchived(false);
  };

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {state.error && (
        <div style={{ padding: "10px", backgroundColor: "#ffebee", color: "#c62828", borderRadius: "4px" }}>
          {state.error}
        </div>
      )}
      
      {photoArchived && (
        <div style={{ padding: "10px", backgroundColor: "#fff3cd", color: "#856404", borderRadius: "4px", border: "1px solid #ffeeba" }}>
          <strong>Atención:</strong> La fotografía actual de este integrante fue archivada. 
          Para guardar una nueva versión, debes reemplazarla o eliminarla.
        </div>
      )}

      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="baseVersionId" value={initialData.id} />
      <input type="hidden" name="photoMediaAssetId" value={photoId} />
      <input type="hidden" name="photoAltText" value={photoAlt} />

      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Nombre Completo *</label>
        <input 
          type="text" 
          name="fullName" 
          defaultValue={initialData.fullName}
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
          defaultValue={initialData.roleTitle || ""}
          required
          maxLength={160}
          style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} 
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Biografía (Markdown) *</label>
        <textarea 
          name="bioMarkdown" 
          defaultValue={initialData.bioMarkdown || ""}
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
              {photoArchived && <span style={{ color: "#d92d20", fontWeight: "bold" }}>(Archivada)</span>}
              <button 
                type="button" 
                onClick={handleRemovePhoto}
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
            defaultValue={initialData.githubUrl || ""}
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
            defaultValue={initialData.linkedinUrl || ""}
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
            defaultValue={initialData.displayOrder}
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
              defaultChecked={initialData.isVisible} 
              style={{ width: "18px", height: "18px" }}
            />
            <span style={{ fontWeight: "bold" }}>Visible Públicamente</span>
          </label>
        </div>
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Resumen del Cambio *</label>
        <input 
          type="text" 
          name="changeSummary" 
          required
          maxLength={500}
          placeholder="Ej: Se actualizó la biografía"
          style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} 
        />
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button 
          type="submit" 
          disabled={isPending || photoArchived}
          style={{ padding: "10px 20px", backgroundColor: "#1655f8", color: "#fff", border: "none", borderRadius: "4px", cursor: (isPending || photoArchived) ? "not-allowed" : "pointer", fontWeight: "bold", opacity: (isPending || photoArchived) ? 0.7 : 1 }}
        >
          {isPending ? "Guardando..." : "Guardar Cambios"}
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

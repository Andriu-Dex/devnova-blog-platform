"use client";

import { useActionState } from "react";
import { updateProfileFormAction, type FormState } from "@/server/actions/site-content-actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

const initialState: FormState = { error: "", success: false };

export default function ProfileForm({ 
  initialData 
}: { 
  initialData: { 
    id?: string | null;
    groupName: string;
    tagline: string | null;
    logoMediaAssetId: string | null;
    logoAltText: string | null;
    publicEmail: string | null;
    publicPhone: string | null;
  } | null;
}) {
  const [state, formAction, isPending] = useActionState(updateProfileFormAction, initialState);
  const router = useRouter();

  if (state.success) {
    router.push("/admin/content");
  }

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {state.error && (
        <div style={{ padding: "10px", backgroundColor: "#ffebee", color: "#c62828", borderRadius: "4px" }}>
          {state.error}
        </div>
      )}

      <input type="hidden" name="baseVersionId" value={initialData?.id || ""} />

      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Nombre del Grupo *</label>
        <input 
          type="text" 
          name="groupName" 
          defaultValue={initialData?.groupName || ""} 
          required
          maxLength={160}
          style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} 
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Eslogan (Tagline)</label>
        <input 
          type="text" 
          name="tagline" 
          defaultValue={initialData?.tagline || ""} 
          maxLength={300}
          style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} 
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>ID del Logo (Media Asset ID)</label>
        <input 
          type="text" 
          name="logoMediaAssetId" 
          defaultValue={initialData?.logoMediaAssetId || ""} 
          placeholder="Ej: uuid-del-media"
          style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} 
        />
        <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "5px" }}>Obtén el ID desde <Link href="/dashboard/media">Media Library</Link></p>
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Texto Alternativo del Logo</label>
        <input 
          type="text" 
          name="logoAltText" 
          defaultValue={initialData?.logoAltText || ""} 
          maxLength={300}
          style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} 
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Email de Contacto Público</label>
        <input 
          type="email" 
          name="publicEmail" 
          defaultValue={initialData?.publicEmail || ""} 
          style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} 
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Teléfono de Contacto Público</label>
        <input 
          type="text" 
          name="publicPhone" 
          defaultValue={initialData?.publicPhone || ""} 
          maxLength={50}
          style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} 
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Resumen del Cambio *</label>
        <input 
          type="text" 
          name="changeSummary" 
          required={!!initialData} // Requerido si es edición
          maxLength={500}
          placeholder="Ej: Actualización de teléfono"
          style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} 
        />
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button 
          type="submit" 
          disabled={isPending}
          style={{ padding: "10px 20px", backgroundColor: "#1655f8", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? "Guardando..." : "Guardar Perfil"}
        </button>
        <Link 
          href="/admin/content" 
          style={{ padding: "10px 20px", backgroundColor: "#fff", color: "#333", border: "1px solid #ccc", borderRadius: "4px", textDecoration: "none", display: "inline-block" }}
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

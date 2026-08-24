"use client";

import { useActionState } from "react";
import { updateSectionFormAction, type FormState } from "@/server/actions/site-content-actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

const initialState: FormState = { error: "", success: false };

export default function SectionForm({ 
  sectionKey,
  initialData 
}: { 
  sectionKey: string;
  initialData: { id?: string; title?: string | null; contentMarkdown?: string } | null;
}) {
  const [state, formAction, isPending] = useActionState(updateSectionFormAction, initialState);
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

      <input type="hidden" name="sectionKey" value={sectionKey} />
      <input type="hidden" name="baseVersionId" value={initialData?.id || ""} />

      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Título (Opcional)</label>
        <input 
          type="text" 
          name="title" 
          defaultValue={initialData?.title || ""} 
          maxLength={200}
          style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} 
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Contenido Markdown *</label>
        <textarea 
          name="contentMarkdown" 
          defaultValue={initialData?.contentMarkdown || ""} 
          required
          rows={15}
          style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px", fontFamily: "monospace" }} 
        />
        <p style={{ fontSize: "0.85rem", color: "#d9534f", marginTop: "5px" }}>Nota: Las imágenes media:// no están soportadas en esta sección.</p>
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Resumen del Cambio *</label>
        <input 
          type="text" 
          name="changeSummary" 
          required={!!initialData}
          maxLength={500}
          placeholder="Ej: Corrección ortográfica"
          style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} 
        />
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button 
          type="submit" 
          disabled={isPending}
          style={{ padding: "10px 20px", backgroundColor: "#1655f8", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? "Guardando..." : "Guardar Sección"}
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

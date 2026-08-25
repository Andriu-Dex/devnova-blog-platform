import Link from "next/link";
import { requireAdmin } from "@/server/auth/authorization";
import { PrivateHeader } from "@/components/layout/private-header";

export default async function AdminContentPage() {
  const user = await requireAdmin();

  const sections = [
    { key: "HOME", title: "Inicio" },
    { key: "MISSION", title: "Misión" },
    { key: "VISION", title: "Visión" },
    { key: "ABOUT", title: "Nosotros" },
    { key: "CONTACT", title: "Contacto" },
  ];

  return (
    <main className="private-page">
      <PrivateHeader displayName={user.displayName} role={user.role} />
      
      <div style={{ marginBottom: "var(--space-8)" }}>
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "2.25rem", margin: "0 0 var(--space-2) 0", color: "var(--color-carbon)", letterSpacing: "-0.04em", fontWeight: 600 }}>
          Gestión de Contenido Institucional
        </h1>
        <p style={{ fontFamily: "var(--font-sans)", color: "var(--color-carbon-muted)", margin: 0 }}>
          Administra las secciones estáticas y el perfil de la plataforma.
        </p>
      </div>

      <section style={{ marginBottom: "var(--space-12)" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "var(--space-4)", color: "var(--color-carbon)", fontWeight: 600, letterSpacing: "-0.02em" }}>Perfil del Sitio</h2>
        <div style={{ padding: "var(--space-6)", backgroundColor: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", margin: "0 0 var(--space-2) 0", color: "var(--color-carbon)", fontWeight: 600 }}>Identidad y Contacto</h3>
            <p style={{ color: "var(--color-carbon-muted)", margin: 0, fontSize: "0.95rem" }}>Gestiona el logo, eslogan, email y teléfono público.</p>
          </div>
          <Link href="/admin/content/profile" style={{ padding: "10px 20px", backgroundColor: "var(--color-primary)", color: "var(--color-white)", textDecoration: "none", borderRadius: "var(--radius-md)", fontWeight: 600, fontFamily: "var(--font-mono)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Administrar
          </Link>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "var(--space-4)", color: "var(--color-carbon)", fontWeight: 600, letterSpacing: "-0.02em" }}>Secciones Públicas</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {sections.map((sec) => (
            <div key={sec.key} style={{ padding: "var(--space-6)", backgroundColor: "var(--color-paper)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-card)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", margin: "0 0 var(--space-2) 0", color: "var(--color-carbon)", fontWeight: 600 }}>{sec.title} <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--color-carbon-subtle)", fontWeight: 400 }}>({sec.key})</span></h3>
                <p style={{ color: "var(--color-carbon-muted)", margin: 0, fontSize: "0.95rem" }}>Editar el texto y la estructura de esta sección.</p>
              </div>
              <Link href={`/admin/content/sections/${sec.key}`} style={{ padding: "10px 20px", backgroundColor: "transparent", border: "1px solid var(--color-line-strong)", color: "var(--color-carbon)", textDecoration: "none", borderRadius: "var(--radius-md)", fontWeight: 600, fontFamily: "var(--font-mono)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Editar Sección
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { requireAdmin } from "@/server/auth/authorization";

export default async function AdminContentPage() {
  await requireAdmin();

  const sections = [
    { key: "HOME", title: "Inicio" },
    { key: "MISSION", title: "Misión" },
    { key: "VISION", title: "Visión" },
    { key: "ABOUT", title: "Nosotros" },
    { key: "CONTACT", title: "Contacto" },
  ];

  return (
    <main style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "40px" }}>Gestión de Contenido Institucional</h1>

      <section style={{ marginBottom: "50px" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "20px", color: "#444" }}>Perfil del Sitio</h2>
        <div style={{ padding: "20px", backgroundColor: "#fff", border: "1px solid #eaeaea", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", margin: "0 0 5px 0" }}>Identidad y Contacto</h3>
            <p style={{ color: "#666", margin: 0 }}>Gestiona el logo, eslogan, email y teléfono público.</p>
          </div>
          <Link href="/admin/content/profile" style={{ padding: "10px 20px", backgroundColor: "#1655f8", color: "#fff", textDecoration: "none", borderRadius: "4px", fontWeight: "bold" }}>
            Administrar
          </Link>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "20px", color: "#444" }}>Secciones Públicas</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {sections.map((sec) => (
            <div key={sec.key} style={{ padding: "20px", backgroundColor: "#fff", border: "1px solid #eaeaea", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", margin: "0 0 5px 0" }}>{sec.title} ({sec.key})</h3>
                <p style={{ color: "#666", margin: 0, fontSize: "0.9rem" }}>Editar el texto y la estructura de esta sección.</p>
              </div>
              <Link href={`/admin/content/sections/${sec.key}`} style={{ padding: "10px 20px", backgroundColor: "#f0f4ff", color: "#1655f8", textDecoration: "none", borderRadius: "4px", fontWeight: "bold", border: "1px solid #d0deff" }}>
                Editar Sección
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { PublicHeader } from "@/components/site/public-header";
import { PublicFooter } from "@/components/site/public-footer";

export default function NotFound() {
  return (
    <div className="public-page">
      <PublicHeader />
      
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-12) var(--space-4)" }}>
        <div style={{ 
          maxWidth: "500px", 
          width: "100%", 
          textAlign: "center"
        }}>
          <h1 style={{ 
            fontSize: "6rem", 
            fontWeight: 800, 
            margin: "0 0 var(--space-4) 0", 
            color: "var(--color-carbon)",
            lineHeight: 1,
            letterSpacing: "-0.05em"
          }}>
            404
          </h1>
          <h2 style={{ fontSize: "1.5rem", color: "var(--color-primary)", margin: "0 0 var(--space-4) 0", fontWeight: 600 }}>
            Página no encontrada
          </h2>
          <p style={{ color: "var(--color-carbon-muted)", fontSize: "1.1rem", marginBottom: "var(--space-8)", lineHeight: 1.6 }}>
            La ruta que buscas no existe o ha sido movida. Puedes volver al inicio o explorar nuestros blogs más recientes.
          </p>
          <div style={{ display: "flex", gap: "var(--space-4)", justifyContent: "center" }}>
            <Link href="/" style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 24px",
              backgroundColor: "var(--color-carbon)",
              color: "var(--color-white)",
              textDecoration: "none",
              borderRadius: "var(--radius-pill)",
              fontWeight: 600,
              fontSize: "0.95rem"
            }}>
              Volver al inicio
            </Link>
            <Link href="/blogs" style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 24px",
              backgroundColor: "transparent",
              color: "var(--color-carbon)",
              border: "1px solid var(--color-line-strong)",
              textDecoration: "none",
              borderRadius: "var(--radius-pill)",
              fontWeight: 600,
              fontSize: "0.95rem"
            }}>
              Leer blogs
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

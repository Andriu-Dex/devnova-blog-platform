"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="public-page">
      <header style={{ padding: "var(--space-6) var(--space-4)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ fontFamily: "var(--font-sans)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-carbon)", textDecoration: "none" }}>
          DevNova
        </Link>
      </header>
      
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-12) var(--space-4)" }}>
        <div style={{ 
          maxWidth: "500px", 
          width: "100%", 
          textAlign: "center"
        }}>
          <h1 style={{ 
            fontSize: "3rem", 
            fontWeight: 800, 
            margin: "0 0 var(--space-4) 0", 
            color: "var(--color-carbon)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em"
          }}>
            Ocurrió un problema inesperado.
          </h1>
          <p style={{ color: "var(--color-carbon-muted)", fontSize: "1.1rem", marginBottom: "var(--space-8)", lineHeight: 1.6 }}>
            Nuestros sistemas encontraron un error procesando tu solicitud. Por favor intenta nuevamente en unos momentos.
          </p>
          <div style={{ display: "flex", gap: "var(--space-4)", justifyContent: "center", flexWrap: "wrap" }}>
            <button 
              onClick={() => reset()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 24px",
                backgroundColor: "var(--color-carbon)",
                color: "var(--color-white)",
                border: "none",
                cursor: "pointer",
                borderRadius: "var(--radius-pill)",
                fontWeight: 600,
                fontSize: "0.95rem"
              }}
            >
              Intentar nuevamente
            </button>
            <Link href="/" style={{
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
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>

      <footer style={{ padding: "var(--space-8) var(--space-4)", borderTop: "1px solid var(--color-line)", textAlign: "center" }}>
        <p style={{ color: "var(--color-carbon-muted)", fontSize: "0.85rem", margin: 0 }}>
          © {new Date().getFullYear()} DevNova. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}

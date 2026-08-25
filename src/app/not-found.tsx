import Link from "next/link";
import { PublicHeader } from "@/components/site/public-header";
import { PublicFooter } from "@/components/site/public-footer";
import { IconoTerminal, IconoFlecha } from "@/components/site/devbox-pieces";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--color-canvas, #f7f3e8)" }}>
      <PublicHeader />

      <main style={{ flex: 1, display: "grid", placeContent: "center", gap: "32px", padding: "64px 20px", textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "clamp(10px, 3vw, 30px)",
            fontSize: "clamp(7rem, 20vw, 15rem)",
            fontWeight: 700,
            lineHeight: 0.7,
            letterSpacing: "-0.08em",
            color: "var(--color-primary, #155eef)",
            fontFamily: "var(--font-sans, 'Space Grotesk', sans-serif)",
          }}
        >
          <span>4</span>
          <div
            style={{
              width: "clamp(120px, 18vw, 200px)",
              aspectRatio: "1",
              display: "grid",
              placeContent: "center",
              justifyItems: "center",
              color: "var(--color-paper, #fffcf4)",
              backgroundColor: "var(--color-carbon, #121419)",
              borderRadius: "24px",
              textAlign: "center",
              transform: "rotate(-3deg)",
              boxShadow: "0 10px 28px rgba(18, 20, 25, 0.15)",
            }}
          >
            <div style={{ color: "var(--color-cyan, #28c7e8)", width: "36px", height: "36px" }}>
              <IconoTerminal />
            </div>
            <b
              style={{
                marginTop: "12px",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "clamp(0.75rem, 1.2vw, 1rem)",
                lineHeight: 1.3,
                color: "#ffffff",
              }}
            >
              archivo no indexado
            </b>
          </div>
          <span>4</span>
        </div>

        <div style={{ maxWidth: "600px", marginInline: "auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-sans, 'Space Grotesk', sans-serif)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)",
              fontWeight: 700,
              margin: 0,
              color: "var(--color-carbon, #121419)",
            }}
          >
            Página o archivo no encontrado
          </h2>
          <p
            style={{
              marginTop: "16px",
              color: "var(--color-carbon-muted, #51545a)",
              fontSize: "1.1rem",
              lineHeight: 1.6,
            }}
          >
            La ruta solicitada no forma parte del árbol de entregas publicado o ha sido reorganizada.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "32px", flexWrap: "wrap" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                backgroundColor: "var(--color-carbon, #121419)",
                color: "var(--color-paper, #fffcf4)",
                borderRadius: "10px",
                fontWeight: 600,
                textDecoration: "none",
                fontFamily: "var(--font-sans, 'Space Grotesk', sans-serif)",
                fontSize: "0.9rem",
              }}
            >
              <span>Volver al inicio</span> <IconoFlecha />
            </Link>
            <Link
              href="/blogs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                backgroundColor: "var(--color-primary, #155eef)",
                color: "#ffffff",
                borderRadius: "10px",
                fontWeight: 600,
                textDecoration: "none",
                fontFamily: "var(--font-sans, 'Space Grotesk', sans-serif)",
                fontSize: "0.9rem",
              }}
            >
              <span>Explorar entregas</span> <IconoFlecha />
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

"use client";

import React, { useEffect, useState, useId } from "react";

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCode, setShowCode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const reactId = useId().replace(/:/g, "");

  useEffect(() => {
    let isCancelled = false;

    async function renderChart() {
      setIsLoading(true);
      setError(null);

      const trimmedChart = chart.trim();
      if (!trimmedChart) {
        setIsLoading(false);
        return;
      }

      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "neutral",
          fontFamily: "'IBM Plex Mono', Consolas, monospace",
        });

        const uniqueId = `mermaid-${reactId}-${Math.random().toString(36).substring(2, 7)}`;
        const { svg: renderedSvg } = await mermaid.render(uniqueId, trimmedChart);

        if (!isCancelled) {
          setSvg(renderedSvg);
          setError(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          console.warn("Error rendering Mermaid diagram:", err);
          setError(err instanceof Error ? err.message : "Error al procesar el diagrama Mermaid.");
          setIsLoading(false);
        }
      }
    }

    renderChart();

    return () => {
      isCancelled = true;
    };
  }, [chart, reactId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chart);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      style={{
        margin: "1.75rem 0",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 14px",
          backgroundColor: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          fontSize: "0.8rem",
          color: "#4b5563",
          fontFamily: "'IBM Plex Mono', Consolas, monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "#1f2937" }}>
          <span>📊</span>
          <span>Diagrama Mermaid</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: "none",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              padding: "3px 8px",
              fontSize: "0.75rem",
              cursor: "pointer",
              color: "#374151",
              backgroundColor: "#ffffff",
            }}
            title="Copiar código del diagrama"
          >
            {copied ? "✓ Copiado" : "Copiar"}
          </button>
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            style={{
              background: "none",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              padding: "3px 8px",
              fontSize: "0.75rem",
              cursor: "pointer",
              color: "#374151",
              backgroundColor: "#ffffff",
            }}
          >
            {showCode ? "Ocultar código" : "Ver código"}
          </button>
        </div>
      </div>

      {/* Diagram display area */}
      <div
        style={{
          padding: "1.5rem",
          overflowX: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "120px",
          backgroundColor: "#ffffff",
        }}
      >
        {isLoading && (
          <div style={{ color: "#6b7280", fontSize: "0.9rem", fontStyle: "italic" }}>
            Generando diagrama...
          </div>
        )}

        {!isLoading && error && (
          <div
            style={{
              width: "100%",
              padding: "12px 16px",
              backgroundColor: "#fffbeb",
              border: "1px solid #fef3c7",
              borderRadius: "8px",
              color: "#92400e",
              fontSize: "0.85rem",
            }}
          >
            <p style={{ margin: "0 0 8px 0", fontWeight: 600 }}>
              ⚠️ No se pudo renderizar el diagrama Mermaid (revisa la sintaxis):
            </p>
            <pre
              style={{
                margin: 0,
                padding: "8px",
                backgroundColor: "#fef3c7",
                borderRadius: "4px",
                fontSize: "0.8rem",
                overflowX: "auto",
              }}
            >
              <code>{chart}</code>
            </pre>
          </div>
        )}

        {!isLoading && !error && svg && (
          <div
            style={{
              maxWidth: "100%",
              display: "flex",
              justifyContent: "center",
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>

      {/* Collapsible raw code view */}
      {showCode && (
        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "#1e1e1e",
            padding: "12px 16px",
          }}
        >
          <pre
            style={{
              margin: 0,
              color: "#e5e7eb",
              fontFamily: "'IBM Plex Mono', Consolas, monospace",
              fontSize: "0.85rem",
              overflowX: "auto",
              lineHeight: 1.5,
            }}
          >
            <code>{chart}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

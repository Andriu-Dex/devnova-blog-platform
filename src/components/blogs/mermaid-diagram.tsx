"use client";

import React, { useEffect, useState, useId, useRef } from "react";

interface MermaidDiagramProps {
  chart: string;
}

// 1. In-memory cache for rendered SVGs: key = sanitized chart string, value = rendered SVG
const svgCache = new Map<string, string>();

// 2. Global Mermaid loader & initializer (runs ONCE across the entire application lifecycle)
let mermaidPromise: Promise<typeof import("mermaid")["default"]> | null = null;

function getMermaidInstance() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => {
      const mermaid = m.default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: "default",
        fontFamily: "'IBM Plex Mono', Consolas, monospace",
        suppressErrorRendering: true,
        themeVariables: {
          background: "#f6f8fa",
          mainBkg: "#ececff",
          primaryColor: "#ececff",
          primaryTextColor: "#1e1b4b",
          primaryBorderColor: "#9370db",
          lineColor: "#334155",
          secondaryColor: "#ffffde",
          tertiaryColor: "#f5f3ff",
          textColor: "#1e1b4b",
          nodeBorder: "#9370db",
          clusterBkg: "#ffffff",
          clusterBorder: "#cbd5e1",
          edgeLabelBackground: "#f6f8fa",
          actorBkg: "#ececff",
          actorBorder: "#9370db",
          actorTextColor: "#1e1b4b",
          actorLineColor: "#9370db",
          labelBoxBkgColor: "#ececff",
          labelBoxBorderColor: "#9370db",
          labelTextColor: "#1e1b4b",
          signalColor: "#334155",
          signalTextColor: "#1e1b4b",
          sectionBkgColor: "#9370db",
          sectionBkgColor2: "#7c3aed",
          altSectionBkgColor: "#f6f8fa",
          taskBkgColor: "#ececff",
          taskBorderColor: "#9370db",
          taskTextColor: "#1e1b4b",
        },
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

function sanitizeMermaidChart(chartText: string): string {
  // In Mermaid timeline diagrams, colons (':') in section declarations
  // (e.g. 'section Fase 1: Barrera Inicial') break Mermaid's lexer because ':'
  // is reserved to separate periods from events. We sanitize them automatically to ' -'.
  if (/^\s*timeline\b/i.test(chartText)) {
    return chartText
      .split("\n")
      .map((line) => {
        const match = line.match(/^(\s*section\s+)(.*)$/i);
        if (match) {
          const prefix = match[1];
          const title = match[2].replace(/:/g, " -");
          return `${prefix}${title}`;
        }
        return line;
      })
      .join("\n");
  }
  return chartText;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const trimmed = chart.trim();
  const sanitized = sanitizeMermaidChart(trimmed);

  // Instant cache hit: 0ms render without even waiting for useEffect!
  const [svg, setSvg] = useState<string>(() => svgCache.get(sanitized) || "");
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If already in cache, set it immediately
    const cached = svgCache.get(sanitized);
    if (cached) {
      setSvg(cached);
      return;
    }

    if (!trimmed) {
      setSvg("");
      return;
    }

    // Preload Mermaid in background if not loaded
    getMermaidInstance();

    let isCancelled = false;

    // Debounce to avoid calculating heavy SVGs on every single keystroke during live editing
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      const uniqueId = `mermaid-${reactId}-${Math.random().toString(36).substring(2, 8)}`;
      let sandbox: HTMLDivElement | null = null;

      if (typeof document !== "undefined") {
        sandbox = document.createElement("div");
        sandbox.id = `sandbox-${uniqueId}`;
        sandbox.setAttribute("aria-hidden", "true");
        sandbox.style.cssText =
          "position: fixed !important; top: -99999px !important; left: -99999px !important; width: 1200px !important; height: 800px !important; opacity: 0 !important; pointer-events: none !important; overflow: hidden !important; z-index: -99999 !important;";
        document.body.appendChild(sandbox);
      }

      try {
        const mermaid = await getMermaidInstance();
        const { svg: renderedSvg } = await mermaid.render(
          uniqueId,
          sanitized,
          sandbox || undefined
        );

        if (!isCancelled) {
          // Store in cache for instant recall
          svgCache.set(sanitized, renderedSvg);
          setSvg(renderedSvg);
        }
      } catch {
        // If syntax is temporarily invalid while typing, keep current SVG or empty
      } finally {
        if (sandbox && sandbox.parentNode) {
          sandbox.remove();
        }
        if (typeof document !== "undefined") {
          const stray = document.getElementById(uniqueId);
          if (stray) stray.remove();
          const strayD = document.getElementById(`d${uniqueId}`);
          if (strayD) strayD.remove();
        }
      }
    }, 200);

    return () => {
      isCancelled = true;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [trimmed, sanitized, reactId]);

  // If not rendered yet or if syntax is incomplete/invalid, display standard dark code block
  if (!chart.trim() || !svg) {
    return (
      <pre
        style={{
          backgroundColor: "#121419",
          color: "#f8fafc",
          border: "1px solid #262930",
          padding: "1rem 1.25rem",
          borderRadius: "8px",
          overflowX: "auto",
          fontFamily: "'IBM Plex Mono', Consolas, monospace",
          fontSize: "0.9em",
          margin: "1.5rem 0",
        }}
      >
        <code className="language-mermaid" style={{ color: "#f8fafc", background: "transparent" }}>
          {chart}
        </code>
      </pre>
    );
  }

  return (
    <div
      className="mermaid-diagram-container"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "1.75rem 0",
        padding: "1.5rem",
        backgroundColor: "#f6f8fa",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        overflowX: "auto",
        maxWidth: "100%",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

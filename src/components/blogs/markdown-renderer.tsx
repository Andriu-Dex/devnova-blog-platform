import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import Link from "next/link";
import { getDeliveryUrlClient } from "@/lib/cloudinary-client";

import { defaultUrlTransform } from "react-markdown";

import { MermaidDiagram } from "./mermaid-diagram";

interface MediaMapItem {
  id: string;
  publicId: string;
  width: number;
  height: number;
}

interface MarkdownRendererProps {
  content: string;
  mediaMap?: Map<string, MediaMapItem>;
  allowMedia?: boolean;
}

export function MarkdownRenderer({ content, mediaMap = new Map(), allowMedia = true }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml={true}
      urlTransform={(url, key, node: unknown) => {
        if (url.startsWith("media://")) {
          if (!allowMedia) return "";
          
          // Sólo permitir media:// para imágenes, NO para enlaces <a>
          if (node && typeof node === 'object' && 'tagName' in node && node.tagName === "img") {
            return url;
          }
          return "";
        }
        return defaultUrlTransform(url);
      }}
      components={{
        img(props) {
          const { src, alt } = props;
          
          if (!src || typeof src !== "string") return null;

          if (src.startsWith("media://")) {
            if (!allowMedia) {
              return (
                <span style={{ color: "#d9534f", border: "1px dashed #d9534f", padding: "4px" }}>
                  [Las imágenes dentro del contenido institucional todavía no están habilitadas.]
                </span>
              );
            }
            const uuid = src.replace("media://", "");
            const mediaItem = mediaMap.get(uuid);

            if (mediaItem) {
              const deliveryUrl = getDeliveryUrlClient(mediaItem.publicId, 800);
              return (
                <span style={{ display: "block", margin: "2rem 0" }}>
                  <Image
                    src={deliveryUrl}
                    alt={alt || "Imagen del blog"}
                    width={mediaItem.width || 800}
                    height={mediaItem.height || 600}
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                      borderRadius: "8px",
                      display: "block",
                      margin: "0 auto",
                    }}
                    unoptimized
                  />
                </span>
              );
            } else {
              // Si el medio no se puede resolver (o no pertenece a la versión publicada)
              return (
                <span
                  style={{
                    display: "inline-block",
                    padding: "8px 16px",
                    backgroundColor: "#fef2f2",
                    color: "#991b1b",
                    border: "1px solid #fecaca",
                    borderRadius: "4px",
                    fontSize: "0.9rem",
                  }}
                >
                  [Imagen no disponible: {alt || "Sin texto alternativo"}]
                </span>
              );
            }
          }

          // Imágenes externas no permitidas
          return (
            <span
              style={{
                display: "inline-block",
                padding: "8px 16px",
                backgroundColor: "#fffbeb",
                color: "#92400e",
                border: "1px solid #fde68a",
                borderRadius: "4px",
                fontSize: "0.9rem",
              }}
            >
              [Imagen externa bloqueada: {alt || String(src)}]
            </span>
          );
        },
        a(props) {
          const { href, children } = props;
          if (!href || typeof href !== "string") return <a>{children}</a>;

          // Bloquear links maliciosos explicitamente
          if (
            href.toLowerCase().startsWith("javascript:") ||
            href.toLowerCase().startsWith("data:") ||
            href.toLowerCase().startsWith("vbscript:") ||
            href.toLowerCase().startsWith("file:")
          ) {
            return <span style={{ textDecoration: "line-through", color: "#991b1b" }}>[Enlace bloqueado]</span>;
          }

          if (href.startsWith("http://") || href.startsWith("https://")) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#1655f8", textDecoration: "underline" }}
              >
                {children}
              </a>
            );
          }

          return (
            <Link href={href} style={{ color: "#1655f8", textDecoration: "underline" }}>
              {children}
            </Link>
          );
        },
        h1: ({ children }) => <h2 style={{ fontSize: "1.55em", marginTop: "1.4em", marginBottom: "0.5em", color: "#0f172a", fontWeight: 700, letterSpacing: "-0.02em" }}>{children}</h2>,
        h2: ({ children }) => <h3 style={{ fontSize: "1.35em", marginTop: "1.25em", marginBottom: "0.5em", color: "#0f172a", fontWeight: 700, letterSpacing: "-0.02em" }}>{children}</h3>,
        h3: ({ children }) => <h4 style={{ fontSize: "1.18em", marginTop: "1.1em", marginBottom: "0.4em", color: "#0f172a", fontWeight: 600 }}>{children}</h4>,
        p: ({ children }) => <p style={{ fontSize: "1em", lineHeight: 1.7, marginBottom: "1.1em", color: "#1e293b" }}>{children}</p>,
        ul: ({ children }) => <ul style={{ fontSize: "1em", lineHeight: 1.7, marginBottom: "1.1em", color: "#1e293b", paddingLeft: "1.4em" }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ fontSize: "1em", lineHeight: 1.7, marginBottom: "1.1em", color: "#1e293b", paddingLeft: "1.4em" }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: "0.35em", color: "#1e293b" }}>{children}</li>,
        strong: ({ children }) => <strong style={{ color: "#0f172a", fontWeight: 700 }}>{children}</strong>,
        blockquote: ({ children }) => (
          <blockquote style={{ borderLeft: "4px solid #155eef", paddingLeft: "1.2rem", paddingRight: "1rem", paddingTop: "0.75rem", paddingBottom: "0.75rem", color: "#334155", fontStyle: "italic", margin: "1.5rem 0", backgroundColor: "#f8fafc", borderRadius: "0 8px 8px 0" }}>
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div style={{ overflowX: "auto", margin: "1.75rem 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95em", textAlign: "left" }}>
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th style={{ border: "1px solid #e2e8f0", padding: "10px 14px", backgroundColor: "#f8fafc", color: "#0f172a", fontWeight: 600 }}>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td style={{ border: "1px solid #e2e8f0", padding: "10px 14px", color: "#334155" }}>
            {children}
          </td>
        ),
        hr: () => <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "2rem 0" }} />,
        pre: ({ children }) => <>{children}</>,
        code(props) {
          const { children, className } = props;
          const isInline = !className;
          const match = /language-(\w+)/.exec(className || "");
          const lang = match ? match[1] : "";

          if (!isInline && lang.toLowerCase() === "mermaid") {
            return <MermaidDiagram chart={String(children)} />;
          }

          return isInline ? (
            <code
              style={{
                backgroundColor: "#f1f5f9",
                color: "#0f172a",
                padding: "0.2rem 0.45rem",
                borderRadius: "5px",
                fontFamily: "'IBM Plex Mono', Consolas, monospace",
                fontSize: "0.88em",
                border: "1px solid #e2e8f0",
                fontWeight: 500,
              }}
            >
              {children}
            </code>
          ) : (
            <pre
              style={{
                backgroundColor: "#121419",
                color: "#f8fafc",
                padding: "1.25rem 1.5rem",
                borderRadius: "10px",
                overflowX: "auto",
                fontFamily: "'IBM Plex Mono', Consolas, monospace",
                fontSize: "0.92em",
                lineHeight: 1.6,
                margin: "1.75rem 0",
                border: "1px solid #262930",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.15)",
              }}
            >
              <code
                style={{
                  background: "transparent",
                  backgroundColor: "transparent",
                  color: "#f8fafc",
                  padding: 0,
                  margin: 0,
                  border: "none",
                  borderRadius: 0,
                  boxShadow: "none",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  display: "block",
                  whiteSpace: "pre",
                }}
              >
                {children}
              </code>
            </pre>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

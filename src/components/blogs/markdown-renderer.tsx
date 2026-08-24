import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import Link from "next/link";
import { getDeliveryUrl } from "@/server/media/cloudinary";

import { defaultUrlTransform } from "react-markdown";

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
              const deliveryUrl = getDeliveryUrl(mediaItem.publicId, 800);
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
        h1: ({ children }) => <h2 style={{ fontSize: "2rem", marginTop: "2rem", marginBottom: "1rem", color: "#121419" }}>{children}</h2>,
        h2: ({ children }) => <h3 style={{ fontSize: "1.75rem", marginTop: "1.75rem", marginBottom: "1rem", color: "#121419" }}>{children}</h3>,
        h3: ({ children }) => <h4 style={{ fontSize: "1.5rem", marginTop: "1.5rem", marginBottom: "0.75rem", color: "#121419" }}>{children}</h4>,
        p: ({ children }) => <p style={{ fontSize: "1.1rem", lineHeight: 1.8, marginBottom: "1.25rem", color: "#374151" }}>{children}</p>,
        ul: ({ children }) => <ul style={{ fontSize: "1.1rem", lineHeight: 1.8, marginBottom: "1.25rem", color: "#374151", paddingLeft: "1.5rem" }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ fontSize: "1.1rem", lineHeight: 1.8, marginBottom: "1.25rem", color: "#374151", paddingLeft: "1.5rem" }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: "0.5rem" }}>{children}</li>,
        blockquote: ({ children }) => (
          <blockquote style={{ borderLeft: "4px solid #1655f8", paddingLeft: "1rem", color: "#4b5563", fontStyle: "italic", margin: "1.5rem 0", backgroundColor: "#f9fafb", padding: "1rem" }}>
            {children}
          </blockquote>
        ),
        code(props) {
          const { children, className } = props;
          const isInline = !className;
          return isInline ? (
            <code style={{ backgroundColor: "#f3f4f6", padding: "0.2rem 0.4rem", borderRadius: "4px", fontFamily: "'IBM Plex Mono', Consolas, monospace", fontSize: "0.9em", color: "#d93025" }}>
              {children}
            </code>
          ) : (
            <pre style={{ backgroundColor: "#1e1e1e", color: "#d4d4d4", padding: "1rem", borderRadius: "8px", overflowX: "auto", fontFamily: "'IBM Plex Mono', Consolas, monospace", fontSize: "0.95em", margin: "1.5rem 0" }}>
              <code>{children}</code>
            </pre>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

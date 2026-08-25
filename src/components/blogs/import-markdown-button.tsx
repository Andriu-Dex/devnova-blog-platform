"use client";

import { useRef, useState } from "react";
import styles from "./import-markdown.module.css";

interface ImportedMetadata {
  title?: string;
  summary?: string;
  contentMarkdown: string;
}

interface ImportMarkdownButtonProps {
  onImport: (data: ImportedMetadata) => void;
  hasExistingContent?: boolean;
}

export function ImportMarkdownButton({ onImport, hasExistingContent = false }: ImportMarkdownButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("El archivo Markdown es demasiado grande.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const text = await file.text();
      
      if (hasExistingContent) {
        const confirmResult = window.confirm("Importar reemplazará el contenido actual del formulario. ¿Deseas continuar?");
        if (!confirmResult) {
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
      }

      let parsedTitle: string | undefined;
      let parsedSummary: string | undefined;
      let markdownContent = text;

      // Check for devnova-export header
      const headerMatch = text.match(/^<!--\s*devnova-export\s*({[\s\S]*?})\s*-->\s*/);
      
      if (headerMatch && headerMatch[1]) {
        try {
          const metadata = JSON.parse(headerMatch[1]);
          if (metadata.formatVersion === 1) {
            parsedTitle = metadata.title;
            parsedSummary = metadata.summary;
            markdownContent = text.substring(headerMatch[0].length);
          } else {
            setError("El formato de respaldo DevNova no es compatible.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }
        } catch (e) {
          // If JSON is invalid, just import as plain markdown
          console.warn("Invalid devnova-export JSON", e);
        }
      }

      onImport({
        title: parsedTitle,
        summary: parsedSummary,
        contentMarkdown: markdownContent,
      });

    } catch (err) {
      console.error(err);
      setError("No fue posible leer el archivo.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={styles.container}>
      <input
        type="file"
        accept=".md,text/markdown,text/plain"
        ref={fileInputRef}
        onChange={handleFileChange}
        className={styles.fileInput}
        id="import-markdown-input"
        aria-label="Importar archivo Markdown"
      />
      <label htmlFor="import-markdown-input" className={styles.button}>
        Importar Markdown
      </label>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

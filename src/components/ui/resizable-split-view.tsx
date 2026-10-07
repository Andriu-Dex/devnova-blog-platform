"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";

export type SplitViewMode = "split" | "editor" | "preview";

interface ResizableSplitViewProps {
  editor: ReactNode;
  preview: ReactNode;
  mode: SplitViewMode;
  initialEditorWidth?: number; // percentage (e.g. 50)
  minEditorWidth?: number; // minimum percentage
  maxEditorWidth?: number; // maximum percentage
}

export function ResizableSplitView({
  editor,
  preview,
  mode,
  initialEditorWidth = 50,
  minEditorWidth = 20,
  maxEditorWidth = 80,
}: ResizableSplitViewProps) {
  const [editorWidth, setEditorWidth] = useState(initialEditorWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      let newWidthPercent = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      newWidthPercent = Math.max(minEditorWidth, Math.min(maxEditorWidth, newWidthPercent));
      setEditorWidth(newWidthPercent);
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, minEditorWidth, maxEditorWidth]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        display: "flex", 
        width: "100%", 
        height: "100%",
        flex: 1,
        minHeight: 0,
        alignItems: "stretch",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* EDITOR PANEL */}
      {(mode === "split" || mode === "editor") && (
        <div style={{ 
          width: mode === "split" ? `${editorWidth}%` : "100%",
          flexShrink: 0,
          transition: isDragging ? "none" : "width 0.2s ease",
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {editor}
        </div>
      )}

      {/* DRAGGABLE DIVIDER */}
      {mode === "split" && (
        <div 
          onMouseDown={() => setIsDragging(true)}
          style={{
            width: "10px",
            margin: "0 -5px",
            cursor: "col-resize",
            backgroundColor: "transparent",
            zIndex: 20,
            display: "flex",
            justifyContent: "center",
            alignItems: "stretch",
            position: "relative",
            userSelect: "none",
          }}
          title="Arrastra para cambiar el tamaño"
        >
          <div style={{
            width: isDragging ? "3px" : "1px",
            height: "100%",
            backgroundColor: isDragging ? "#155eef" : "#e5e7eb",
            transition: "all 0.15s ease",
          }} />
        </div>
      )}

      {/* PREVIEW PANEL */}
      {(mode === "split" || mode === "preview") && (
        <div style={{ 
          width: mode === "split" ? `${100 - editorWidth}%` : "100%",
          flexShrink: 0,
          transition: isDragging ? "none" : "width 0.2s ease",
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {preview}
        </div>
      )}
    </div>
  );
}

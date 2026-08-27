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

  // Stop dragging if mouse leaves window or button released
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      // Calculate new percentage based on mouse position relative to container
      let newWidthPercent = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Clamp to min/max
      newWidthPercent = Math.max(minEditorWidth, Math.min(maxEditorWidth, newWidthPercent));
      setEditorWidth(newWidthPercent);
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      // Change cursor on whole document while dragging to avoid losing it if mouse moves fast
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
        alignItems: "stretch",
        position: "relative",
      }}
    >
      {/* EDITOR PANEL */}
      {(mode === "split" || mode === "editor") && (
        <div style={{ 
          width: mode === "split" ? `${editorWidth}%` : "100%",
          flexShrink: 0,
          transition: isDragging ? "none" : "width 0.3s ease",
          height: "100%",
        }}>
          {editor}
        </div>
      )}

      {/* DRAGGABLE DIVIDER */}
      {mode === "split" && (
        <div 
          onMouseDown={() => setIsDragging(true)}
          style={{
            width: "12px",
            margin: "0 -6px", // To overlap and increase hit area
            cursor: "col-resize",
            backgroundColor: "transparent",
            zIndex: 10,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
          }}
          className="split-divider"
        >
          {/* Visual line inside the hit area */}
          <div style={{
            width: "4px",
            height: "100%",
            borderRadius: "2px",
            backgroundColor: isDragging ? "var(--color-cyan, #28c7e8)" : "#e5e7eb",
            transition: "background-color 0.2s ease"
          }} />
        </div>
      )}

      {/* PREVIEW PANEL */}
      {(mode === "split" || mode === "preview") && (
        <div style={{ 
          width: mode === "split" ? `${100 - editorWidth}%` : "100%",
          flexShrink: 0,
          transition: isDragging ? "none" : "width 0.3s ease",
          height: "100%",
        }}>
          {preview}
        </div>
      )}
    </div>
  );
}

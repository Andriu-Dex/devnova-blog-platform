"use client";

import { useEffect, useState, useRef, useCallback } from "react";

export type BlogDraftData = {
  schemaVersion: number;
  title: string;
  slug?: string;
  summary: string;
  contentMarkdown: string;
  coverMediaAssetId: string | null;
  coverAltText: string | null;
  categoryId?: string | null;
  changeSummary?: string;
  baseVersionId?: string;
  savedAt: string;
};

export const DRAFT_SCHEMA_VERSION = 1;

type UseLocalBlogDraftProps = {
  draftKey: string;
  currentData: Omit<BlogDraftData, "schemaVersion" | "savedAt">;
};

export function useLocalBlogDraft({ draftKey, currentData }: UseLocalBlogDraftProps) {
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState<BlogDraftData | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const initialLoadDone = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isDiscarding = useRef(false);

  const [isStale, setIsStale] = useState(false);

  // Cargar draft inicial
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    try {
      const stored = localStorage.getItem(draftKey);
      if (stored) {
        const parsed = JSON.parse(stored) as BlogDraftData;
        if (parsed.schemaVersion === DRAFT_SCHEMA_VERSION) {
          // Detectar si hay cambios respecto al form inicial
          const isDifferent =
            parsed.title !== currentData.title ||
            parsed.summary !== currentData.summary ||
            parsed.contentMarkdown !== currentData.contentMarkdown ||
            (parsed.slug !== currentData.slug && currentData.slug !== undefined) ||
            parsed.coverMediaAssetId !== currentData.coverMediaAssetId ||
            parsed.coverAltText !== currentData.coverAltText ||
            parsed.categoryId !== currentData.categoryId;

          if (isDifferent) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDraftData(parsed);
            setHasDraft(true);
            setLastSavedAt(parsed.savedAt);
            
            if (currentData.baseVersionId && parsed.baseVersionId && currentData.baseVersionId !== parsed.baseVersionId) {
              setIsStale(true);
            }
          }
        } else {
          // Versión antigua, descartar
          localStorage.removeItem(draftKey);
        }
      }
    } catch (err) {
      console.warn("Error parsing local draft", err);
      localStorage.removeItem(draftKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Guardado automático
  const currentDataStr = JSON.stringify(currentData);

  useEffect(() => {
    if (!initialLoadDone.current || isDiscarding.current) return;
    
    // Si no ha cargado completamente o si acaba de recuperar, esperamos a la próxima interacción.
    // Usamos debounce
    setSaveStatus("saving");

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      try {
        const now = new Date().toISOString();
        const payload: BlogDraftData = {
          schemaVersion: DRAFT_SCHEMA_VERSION,
          ...JSON.parse(currentDataStr), // Usamos el string parseado para asegurar consistencia
          savedAt: now,
        };
        localStorage.setItem(draftKey, JSON.stringify(payload));
        setSaveStatus("saved");
        setLastSavedAt(now);
      } catch (err) {
        console.error("Failed to save local draft", err);
        setSaveStatus("idle");
      }
    }, 1000);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [draftKey, currentDataStr]);

  // Escuchar cambios de otra pestaña
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === draftKey) {
        if (!e.newValue) {
          // Fue borrado en otra pestaña
          setHasDraft(false);
          setDraftData(null);
        } else {
          // Actualizado en otra pestaña
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed.schemaVersion === DRAFT_SCHEMA_VERSION) {
              setDraftData(parsed);
              setHasDraft(true);
              setLastSavedAt(parsed.savedAt);
            }
          } catch (err) {
            console.error("Storage event parse error", err);
          }
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [draftKey]);

  // Alert before unload if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Si el status es saving o ya está guardado localmente
      // actually we want to warn them if they haven't explicitly saved to DB.
      // But the requirement says: "Si existen cambios locales diferentes del último estado DB/form inicial: registrar beforeunload"
      // How do we know it's different from the DB state?
      // Since `saveStatus` changes to "saved" when localStorage is updated, that implies they have LOCAL changes.
      // We only clear the draft when they successfully save to DB.
      // So if `lastSavedAt` is set, they have local changes.
      if (lastSavedAt && !isDiscarding.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [lastSavedAt]);

  const discardDraft = useCallback(() => {
    isDiscarding.current = true;
    localStorage.removeItem(draftKey);
    setHasDraft(false);
    setDraftData(null);
    setLastSavedAt(null);
    setSaveStatus("idle");
    
    // Allow a tick to skip autosaving the old data
    setTimeout(() => {
      isDiscarding.current = false;
    }, 100);
  }, [draftKey]);

  const clearDraftOnSuccess = useCallback(() => {
    isDiscarding.current = true;
    localStorage.removeItem(draftKey);
    setHasDraft(false);
    setDraftData(null);
    setLastSavedAt(null);
    // Don't reset isDiscarding immediately so we don't save the form state while redirecting
  }, [draftKey]);

  return {
    hasDraft,
    draftData,
    saveStatus,
    lastSavedAt,
    isStale,
    discardDraft,
    clearDraftOnSuccess,
  };
}

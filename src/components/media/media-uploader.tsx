"use client";

import { useState, useRef } from "react";
import { registerUploadedMediaAction } from "@/app/dashboard/media/actions";

interface MediaUploaderProps {
  onUploadSuccess?: (mediaAssetId?: string) => void;
}

export function MediaUploader({ onUploadSuccess }: MediaUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "signing" | "uploading" | "registering" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Formato no permitido. Solo se aceptan imágenes JPG, PNG o WebP.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const maxBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxBytes) {
      setErrorMessage("El archivo supera el límite de 10 MB.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Obtener firma del backend
      setStatus("signing");
      const signRes = await fetch("/api/cloudinary/sign-upload", {
        method: "POST",
      });

      if (!signRes.ok) {
        const errData = await signRes.json().catch(() => ({}));
        throw new Error(errData.error || "No fue posible obtener la firma de subida.");
      }

      const { timestamp, signature, cloudName, apiKey, uploadPreset } = await signRes.json();

      // 2. Subida directa del navegador a Cloudinary
      setStatus("uploading");
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("upload_preset", uploadPreset);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!cloudRes.ok) {
        const cloudErr = await cloudRes.json().catch(() => ({}));
        throw new Error(cloudErr.error?.message || "Error al subir la imagen a Cloudinary.");
      }

      const cloudData = await cloudRes.json();

      // 3. Registro verificado en el backend
      setStatus("registering");
      const registerRes = await registerUploadedMediaAction({
        publicId: cloudData.public_id,
        version: cloudData.version,
        signature: cloudData.signature,
      });

      if (registerRes.error) {
        throw new Error(registerRes.error);
      }

      setStatus("success");
      setSuccessMessage("¡Imagen subida y registrada correctamente!");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (onUploadSuccess) {
        onUploadSuccess(registerRes.mediaAssetId);
      }
    } catch (err: unknown) {
      console.error("Error en flujo de subida:", err);
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Ocurrió un error inesperado durante la subida."
      );
    }
  };

  const isBusy = status === "signing" || status === "uploading" || status === "registering";

  return (
    <div
      style={{
        backgroundColor: "#fffcf4",
        border: "1px solid #c9c6bb",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "32px",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04)",
      }}
    >
      <h3
        style={{
          fontFamily: "'Space Grotesk', Arial, sans-serif",
          fontSize: "1.25rem",
          margin: "0 0 8px 0",
          color: "#121419",
        }}
      >
        Subir nuevo archivo multimedia
      </h3>
      <p
        style={{
          fontFamily: "'Space Grotesk', Arial, sans-serif",
          fontSize: "0.85rem",
          color: "#51545a",
          margin: "0 0 16px 0",
        }}
      >
        Formatos soportados: JPG, PNG, WebP (máximo 10 MB). La imagen se sube de forma directa y segura.
      </p>

      {errorMessage && (
        <div
          style={{
            backgroundColor: "#fcebeb",
            color: "#d92d20",
            padding: "12px 16px",
            borderRadius: "8px",
            borderLeft: "4px solid #d92d20",
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontSize: "0.85rem",
            marginBottom: "16px",
          }}
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            backgroundColor: "#d1fadf",
            color: "#039855",
            padding: "12px 16px",
            borderRadius: "8px",
            borderLeft: "4px solid #039855",
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontSize: "0.85rem",
            marginBottom: "16px",
          }}
        >
          {successMessage}
        </div>
      )}

      <form onSubmit={handleUpload} style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          disabled={isBusy}
          style={{
            fontFamily: "'IBM Plex Mono', Consolas, monospace",
            fontSize: "0.85rem",
            color: "#121419",
          }}
        />

        <button
          type="submit"
          disabled={!selectedFile || isBusy}
          style={{
            backgroundColor: "#155eef",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontFamily: "'IBM Plex Mono', Consolas, monospace",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: !selectedFile || isBusy ? "not-allowed" : "pointer",
            opacity: !selectedFile || isBusy ? 0.6 : 1,
            transition: "background-color 0.2s ease",
          }}
        >
          {status === "signing" && "Firmando..."}
          {status === "uploading" && "Subiendo a Cloudinary..."}
          {status === "registering" && "Procesando registro..."}
          {!isBusy && "Subir archivo"}
        </button>
      </form>
    </div>
  );
}

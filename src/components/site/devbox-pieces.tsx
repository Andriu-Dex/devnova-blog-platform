import React from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./devbox.module.css";

export function Svg({
  children,
  size = 20,
  viewBox = "0 0 24 24",
  className,
}: {
  children: React.ReactNode;
  size?: number;
  viewBox?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconoFlecha({ direccion = "derecha" }: { direccion?: "derecha" | "izquierda" }) {
  const transformacion = direccion === "izquierda" ? "rotate(180 12 12)" : undefined;
  return (
    <Svg>
      <g transform={transformacion}>
        <path d="M5 12h14" />
        <path d="m14 6 6 6-6 6" />
      </g>
    </Svg>
  );
}

export function IconoRepo() {
  return (
    <Svg>
      <circle cx="6" cy="5" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="12" cy="19" r="2" />
      <path d="M6 7v3c0 2 1.5 3 3.5 3H12c2 0 3.5-1 3.5-3V8" />
      <path d="M12 13v4" />
    </Svg>
  );
}

export function IconoArchivo() {
  return (
    <Svg>
      <path d="M6 2.5h8l4 4V21H6z" />
      <path d="M14 2.5V7h4" />
      <path d="m9 12 2 2-2 2m4 0h2" />
    </Svg>
  );
}

export function IconoTerminal() {
  return (
    <Svg>
      <rect x="2.5" y="4" width="19" height="16" rx="2.5" />
      <path d="m7 9 3 3-3 3m6 0h4" />
    </Svg>
  );
}

export function IconoCalendario() {
  return (
    <Svg>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M8 3v4m8-4v4M3 10h18" />
    </Svg>
  );
}

export function IconoCheck() {
  return (
    <Svg>
      <path d="m5 12 4.5 4.5L19 7" />
    </Svg>
  );
}

export function IconoReloj() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  );
}

export function IconoRama() {
  return (
    <Svg>
      <circle cx="6" cy="5" r="2" />
      <circle cx="18" cy="7" r="2" />
      <circle cx="6" cy="19" r="2" />
      <path d="M6 7v10m2-5h4c3.3 0 6-1.3 6-3" />
    </Svg>
  );
}

export function IconoBuscar() {
  return (
    <Svg>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </Svg>
  );
}

export function IconoCerrar() {
  return (
    <Svg size={18}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

export function IconoGitHub() {
  return (
    <Svg>
      <path d="M9 19c-4 1.2-4-2.3-5.6-2.8" />
      <path d="M15 21v-3.3a2.9 2.9 0 0 0-.8-2.2c2.7-.3 5.5-1.3 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.7 11.7 0 0 0-6 0C6.5 2.8 5.4 3.1 5.4 3.1a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.7 2.8 5.7 5.5 6a2.9 2.9 0 0 0-.8 2.2V21" />
    </Svg>
  );
}

export function EtiquetaTipo({ tipo = "blog", label }: { tipo?: string; label?: string | null }) {
  const Icono = tipo === "proyecto" ? IconoRama : tipo === "taller" ? IconoTerminal : IconoArchivo;
  const displayLabel = label || (tipo === "proyecto" ? "Proyecto" : tipo === "taller" ? "Taller" : tipo === "deber" ? "Deber" : "Repositorio académico");
  return (
    <span className={styles.etiquetaTipo} data-tipo={tipo}>
      <Icono />
      {displayLabel}
    </span>
  );
}

export function EstadoEntrega({ estado = "entregado" }: { estado?: "entregado" | "en-progreso" | "planificado" | "pendiente" }) {
  const isOk = estado === "entregado";
  const Icono = isOk ? IconoCheck : estado === "en-progreso" ? IconoRama : IconoReloj;
  const label = isOk ? "Publicado" : estado === "en-progreso" ? "En progreso" : "Planificado";
  return (
    <span className={styles.estadoEntrega} data-estado={estado}>
      <Icono />
      {label}
    </span>
  );
}

export function BarraProgreso({ valor = 100 }: { valor?: number }) {
  const seguro = Math.max(0, Math.min(100, valor));
  return (
    <div className={styles.progreso} aria-label={`Progreso declarado: ${seguro}%`}>
      <div className={styles.progresoCabecera}>
        <span>progreso</span>
        <strong>{seguro}%</strong>
      </div>
      <div className={styles.progresoPista} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={seguro}>
        <span style={{ width: `${seguro}%` }} />
      </div>
    </div>
  );
}

export function VentanaEvidencia({
  imageUrl,
  alt = "Evidencia verificable",
  title = "flujo-devnova.png",
  tag = "desarrollo asistido",
  caption = "Proceso general de aprendizaje y desarrollo en DevNova",
  compacta = false,
}: {
  imageUrl?: string | null;
  alt?: string;
  title?: string;
  tag?: string;
  caption?: string;
  compacta?: boolean;
}) {
  return (
    <figure className={`${styles.ventanaEvidencia} ${compacta ? styles.ventanaEvidenciaCompacta : ""}`}>
      <div className={styles.ventanaEvidenciaBarra}>
        <span className={styles.ventanaEvidenciaControles} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>{title}</span>
        <span>{tag}</span>
      </div>
      {imageUrl ? (
        <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 10", background: "#0d0f12" }}>
          <Image
            src={imageUrl}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            style={{ objectFit: "contain" }}
            unoptimized
          />
        </div>
      ) : (
        <div className={styles.ventanaEvidenciaVacio}>
          <IconoTerminal />
          <p>
            <span>$</span> esperando captura verificable
          </p>
          <small>La entrega conserva su contenido y metadatos; no se simula una imagen.</small>
        </div>
      )}
      <figcaption className={styles.ventanaEvidenciaFigcaption}>{caption}</figcaption>
    </figure>
  );
}

export function FilaArchivo({
  slug,
  title,
  summary,
  author,
  date,
}: {
  slug: string;
  title: string;
  summary?: string;
  author: string;
  date: Date | string;
  indexNumber?: number;
}) {
  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));

  return (
    <Link href={`/blogs/${slug}`} className={styles.filaArchivo}>
      <span className={styles.filaArchivoIcono}>
        <IconoArchivo />
      </span>
      <span className={styles.filaArchivoTitulo}>
        <strong>{title}</strong>
        <span className={styles.meta}>{summary ? summary.slice(0, 80) + "..." : `Archivo / ${slug}`}</span>
      </span>
      <span className={`${styles.filaArchivoAutores} ${styles.meta}`}>{author}</span>
      <span className={styles.filaArchivoEstado}>
        <EstadoEntrega estado="entregado" />
      </span>
      <time className={`${styles.filaArchivoFecha} ${styles.meta}`} dateTime={new Date(date).toISOString()}>
        {formattedDate}
      </time>
      <span className={styles.filaArchivoFlecha}>
        <IconoFlecha />
      </span>
    </Link>
  );
}

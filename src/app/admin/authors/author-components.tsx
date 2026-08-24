"use client";

import { useState, useActionState, useEffect } from "react";
import { createAuthorAction, blockAuthorAction, reactivateAuthorAction, resetAuthorPasswordAction } from "./actions";
import styles from "./authors.module.css";
import type { AuthorListItem } from "@/server/users/author-service";

// Helper hook para copiar al portapapeles
function useClipboard() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return { copied, copy };
}

export function AuthorsManager({ initialAuthors }: { initialAuthors: AuthorListItem[] }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  return (
    <>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Autores</h1>
          <a href="/admin" className={styles.subtitle}>
            ← Volver al panel administrativo
          </a>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className={styles.createButton}>
          + Crear Autor
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Nombre de usuario</th>
              <th className={styles.th}>Nombre para mostrar</th>
              <th className={styles.th}>Estado</th>
              <th className={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {initialAuthors.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.td} style={{ textAlign: "center", color: "#74777e" }}>
                  No hay autores registrados.
                </td>
              </tr>
            ) : (
              initialAuthors.map((author, index) => {
                const isLast = index === initialAuthors.length - 1;
                const tdClass = isLast ? styles.tdLast : styles.td;
                
                return (
                  <tr key={author.id}>
                    <td className={tdClass}>
                      <strong>{author.username}</strong>
                      {author.mustChangePassword && (
                        <span style={{ display: "block", fontSize: "0.75rem", color: "#f79009" }}>
                          (Pendiente de cambio de clave)
                        </span>
                      )}
                    </td>
                    <td className={tdClass}>{author.displayName}</td>
                    <td className={tdClass}>
                      <span className={`${styles.statusPill} ${author.status === "ACTIVE" ? styles.statusActive : styles.statusBlocked}`}>
                        {author.status}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <AuthorActions author={author} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isCreateModalOpen && (
        <CreateAuthorModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </>
  );
}

function CreateAuthorModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createAuthorAction, null);
  const { copied, copy } = useClipboard();

  // Si fue exitoso y nos devolvió contraseña
  if (state?.temporaryPassword) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <h2 className={styles.modalTitle}>Autor Creado Exitosamente</h2>
          <div className={styles.tempPasswordBox}>
            <p className={styles.modalText} style={{ margin: 0, color: "#039855" }}>
              Esta contraseña se mostrará <strong>una sola vez</strong>. Guárdala ahora y compártela de forma segura con el Autor.
            </p>
            <div className={styles.tempPasswordText}>{state.temporaryPassword}</div>
            <button 
              onClick={() => copy(state.temporaryPassword!)} 
              className={styles.submitButton} 
              style={{ width: "100%" }}
            >
              {copied ? "¡Copiado!" : "Copiar contraseña"}
            </button>
          </div>
          <div className={styles.modalActions}>
            <button onClick={onClose} className={styles.cancelButton} style={{ width: "100%" }}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Crear nuevo Autor</h2>
        <p className={styles.modalText}>
          El sistema generará una contraseña temporal segura que deberás compartir con el autor.
        </p>

        <form action={formAction}>
          {state?.error && (
            <div className={styles.errorMessage}>
              {state.error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>Nombre de usuario</label>
            <input 
              id="username" 
              name="username" 
              type="text" 
              required 
              maxLength={80} 
              className={styles.input} 
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="displayName" className={styles.label}>Nombre para mostrar</label>
            <input 
              id="displayName" 
              name="displayName" 
              type="text" 
              required 
              maxLength={120} 
              className={styles.input} 
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} disabled={isPending} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className={styles.submitButton}>
              {isPending ? "Creando..." : "Crear Autor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AuthorActions({ author }: { author: AuthorListItem }) {
  const [isConfirmingBlock, setIsConfirmingBlock] = useState(false);
  const [isConfirmingReactivate, setIsConfirmingReactivate] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  return (
    <>
      <div style={{ display: "flex", gap: "8px" }}>
        {author.status === "ACTIVE" ? (
          <button onClick={() => setIsConfirmingBlock(true)} className={`${styles.actionButton} ${styles.actionButtonDanger}`}>
            Bloquear
          </button>
        ) : (
          <button onClick={() => setIsConfirmingReactivate(true)} className={styles.actionButton}>
            Reactivar
          </button>
        )}
        <button onClick={() => setIsConfirmingReset(true)} className={styles.actionButton}>
          Restablecer clave
        </button>
      </div>

      {isConfirmingBlock && (
        <BlockModal author={author} onClose={() => setIsConfirmingBlock(false)} />
      )}
      
      {isConfirmingReactivate && (
        <ReactivateModal author={author} onClose={() => setIsConfirmingReactivate(false)} />
      )}

      {isConfirmingReset && (
        <ResetPasswordModal author={author} onClose={() => setIsConfirmingReset(false)} />
      )}
    </>
  );
}

function BlockModal({ author, onClose }: { author: AuthorListItem, onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(blockAuthorAction, null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Bloquear Autor</h2>
        <p className={styles.modalText}>
          ¿Estás seguro de que deseas bloquear a <strong>{author.username}</strong>? Esto revocará inmediatamente todas sus sesiones activas.
        </p>

        <form action={formAction}>
          <input type="hidden" name="targetUserId" value={author.id} />
          
          {state?.error && <div className={styles.errorMessage}>{state.error}</div>}

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} disabled={isPending} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className={`${styles.submitButton} ${styles.submitButtonDanger}`}>
              {isPending ? "Bloqueando..." : "Bloquear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReactivateModal({ author, onClose }: { author: AuthorListItem, onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(reactivateAuthorAction, null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Reactivar Autor</h2>
        <p className={styles.modalText}>
          ¿Estás seguro de que deseas reactivar a <strong>{author.username}</strong>? Tendrá que iniciar sesión nuevamente con sus credenciales.
        </p>

        <form action={formAction}>
          <input type="hidden" name="targetUserId" value={author.id} />
          
          {state?.error && <div className={styles.errorMessage}>{state.error}</div>}

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} disabled={isPending} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className={styles.submitButton}>
              {isPending ? "Reactivando..." : "Reactivar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ author, onClose }: { author: AuthorListItem, onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(resetAuthorPasswordAction, null);
  const { copied, copy } = useClipboard();

  if (state?.temporaryPassword) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <h2 className={styles.modalTitle}>Contraseña Restablecida</h2>
          <div className={styles.tempPasswordBox}>
            <p className={styles.modalText} style={{ margin: 0, color: "#039855" }}>
              Las sesiones activas han sido revocadas. Esta nueva contraseña se mostrará <strong>una sola vez</strong>. Guárdala ahora y compártela.
            </p>
            <div className={styles.tempPasswordText}>{state.temporaryPassword}</div>
            <button 
              onClick={() => copy(state.temporaryPassword!)} 
              className={styles.submitButton} 
              style={{ width: "100%" }}
            >
              {copied ? "¡Copiado!" : "Copiar contraseña"}
            </button>
          </div>
          <div className={styles.modalActions}>
            <button onClick={onClose} className={styles.cancelButton} style={{ width: "100%" }}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Restablecer Contraseña</h2>
        <p className={styles.modalText}>
          Se revocará cualquier sesión activa de <strong>{author.username}</strong> y se generará una nueva contraseña temporal segura. ¿Continuar?
        </p>

        <form action={formAction}>
          <input type="hidden" name="targetUserId" value={author.id} />
          
          {state?.error && <div className={styles.errorMessage}>{state.error}</div>}

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} disabled={isPending} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className={`${styles.submitButton} ${styles.submitButtonDanger}`}>
              {isPending ? "Restableciendo..." : "Restablecer y revocar sesiones"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

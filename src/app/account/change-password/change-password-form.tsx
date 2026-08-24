"use client";

import { useActionState, useState } from "react";
import { completeRequiredPasswordChangeAction } from "./actions";
import styles from "./change-password.module.css";

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(completeRequiredPasswordChangeAction, null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <form action={formAction} className={styles.container}>
      <h2 className={styles.title}>Cambio de contraseña obligatorio</h2>
      <p className={styles.description}>
        Debes crear una contraseña propia antes de continuar.
      </p>

      {state?.error && (
        <div className={styles.errorMessage} role="alert">
          {state.error}
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="currentPassword" className={styles.label}>Contraseña actual</label>
        <div className={styles.inputWrapper}>
          <input
            id="currentPassword"
            name="currentPassword"
            type={showCurrent ? "text" : "password"}
            required
            className={styles.input}
            autoComplete="current-password"
          />
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setShowCurrent(!showCurrent)}
          >
            {showCurrent ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="newPassword" className={styles.label}>Nueva contraseña</label>
        <div className={styles.inputWrapper}>
          <input
            id="newPassword"
            name="newPassword"
            type={showNew ? "text" : "password"}
            required
            minLength={12}
            maxLength={128}
            className={styles.input}
            autoComplete="new-password"
          />
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setShowNew(!showNew)}
          >
            {showNew ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="confirmPassword" className={styles.label}>Confirmar nueva contraseña</label>
        <div className={styles.inputWrapper}>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            required
            minLength={12}
            maxLength={128}
            className={styles.input}
            autoComplete="new-password"
          />
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      <button type="submit" disabled={isPending} className={styles.submitButton}>
        {isPending ? "Actualizando..." : "Actualizar contraseña"}
      </button>
    </form>
  );
}

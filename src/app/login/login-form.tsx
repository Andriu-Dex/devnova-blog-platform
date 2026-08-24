"use client";

import { useActionState, useState } from "react";
import { loginAction } from "./actions";
import styles from "./login.module.css";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>DevNova</h1>
      
      {state.error && (
        <div className={styles.error} role="alert">
          {state.error}
        </div>
      )}

      <form action={formAction}>
        <div className={styles.formGroup}>
          <label htmlFor="username" className={styles.label}>
            Usuario
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              maxLength={80}
              className={styles.input}
              disabled={isPending}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>
            Contraseña
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              maxLength={128}
              className={styles.input}
              disabled={isPending}
            />
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
        </div>

        <button type="submit" className={styles.submitButton} disabled={isPending}>
          {isPending ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}

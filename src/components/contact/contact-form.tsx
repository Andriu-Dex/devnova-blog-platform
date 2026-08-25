"use client";

import { useActionState } from "react";
import { submitContactFormAction, ContactFormState } from "@/server/actions/contact-actions";
import styles from "./contact-form.module.css";

export function ContactForm() {
  const [state, formAction, isPending] = useActionState<ContactFormState, FormData>(
    submitContactFormAction,
    { error: "", success: false }
  );

  if (state.success) {
    return (
      <div className={styles.success} role="status" aria-live="polite">
        <h3 className={styles.successTitle}>¡Gracias por escribirnos!</h3>
        <p className={styles.successText}>
          Tu mensaje fue enviado correctamente. Nos pondremos en contacto contigo a la brevedad.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className={styles.form} noValidate>
      <h2 className={styles.formTitle}>Envíanos un mensaje</h2>

      {state.error && (
        <div className={styles.error} role="alert" aria-live="assertive">
          {state.error}
        </div>
      )}

      {/* Honeypot – must remain invisible */}
      <div style={{ display: "none" }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="senderName" className={styles.label}>Nombre</label>
        <input
          type="text"
          id="senderName"
          name="senderName"
          required
          maxLength={150}
          autoComplete="name"
          className={styles.input}
          disabled={isPending}
          aria-required="true"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="senderEmail" className={styles.label}>Correo electrónico</label>
        <input
          type="email"
          id="senderEmail"
          name="senderEmail"
          required
          maxLength={255}
          autoComplete="email"
          className={styles.input}
          disabled={isPending}
          aria-required="true"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="subject" className={styles.label}>Asunto</label>
        <input
          type="text"
          id="subject"
          name="subject"
          required
          maxLength={200}
          autoComplete="off"
          className={styles.input}
          disabled={isPending}
          aria-required="true"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="messageBody" className={styles.label}>Mensaje</label>
        <textarea
          id="messageBody"
          name="messageBody"
          required
          maxLength={5000}
          rows={5}
          className={styles.textarea}
          disabled={isPending}
          aria-required="true"
        />
      </div>

      <button type="submit" className={styles.submit} disabled={isPending} aria-busy={isPending}>
        {isPending ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}

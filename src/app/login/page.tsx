import { getCurrentAuthenticatedUser } from "@/server/auth/authentication-service";
import { LoginForm } from "./login-form";
import styles from "./login.module.css";
import { logoutAction } from "./actions";
import { PublicHeader } from "@/components/site/public-header";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Iniciar sesión | DevNova",
  description: "Ingreso al sistema DevNova",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentAuthenticatedUser();
  const resolvedSearchParams = await searchParams;
  const isPasswordChanged = resolvedSearchParams?.passwordChanged === "1";

  if (user) {
    if (user.mustChangePassword) {
      redirect("/account/change-password");
    }

    return (
      <div className={styles.page}>
        <PublicHeader />
        <main className={styles.pageMain}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h1 className={styles.title}>Sesión Activa</h1>
              <p className={styles.subtitle}>
                Hola <strong style={{ color: "#121419" }}>{user.displayName}</strong>
              </p>
            </div>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{
                display: "inline-block",
                backgroundColor: "rgba(18, 20, 25, 0.05)",
                padding: "4px 12px",
                borderRadius: "999px",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 600,
                color: "#121419",
                border: "1px dashed rgba(18, 20, 25, 0.2)"
              }}>
                {user.role}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              {user.role === "ADMIN" ? (
                <Link href="/admin" className={styles.submitButton} style={{ textDecoration: "none", textAlign: "center", display: "block" }}>
                  Ir al panel administrativo
                </Link>
              ) : (
                <Link href="/dashboard" className={styles.submitButton} style={{ textDecoration: "none", textAlign: "center", display: "block" }}>
                  Ir al panel
                </Link>
              )}
              <form action={logoutAction} style={{ width: "100%" }}>
                <button type="submit" className={styles.submitButton} style={{ backgroundColor: "#121419", color: "#fffcf4" }}>
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PublicHeader />
      <main className={styles.pageMain}>
        {isPasswordChanged && (
          <div style={{
            backgroundColor: "var(--color-paper)",
            color: "#059669",
            padding: "16px",
            borderRadius: "10px",
            fontFamily: "var(--font-sans)",
            fontSize: "0.9rem",
            marginBottom: "24px",
            border: "1px solid #059669",
            maxWidth: "420px",
            width: "100%",
          }} role="status">
            Contraseña actualizada. Inicia sesión nuevamente.
          </div>
        )}
        <LoginForm />
      </main>
    </div>
  );
}

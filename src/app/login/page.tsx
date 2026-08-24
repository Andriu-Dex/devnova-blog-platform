import { getCurrentAuthenticatedUser } from "@/server/auth/authentication-service";
import { LoginForm } from "./login-form";
import { logoutAction } from "./actions";
import styles from "./login.module.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión | DevNova",
  description: "Acceso al expediente académico DevNova.",
};

export default async function LoginPage() {
  const user = await getCurrentAuthenticatedUser();

  if (user) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: "center" }}>
          <h1 className={styles.title} style={{ marginBottom: "8px" }}>{user.displayName}</h1>
          <div style={{ 
            fontFamily: "'IBM Plex Mono', Consolas, monospace",
            fontSize: "0.72rem",
            fontWeight: 600,
            color: "#121419",
            backgroundColor: "#28c7e8",
            display: "inline-block",
            padding: "5px 11px",
            borderRadius: "10px",
            marginBottom: "24px"
          }}>
            {user.role}
          </div>
          <p style={{ 
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontSize: "17px",
            color: "#121419",
            marginBottom: "32px"
          }}>
            Tu sesión está activa.
          </p>
          <form action={logoutAction}>
            <button type="submit" className={styles.submitButton} style={{ backgroundColor: "#121419", color: "#fffcf4" }}>
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <LoginForm />;
}

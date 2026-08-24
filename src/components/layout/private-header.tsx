import { logoutAction } from "@/app/login/actions";
import styles from "./private-header.module.css";
import { RoleCode } from "@/server/auth/types";

interface PrivateHeaderProps {
  displayName: string;
  role: RoleCode;
}

export function PrivateHeader({ displayName, role }: PrivateHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <h2 className={styles.brandName}>DevNova</h2>
        <span className={styles.roleLabel}>{role}</span>
      </div>
      
      <div className={styles.userNav}>
        <span className={styles.userName}>{displayName}</span>
        <form action={logoutAction}>
          <button type="submit" className={styles.logoutButton}>
            Cerrar sesión
          </button>
        </form>
      </div>
    </header>
  );
}

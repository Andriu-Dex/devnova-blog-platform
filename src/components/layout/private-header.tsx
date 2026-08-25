"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/login/actions";
import styles from "./private-header.module.css";
import { RoleCode } from "@/server/auth/types";
import { useState } from "react";

interface PrivateHeaderProps {
  displayName: string;
  role: RoleCode;
}

const adminLinks = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/authors", label: "Autores" },
  { href: "/dashboard/blogs", label: "Blogs" },
  { href: "/dashboard/media", label: "Multimedia" },
  { href: "/admin/content", label: "Contenido" },
  { href: "/admin/team", label: "Equipo" },
  { href: "/admin/social", label: "Redes" },
  { href: "/admin/messages", label: "Mensajes" },
  { href: "/admin/audit", label: "Auditoría" },
  { href: "/admin/security", label: "Seguridad" },
];

const authorLinks = [
  { href: "/dashboard", label: "Panel" },
  { href: "/dashboard/blogs", label: "Blogs" },
  { href: "/dashboard/blogs/new", label: "Nuevo blog" },
  { href: "/dashboard/media", label: "Multimedia" },
  { href: "/account/change-password", label: "Cuenta" },
];

export function PrivateHeader({ displayName, role }: PrivateHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = role === "ADMIN" ? adminLinks : authorLinks;

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.brand}>
          <Link href={role === "ADMIN" ? "/admin" : "/dashboard"} className={styles.brandName}>
            DevNova
          </Link>
          <span className={styles.roleLabel}>{role}</span>
        </div>
        
        <div className={styles.userNav}>
          <span className={styles.userName}>{displayName}</span>
          <form action={logoutAction}>
            <button type="submit" className={styles.logoutButton}>
              Cerrar sesión
            </button>
          </form>

          <button
            className={styles.menuToggle}
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      <nav className={`${styles.navBar} ${menuOpen ? styles.navBarOpen : ""}`} aria-label="Navegación del panel">
        <ul className={styles.navList}>
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href || (href !== "/admin" && href !== "/dashboard" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}

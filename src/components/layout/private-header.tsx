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

function HomeIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      style={{ marginRight: "6px", display: "inline-block", verticalAlign: "text-bottom" }}
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  );
}

interface HeaderNavLink {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

const adminLinks: HeaderNavLink[] = [
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
  { href: "/", label: "Home", icon: <HomeIcon /> },
];

const authorLinks: HeaderNavLink[] = [
  { href: "/dashboard", label: "Panel" },
  { href: "/dashboard/blogs", label: "Blogs" },
  { href: "/dashboard/blogs/new", label: "Nuevo blog" },
  { href: "/dashboard/media", label: "Multimedia" },
  { href: "/account/change-password", label: "Cuenta" },
  { href: "/", label: "Home", icon: <HomeIcon /> },
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
          {navLinks.map((link) => {
            const { href, label, icon } = link;
            const isActive = pathname === href || (href !== "/admin" && href !== "/dashboard" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {icon}
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

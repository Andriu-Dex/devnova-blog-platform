"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import styles from "./public-header.module.css";
import { IconoFlecha } from "./devbox-pieces";

interface PublicHeaderClientProps {
  brandName: string;
  logoUrl: string | null;
  logoAlt: string;
}

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/blogs", label: "Entregas" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

function isPathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function PublicHeaderClient({ brandName, logoUrl, logoAlt }: PublicHeaderClientProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Brand */}
        <Link href="/" className={styles.brand} aria-label={`${brandName} – Inicio`}>
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={logoAlt}
              width={120}
              height={32}
              style={{ objectFit: "contain", height: "32px", width: "auto" }}
            />
          ) : (
            <>
              <span className={styles.brandGlyph} aria-hidden="true">
                <svg viewBox="0 0 28 24" fill="none">
                  <path d="M2 5.5h9l2.2-3H26v18.5H2z" fill="currentColor" />
                  <path d="M2 8h24" stroke="var(--color-cyan, #28c7e8)" strokeWidth="2" />
                </svg>
              </span>
              <span className={styles.brandName}>{brandName}</span>
              <span className={styles.brandPath} aria-hidden="true">/main</span>
            </>
          )}
        </Link>

        {/* Desktop nav capsule */}
        <nav className={styles.desktopNav} aria-label="Navegación principal">
          <div className={styles.navCapsule}>
            {navLinks.map(({ href, label }) => {
              const active = isPathActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Status / Login */}
        <div className={styles.headerRight}>
          <span className={styles.repoStatus}>
            <span className={styles.statusDot} aria-hidden="true" /> repo público
          </span>
          <Link href="/login" className={styles.loginLink}>
            Acceso
          </Link>
          {/* Mobile toggle */}
          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            <span>{menuOpen ? "Cerrar" : "Menú"}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="20" height="20" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <nav
        id="mobile-nav"
        aria-label="Navegación móvil"
        className={`${styles.mobileNav} ${menuOpen ? styles.mobileNavOpen : ""}`}
      >
        {navLinks.map(({ href, label }) => {
          const active = isPathActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.mobileNavLink} ${active ? styles.mobileNavLinkActive : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <span>{label}</span>
              <IconoFlecha />
            </Link>
          );
        })}
        <Link href="/login" className={styles.mobileLoginBtn} onClick={() => setMenuOpen(false)}>
          Acceso privado
        </Link>
      </nav>
    </header>
  );
}

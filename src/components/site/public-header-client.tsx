"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import styles from "./public-header.module.css";

interface PublicHeaderClientProps {
  brandName: string;
  logoUrl: string | null;
  logoAlt: string;
}

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/blogs", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
];

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
              height={40}
              style={{ objectFit: "contain", height: "40px", width: "auto" }}
            />
          ) : (
            <span className={styles.brandName}>{brandName}</span>
          )}
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Navegación principal">
          <ul className={styles.nav} role="list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`${styles.navLink} ${pathname === href ? styles.navLinkActive : ""}`}
                  aria-current={pathname === href ? "page" : undefined}
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/login" className={styles.loginLink}>
                Ingresar
              </Link>
            </li>
          </ul>
        </nav>

        {/* Mobile toggle */}
        <button
          className={styles.menuToggle}
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      <nav
        id="mobile-nav"
        aria-label="Navegación móvil"
        className={`${styles.mobileNav} ${menuOpen ? styles.mobileNavOpen : ""}`}
      >
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={styles.mobileNavLink}
            aria-current={pathname === href ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            {label}
          </Link>
        ))}
        <Link href="/login" className={styles.mobileLoginLink} onClick={() => setMenuOpen(false)}>
          Ingresar
        </Link>
      </nav>
    </header>
  );
}

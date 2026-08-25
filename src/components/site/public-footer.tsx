import Link from "next/link";
import { getPublicSiteProfile, getPublicSocialLinks } from "@/server/site/public-site-service";
import styles from "./public-footer.module.css";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/blogs", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
];

export async function PublicFooter() {
  const [socialLinks, profile] = await Promise.all([
    getPublicSocialLinks(),
    getPublicSiteProfile(),
  ]);

  const year = new Date().getFullYear();
  const brandName = profile?.groupName || "DevNova";
  const tagline = profile?.tagline;

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Brand block */}
        <div className={styles.brand}>
          <span className={styles.brandName}>{brandName}</span>
          {tagline && <p className={styles.tagline}>{tagline}</p>}
        </div>

        {/* Nav links */}
        <nav aria-label="Navegación secundaria">
          <ul className={styles.navList}>
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className={styles.navLink}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <hr className={styles.divider} />

      <div className={styles.bottom}>
        <p className={styles.copyright}>
          © {year} {brandName}. Todos los derechos reservados.
        </p>

        {socialLinks.length > 0 && (
          <ul className={styles.socialList} aria-label="Redes sociales">
            {socialLinks.map((link) => {
              if (!link.url.startsWith("https://")) return null;
              return (
                <li key={link.platformCode}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    aria-label={link.platformName}
                  >
                    {link.platformName}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </footer>
  );
}

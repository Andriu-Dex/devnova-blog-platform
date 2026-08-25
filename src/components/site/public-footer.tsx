import Link from "next/link";
import { getPublicSiteProfile, getPublicSocialLinks } from "@/server/site/public-site-service";
import styles from "./public-footer.module.css";
import { IconoFlecha } from "./devbox-pieces";

export async function PublicFooter() {
  const [socialLinks, profile] = await Promise.all([
    getPublicSocialLinks(),
    getPublicSiteProfile(),
  ]);

  const brandName = profile?.groupName || "DevNova";
  const tagline = profile?.tagline || "Ideas que compilan, proyectos que evolucionan.";

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <p className={styles.brandTitle}>{brandName}</p>
          <p className={styles.brandLema}>{tagline}</p>
        </div>

        <div className={styles.routesBlock}>
          <p className={styles.routeHeader}>devnova / desarrollo-asistido</p>
          <nav className={styles.footerNav} aria-label="Navegación del pie">
            <Link href="/">
              <span>Inicio</span> <IconoFlecha />
            </Link>
            <Link href="/blogs">
              <span>Entregas</span> <IconoFlecha />
            </Link>
            <Link href="/nosotros">
              <span>Nosotros</span> <IconoFlecha />
            </Link>
            <Link href="/contacto">
              <span>Contacto</span> <IconoFlecha />
            </Link>
            <Link href="/feed.xml">
              <span>RSS</span> <IconoFlecha />
            </Link>
          </nav>
          <p className={styles.academicCredit}>
            Sitio académico · contenido versionado
          </p>

          {socialLinks.length > 0 && (
            <div className={styles.socialRow}>
              {socialLinks.map((link) => {
                if (!link.url.startsWith("https://")) return null;
                return (
                  <a
                    key={link.platformCode}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                  >
                    {link.platformName}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

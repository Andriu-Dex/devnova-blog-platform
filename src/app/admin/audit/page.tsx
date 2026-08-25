import { requireAdmin } from "@/server/auth/authorization";
import { PrivateHeader } from "@/components/layout/private-header";
import { listAuditEvents, AuditEventDomain } from "@/server/audit/audit-service";
import styles from "./audit.module.css";
import Link from "next/link";
import { formatDateTime } from "@/lib/format-date";

export const metadata = {
  title: "Auditoría | DevNova Admin",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    action?: string;
    domain?: string;
    from?: string;
    to?: string;
  }>;
}

const PAGE_SIZE = 50;

function getBadgeClass(domain: string) {
  switch (domain) {
    case "AUTH": return styles.badgeAuth;
    case "USERS": return styles.badgeUsers;
    case "BLOGS": return styles.badgeBlogs;
    case "SITE_SECTION": 
    case "SITE_PROFILE": return styles.badgeContent;
    case "CONTACT": return styles.badgeContact;
    case "MEDIA": return styles.badgeMedia;
    default: return styles.badge;
  }
}

export default async function AuditPage({ searchParams }: PageProps) {
  const user = await requireAdmin();
  const sp = await searchParams;
  
  const page = parseInt(sp.page || "1", 10) || 1;
  const action = sp.action;
  const domain = sp.domain as AuditEventDomain;
  const from = sp.from;
  const to = sp.to;

  const { data, total } = await listAuditEvents({ page, pageSize: PAGE_SIZE, action, domain, from, to });
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  // Construir la URL para los botones de navegación y limpieza
  const baseParams = new URLSearchParams();
  if (action) baseParams.set("action", action);
  if (domain) baseParams.set("domain", domain);
  if (from) baseParams.set("from", from);
  if (to) baseParams.set("to", to);

  const prevParams = new URLSearchParams(baseParams);
  prevParams.set("page", Math.max(1, page - 1).toString());

  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("page", Math.min(totalPages, page + 1).toString());

  const exportParams = new URLSearchParams();
  if (action) exportParams.set("action", action);
  if (domain) exportParams.set("domain", domain);
  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);

  return (
    <main>
      <PrivateHeader displayName={user.displayName} role={user.role} />
      
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Centro de Auditoría</h1>
          <div className={styles.subtitle}>Registro inmutable de actividades en el sistema</div>
        </div>
        <a 
          href={`/admin/audit/export?${exportParams.toString()}`}
          download
          style={{ padding: "8px 16px", borderRadius: "6px", backgroundColor: "#10b981", color: "white", textDecoration: "none", fontWeight: 500 }}
        >
          Exportar CSV
        </a>
      </div>

      <div className={styles.filtersCard}>
        <form method="GET" action="/admin/audit" className={styles.filtersForm}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="domain">Módulo</label>
            <select name="domain" id="domain" defaultValue={domain || ""} className={styles.filterSelect}>
              <option value="">Todos los módulos</option>
              <option value="AUTH">Autenticación</option>
              <option value="USERS">Usuarios</option>
              <option value="BLOGS">Blogs</option>
              <option value="SITE_SECTION">Contenido (Secciones)</option>
              <option value="SITE_PROFILE">Contenido (Perfil)</option>
              <option value="TEAM">Equipo</option>
              <option value="CONTACT">Contacto</option>
              <option value="SOCIAL">Redes Sociales</option>
              <option value="MEDIA">Multimedia</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="action">Acción (Cod.)</label>
            <input type="text" name="action" id="action" defaultValue={action || ""} placeholder="ej. CREATE" className={styles.filterInput} />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="from">Desde</label>
            <input type="date" name="from" id="from" defaultValue={from || ""} className={styles.filterInput} />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="to">Hasta</label>
            <input type="date" name="to" id="to" defaultValue={to || ""} className={styles.filterInput} />
          </div>

          <div className={styles.filterActions}>
            <button type="submit" className={styles.btnPrimary}>Filtrar</button>
            <Link href="/admin/audit" className={styles.btnSecondary}>Limpiar</Link>
          </div>
        </form>
      </div>

      <div className={styles.tableContainer}>
        {data.length === 0 ? (
          <div className={styles.emptyState}>No se encontraron eventos con estos filtros.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Fecha y Hora</th>
                <th className={styles.th}>Módulo</th>
                <th className={styles.th}>Acción</th>
                <th className={styles.th}>Actor</th>
                <th className={styles.th}>Descripción</th>
                <th className={styles.th}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id} className={styles.tr}>
                  <td className={styles.td}>{formatDateTime(item.occurredAt)}</td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${getBadgeClass(item.domain)}`}>
                      {item.domainLabel}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <strong>{item.actionName}</strong>
                    <br />
                    <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--color-carbon-subtle)" }}>{item.actionCode}</span>
                  </td>
                  <td className={styles.td}>{item.actorName}</td>
                  <td className={styles.td}>{item.description}</td>
                  <td className={styles.td}>
                    <Link href={`/admin/audit/${item.id}`} className={styles.linkDetail}>
                      Ver Detalles
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.pagination}>
        <div className={styles.pageInfo}>
          Página {page} de {totalPages} ({total} eventos)
        </div>
        <div className={styles.paginationControls}>
          {page > 1 && (
            <Link href={`/admin/audit?${prevParams.toString()}`} className={styles.btnSecondary}>
              Anterior
            </Link>
          )}
          {page < totalPages && (
            <Link href={`/admin/audit?${nextParams.toString()}`} className={styles.btnSecondary}>
              Siguiente
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

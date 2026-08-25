import { requireAdmin } from "@/server/auth/authorization";
import { PrivateHeader } from "@/components/layout/private-header";
import { getAuditEventDetail } from "@/server/audit/audit-service";
import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "../audit.module.css";
import { formatDateTime } from "@/lib/format-date";

export const metadata = {
  title: "Detalle de Auditoría | DevNova Admin",
};

interface PageProps {
  params: Promise<{
    auditEventId: string;
  }>;
}

export default async function AuditDetailPage({ params }: PageProps) {
  const user = await requireAdmin();
  const { auditEventId } = await params;

  const event = await getAuditEventDetail(auditEventId);
  if (!event) {
    notFound();
  }

  // Identificar información sensible de IP/UA (Solo Auth/Contact según spec)
  const showSecurityInfo = event.domain === "AUTH" || event.domain === "CONTACT";

  return (
    <main>
      <PrivateHeader displayName={user.displayName} role={user.role} />

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Detalle de Evento</h1>
          <div className={styles.subtitle}>
            <Link href="/admin/audit" className={styles.linkDetail} style={{ marginRight: "8px" }}>← Volver al Centro de Auditoría</Link>
          </div>
        </div>
      </div>

      <div className={styles.detailCard}>
        <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "1.25rem", marginTop: 0, marginBottom: "var(--space-6)" }}>
          Información Principal
        </h2>
        
        <div className={styles.detailGrid}>
          <div>
            <div className={styles.detailLabel}>ID del Evento</div>
            <div className={styles.detailValue} style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{event.id}</div>
          </div>
          <div>
            <div className={styles.detailLabel}>Fecha y Hora</div>
            <div className={styles.detailValue}>{formatDateTime(event.occurredAt)}</div>
          </div>
          <div>
            <div className={styles.detailLabel}>Acción</div>
            <div className={styles.detailValue}>
              <strong>{event.actionName}</strong> ({event.actionCode})
            </div>
          </div>
          <div>
            <div className={styles.detailLabel}>Módulo (Dominio)</div>
            <div className={styles.detailValue}>{event.domainLabel} ({event.domain})</div>
          </div>
          <div>
            <div className={styles.detailLabel}>Actor Nombre</div>
            <div className={styles.detailValue}>{event.actorName || (event.domain === "AUTH" || event.domain === "CONTACT" ? "Visitante" : "Sistema")}</div>
          </div>
          {event.actorUsername && (
            <div>
              <div className={styles.detailLabel}>Actor Usuario</div>
              <div className={styles.detailValue}>{event.actorUsername} ({event.actorRole})</div>
            </div>
          )}
        </div>

        <hr className={styles.sectionDivider} />

        <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "1.25rem", marginTop: 0, marginBottom: "var(--space-6)" }}>
          Información de Dominio ({event.domainLabel})
        </h2>

        <div className={styles.detailGrid}>
          {event.domain === "AUTH" && (
            <>
              <div>
                <div className={styles.detailLabel}>Usuario Intentado</div>
                <div className={styles.detailValue}>{event.authUsername}</div>
              </div>
            </>
          )}

          {event.domain === "USERS" && (
            <>
              <div>
                <div className={styles.detailLabel}>Usuario Objetivo (ID)</div>
                <div className={styles.detailValue} style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{event.targetUserId}</div>
              </div>
            </>
          )}

          {event.domain === "BLOGS" && (
            <>
              <div>
                <div className={styles.detailLabel}>Blog Afectado</div>
                <div className={styles.detailValue}>{event.blogTitle || "Desconocido"}</div>
              </div>
              {event.blogPrevVersion && (
                <div>
                  <div className={styles.detailLabel}>Versión Anterior (ID)</div>
                  <div className={styles.detailValue} style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{event.blogPrevVersion}</div>
                </div>
              )}
              {event.blogNewVersion && (
                <div>
                  <div className={styles.detailLabel}>Versión Nueva (ID)</div>
                  <div className={styles.detailValue} style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{event.blogNewVersion}</div>
                </div>
              )}
            </>
          )}

          {event.domain === "SITE_SECTION" && (
            <>
              <div>
                <div className={styles.detailLabel}>Sección (Llave)</div>
                <div className={styles.detailValue}>{event.sectionKey}</div>
              </div>
              {event.sectionPrev && (
                <div>
                  <div className={styles.detailLabel}>Versión Anterior (ID)</div>
                  <div className={styles.detailValue} style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{event.sectionPrev}</div>
                </div>
              )}
              {event.sectionNew && (
                <div>
                  <div className={styles.detailLabel}>Versión Nueva (ID)</div>
                  <div className={styles.detailValue} style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{event.sectionNew}</div>
                </div>
              )}
            </>
          )}

          {event.domain === "SITE_PROFILE" && (
            <>
              {event.profilePrev && (
                <div>
                  <div className={styles.detailLabel}>Versión Anterior (ID)</div>
                  <div className={styles.detailValue} style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{event.profilePrev}</div>
                </div>
              )}
              {event.profileNew && (
                <div>
                  <div className={styles.detailLabel}>Versión Nueva (ID)</div>
                  <div className={styles.detailValue} style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{event.profileNew}</div>
                </div>
              )}
            </>
          )}

          {event.domain === "TEAM" && (
            <>
              <div>
                <div className={styles.detailLabel}>Miembro del Equipo</div>
                <div className={styles.detailValue}>{event.teamName || "Desconocido"}</div>
              </div>
              {event.teamPrev && (
                <div>
                  <div className={styles.detailLabel}>Versión Anterior (ID)</div>
                  <div className={styles.detailValue} style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{event.teamPrev}</div>
                </div>
              )}
              {event.teamNew && (
                <div>
                  <div className={styles.detailLabel}>Versión Nueva (ID)</div>
                  <div className={styles.detailValue} style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{event.teamNew}</div>
                </div>
              )}
            </>
          )}

          {event.domain === "CONTACT" && (
            <>
              <div>
                <div className={styles.detailLabel}>Mensaje Afectado (ID)</div>
                <div className={styles.detailValue} style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                  <Link href={`/admin/messages/${event.targetContactId}`} className={styles.linkDetail}>
                    {event.targetContactId}
                  </Link>
                </div>
              </div>
              {event.contactPrevStatus && (
                <div>
                  <div className={styles.detailLabel}>Estado Anterior (Historial ID)</div>
                  <div className={styles.detailValue} style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{event.contactPrevStatus}</div>
                </div>
              )}
              {event.contactNewStatus && (
                <div>
                  <div className={styles.detailLabel}>Estado Nuevo (Historial ID)</div>
                  <div className={styles.detailValue} style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{event.contactNewStatus}</div>
                </div>
              )}
            </>
          )}

          {event.domain === "MEDIA" && (
            <>
              <div>
                <div className={styles.detailLabel}>Nombre de Archivo</div>
                <div className={styles.detailValue}>{event.mediaName || "Desconocido"}</div>
              </div>
              {event.mediaFormat && (
                <div>
                  <div className={styles.detailLabel}>Formato</div>
                  <div className={styles.detailValue}>{event.mediaFormat}</div>
                </div>
              )}
            </>
          )}

          {event.domain === "SOCIAL" && (
            <>
              <div>
                <div className={styles.detailLabel}>Referencia a Red Social</div>
                <div className={styles.detailValue}>Actualización detectada.</div>
              </div>
            </>
          )}
        </div>

        {showSecurityInfo && (event.ipAddress || event.userAgent) && (
          <>
            <hr className={styles.sectionDivider} />
            <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "1.25rem", marginTop: 0, marginBottom: "var(--space-6)" }}>
              Información de Seguridad
            </h2>
            <div className={styles.detailGrid}>
              {event.ipAddress && (
                <div>
                  <div className={styles.detailLabel}>Dirección IP</div>
                  <div className={styles.detailValue} style={{ fontFamily: "var(--font-mono)" }}>{event.ipAddress}</div>
                </div>
              )}
              {event.userAgent && (
                <div>
                  <div className={styles.detailLabel}>User Agent</div>
                  <div className={styles.detailValue} style={{ fontSize: "0.85rem" }}>{event.userAgent}</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

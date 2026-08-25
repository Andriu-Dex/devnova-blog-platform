import { requireAdmin } from "@/server/auth/authorization";
import { PrivateHeader } from "@/components/layout/private-header";
import { getAdminMessageDetail } from "@/server/contact/contact-service";
import { markMessageReadAction, archiveMessageAction } from "@/server/actions/contact-actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import styles from "./message.module.css";

export const metadata: Metadata = {
  title: "Detalle del Mensaje | DevNova",
};

export default async function AdminMessageDetailPage({ params }: { params: Promise<{ messageId: string }> }) {
  const user = await requireAdmin();
  const { messageId } = await params;
  
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)) {
    notFound();
  }

  const message = await getAdminMessageDetail(messageId);
  if (!message) {
    notFound();
  }

  const currentStatus = message.currentStatus;
  const isNew = currentStatus.statusCode === "NEW";
  const isRead = currentStatus.statusCode === "READ";

  let statusClass = styles.statusArchived;
  if (isNew) statusClass = styles.statusNew;
  else if (isRead) statusClass = styles.statusRead;

  return (
    <main className="private-page">
      <PrivateHeader displayName={user.displayName} role={user.role} />
      
      <Link href="/admin/messages" className={styles.backLink}>
        ← Volver a la bandeja
      </Link>

      <div className={styles.layout}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h1 className={styles.subject}>{message.subject}</h1>
            <p className={styles.sender}>
              De: <strong>{message.senderName}</strong> &lt;{message.senderEmail}&gt;
            </p>
          </div>
          
          <div className={`${styles.statusBadge} ${statusClass}`}>
            {currentStatus.statusName}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {isNew && (
            <form action={markMessageReadAction.bind(null, message.id)}>
              <button type="submit" className={styles.btnPrimary}>
                Marcar como leído
              </button>
            </form>
          )}
          {isRead && (
            <form action={archiveMessageAction.bind(null, message.id)}>
              <button type="submit" className={styles.btnSecondary}>
                Archivar
              </button>
            </form>
          )}
          {(() => {
            const email = message.senderEmail?.trim() || "";
            const isValidEmail = email.length > 3 && email.length <= 255 && /^[^\s@?#&%\r\n]+@[^\s@?#&%\r\n]+\.[^\s@?#&%\r\n]+$/.test(email);
            
            if (isValidEmail) {
              return (
                <a href={`mailto:${email}`} className={styles.btnOutline}>
                  Responder por correo
                </a>
              );
            }
            return null;
          })()}
        </div>

        {/* Message Body */}
        <div className={styles.bodyCard}>
          <div className={styles.receivedAt}>
            Recibido el {new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(message.receivedAt))}
          </div>
          <div className={styles.messageBody}>
            {message.messageBody}
          </div>
        </div>

        {/* History */}
        <div className={styles.historySection}>
          <h2 className={styles.historyTitle}>Historial de Estados</h2>
          <div className={styles.historyList}>
            {message.history.map(item => (
              <div key={item.id} className={styles.historyItem}>
                <div className={styles.historyItemLeft}>
                  <span className={styles.historyStatusName}>{item.statusName}</span>
                  <span className={styles.historyActor}>
                    por {item.actorName || "Sistema / visitante"}
                  </span>
                </div>
                <div className={styles.historyDate}>
                  {new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.changedAt))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

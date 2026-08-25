import { requireAdmin } from "@/server/auth/authorization";
import { PrivateHeader } from "@/components/layout/private-header";
import { getAdminMessageDetail } from "@/server/contact/contact-service";
import { markMessageReadAction, archiveMessageAction } from "@/server/actions/contact-actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detalle del Mensaje | DevNova",
};

export default async function AdminMessageDetailPage({ params }: { params: Promise<{ messageId: string }> }) {
  const user = await requireAdmin();
  const { messageId } = await params;
  
  // UUID regex validation (basica) para prevenir SQL details leaking si se manda basura
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

  return (
    <main>
      <PrivateHeader displayName={user.displayName} role={user.role} />
      
      <div style={{ marginBottom: "20px" }}>
        <Link href="/admin/messages" style={{ color: "#51545a", textDecoration: "none", fontSize: "0.875rem" }}>
          ← Volver a la bandeja
        </Link>
      </div>

      <div style={{ display: "flex", gap: "24px", flexDirection: "column", maxWidth: "900px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk', Arial, sans-serif", fontSize: "2rem", margin: 0, color: "#121419" }}>
              {message.subject}
            </h1>
            <p style={{ color: "#51545a", marginTop: "8px" }}>
              De: <strong>{message.senderName}</strong> &lt;{message.senderEmail}&gt;
            </p>
          </div>
          
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{
              padding: "6px 12px", 
              borderRadius: "999px", 
              fontSize: "0.875rem", 
              fontWeight: 600,
              backgroundColor: isNew ? "#fef3c7" : isRead ? "#d1fae5" : "#f3f4f6",
              color: isNew ? "#92400e" : isRead ? "#065f46" : "#4b5563"
            }}>
              {currentStatus.statusName}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", padding: "16px", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          {isNew && (
            <form action={markMessageReadAction.bind(null, message.id)}>
              <button type="submit" style={{ backgroundColor: "#155eef", color: "white", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: 500 }}>
                Marcar como leído
              </button>
            </form>
          )}
          {isRead && (
            <form action={archiveMessageAction.bind(null, message.id)}>
              <button type="submit" style={{ backgroundColor: "#4b5563", color: "white", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: 500 }}>
                Archivar
              </button>
            </form>
          )}
          {(() => {
            const email = message.senderEmail?.trim() || "";
            // Validación estricta RFC básica, longitud y sin cr/lf ni delimitadores URI peligrosos
            const isValidEmail = email.length > 3 && email.length <= 255 && /^[^\s@?#&%\r\n]+@[^\s@?#&%\r\n]+\.[^\s@?#&%\r\n]+$/.test(email);
            
            if (isValidEmail) {
              return (
                <a href={`mailto:${email}`} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #d1d5db", backgroundColor: "white", color: "#374151", textDecoration: "none", fontWeight: 500, display: "inline-block" }}>
                  Responder por correo
                </a>
              );
            }
            return null;
          })()}
        </div>

        <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "16px" }}>
            Recibido el {new Date(message.receivedAt).toLocaleString()}
          </div>
          <div style={{ whiteSpace: "pre-wrap", color: "#111827", lineHeight: "1.6", fontSize: "1rem" }}>
            {message.messageBody}
          </div>
        </div>

        <div style={{ marginTop: "32px" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "16px", color: "#111827" }}>Historial de Estados</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {message.history.map(item => (
              <div key={item.id} style={{ padding: "12px 16px", backgroundColor: "#f9fafb", borderRadius: "6px", border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontWeight: 600, color: "#374151", marginRight: "8px" }}>{item.statusName}</span>
                  <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    por {item.actorName || "Sistema / visitante"}
                  </span>
                </div>
                <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  {new Date(item.changedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

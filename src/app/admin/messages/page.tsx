import { requireAdmin } from "@/server/auth/authorization";
import { PrivateHeader } from "@/components/layout/private-header";
import { listAdminMessages } from "@/server/contact/contact-service";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bandeja de Mensajes | DevNova",
};

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<{ status?: string, page?: string }> }) {
  const user = await requireAdmin();
  const params = await searchParams;
  const statusFilter = params.status;
  
  const page = parseInt(params.page || "1", 10);
  const pageSize = 25;

  const { rows: messages, totalCount } = await listAdminMessages(page, pageSize, statusFilter);

  return (
    <main>
      <PrivateHeader displayName={user.displayName} role={user.role} />
      
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', Arial, sans-serif", fontSize: "2rem", margin: 0, color: "#121419" }}>
            Mensajes de Contacto
          </h1>
          <p style={{ color: "#51545a", marginTop: "8px" }}>
            Bandeja de entrada pública.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <Link href="/admin/messages" style={{ padding: "6px 12px", borderRadius: "4px", backgroundColor: !statusFilter ? "#155eef" : "#f1f3f5", color: !statusFilter ? "white" : "black", textDecoration: "none" }}>Todos</Link>
        <Link href="/admin/messages?status=NEW" style={{ padding: "6px 12px", borderRadius: "4px", backgroundColor: statusFilter === "NEW" ? "#155eef" : "#f1f3f5", color: statusFilter === "NEW" ? "white" : "black", textDecoration: "none" }}>Nuevos</Link>
        <Link href="/admin/messages?status=READ" style={{ padding: "6px 12px", borderRadius: "4px", backgroundColor: statusFilter === "READ" ? "#155eef" : "#f1f3f5", color: statusFilter === "READ" ? "white" : "black", textDecoration: "none" }}>Leídos</Link>
        <Link href="/admin/messages?status=ARCHIVED" style={{ padding: "6px 12px", borderRadius: "4px", backgroundColor: statusFilter === "ARCHIVED" ? "#155eef" : "#f1f3f5", color: statusFilter === "ARCHIVED" ? "white" : "black", textDecoration: "none" }}>Archivados</Link>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderRadius: "8px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>
              <th style={{ padding: "12px 16px", fontWeight: 600, color: "#374151" }}>Remitente</th>
              <th style={{ padding: "12px 16px", fontWeight: 600, color: "#374151" }}>Asunto</th>
              <th style={{ padding: "12px 16px", fontWeight: 600, color: "#374151" }}>Estado</th>
              <th style={{ padding: "12px 16px", fontWeight: 600, color: "#374151" }}>Fecha</th>
              <th style={{ padding: "12px 16px", fontWeight: 600, color: "#374151" }}></th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
                  No hay mensajes {statusFilter ? "con este estado" : "recibidos"}.
                </td>
              </tr>
            ) : (
              messages.map(msg => (
                <tr key={msg.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 500, color: "#111827" }}>{msg.senderName}</div>
                    <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>{msg.senderEmail}</div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#374151" }}>{msg.subject}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "4px 8px", 
                      borderRadius: "999px", 
                      fontSize: "0.75rem", 
                      fontWeight: 600,
                      backgroundColor: msg.currentStatusCode === "NEW" ? "#fef3c7" : msg.currentStatusCode === "READ" ? "#d1fae5" : "#f3f4f6",
                      color: msg.currentStatusCode === "NEW" ? "#92400e" : msg.currentStatusCode === "READ" ? "#065f46" : "#4b5563"
                    }}>
                      {msg.currentStatusName}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "0.875rem" }}>
                    {new Date(msg.receivedAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <Link href={`/admin/messages/${msg.id}`} style={{ color: "#155eef", textDecoration: "none", fontWeight: 500, fontSize: "0.875rem" }}>
                      Ver detalle →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalCount > pageSize && (
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            Mostrando {messages.length} de {totalCount} mensajes.
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {page > 1 && (
              <Link href={`/admin/messages?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}`} style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: "4px", color: "#374151", textDecoration: "none", fontSize: "0.875rem" }}>
                Anterior
              </Link>
            )}
            {page * pageSize < totalCount && (
              <Link href={`/admin/messages?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`} style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: "4px", color: "#374151", textDecoration: "none", fontSize: "0.875rem" }}>
                Siguiente
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

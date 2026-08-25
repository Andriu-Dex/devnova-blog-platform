import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/authorization";
import { listAuditEvents, AuditEventDomain } from "@/server/audit/audit-service";
import { escapeCsvCell } from "@/lib/csv";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || undefined;
  const domain = (searchParams.get("domain") as AuditEventDomain) || undefined;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  const { data } = await listAuditEvents({
    page: 1,
    pageSize: 5000,
    action,
    domain,
    from,
    to,
  });

  // Headers
  let csvContent = "\uFEFF"; // UTF-8 BOM
  csvContent += ["Fecha", "Acción", "Dominio", "Actor", "Descripción"].join(",") + "\n";

  // Rows
  for (const item of data) {
    const row = [
      escapeCsvCell(item.occurredAt.toISOString()),
      escapeCsvCell(item.actionName),
      escapeCsvCell(item.domainLabel),
      escapeCsvCell(item.actorName),
      escapeCsvCell(item.description),
    ];
    csvContent += row.join(",") + "\n";
  }

  const dateStr = new Date().toISOString().split("T")[0];
  
  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="devnova-auditoria-${dateStr}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

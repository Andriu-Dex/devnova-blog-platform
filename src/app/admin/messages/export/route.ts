import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/authorization";
import { exportMessagesForCsv } from "@/server/contact/contact-service";
import { escapeCsvCell } from "@/lib/csv";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (error) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") || undefined;

  const messages = await exportMessagesForCsv(statusFilter);

  // Headers
  let csvContent = "\uFEFF"; // UTF-8 BOM
  csvContent += ["Fecha", "Nombre", "Email", "Asunto", "Estado"].join(",") + "\n";

  // Rows
  for (const msg of messages) {
    const row = [
      escapeCsvCell(msg.receivedAt.toISOString()),
      escapeCsvCell(msg.senderName),
      escapeCsvCell(msg.senderEmail),
      escapeCsvCell(msg.subject),
      escapeCsvCell(msg.currentStatusCode),
    ];
    csvContent += row.join(",") + "\n";
  }

  const dateStr = new Date().toISOString().split("T")[0];
  
  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="devnova-mensajes-${dateStr}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

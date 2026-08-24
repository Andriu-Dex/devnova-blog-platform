import { requireAdmin } from "@/server/auth/authorization";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f7f3e8", padding: "32px" }}>
      {children}
    </div>
  );
}

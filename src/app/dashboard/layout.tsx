import { requireAuthorOrAdmin } from "@/server/auth/authorization";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuthorOrAdmin();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f7f3e8", padding: "32px" }}>
      {children}
    </div>
  );
}

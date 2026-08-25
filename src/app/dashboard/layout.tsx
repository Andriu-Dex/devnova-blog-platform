import { requireAuthorOrAdmin } from "@/server/auth/authorization";
import { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuthorOrAdmin();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-canvas)", padding: "var(--space-6) var(--space-4)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {children}
      </div>
    </div>
  );
}

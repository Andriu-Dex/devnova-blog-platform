import { requireAuthenticatedUser } from "@/server/auth/authorization";
import { PrivateHeader } from "@/components/layout/private-header";
import { ChangePasswordForm } from "./change-password-form";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Cambio de contraseña | DevNova",
  description: "Actualiza tu contraseña para continuar",
};

export default async function ChangePasswordPage() {
  const user = await requireAuthenticatedUser();

  if (!user.mustChangePassword) {
    if (user.role === "ADMIN") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f7f3e8", padding: "32px" }}>
      <PrivateHeader displayName={user.displayName} role={user.role} />
      
      <ChangePasswordForm />
    </main>
  );
}

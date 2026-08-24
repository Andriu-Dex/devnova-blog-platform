import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevNova Blog Platform",
  description: "Plataforma de blog en construcción."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

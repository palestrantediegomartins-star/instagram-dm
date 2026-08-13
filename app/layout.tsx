import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Automação de DM — Instagram",
  description: "Comentou a palavra-chave, recebe o link na DM. Automático.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

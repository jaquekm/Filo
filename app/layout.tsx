import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Filo — Plataforma de Pesquisas",
  description: "Sistema de criação e coleta de pesquisas por cidades",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

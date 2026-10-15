import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "entre — suas finanças, no seu ritmo",
  description: "Controle pessoal de entradas, despesas e recorrências.",
  applicationName: "entre",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "entre" },
};

export const viewport: Viewport = {
  themeColor: "#201f1d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}

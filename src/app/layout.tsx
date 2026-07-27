import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { LocalBusinessSchema } from "@/components/schema";
import { site } from "@/data/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const TITULO = "Guaru Ar LC | Ar-condicionado, aquecedores e piscinas no Guarujá";
const DESCRICAO =
  "Instalação, manutenção, limpeza e reparos em ar-condicionado, aquecedores e piscinas no Guarujá. Peça seu orçamento.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: TITULO, template: `%s | ${site.name}` },
  description: DESCRICAO,
  // "./" resolve para a própria rota: cada página exporta o canonical dela.
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: site.name,
    title: TITULO,
    description: DESCRICAO,
    url: "./",
    images: [{ url: "/og-guaruar.jpg", width: 1200, height: 630, alt: site.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRICAO,
    images: ["/og-guaruar.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable}`}
    >
      <body><LocalBusinessSchema/><Header/><main>{children}</main><Footer/><WhatsAppFloat/></body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { LocalBusinessSchema } from "@/components/schema";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://guaruarguaruja.com.br"),
  title: {default:"Guaru Ar LC | Ar-condicionado, aquecedores e piscinas no Guarujá",template:"%s | Guaru Ar LC"},
  description: "Instalação, manutenção, limpeza e reparos em ar-condicionado, aquecedores e piscinas no Guarujá. Peça seu orçamento.",
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

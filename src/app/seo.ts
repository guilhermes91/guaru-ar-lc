import type { Metadata } from "next";
import { site } from "@/data/site";

// O Next mescla metadados de forma rasa: quando uma página declara `openGraph`,
// o bloco do layout é substituído inteiro — e quando não declara, herda o do
// layout SEM o título dela. Nos dois casos o resultado é o mesmo card em todas
// as páginas. Por isso cada rota monta o seu por aqui.
const IMAGEM = { url: "/og-guaruar.jpg", width: 1200, height: 630, alt: site.name };

export function metaDaPagina({
  title,
  description,
}: {
  title: string;
  description: string;
}): Metadata {
  const compartilhado = `${title} | ${site.name}`;
  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: site.name,
      title: compartilhado,
      description,
      url: "./",
      images: [IMAGEM],
    },
    twitter: {
      card: "summary_large_image",
      title: compartilhado,
      description,
      images: [IMAGEM.url],
    },
  };
}

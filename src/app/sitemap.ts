import type { MetadataRoute } from "next";
import { contentUpdatedAt, neighborhoods, services, site, slugBairro as slug } from "@/data/site";

export const dynamic = "force-static";

const base = site.url.replace(/\/$/, "");
// O site é exportado com trailingSlash: /servicos responde 308 para /servicos/.
// Declarar a URL sem a barra faria o Google seguir um redirect em cada uma das rotas.
const url = (caminho: string) => `${base}${caminho}/`.replace(/\/{2,}$/, "/");

// Data da última edição de conteúdo, não do build: o painel carimba updatedAt ao
// publicar, então republicar o site sem mudar nada não finge frescor para o Google.
const lastModified = new Date(contentUpdatedAt);

const fixas = ["", "/servicos", "/produtos", "/assistencia-autorizada", "/sobre", "/contato"];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...fixas.map((caminho) => ({
      url: url(caminho),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: caminho === "" ? 1 : 0.8,
    })),
    ...services.map((s) => ({
      url: url(`/servicos/${s.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...neighborhoods.map((n) => ({
      url: url(`/guaruja/${slug(n)}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

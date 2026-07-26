import content from "./content.json";
import { guarujaNeighborhoods } from "./brands";

// Todo o conteúdo editável vive em content.json — o painel /admin altera esse
// arquivo via commit no GitHub, e o deploy automático republica o site.
export const site = {
  ...content.site,
  whatsapp(message = content.site.whatsappMessage) {
    return `https://wa.me/${this.phone}?text=${encodeURIComponent(message)}`;
  },
};

// Carimbado pelo painel a cada publicação. A base de fábrica não tem o campo,
// então o fallback é a data de entrega do site.
export const contentUpdatedAt: string =
  (content as { updatedAt?: string }).updatedAt || "2026-07-26T00:00:00.000Z";

/**
 * Nome de bairro → segmento de URL. Precisa ser idêntico ao `slugify` de
 * lib/validate.js: é ele que valida o nome no painel, e é este que gera a rota,
 * o link do card e a entrada do sitemap. Duas cópias divergentes = link 404.
 */
export function slugBairro(nome: string): string {
  return String(nome)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const texts = content.texts;

export const services = content.services;

export const stats = content.stats;

export const reviews = content.reviews;

export const areaPhotos = content.areaPhotos;

export const faqs = content.faqs;

export type Product = { id: string; name: string; price: number; image: string; imageEmUso?: string };

// Vitrine demonstrativa: uma amostra por categoria, com preço "a partir de"
// em faixa realista para triagem inicial. O valor final depende de modelo, estoque e instalação.
// image = foto de estúdio; imageEmUso = foto do produto instalado/em uso.
// Quando as duas existem, o card alterna entre elas a cada 5s (ver ProductImage).
export const products: Product[] = content.products;

export const neighborhoods = guarujaNeighborhoods;

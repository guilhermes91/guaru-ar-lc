import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/logo";
import { ProductsGrid } from "@/components/products-grid";
import { products, site, type Product } from "@/data/site";
import { metaDaPagina } from "@/app/seo";

export const metadata: Metadata = metaDaPagina({
  title: "Produtos — ar-condicionado, aquecedores e piscinas",
  description:
    "Vitrine Guaru Ar LC no Guarujá: ar-condicionado, condensadoras, evaporadoras, aquecedores a gás, bombas, filtros e acessórios. Consulte modelos e disponibilidade pelo WhatsApp.",
});

// No build (export estático), só inclui a foto "em uso" se o arquivo existir de fato,
// evitando frames quebrados. Ao adicionar as imagens -emuso.webp, a troca liga sozinha.
const publicDir = path.join(process.cwd(), "public");
function imagesFor(p: Product) {
  const list = [p.image];
  if (p.imageEmUso && fs.existsSync(path.join(publicDir, p.imageEmUso))) list.push(p.imageEmUso);
  return list;
}

export default function Products() {
  const items = products.map((p) => ({ id: p.id, name: p.name, price: p.price, images: imagesFor(p) }));

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs"><Link href="/">Início</Link> / Produtos</div>
          <span className="eyebrow">Vitrine Guaru Ar LC</span>
          <h1>Produtos</h1>
          <p>Trabalhamos com ar-condicionado, aquecedores a gás e equipamentos de piscina. Veja alguns exemplos e chame no WhatsApp para consultar modelos, disponibilidade e instalação.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="sr-only">Vitrine de produtos</h2>
          <ProductsGrid items={items} />
          <p className="product-note">
            Valores a partir de, sujeitos a alteração conforme modelo, disponibilidade, frete e instalação.
          </p>
          <div className="center-cta">
            <a className="btn whatsapp" target="_blank" rel="noopener" href={site.whatsapp("Olá! Gostaria de saber quais produtos a Guaru Ar LC tem disponíveis.")}>
              <WhatsAppIcon /> Consultar produtos
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { guarujaNeighborhoodGroups } from "@/data/brands";
import { neighborhoods, site, slugBairro as slug } from "@/data/site";
import { metaDaPagina } from "@/app/seo";

// Sem este hub, os bairros que não cabiam na lista de vizinhos de ninguém
// ficavam no sitemap mas sem nenhum link interno apontando para eles.
export const metadata: Metadata = metaDaPagina({
  title: "Bairros atendidos no Guarujá",
  description: `Ar-condicionado, aquecedores e piscinas em ${neighborhoods.length} bairros do Guarujá. Veja se atendemos o seu e peça orçamento pelo WhatsApp.`,
});

export default function Bairros() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs">Início / Guarujá</div>
          <h1>Bairros atendidos no Guarujá</h1>
          <p>
            Atendemos {neighborhoods.length} bairros do Guarujá com instalação, manutenção, limpeza e
            reparos em ar-condicionado, aquecedores e piscinas. Encontre o seu na lista abaixo.
          </p>
          <a
            className="btn whatsapp"
            href={site.whatsapp()}
            target="_blank"
            rel="noopener"
          >
            <MessageCircle /> Pedir orçamento
          </a>
        </div>
      </section>

      <section className="section">
        <div className="container content">
          {guarujaNeighborhoodGroups.map((grupo) => (
            <div key={grupo.region}>
              <h2>{grupo.region}</h2>
              {grupo.seoText && <p>{grupo.seoText}</p>}
              <ul className="lista-bairros">
                {grupo.neighborhoods.map((bairro) => (
                  <li key={bairro}>
                    <Link href={`/guaruja/${slug(bairro)}/`}>{bairro}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

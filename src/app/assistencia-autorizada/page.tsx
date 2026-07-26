import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { WhatsAppIcon } from "@/components/logo";
import { airConditioningBrands, guarujaNeighborhoodGroups, heatingBrands, serviceAreaGroups } from "@/data/brands";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Assistência técnica especializada multimarcas",
  description:
    "Assistência técnica especializada em ar-condicionado e aquecedores das principais marcas. Atendimento de Peruíbe a Ilhabela, SP Capital e bairros do Guarujá.",
};

const highlights = [
  {
    icon: <ShieldCheck />,
    title: "Diagnóstico claro",
    text: "Avaliação objetiva do equipamento, com orientação simples sobre o melhor caminho.",
  },
  {
    icon: <Wrench />,
    title: "Serviço multimarcas",
    text: "Manutenção, limpeza, instalação e reparo nas marcas mais presentes no mercado.",
  },
  {
    icon: <Sparkles />,
    title: "Apresentação profissional",
    text: "Atendimento organizado, fotos pelo WhatsApp e orçamento direto, sem enrolação.",
  },
];

function BrandGrid({ title, brands }: { title: string; brands: typeof heatingBrands }) {
  return (
    <div className="brand-list-card">
      <div className="brand-list-head">
        <span>Marcas atendidas</span>
        <h2>{title}</h2>
      </div>
      <div className="brand-logo-grid">
        {brands.map((brand) => (
          <div className="brand-logo-card" key={`${title}-${brand.name}`}>
            <img src={brand.image} alt={`Logo ${brand.name}`} loading="lazy" decoding="async" />
            <strong>{brand.name}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuthorizedAssistance() {
  return (
    <>
      <section className="page-hero brands-hero">
        <div className="container brands-hero-grid">
          <div>
            <p className="breadcrumbs">
              <Link href="/">Início</Link> / Assistência técnica multimarcas
            </p>
            <span className="eyebrow">Guaru Ar LC multimarcas</span>
            <h1>Especialistas nas principais marcas de ar-condicionado e aquecedores.</h1>
            <p>
              Atendimento técnico para instalação, limpeza, manutenção e reparo, com linguagem clara,
              organização e suporte pelo WhatsApp em todo litoral atendido.
            </p>
            <div className="brand-hero-actions">
              <a
                className="btn whatsapp"
                href={site.whatsapp("Olá! Vim pelo site da Guaru Ar LC e preciso de assistência técnica para um equipamento de marca específica.")}
                target="_blank"
                rel="noopener"
              >
                <WhatsAppIcon /> Solicitar orçamento
              </a>
              <a className="btn outline" href="#marcas">
                Ver marcas atendidas
              </a>
            </div>
          </div>

          <div className="brands-hero-media">
            <img
              src="/images/brands/standard/03-marcas-multimarcas.png"
              alt="Marcas atendidas pela assistência técnica multimarcas Guaru Ar LC"
            />
          </div>
        </div>
      </section>

      <section className="section brand-trust-section">
        <div className="container brand-highlight-grid">
          {highlights.map((item) => (
            <article className="brand-highlight" key={item.title}>
              <span>{item.icon}</span>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section soft" id="marcas">
        <div className="container">
          <div className="section-head">
            <h2>Marcas que a Guaru Ar LC atende</h2>
            <p>
              Logos organizadas em padrão limpo para facilitar a identificação do seu equipamento.
            </p>
          </div>

          <div className="brand-feature-grid">
            <article className="brand-feature-card heating">
              <span>Aquecedores</span>
              <h2>Assistência técnica em aquecedores</h2>
              <p>Instalação, revisão, limpeza e reparos em aquecedores a gás e sistemas de água quente.</p>
              <img
                src="/images/brands/standard/01-marcas-aquecedores.png"
                alt="Principais marcas de aquecedores atendidas pela Guaru Ar LC"
                loading="lazy"
                decoding="async"
              />
            </article>

            <article className="brand-feature-card cooling">
              <span>Ar-condicionado</span>
              <h2>Assistência técnica em climatização</h2>
              <p>Manutenção, higienização, instalação e reparo em splits residenciais e comerciais.</p>
              <img
                src="/images/brands/standard/02-marcas-ar-condicionado.png"
                alt="Principais marcas de ar-condicionado atendidas pela Guaru Ar LC"
                loading="lazy"
                decoding="async"
              />
            </article>
          </div>
        </div>
      </section>

      <section className="section brand-list-section">
        <div className="container brand-lists">
          <BrandGrid title="Aquecedores" brands={heatingBrands} />
          <BrandGrid title="Ar-condicionado" brands={airConditioningBrands} />
        </div>
      </section>

      <section className="section area-coverage-section">
        <div className="container area-coverage-grid">
          <div>
            <span className="eyebrow">Cobertura regional</span>
            <h2>Atendimento de Peruíbe a Ilhabela, SP Capital e bairros do Guarujá.</h2>
            <p>
              A Guaru Ar LC tem base no Guarujá e agenda atendimentos conforme região, urgência e tipo de serviço.
              Para agilizar, envie o bairro/cidade e fotos do equipamento pelo WhatsApp.
            </p>
            <div className="coverage-groups">
              {serviceAreaGroups.map((group) => (
                <div className="coverage-group" key={group.region}>
                  <strong>{group.region}</strong>
                  <div>
                    {group.cities.map((city) => (
                      <span key={city}>{city}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="coverage-neighborhoods">
              <strong>Bairros do Guarujá</strong>
              <div className="coverage-groups compact">
                {guarujaNeighborhoodGroups.map((group) => (
                  <div className="coverage-group" key={group.region}>
                    <strong>{group.region}</strong>
                    <div>
                      {group.neighborhoods.map((neighborhood) => (
                        <span key={neighborhood}>{neighborhood}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <img
            className="coverage-image"
            src="/images/brands/standard/04-atendimento-litoral-sp.png"
            alt="Área de atendimento da Guaru Ar LC de Peruíbe a Ilhabela e SP Capital"
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>

      <section className="section brand-disclaimer">
        <div className="container brand-disclaimer-box">
          <BadgeCheck />
          <div>
            <h2>Atendimento técnico especializado</h2>
            <p>
              A Guaru Ar LC atua com assistência técnica multimarcas. Quando houver necessidade de garantia de fábrica
              ou autorização formal de fabricante, a confirmação pode ser feita caso a caso no atendimento.
            </p>
          </div>
          <a
            className="btn whatsapp"
            href={site.whatsapp("Olá! Gostaria de confirmar atendimento técnico para uma marca específica.")}
            target="_blank"
            rel="noopener"
          >
            <WhatsAppIcon /> Falar com especialista
          </a>
        </div>
      </section>
    </>
  );
}

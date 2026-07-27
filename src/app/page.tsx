import Link from "next/link";
import { Fragment } from "react";
import {
  ArrowRight, BadgeCheck, Calculator, CheckCircle2, ClipboardCheck, Clock3,
  Heart, MapPin, ShieldCheck, ThumbsUp, Users, Wrench,
} from "lucide-react";
import { ServiceCard } from "@/components/service-card";
import { BeforeAfter } from "@/components/before-after";
import { WhatsAppIcon } from "@/components/logo";
import { guarujaNeighborhoodGroups, serviceAreaGroups } from "@/data/brands";
import { areaPhotos, faqs, neighborhoods, reviews, services, site, slugBairro as slug, stats, texts } from "@/data/site";
import { HighlightedTitle } from "@/components/highlighted-title";

const trust = [
  { Icon: ShieldCheck, t: "Profissionais", s: "especializados" },
  { Icon: Clock3, t: "Atendimento rápido", s: "no Guarujá e região" },
  { Icon: CheckCircle2, t: "Serviços com", s: "garantia" },
  { Icon: ThumbsUp, t: "Satisfação", s: "garantida" },
];

const steps = [
  { Icon: ClipboardCheck, t: "Avaliação", d: "Entendemos sua necessidade e avaliamos o melhor caminho." },
  { Icon: Calculator, t: "Orçamento", d: "Enviamos um orçamento claro, transparente e sem compromisso." },
  { Icon: Wrench, t: "Execução", d: "Realizamos o serviço com técnica, cuidado e agilidade." },
  { Icon: ShieldCheck, t: "Garantia", d: "Serviço garantido para você ficar tranquilo por muito mais tempo." },
];

const authFeats = [
  { Icon: Users, t: "Equipe qualificada" },
  { Icon: BadgeCheck, t: "Equipamentos e produtos de qualidade" },
  { Icon: ShieldCheck, t: "Normas técnicas e segurança" },
  { Icon: Heart, t: "Compromisso com o cliente" },
];

const beforeAfter = [
  { label: "Ar-condicionado", before: "/images/home-generated/antes-ac.webp", after: "/images/home-generated/depois-ac.webp" },
  { label: "Piscinas", before: "/images/home-generated/antes-piscina.webp", after: "/images/home-generated/depois-piscina.webp" },
  { label: "Aquecedores", before: "/images/home-generated/antes-aquecedor.webp", after: "/images/home-generated/depois-aquecedor.webp" },
];

export default function Home() {
  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">{site.name}</span>
            <h1><HighlightedTitle text={texts.heroTitle} highlight={texts.heroHighlight} /></h1>
            <p>{texts.heroSubtitle}</p>
            <a className="btn whatsapp" href={site.whatsapp()} target="_blank" rel="noopener">
              <WhatsAppIcon /> Solicitar orçamento
            </a>
          </div>
          <div className="hero-media" role="img" aria-label="Técnico da Guaru Ar LC instalando ar-condicionado" />
        </div>
      </section>

      {/* ---------- TRUST ---------- */}
      <div className="trust">
        <div className="container">
          <div className="trust-inner">
            {trust.map(({ Icon, t, s }) => (
              <div key={t}>
                <span className="trust-ic"><Icon /></span>
                <span><b>{t}</b><span>{s}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- SERVIÇOS ---------- */}
      <section id="servicos" className="section">
        <div className="container">
          <div className="section-head"><h2>Nossos serviços</h2></div>
          <div className="svc-grid">
            {services.map((s) => <ServiceCard key={s.slug} service={s} />)}
          </div>
          <div className="area-bar">
            <MapPin className="pin" />
            <strong>Atendimento rápido no Guarujá, litoral e SP Capital</strong>
            <span className="tags">{neighborhoods.slice(0, 8).map((n) => <span key={n}>{n}</span>)}</span>
          </div>
        </div>
      </section>

      {/* ---------- COMO FUNCIONA ---------- */}
      <section id="como-funciona" className="section soft">
        <div className="container">
          <div className="section-head"><h2>Como funciona</h2></div>
          <div className="steps">
            {steps.map(({ Icon, t, d }, i) => (
              <Fragment key={t}>
                <div className="step">
                  <div className="step-ic">
                    <span className="step-num">{i + 1}</span>
                    <Icon />
                  </div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
                {i < steps.length - 1 && <div className="step-arrow"><ArrowRight /></div>}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- ANTES E DEPOIS ---------- */}
      <section className="section">
        <div className="container">
          <div className="section-head"><h2>Antes e depois</h2></div>
          <div className="ba-grid">
            {beforeAfter.map((b) => <BeforeAfter key={b.label} before={b.before} after={b.after} label={b.label} />)}
          </div>
          <div className="center-cta">
            <a className="btn ghost" href={site.whatsapp("Olá! Gostaria de ver mais serviços realizados pela Guaru Ar LC.")} target="_blank" rel="noopener">
              Ver mais serviços realizados
            </a>
          </div>
        </div>
      </section>

      {/* ---------- SOBRE / AUTORIDADE ---------- */}
      <section id="sobre" className="authority">
        <div className="container">
          <div className="authority-grid">
            <div>
              <span className="eyebrow">Sobre a {site.name}</span>
              <h2>{texts.aboutTitle}</h2>
              <p>{texts.aboutText}</p>
              <div className="auth-feats">
                {authFeats.map(({ Icon, t }) => (
                  <div key={t}><Icon /><span>{t}</span></div>
                ))}
              </div>
            </div>
            <div className="team-photo" role="img" aria-label="Equipe técnica da Guaru Ar LC" />
            <div className="numbers">
              {stats.map((n) => (
                <div key={n.label}><b>{n.value}</b><span>{n.label}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- AVALIAÇÕES ---------- */}
      <section className="section soft">
        <div className="container">
          <div className="section-head"><h2>Clientes satisfeitos</h2></div>
          <div className="reviews">
            {reviews.map((r) => (
              <div className="review" key={r.name}>
                <span className="quote">&ldquo;</span>
                <div className="stars">★★★★★</div>
                <blockquote>{r.text}</blockquote>
                <div className="who">
                  {/* 44x44 no CSS: as medidas evitam o pulo de layout enquanto carrega. */}
                  <img src={r.avatar} alt={r.name} width="44" height="44" loading="lazy" decoding="async" />
                  <span><b>{r.name}</b><span>{r.area}</span></span>
                </div>
              </div>
            ))}
          </div>
          <div className="center-cta">
            <a className="btn whatsapp" href={site.whatsapp("Olá! Gostaria de ver mais avaliações da Guaru Ar LC.")} target="_blank" rel="noopener">
              <WhatsAppIcon /> Ver avaliações
            </a>
          </div>
        </div>
      </section>

      {/* ---------- ÁREAS DE ATENDIMENTO ---------- */}
      <section id="areas" className="section">
        <div className="container">
          <div className="section-head">
            <h2>Áreas de atendimento</h2>
            <p>Atendimento de Peruíbe a Ilhabela, SP Capital e cobertura detalhada nos bairros do Guarujá.</p>
          </div>
          <div className="areas-grid">
            {areaPhotos.map((a) => (
              <Link key={a.name} href={`/guaruja/${slug(a.name)}`} className="area-card" style={{ backgroundImage: `url(${a.image})` }}>
                <span>{a.name}</span>
              </Link>
            ))}
            <Link href="/guaruja/" className="area-card more"><span>e mais<br />regiões</span></Link>
          </div>

          <div className="service-area-detail">
            <div className="service-area-panel">
              <span className="eyebrow">Cidades atendidas</span>
              <h3>De Peruíbe a Ilhabela + SP Capital</h3>
              <div className="coverage-groups compact">
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
            </div>

            <div className="service-area-panel">
              <span className="eyebrow">Bairros do Guarujá</span>
              <h3>Cobertura bairro a bairro</h3>
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
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="section soft">
        <div className="container">
          <div className="section-head"><h2>Perguntas frequentes</h2></div>
          <div className="faq">
            {faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}


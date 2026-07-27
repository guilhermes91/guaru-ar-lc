import Link from "next/link";
import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import { FacebookIcon, InstagramIcon, Logo, WhatsAppIcon } from "./logo";
import { services, site, texts } from "@/data/site";

export function Footer() {
  return (
    <>
      <section className="final-cta">
        <div className="container">
          <h2>{texts.ctaTitle}</h2>
          <p>{texts.ctaText}</p>
          <a className="btn whatsapp" href={site.whatsapp()} target="_blank" rel="noopener">
            <WhatsAppIcon /> Fale com a {site.name}
          </a>
        </div>
      </section>

      <footer>
        <div className="container footer-grid">
          <div className="footer-col">
            <Logo />
            <p className="desc">{texts.footerDescription}</p>
            <div className="socials">
              {site.social.instagram && (
                <a href={site.social.instagram} target="_blank" rel="noopener" aria-label="Instagram da Guaru Ar LC"><InstagramIcon /></a>
              )}
              {site.social.facebook && (
                <a href={site.social.facebook} target="_blank" rel="noopener" aria-label="Facebook da Guaru Ar LC"><FacebookIcon /></a>
              )}
              <a href={site.whatsapp()} target="_blank" rel="noopener" aria-label="WhatsApp"><WhatsAppIcon /></a>
            </div>
          </div>

          <div className="footer-col">
            <h3>Navegação</h3>
            <Link href="/">Início</Link>
            <Link href="/produtos">Produtos</Link>
            <Link href="/assistencia-especializada">Marcas atendidas</Link>
            <Link href="/#como-funciona">Como funciona</Link>
            <Link href="/#sobre">Sobre nós</Link>
            <Link href="/#areas">Áreas de atendimento</Link>
            <Link href="/contato">Contato</Link>
          </div>

          <div className="footer-col">
            <h3>Serviços</h3>
            {services.map((s) => <Link key={s.slug} href={`/servicos/${s.slug}`}>{s.title}</Link>)}
            <Link href="/servicos">Manutenção e limpeza</Link>
            <Link href="/servicos">Instalação</Link>
            <Link href="/servicos">Reparos</Link>
          </div>

          <div className="footer-col">
            <h3>Contato</h3>
            <a href={`tel:+${site.phone}`}><Phone />{site.phoneDisplay}</a>
            <a href={`mailto:${site.email}`}><Mail />{site.email}</a>
            <p className="line"><MapPin />{site.address}</p>
            <p className="line"><Clock3 />Atendimento: {site.hours}</p>
          </div>

          <div className="footer-col">
            <h3>Fale com a Guaru Ar LC</h3>
            <p className="desc">Solicite seu orçamento pelo WhatsApp.</p>
            <a className="btn whatsapp" href={site.whatsapp()} target="_blank" rel="noopener">
              <WhatsAppIcon /> Solicitar orçamento
            </a>
          </div>
        </div>
        <div className="container copyright">
          <span>© {new Date().getFullYear()} {site.name}. Todos os direitos reservados.</span>
          <span className="developer-credit">
            Site desenvolvido por{" "}
            <a href="https://softuria.com" target="_blank" rel="noopener">
              <strong>softuria.com</strong>
            </a>
          </span>
        </div>
      </footer>
    </>
  );
}

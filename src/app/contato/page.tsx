import type { Metadata } from "next";
import { Clock3, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/logo";
import { guarujaNeighborhoodGroups, serviceAreaGroups } from "@/data/brands";
import { site } from "@/data/site";
import { metaDaPagina } from "@/app/seo";

export const metadata: Metadata = metaDaPagina({
  title: "Contato",
  description:
    "Fale com a Guaru Ar LC pelo WhatsApp, telefone ou redes sociais. Atendimento técnico no Guarujá para ar-condicionado, aquecedores e piscinas.",
});

const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`;

export default function Contact() {
  return (
    <>
      <section className="page-hero contact-hero">
        <div className="container contact-hero-grid">
          <div>
            <span className="eyebrow">Fale com a Guaru Ar LC</span>
            <h1>Atendimento rápido, claro e sem enrolação.</h1>
            <p>
              Chame no WhatsApp, conte o que precisa e envie fotos do equipamento ou do ambiente.
              Assim a equipe entende melhor o serviço e orienta o próximo passo.
            </p>
            <div className="contact-actions">
              <a className="btn whatsapp" href={site.whatsapp()} target="_blank" rel="noopener">
                <WhatsAppIcon /> Chamar no WhatsApp
              </a>
              <a className="btn outline" href={`tel:+${site.phone}`}>
                <Phone /> Ligar agora
              </a>
            </div>
          </div>

          <aside className="contact-summary" aria-label="Resumo de atendimento">
            <span className="contact-badge"><ShieldCheck /> Atendimento local</span>
            <h2>Guarujá e região</h2>
            <p>Ar-condicionado, aquecedores e piscinas com avaliação objetiva e orçamento transparente.</p>
            <div className="contact-summary-line">
              <Clock3 />
              <span>Segunda a sábado, das 8h às 18h</span>
            </div>
          </aside>
        </div>
      </section>

      <section className="section contact-section">
        <div className="container">
          <div className="contact-grid">
            <a className="contact-card primary" href={site.whatsapp()} target="_blank" rel="noopener">
              <span className="contact-icon"><MessageCircle /></span>
              <small>Mais rápido</small>
              <h2>WhatsApp</h2>
              <p>Envie fotos, vídeos e detalhes do serviço. A resposta fica mais prática e certeira.</p>
              <strong>Chamar agora</strong>
            </a>

            <a className="contact-card" href={`tel:+${site.phone}`}>
              <span className="contact-icon"><Phone /></span>
              <small>Telefone</small>
              <h2>{site.phoneDisplay}</h2>
              <p>Prefere falar direto? Ligue e combine o melhor horário para atendimento.</p>
              <strong>Ligar agora</strong>
            </a>

            <a className="contact-card" href={mapUrl} target="_blank" rel="noopener">
              <span className="contact-icon"><MapPin /></span>
              <small>Base local</small>
              <h2>Perequê, Guarujá</h2>
              <p>{site.address}</p>
              <strong>Ver no mapa</strong>
            </a>
          </div>

          <div className="contact-bottom">
            <div className="contact-note">
              <h2>Para agilizar seu orçamento</h2>
              <ul>
                <li><ShieldCheck /> Informe o bairro e o tipo de serviço.</li>
                <li><ShieldCheck /> Envie fotos do equipamento, etiqueta ou instalação.</li>
                <li><ShieldCheck /> Conte se é manutenção, limpeza, reparo ou instalação.</li>
              </ul>
            </div>

            <div className="contact-social-box">
              <h2>Redes sociais</h2>
              <p>Acompanhe a Guaru Ar LC e fale por onde for mais fácil.</p>
              <div className="socials contact-socials" aria-label="Redes sociais da Guaru Ar LC">
                {site.social.instagram && (

                  <a href={site.social.instagram} target="_blank" rel="noopener" aria-label="Instagram da Guaru Ar LC">
                  <InstagramIcon /> Instagram
                  </a>

                )}
                {site.social.facebook && (

                  <a href={site.social.facebook} target="_blank" rel="noopener" aria-label="Facebook da Guaru Ar LC">
                  <FacebookIcon /> Facebook
                  </a>

                )}
              </div>
              <a className="contact-mail" href={`mailto:${site.email}`}>
                <Mail /> {site.email}
              </a>
            </div>
          </div>

          <div className="contact-areas-box">
            <div className="contact-areas-copy">
              <span className="eyebrow">Área de atendimento</span>
              <h2>De Peruíbe a Ilhabela, SP Capital e cobertura completa nos bairros do Guarujá.</h2>
              <p>
                Atendimento agendado para residências, condomínios e empresas. Envie sua cidade,
                bairro e fotos do equipamento para confirmar disponibilidade.
              </p>
            </div>

            <div className="contact-city-groups">
              {serviceAreaGroups.map((group) => (
                <div className="contact-city-group" key={group.region}>
                  <strong>{group.region}</strong>
                  <div>
                    {group.cities.map((city) => (
                      <span key={city}>{city}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="contact-neighborhoods">
              <strong>Bairros do Guarujá</strong>
              <div className="contact-neighborhood-groups">
                {guarujaNeighborhoodGroups.map((group) => (
                  <div className="contact-city-group" key={group.region}>
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
    </>
  );
}

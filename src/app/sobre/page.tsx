import type { Metadata } from "next";
import { site, texts } from "@/data/site";

export const metadata: Metadata = {
  title: "Sobre nós",
  description: `Quem é a ${site.name}: atendimento local em ar-condicionado, aquecedores e piscinas no Guarujá, com orçamento antes da execução.`,
};

export default function About() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Quem somos</span>
          <h1>{site.name}</h1>
          <p>Atendimento local para climatização, aquecimento e piscinas no Guarujá.</p>
        </div>
      </section>
      <section className="section">
        <article className="container content">
          <h2>{texts.aboutTitle}</h2>
          <p>{texts.aboutText}</p>
          <h2>Nossa forma de trabalhar</h2>
          <p>
            Primeiro entendemos a necessidade. Depois avaliamos o equipamento ou ambiente, apresentamos
            um orçamento e, após a aprovação, realizamos o serviço com organização e atenção aos detalhes.
          </p>
          <h2>Presença local</h2>
          <p>
            Estamos em {site.address} e atendemos diferentes bairros do Guarujá. Essa proximidade ajuda a
            oferecer suporte ágil e conhecimento das condições específicas do litoral, incluindo os
            cuidados extras causados pela maresia.
          </p>
          <h2>Como falar com a gente</h2>
          <p>
            WhatsApp e telefone: {site.phoneDisplay}. E-mail: {site.email}. Horário de atendimento:{" "}
            {site.hours}.
          </p>
        </article>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { guarujaNeighborhoodGroups } from "@/data/brands";
import { neighborhoods, services, site, slugBairro as slug } from "@/data/site";
import { metaDaPagina } from "@/app/seo";

export function generateStaticParams() {
  return neighborhoods.map((bairro) => ({ bairro: slug(bairro) }));
}

// Sem isto, as 41 páginas de bairro seriam o mesmo texto com o nome trocado —
// exatamente o padrão de "doorway page" que o Google despriorizou. O texto varia
// pela região a que o bairro pertence, que é dado que já existe no painel.
// Indexado pela POSIÇÃO do grupo, não pelo nome: o nome da região é texto livre
// no painel, e renomear "Região I" derrubaria as 41 páginas para o texto padrão
// sem erro nenhum — de volta ao problema de páginas idênticas.
const PORREGIAO = [
  "Na faixa das praias urbanizadas, os equipamentos convivem com maresia constante e uso intenso na temporada. Limpeza periódica e checagem de vedação evitam a corrosão que aparece primeiro nas serpentinas.",
  "Na parte continental do Guarujá, o atendimento costuma envolver casas e comércios de uso o ano inteiro, com prioridade para manutenção preventiva e reparo rápido, sem depender da temporada.",
  "Região de casas de veraneio e condomínios: boa parte dos chamados é de reativação de equipamento que ficou meses parado — aquecedor, bomba de piscina e ar-condicionado pedem revisão antes do primeiro uso.",
  "Área mais afastada da orla, com imóveis maiores e acesso por estrada. A visita é agendada com antecedência para levar peças e ferramentas na primeira ida, evitando um segundo deslocamento.",
];

const PADRAO =
  "O atendimento começa por uma avaliação no local, com orçamento antes de qualquer execução e orientação de conservação para o ambiente litorâneo.";

/** Bairro + região dele + vizinhos da mesma região. */
function contexto(nome: string) {
  const indice = guarujaNeighborhoodGroups.findIndex((g) => g.neighborhoods.includes(nome));
  const grupo = guarujaNeighborhoodGroups[indice];
  return {
    regiao: grupo?.region,
    // Grupo além do quarto (o cliente pode criar mais) cai no texto padrão.
    texto: PORREGIAO[indice] || PADRAO,
    vizinhos: (grupo?.neighborhoods || []).filter((n) => n !== nome),
  };
}

export async function generateMetadata({ params }: { params: Promise<{ bairro: string }> }): Promise<Metadata> {
  const { bairro } = await params;
  const nome = neighborhoods.find((n) => slug(n) === bairro);
  if (!nome) return {};
  const { regiao } = contexto(nome);
  return metaDaPagina({
    title: `Ar-condicionado, aquecedores e piscinas em ${nome}`,
    description: `Manutenção, limpeza, instalação e reparos em ${nome}${
      regiao ? ` (${regiao})` : ""
    }, Guarujá. Atendimento local Guaru Ar LC, com orçamento antes da execução.`,
  });
}

export default async function Neighborhood({ params }: { params: Promise<{ bairro: string }> }) {
  const { bairro } = await params;
  const nome = neighborhoods.find((n) => slug(n) === bairro);
  if (!nome) notFound();

  const { regiao, texto, vizinhos } = contexto(nome);
  const proximos = vizinhos.slice(0, 6);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumbs">Início / Guarujá / {nome}</div>
          <h1>Serviços Guaru Ar LC em {nome}</h1>
          <p>
            Manutenção, limpeza, instalação e reparos em ar-condicionado, aquecedores e piscinas com
            atendimento em {nome}
            {regiao ? `, na ${regiao} da nossa cobertura no Guarujá` : ", Guarujá"}.
          </p>
          <a
            className="btn whatsapp"
            href={site.whatsapp(`Olá! Estou em ${nome}, Guarujá, e gostaria de um orçamento.`)}
            target="_blank"
            rel="noopener"
          >
            <MessageCircle /> Pedir orçamento em {nome}
          </a>
        </div>
      </section>

      <section className="section">
        <article className="container content">
          <h2>Atendimento técnico em {nome}</h2>
          <p>
            A Guaru Ar LC atende residências, condomínios e empresas em {nome}. {texto}
          </p>

          <h2>Serviços disponíveis em {nome}</h2>
          <ul>
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/servicos/${s.slug}/`}>
                  <strong>{s.title}:</strong> {s.description}
                </Link>
              </li>
            ))}
          </ul>

          {proximos.length > 0 && (
            <>
              <h2>Bairros vizinhos que também atendemos</h2>
              <p>
                {proximos.map((vizinho, i) => (
                  <span key={vizinho}>
                    {i > 0 && " · "}
                    <Link href={`/guaruja/${slug(vizinho)}/`}>{vizinho}</Link>
                  </span>
                ))}
              </p>
            </>
          )}

          <h2>Solicite uma avaliação</h2>
          <p>
            Informe seu endereço em {nome}, o tipo de equipamento e o problema encontrado. Fotos e
            vídeos pelo WhatsApp ajudam nossa equipe a entender melhor a necessidade antes da visita.
          </p>
        </article>
      </section>
    </>
  );
}

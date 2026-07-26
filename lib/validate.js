// Validação do content.json antes de commitar.
// Objetivo: impedir que uma edição no painel quebre o build do site.
// Não é um schema exaustivo — é a rede de segurança do que o site realmente lê.

const str = (v) => typeof v === "string";
const num = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const list = (v) => Array.isArray(v);

/** Teto para qualquer texto livre: evita que um paste gigante vá parar no commit. */
const MAX_TEXTO = 2000;

/**
 * Por que "<" e ">" são barrados: o conteúdo é injetado em JSON-LD e em
 * atributos de estilo. Sinal de tag nunca é conteúdo legítimo aqui, e barrar na
 * entrada é mais seguro do que depender só do escape na saída.
 *
 * Devolve a mensagem do problema, ou null se o texto está bom.
 */
function problemaDeTexto(valor, max = MAX_TEXTO) {
  if (!str(valor) || valor.trim().length === 0) return "não pode ficar vazio";
  if (valor.length > max) return `passou do limite de ${max} caracteres`;
  if (/[<>]/.test(valor)) return "não pode conter os sinais < ou >";
  return null;
}

/** Slug seguro para virar rota estática (/servicos/<slug>). */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Caminho de imagem: só relativo dentro do site, ou http(s). */
// Só caminho dentro do site: é o único formato que o upload do painel produz,
// e a CSP bloquearia http:// de terceiro de qualquer jeito.
const IMAGE = /^\/[\w\-]+(\/[\w\-]+)*\.[a-z]{3,4}$/;
/** Nome que vira segmento de URL (/guaruja/<bairro>) ou entra no JSON-LD. */
const NOME_LUGAR = /^[\p{L}\p{N}][\p{L}\p{N} .'’-]{1,59}$/u;
/** Só string passa: `String(123)` casaria no regex e depois quebraria o slugify. */
const nomeDeLugar = (v) => str(v) && NOME_LUGAR.test(v);
/** Ícones que o site sabe desenhar (ver src/components/service-card.tsx). */
const ICONES = ["Snowflake", "Flame", "Waves", "Wrench"];

export function validateContent(data) {
  const errors = [];
  const check = (condition, message) => {
    if (!condition) errors.push(message);
  };
  /** Reporta o motivo real: vazio, longo demais ou com sinal de tag. */
  const checaTexto = (valor, rotulo, max = MAX_TEXTO) => {
    const problema = problemaDeTexto(valor, max);
    if (problema) errors.push(`${rotulo} ${problema}.`);
  };

  check(data && typeof data === "object" && !Array.isArray(data), "Conteúdo inválido.");
  if (errors.length) return errors;

  // --- Configurações gerais
  const s = data.site;
  check(s && typeof s === "object", "Não encontrei os dados de Configurações. Recarregue o painel e tente de novo.");
  if (s && typeof s === "object") {
    checaTexto(s.name, "O nome da empresa", 40);
    checaTexto(s.legalName, "A razão social", 60);
    check(/^https:\/\/[\w.-]+(\/[\w\-./]*)?$/.test(String(s.url || "")), "O endereço do site deve começar com https:// (ex.: https://guaruarguaruja.com.br).");
    checaTexto(s.phoneDisplay, "O telefone exibido", 20);
    check(/^\d{12,13}$/.test(String(s.phone || "")), "O WhatsApp deve ter só números, com DDI e DDD (ex.: 5513974104466).");
    check(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s.email || "")), "E-mail de contato inválido (ex.: contato@guaruarguaruja.com.br).");
    checaTexto(s.address, "O endereço", 120);
    checaTexto(s.hours, "O horário de atendimento", 60);
    checaTexto(s.whatsappMessage, "A mensagem padrão do WhatsApp", 160);
    // Vão para o sameAs do JSON-LD: só aceita endereço https completo.
    const rede = (v) => str(v) && (v === "" || /^https:\/\/[\w.-]+\/[\w\-./?=&%]*$/.test(v));
    check(s.social && rede(s.social.facebook) && rede(s.social.instagram), "Links de redes sociais inválidos: use o endereço completo, começando com https://.");
  }

  // --- Textos
  const t = data.texts;
  check(t && typeof t === "object", "Não encontrei os Textos do site. Recarregue o painel e tente de novo.");
  if (t && typeof t === "object") {
    // Rótulo igual ao que o cliente lê no painel, e limite igual ao do campo:
    // "heroTitle" é nome de programador, não ajuda quem está editando o site.
    const campos = [
      ["heroTitle", "O título principal da página inicial", 80],
      ["heroSubtitle", "A frase de apoio da página inicial", 120],
      ["aboutTitle", "O título do bloco sobre a empresa", 90],
      ["aboutText", "O texto do bloco sobre a empresa", 500],
      ["footerDescription", "A descrição do rodapé", 200],
      ["ctaTitle", "O título da chamada final", 80],
      ["ctaText", "O texto da chamada final", 140],
    ];
    for (const [key, rotulo, max] of campos) {
      checaTexto(t[key], rotulo, max);
    }
    // Único texto que pode ficar vazio, então não passa pelo checaTexto.
    if (t.heroHighlight) checaTexto(t.heroHighlight, "O destaque do título", 30);
    else check(t.heroHighlight === undefined || t.heroHighlight === "", "Destaque do título inválido.");
  }

  // --- Serviços (cada um vira uma página /servicos/<slug>)
  check(list(data.services), "A lista de serviços está corrompida. Recarregue o painel e tente de novo.");
  check(!list(data.services) || data.services.length > 0, "É preciso ter ao menos um serviço.");
  if (list(data.services)) {
    const seen = new Set();
    data.services.forEach((item, i) => {
      const at = `Serviço ${i + 1}`;
      check(SLUG.test(String(item?.slug || "")), `${at}: identificador inválido (use letras minúsculas e hífens).`);
      check(!seen.has(item?.slug), `${at}: identificador duplicado.`);
      seen.add(item?.slug);
      checaTexto(item?.title, `${at}: o título`, 40);
      checaTexto(item?.short, `${at}: o resumo`, 60);
      checaTexto(item?.description, `${at}: a descrição`, 300);
      check(IMAGE.test(String(item?.image || "")), `${at}: a imagem precisa ser enviada pelo próprio painel.`);
      check(num(item?.price), `${at}: o preço precisa ser um número igual ou maior que zero (escreva 1899, sem "R$" nem pontuação).`);
      check(ICONES.includes(item?.icon), `${at}: ícone inválido (use ${ICONES.join(", ")}).`);
    });
  }

  // --- Produtos
  check(list(data.products), "A lista de produtos está corrompida. Recarregue o painel e tente de novo.");
  check(!list(data.products) || data.products.length > 0, "É preciso ter ao menos um produto.");
  if (list(data.products)) {
    const seen = new Set();
    data.products.forEach((item, i) => {
      const at = `Produto ${i + 1}`;
      check(SLUG.test(String(item?.id || "")), `${at}: identificador inválido (use letras minúsculas e hífens).`);
      check(!seen.has(item?.id), `${at}: identificador duplicado.`);
      seen.add(item?.id);
      checaTexto(item?.name, `${at}: o nome`, 60);
      check(num(item?.price), `${at}: o preço precisa ser um número igual ou maior que zero (escreva 1899, sem "R$" nem pontuação).`);
      check(IMAGE.test(String(item?.image || "")), `${at}: a imagem precisa ser enviada pelo próprio painel.`);
      check(item?.imageEmUso === undefined || item?.imageEmUso === "" || IMAGE.test(String(item.imageEmUso)), `${at}: a segunda imagem precisa ser enviada pelo próprio painel.`);
    });
  }

  // --- Números, avaliações e FAQ
  check(list(data.stats), "A lista de números de destaque está corrompida. Recarregue o painel e tente de novo.");
  if (list(data.stats)) {
    data.stats.forEach((item, i) => {
      checaTexto(item?.value, `Número ${i + 1}: o valor`, 10);
      checaTexto(item?.label, `Número ${i + 1}: a descrição`, 40);
    });
  }

  check(list(data.reviews), "A lista de avaliações está corrompida. Recarregue o painel e tente de novo.");
  if (list(data.reviews)) {
    data.reviews.forEach((item, i) => {
      checaTexto(item?.text, `Avaliação ${i + 1}: o texto`, 260);
      checaTexto(item?.name, `Avaliação ${i + 1}: o nome`, 30);
      check(str(item?.area) && item.area.length <= 30 && !/[<>]/.test(item.area), `Avaliação ${i + 1}: o bairro do cliente é inválido (até 30 caracteres, sem < ou >).`);
      check(IMAGE.test(String(item?.avatar || "")), `Avaliação ${i + 1}: a foto precisa ser enviada pelo próprio painel.`);
    });
  }

  check(list(data.faqs), "A lista de perguntas frequentes está corrompida. Recarregue o painel e tente de novo.");
  if (list(data.faqs)) {
    data.faqs.forEach((item, i) => {
      checaTexto(item?.q, `Pergunta ${i + 1}: a pergunta`, 120);
      checaTexto(item?.a, `Pergunta ${i + 1}: a resposta`, 400);
    });
  }

  // --- Cobertura: cada bairro daqui vira uma página /guaruja/<slug>
  const paginasDeBairro = new Set();
  check(list(data.neighborhoodGroups) && data.neighborhoodGroups.length > 0, "É preciso ter ao menos uma região de bairros.");
  if (list(data.neighborhoodGroups)) {
    data.neighborhoodGroups.forEach((group, i) => {
      checaTexto(group?.region, `Região ${i + 1}: o nome`, 40);
      check(list(group?.neighborhoods) && group.neighborhoods.length > 0, `Região ${i + 1}: adicione ao menos um bairro.`);
      (group?.neighborhoods || []).forEach((n) => {
        // O nome vira segmento de URL: barra, "#" e "?" quebrariam a rota exportada.
        if (!nomeDeLugar(n)) {
          check(false, `Região ${i + 1}: "${n}" não serve como bairro (use letras, números, espaço, ponto, apóstrofo ou hífen).`);
          return;
        }
        const key = slugify(String(n));
        check(!paginasDeBairro.has(key), `Bairro repetido: "${n}". Cada bairro gera uma página própria e não pode se repetir.`);
        paginasDeBairro.add(key);
      });
    });
  }

  // --- Bairros em destaque na home: cada card leva a /guaruja/<slug>,
  // então o bairro precisa existir na cobertura — senão o card cai em 404.
  check(list(data.areaPhotos), "A lista de bairros em destaque está corrompida. Recarregue o painel e tente de novo.");
  check(!list(data.areaPhotos) || data.areaPhotos.length > 0, "É preciso ter ao menos um bairro em destaque.");
  if (list(data.areaPhotos)) {
    data.areaPhotos.forEach((item, i) => {
      const at = `Bairro em destaque ${i + 1}`;
      const nome = String(item?.name || "");
      check(nomeDeLugar(item?.name), `${at}: "${nome}" não serve como nome de bairro (use letras, números, espaço, ponto, apóstrofo ou hífen).`);
      check(IMAGE.test(String(item?.image || "")), `${at}: a imagem precisa ser enviada pelo próprio painel.`);
      if (nomeDeLugar(item?.name) && paginasDeBairro.size) {
        check(
          paginasDeBairro.has(slugify(nome)),
          `${at}: "${nome}" não está na lista de bairros atendidos. Adicione o bairro em uma das regiões, senão o card da página inicial abre uma página inexistente.`,
        );
      }
    });
  }

  check(list(data.serviceAreaGroups) && data.serviceAreaGroups.length > 0, "É preciso ter ao menos uma região de cidades.");
  if (list(data.serviceAreaGroups)) {
    data.serviceAreaGroups.forEach((group, i) => {
      checaTexto(group?.region, `Região de cidades ${i + 1}: o nome`, 40);
      check(list(group?.cities) && group.cities.length > 0, `Região de cidades ${i + 1}: adicione ao menos uma cidade.`);
      // Vão para o areaServed do JSON-LD.
      (group?.cities || []).forEach((c) =>
        check(nomeDeLugar(c), `Região de cidades ${i + 1}: "${c}" não serve como cidade.`),
      );
    });
  }

  // --- Marcas
  check(data.brands && list(data.brands.heating) && list(data.brands.airConditioning), "A lista de marcas está corrompida. Recarregue o painel e tente de novo.");
  for (const key of ["heating", "airConditioning"]) {
    (data.brands?.[key] || []).forEach((item, i) => {
      checaTexto(item?.name, `Marca ${i + 1}: o nome`, 40);
      check(IMAGE.test(String(item?.image || "")), `Marca "${item?.name || i + 1}": o logo precisa ser enviado pelo próprio painel.`);
    });
  }

  return errors;
}

// Formato de cada bloco do content.json. Serve para reconstruir o objeto só com
// o que o site lê: sem isso, um POST autenticado grava qualquer chave extra
// (inclusive "__proto__" ou meio megabyte de lixo) no repositório público.
const FORMATO = {
  site: ["name", "legalName", "url", "phoneDisplay", "phone", "email", "address", "hours", "whatsappMessage", "social"],
  texts: ["heroTitle", "heroHighlight", "heroSubtitle", "aboutTitle", "aboutText", "footerDescription", "ctaTitle", "ctaText"],
  services: ["slug", "title", "short", "description", "image", "price", "icon"],
  products: ["id", "name", "price", "image", "imageEmUso"],
  stats: ["value", "label"],
  reviews: ["text", "name", "area", "avatar"],
  faqs: ["q", "a"],
  areaPhotos: ["name", "image"],
  neighborhoodGroups: ["region", "neighborhoods"],
  serviceAreaGroups: ["region", "cities"],
  marca: ["name", "image"],
  social: ["facebook", "instagram"],
};

/** Copia só as chaves listadas, ignorando o resto. */
function apenas(objeto, chaves) {
  const saida = {};
  for (const chave of chaves) {
    if (objeto && Object.hasOwn(objeto, chave)) saida[chave] = objeto[chave];
  }
  return saida;
}

const mapear = (lista, chaves) => (Array.isArray(lista) ? lista.map((item) => apenas(item, chaves)) : lista);

/** Reconstrói o conteúdo apenas com os campos conhecidos. */
export function limparConteudo(data) {
  const site = apenas(data.site, FORMATO.site);
  if (site.social) site.social = apenas(site.social, FORMATO.social);

  return {
    site,
    texts: apenas(data.texts, FORMATO.texts),
    services: mapear(data.services, FORMATO.services),
    products: mapear(data.products, FORMATO.products),
    stats: mapear(data.stats, FORMATO.stats),
    reviews: mapear(data.reviews, FORMATO.reviews),
    faqs: mapear(data.faqs, FORMATO.faqs),
    areaPhotos: mapear(data.areaPhotos, FORMATO.areaPhotos),
    neighborhoodGroups: mapear(data.neighborhoodGroups, FORMATO.neighborhoodGroups),
    serviceAreaGroups: mapear(data.serviceAreaGroups, FORMATO.serviceAreaGroups),
    brands: {
      heating: mapear(data.brands?.heating, FORMATO.marca),
      airConditioning: mapear(data.brands?.airConditioning, FORMATO.marca),
    },
  };
}

export function slugify(value) {
  // NFD separa o acento da letra; a faixa U+0300-U+036F remove as marcas combinantes.
  // Depois sobra só [a-z0-9-]: ponto, apóstrofo e espaço duplo produziriam
  // segmentos de URL feios ou que não casam com a pasta exportada.
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

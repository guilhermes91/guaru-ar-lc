// Validação do content.json antes de commitar.
// Objetivo: impedir que uma edição no painel quebre o build do site.
// Não é um schema exaustivo — é a rede de segurança do que o site realmente lê.

const str = (v) => typeof v === "string";
const num = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const list = (v) => Array.isArray(v);

/** Teto para qualquer texto livre: evita que um paste gigante vá parar no commit. */
const MAX_TEXTO = 2000;

/**
 * Texto preenchido, dentro do limite e sem "<" nem ">".
 * O conteúdo é injetado em JSON-LD e em atributos de estilo — sinal de tag
 * nunca é conteúdo legítimo aqui, e barrar na entrada é mais seguro do que
 * confiar só no escape na saída.
 */
const nonEmpty = (v, max = MAX_TEXTO) =>
  str(v) && v.trim().length > 0 && v.length <= max && !/[<>]/.test(v);

/** Slug seguro para virar rota estática (/servicos/<slug>). */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Caminho de imagem: só relativo dentro do site, ou http(s). */
const IMAGE = /^(\/[\w\-./]+|https?:\/\/[^\s"'()]+)$/;
/** Nome que vira segmento de URL (/guaruja/<bairro>) ou entra no JSON-LD. */
const NOME_LUGAR = /^[\p{L}\p{N} .'’-]{2,60}$/u;
/** Ícones que o site sabe desenhar (ver src/components/service-card.tsx). */
const ICONES = ["Snowflake", "Flame", "Waves", "Wrench"];

export function validateContent(data) {
  const errors = [];
  const check = (condition, message) => {
    if (!condition) errors.push(message);
  };

  check(data && typeof data === "object" && !Array.isArray(data), "Conteúdo inválido.");
  if (errors.length) return errors;

  // --- Configurações gerais
  const s = data.site;
  check(s && typeof s === "object", "Bloco de configurações ausente.");
  if (s && typeof s === "object") {
    check(nonEmpty(s.name, 60), "O nome da empresa não pode ficar vazio.");
    check(nonEmpty(s.legalName, 120), "A razão social não pode ficar vazia.");
    check(/^https:\/\/[\w.-]+(\/[\w\-./]*)?$/.test(String(s.url || "")), "O endereço do site deve começar com https:// (ex.: https://guaruarguaruja.com.br).");
    check(nonEmpty(s.phoneDisplay, 40), "O telefone exibido não pode ficar vazio.");
    check(/^\d{12,13}$/.test(String(s.phone || "")), "O WhatsApp deve ter só números, com DDI e DDD (ex.: 5513974104466).");
    check(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s.email || "")), "E-mail de contato inválido.");
    check(nonEmpty(s.address, 160), "O endereço não pode ficar vazio.");
    check(nonEmpty(s.hours, 120), "O horário de atendimento não pode ficar vazio.");
    check(nonEmpty(s.whatsappMessage, 300), "A mensagem padrão do WhatsApp não pode ficar vazia.");
    // Vão para o sameAs do JSON-LD: só aceita endereço https completo.
    const rede = (v) => str(v) && (v === "" || /^https:\/\/[\w.-]+\/[\w\-./?=&%]*$/.test(v));
    check(s.social && rede(s.social.facebook) && rede(s.social.instagram), "Links de redes sociais inválidos: use o endereço completo, começando com https://.");
  }

  // --- Textos
  const t = data.texts;
  check(t && typeof t === "object", "Bloco de textos ausente.");
  if (t && typeof t === "object") {
    for (const key of ["heroTitle", "heroSubtitle", "aboutTitle", "aboutText", "footerDescription", "ctaTitle", "ctaText"]) {
      check(nonEmpty(t[key]), `O texto "${key}" não pode ficar vazio.`);
    }
    check(str(t.heroHighlight || ""), "Destaque do título inválido.");
  }

  // --- Serviços (cada um vira uma página /servicos/<slug>)
  check(list(data.services) && data.services.length > 0, "É preciso ter ao menos um serviço.");
  if (list(data.services)) {
    const seen = new Set();
    data.services.forEach((item, i) => {
      const at = `Serviço ${i + 1}`;
      check(SLUG.test(String(item?.slug || "")), `${at}: identificador inválido (use letras minúsculas e hífens).`);
      check(!seen.has(item?.slug), `${at}: identificador duplicado.`);
      seen.add(item?.slug);
      check(nonEmpty(item?.title), `${at}: o título não pode ficar vazio.`);
      check(nonEmpty(item?.short), `${at}: o resumo não pode ficar vazio.`);
      check(nonEmpty(item?.description), `${at}: a descrição não pode ficar vazia.`);
      check(IMAGE.test(String(item?.image || "")), `${at}: imagem inválida.`);
      check(num(item?.price), `${at}: preço inválido.`);
      check(ICONES.includes(item?.icon), `${at}: ícone inválido (use ${ICONES.join(", ")}).`);
    });
  }

  // --- Produtos
  check(list(data.products) && data.products.length > 0, "É preciso ter ao menos um produto.");
  if (list(data.products)) {
    const seen = new Set();
    data.products.forEach((item, i) => {
      const at = `Produto ${i + 1}`;
      check(SLUG.test(String(item?.id || "")), `${at}: identificador inválido (use letras minúsculas e hífens).`);
      check(!seen.has(item?.id), `${at}: identificador duplicado.`);
      seen.add(item?.id);
      check(nonEmpty(item?.name), `${at}: o nome não pode ficar vazio.`);
      check(num(item?.price), `${at}: preço inválido.`);
      check(IMAGE.test(String(item?.image || "")), `${at}: imagem inválida.`);
      check(item?.imageEmUso === undefined || item?.imageEmUso === "" || IMAGE.test(String(item.imageEmUso)), `${at}: segunda imagem inválida.`);
    });
  }

  // --- Números, avaliações e FAQ
  check(list(data.stats), "Bloco de números inválido.");
  if (list(data.stats)) {
    data.stats.forEach((item, i) => {
      check(nonEmpty(item?.value) && nonEmpty(item?.label), `Número ${i + 1}: preencha valor e descrição.`);
    });
  }

  check(list(data.reviews), "Bloco de avaliações inválido.");
  if (list(data.reviews)) {
    data.reviews.forEach((item, i) => {
      check(nonEmpty(item?.text), `Avaliação ${i + 1}: o texto não pode ficar vazio.`);
      check(nonEmpty(item?.name), `Avaliação ${i + 1}: o nome não pode ficar vazio.`);
      check(str(item?.area), `Avaliação ${i + 1}: bairro inválido.`);
      check(IMAGE.test(String(item?.avatar || "")), `Avaliação ${i + 1}: foto inválida.`);
    });
  }

  check(list(data.faqs), "Bloco de perguntas frequentes inválido.");
  if (list(data.faqs)) {
    data.faqs.forEach((item, i) => {
      check(nonEmpty(item?.q) && nonEmpty(item?.a), `Pergunta ${i + 1}: preencha pergunta e resposta.`);
    });
  }

  // --- Cobertura: cada bairro daqui vira uma página /guaruja/<slug>
  const paginasDeBairro = new Set();
  check(list(data.neighborhoodGroups) && data.neighborhoodGroups.length > 0, "É preciso ter ao menos uma região de bairros.");
  if (list(data.neighborhoodGroups)) {
    data.neighborhoodGroups.forEach((group, i) => {
      check(nonEmpty(group?.region, 60), `Região ${i + 1}: o nome não pode ficar vazio.`);
      check(list(group?.neighborhoods) && group.neighborhoods.length > 0, `Região ${i + 1}: adicione ao menos um bairro.`);
      (group?.neighborhoods || []).forEach((n) => {
        // O nome vira segmento de URL: barra, "#" e "?" quebrariam a rota exportada.
        if (!NOME_LUGAR.test(String(n || ""))) {
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
  check(list(data.areaPhotos) && data.areaPhotos.length > 0, "É preciso ter ao menos um bairro em destaque.");
  if (list(data.areaPhotos)) {
    data.areaPhotos.forEach((item, i) => {
      const at = `Bairro em destaque ${i + 1}`;
      const nome = String(item?.name || "");
      check(NOME_LUGAR.test(nome), `${at}: o nome não pode ficar vazio.`);
      check(IMAGE.test(String(item?.image || "")), `${at}: imagem inválida.`);
      if (NOME_LUGAR.test(nome) && paginasDeBairro.size) {
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
      check(nonEmpty(group?.region, 60), `Região de cidades ${i + 1}: o nome não pode ficar vazio.`);
      check(list(group?.cities) && group.cities.length > 0, `Região de cidades ${i + 1}: adicione ao menos uma cidade.`);
      // Vão para o areaServed do JSON-LD.
      (group?.cities || []).forEach((c) =>
        check(NOME_LUGAR.test(String(c || "")), `Região de cidades ${i + 1}: "${c}" não serve como cidade.`),
      );
    });
  }

  // --- Marcas
  check(data.brands && list(data.brands.heating) && list(data.brands.airConditioning), "Bloco de marcas inválido.");
  for (const key of ["heating", "airConditioning"]) {
    (data.brands?.[key] || []).forEach((item, i) => {
      check(nonEmpty(item?.name), `Marca ${i + 1}: o nome não pode ficar vazio.`);
      check(IMAGE.test(String(item?.image || "")), `Marca "${item?.name || i + 1}": logo inválido.`);
    });
  }

  return errors;
}

export function slugify(value) {
  // NFD separa o acento da letra; a faixa U+0300-U+036F remove as marcas combinantes.
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ /g, "-");
}

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
const IMAGE = /^(\/[\w\-./]+|https?:\/\/[^\s"'()]+)$/;
/** Nome que vira segmento de URL (/guaruja/<bairro>) ou entra no JSON-LD. */
const NOME_LUGAR = /^[\p{L}\p{N}][\p{L}\p{N} .'’-]{1,59}$/u;
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
  check(s && typeof s === "object", "Bloco de configurações ausente.");
  if (s && typeof s === "object") {
    checaTexto(s.name, "O nome da empresa", 40);
    checaTexto(s.legalName, "A razão social", 60);
    check(/^https:\/\/[\w.-]+(\/[\w\-./]*)?$/.test(String(s.url || "")), "O endereço do site deve começar com https:// (ex.: https://guaruarguaruja.com.br).");
    checaTexto(s.phoneDisplay, "O telefone exibido", 20);
    check(/^\d{12,13}$/.test(String(s.phone || "")), "O WhatsApp deve ter só números, com DDI e DDD (ex.: 5513974104466).");
    check(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s.email || "")), "E-mail de contato inválido.");
    checaTexto(s.address, "O endereço", 120);
    checaTexto(s.hours, "O horário de atendimento", 60);
    checaTexto(s.whatsappMessage, "A mensagem padrão do WhatsApp", 160);
    // Vão para o sameAs do JSON-LD: só aceita endereço https completo.
    const rede = (v) => str(v) && (v === "" || /^https:\/\/[\w.-]+\/[\w\-./?=&%]*$/.test(v));
    check(s.social && rede(s.social.facebook) && rede(s.social.instagram), "Links de redes sociais inválidos: use o endereço completo, começando com https://.");
  }

  // --- Textos
  const t = data.texts;
  check(t && typeof t === "object", "Bloco de textos ausente.");
  if (t && typeof t === "object") {
    // Mesmos limites dos campos do painel (public/admin/index.html).
    const limites = {
      heroTitle: 80, heroSubtitle: 120, aboutTitle: 90, aboutText: 500,
      footerDescription: 200, ctaTitle: 80, ctaText: 140,
    };
    for (const [key, max] of Object.entries(limites)) {
      checaTexto(t[key], `O texto "${key}"`, max);
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
      checaTexto(item?.title, `${at}: o título`, 40);
      checaTexto(item?.short, `${at}: o resumo`, 60);
      checaTexto(item?.description, `${at}: a descrição`, 300);
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
      checaTexto(item?.name, `${at}: o nome`, 60);
      check(num(item?.price), `${at}: preço inválido.`);
      check(IMAGE.test(String(item?.image || "")), `${at}: imagem inválida.`);
      check(item?.imageEmUso === undefined || item?.imageEmUso === "" || IMAGE.test(String(item.imageEmUso)), `${at}: segunda imagem inválida.`);
    });
  }

  // --- Números, avaliações e FAQ
  check(list(data.stats), "Bloco de números inválido.");
  if (list(data.stats)) {
    data.stats.forEach((item, i) => {
      checaTexto(item?.value, `Número ${i + 1}: o valor`, 10);
      checaTexto(item?.label, `Número ${i + 1}: a descrição`, 40);
    });
  }

  check(list(data.reviews), "Bloco de avaliações inválido.");
  if (list(data.reviews)) {
    data.reviews.forEach((item, i) => {
      checaTexto(item?.text, `Avaliação ${i + 1}: o texto`, 260);
      checaTexto(item?.name, `Avaliação ${i + 1}: o nome`, 30);
      check(str(item?.area) && item.area.length <= 30 && !/[<>]/.test(item.area), `Avaliação ${i + 1}: bairro inválido.`);
      check(IMAGE.test(String(item?.avatar || "")), `Avaliação ${i + 1}: foto inválida.`);
    });
  }

  check(list(data.faqs), "Bloco de perguntas frequentes inválido.");
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
      check(NOME_LUGAR.test(nome), `${at}: "${nome}" não serve como nome de bairro (use letras, números, espaço, ponto, apóstrofo ou hífen).`);
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
      checaTexto(group?.region, `Região de cidades ${i + 1}: o nome`, 40);
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
      checaTexto(item?.name, `Marca ${i + 1}: o nome`, 40);
      check(IMAGE.test(String(item?.image || "")), `Marca "${item?.name || i + 1}": logo inválido.`);
    });
  }

  return errors;
}

export function slugify(value) {
  // NFD separa o acento da letra; a faixa U+0300-U+036F remove as marcas combinantes.
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ /g, "-");
}

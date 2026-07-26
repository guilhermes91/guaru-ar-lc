// Validação do content.json antes de commitar.
// Objetivo: impedir que uma edição no painel quebre o build do site.
// Não é um schema exaustivo — é a rede de segurança do que o site realmente lê.

const str = (v) => typeof v === "string";
const nonEmpty = (v) => str(v) && v.trim().length > 0;
const num = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const list = (v) => Array.isArray(v);

/** Slug seguro para virar rota estática (/servicos/<slug>). */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Caminho de imagem: só relativo dentro do site, ou http(s). */
const IMAGE = /^(\/[\w\-./]+|https?:\/\/[^\s"']+)$/;

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
    check(nonEmpty(s.name), "O nome da empresa não pode ficar vazio.");
    check(nonEmpty(s.phoneDisplay), "O telefone exibido não pode ficar vazio.");
    check(/^\d{12,13}$/.test(String(s.phone || "")), "O WhatsApp deve ter só números, com DDI e DDD (ex.: 5513974104466).");
    check(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s.email || "")), "E-mail de contato inválido.");
    check(nonEmpty(s.address), "O endereço não pode ficar vazio.");
    check(nonEmpty(s.hours), "O horário de atendimento não pode ficar vazio.");
    check(nonEmpty(s.whatsappMessage), "A mensagem padrão do WhatsApp não pode ficar vazia.");
    check(s.social && str(s.social.facebook) && str(s.social.instagram), "Links de redes sociais inválidos.");
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
      check(nonEmpty(item?.icon), `${at}: ícone inválido.`);
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

  check(list(data.productCategories) && data.productCategories.length > 0, "É preciso ter ao menos uma categoria de produto.");
  if (list(data.productCategories)) {
    data.productCategories.forEach((item, i) => {
      check(SLUG.test(String(item?.slug || "")), `Categoria ${i + 1}: identificador inválido.`);
      check(nonEmpty(item?.label), `Categoria ${i + 1}: o nome não pode ficar vazio.`);
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

  // --- Bairros em destaque (cada um vira /guaruja/<slug>)
  check(list(data.areaPhotos) && data.areaPhotos.length > 0, "É preciso ter ao menos um bairro em destaque.");
  if (list(data.areaPhotos)) {
    data.areaPhotos.forEach((item, i) => {
      check(nonEmpty(item?.name), `Bairro em destaque ${i + 1}: o nome não pode ficar vazio.`);
      check(IMAGE.test(String(item?.image || "")), `Bairro em destaque ${i + 1}: imagem inválida.`);
    });
  }

  // --- Cobertura
  check(list(data.neighborhoodGroups) && data.neighborhoodGroups.length > 0, "É preciso ter ao menos uma região de bairros.");
  if (list(data.neighborhoodGroups)) {
    const seen = new Set();
    data.neighborhoodGroups.forEach((group, i) => {
      check(nonEmpty(group?.region), `Região ${i + 1}: o nome não pode ficar vazio.`);
      check(list(group?.neighborhoods) && group.neighborhoods.length > 0, `Região ${i + 1}: adicione ao menos um bairro.`);
      (group?.neighborhoods || []).forEach((n) => {
        check(nonEmpty(n), `Região ${i + 1}: há um bairro sem nome.`);
        const key = slugify(String(n));
        check(!seen.has(key), `Bairro repetido: "${n}". Cada bairro gera uma página própria e não pode se repetir.`);
        seen.add(key);
      });
    });
  }

  check(list(data.serviceAreaGroups) && data.serviceAreaGroups.length > 0, "É preciso ter ao menos uma região de cidades.");
  if (list(data.serviceAreaGroups)) {
    data.serviceAreaGroups.forEach((group, i) => {
      check(nonEmpty(group?.region), `Região de cidades ${i + 1}: o nome não pode ficar vazio.`);
      check(list(group?.cities) && group.cities.length > 0, `Região de cidades ${i + 1}: adicione ao menos uma cidade.`);
      (group?.cities || []).forEach((c) => check(nonEmpty(c), `Região de cidades ${i + 1}: há uma cidade sem nome.`));
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

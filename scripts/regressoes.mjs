// Trava dos defeitos já corrigidos. Roda no `npm run build`.
//
// Por que existe: as rodadas de QA acharam defeito que já tinha sido corrigido
// antes, e correção nova chegou a criar defeito novo. Sem um teste no
// repositório, cada conserto valia só a palavra de quem consertou.
//
// Regra da casa: todo achado corrigido entra aqui com um caso nomeado. Os casos
// que dependem do painel são MUTANTES — desfazem a correção numa cópia e exigem
// que o smoke reprove. Teste que passa com o código quebrado não prova nada.
//
// Cada caso cita a rodada e o achado, para dar para ir de volta ao
// docs/CORRECOES-QA.md e entender o que aconteceu.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { caminhosDeImagem, limparConteudo, validateContent } from "../lib/validate.js";

const PAINEL = "public/admin/index.html";
const tmp = mkdtempSync(join(tmpdir(), "guaruar-regressoes-"));
const fabrica = JSON.parse(readFileSync("src/data/content.default.json", "utf8"));
const copia = () => JSON.parse(JSON.stringify(fabrica));

const falhas = [];
const casos = [];
const caso = (nome, fn) => casos.push({ nome, fn });
/** Devolve mensagem de erro, ou null se passou. */
const exigir = (condicao, oque) => (condicao ? null : oque);

// --------------------------------------------------------------- validação
caso("R8#2 teto de itens vale nas listas aninhadas", () => {
  const erros = [];
  const marca = fabrica.brands.heating[0];
  let d = copia();
  d.brands.heating = Array.from({ length: 268 }, (_, i) => ({ name: `Marca ${i}`, image: marca.image }));
  erros.push(exigir(validateContent(d).some((e) => e.includes("brands.heating") && e.includes("passou de 200")), "268 marcas em brands.heating foram aceitas"));

  d = copia();
  d.neighborhoodGroups[0].neighborhoods = Array.from({ length: 250 }, (_, i) => `Bairro Qa ${i}`);
  erros.push(exigir(validateContent(d).some((e) => e.includes("neighborhoods") && e.includes("passou de 200")), "250 bairros numa região foram aceitos"));

  d = copia();
  d.serviceAreaGroups[0].cities = Array.from({ length: 201 }, (_, i) => `Cidade Qa ${i}`);
  erros.push(exigir(validateContent(d).some((e) => e.includes("cities") && e.includes("passou de 200")), "201 cidades num grupo foram aceitas"));
  return erros;
});

caso("R8#2 tamanho medido sobre o arquivo commitado, não sobre o compacto", () => {
  // A janela da regressão: compacto abaixo de 512 KB, arquivo indentado acima.
  const d = copia();
  d.neighborhoodGroups = Array.from({ length: 60 }, (_, k) => ({
    region: `Regiao Qa ${k}`,
    neighborhoods: Array.from({ length: 200 }, (_, i) => `Bairro Qa numero ${k} ${i} com nome longo`),
  }));
  d.areaPhotos = [{ name: "Bairro Qa numero 0 0 com nome longo", image: fabrica.areaPhotos[0].image }];
  const compacto = JSON.stringify(d).length;
  const arquivo = JSON.stringify(limparConteudo(d), null, 2).length;
  return [
    exigir(compacto <= 512 * 1024, `o caso perdeu a graça: o compacto (${compacto}) já passa do teto sozinho`),
    exigir(arquivo > 512 * 1024, `o caso perdeu a graça: o arquivo commitado (${arquivo}) não passa do teto`),
    exigir(validateContent(d).some((e) => e.includes("grande demais")), "conteúdo de 594 KB de arquivo foi aceito"),
  ];
});

caso("R8#8 duplicata em FAQ, número, marca e cidade é recusada", () => {
  const erros = [];
  const dup = (mexer, oque) => {
    const d = copia();
    mexer(d);
    erros.push(exigir(validateContent(d).some((e) => e.includes("aparece mais de uma vez")), `${oque} duplicado foi aceito`));
  };
  dup((d) => d.faqs.push({ q: d.faqs[0].q, a: "outra resposta qualquer." }), "FAQ");
  dup((d) => d.stats.push({ value: "+99", label: d.stats[0].label }), "número de destaque");
  dup((d) => d.brands.airConditioning.push({ ...d.brands.airConditioning[0] }), "marca");
  dup((d) => d.serviceAreaGroups[0].cities.push(d.serviceAreaGroups[0].cities[0]), "cidade no mesmo grupo");
  return erros;
});

caso("R8#9 bairro do cliente vazio e preço fracionário são recusados", () => {
  let d = copia();
  d.reviews[0].area = "";
  const vazio = validateContent(d).some((e) => e.includes("bairro do cliente"));
  d = copia();
  d.products[0].price = 0.5;
  const fracao = validateContent(d).some((e) => e.includes("preço"));
  return [exigir(vazio, "avaliação com bairro vazio foi aceita"), exigir(fracao, "preço 0,5 foi aceito")];
});

caso("R8#7 caminhos de imagem do conteúdo existem todos em public/", () => {
  const { existsSync } = { existsSync: (p) => { try { readFileSync(p); return true; } catch { return false; } } };
  const ausentes = caminhosDeImagem(fabrica).filter((c) => !existsSync(`public${c}`));
  return [exigir(ausentes.length === 0, `a base de fábrica aponta para imagem inexistente: ${ausentes.join(", ")}`)];
});

caso("a base de fábrica publica sem erro", () => {
  const erros = validateContent(fabrica);
  return [exigir(erros.length === 0, `o botão de restaurar publicaria conteúdo inválido: ${erros.join(" | ")}`)];
});

// ----------------------------------------------------- painel (mutantes)
const rodarSmoke = (args = []) => {
  try {
    execFileSync(process.execPath, ["scripts/smoke-painel.mjs", ...args], { stdio: "pipe" });
    return { passou: true };
  } catch (erro) {
    return { passou: false, saida: String(erro.stdout || "") + String(erro.stderr || "") };
  }
};

/** Escreve o painel com a correção desfeita e exige que o smoke reprove. */
const mutante = (nome, de, para) => {
  caso(nome, () => {
    const original = readFileSync(PAINEL, "utf8");
    if (!original.includes(de)) {
      return [`não achei no painel o trecho que este caso adultera — a correção mudou de forma e o teste ficou cego:\n      ${de.trim().slice(0, 90)}`];
    }
    const arquivo = join(tmp, `painel-${casos.length}.html`);
    writeFileSync(arquivo, original.replace(de, para));
    const { passou } = rodarSmoke([`--painel=${arquivo}`]);
    return [exigir(!passou, "o smoke PASSOU com a correção desfeita: ele não pega esta regressão")];
  });
};

mutante(
  "R8#1 smoke pega o desfazer que sobrevive à publicação",
  "    removidos.push(...aindaNaoPublicados);\n    pintarDesfazeres(desenharSecao);",
  "    removidos.push(...aindaNaoPublicados);",
);

mutante(
  "R9#2 smoke pega o desfazer perdido de remoção feita durante o envio",
  "    const aindaNaoPublicados = removidos.filter((r) => r.versao >= versaoEnviada);",
  "    const aindaNaoPublicados = [];",
);

mutante(
  "R8#5 smoke pega o campo de lista que descarta o que foi digitado",
  '  entrada.addEventListener("blur", adicionar);',
  "  // correcao desfeita pelo teste de regressao",
);

caso("R9#3 o smoke não depende do conteúdo do cliente", () => {
  // O dono enxuga o site até uma lista de um item só — tudo permitido pelo
  // painel. Se o smoke depender desse conteúdo, o build quebra e o site congela
  // na versão anterior, com toda publicação seguinte falhando igual.
  const enxuto = copia();
  enxuto.services = enxuto.services.slice(0, 1);
  enxuto.products = enxuto.products.slice(0, 1);
  enxuto.stats = enxuto.stats.slice(0, 1);
  enxuto.reviews = enxuto.reviews.slice(0, 1);
  enxuto.faqs = enxuto.faqs.slice(0, 1);
  enxuto.areaPhotos = enxuto.areaPhotos.slice(0, 1);
  enxuto.neighborhoodGroups = [{ ...enxuto.neighborhoodGroups[0], neighborhoods: [enxuto.areaPhotos[0].name] }];
  enxuto.serviceAreaGroups = [{ ...enxuto.serviceAreaGroups[0], cities: enxuto.serviceAreaGroups[0].cities.slice(0, 1) }];
  enxuto.brands = { heating: enxuto.brands.heating.slice(0, 1), airConditioning: enxuto.brands.airConditioning.slice(0, 1) };

  const erros = validateContent(enxuto);
  const arquivo = join(tmp, "content-enxuto.json");
  writeFileSync(arquivo, JSON.stringify(enxuto, null, 2));
  const { passou, saida } = rodarSmoke([`--conteudo=${arquivo}`]);
  return [
    exigir(erros.length === 0, `o caso perdeu a graça: a validação já recusa o conteúdo enxuto (${erros[0]})`),
    exigir(passou, `conteúdo enxuto pelo painel derruba o build: ${String(saida).trim().split("\n").slice(0, 3).join(" / ")}`),
  ];
});

// -------------------------------------------------------------------- roda
for (const { nome, fn } of casos) {
  let resultado;
  try {
    resultado = fn();
  } catch (erro) {
    resultado = [`o próprio caso estourou: ${erro.message}`];
  }
  const problemas = (resultado || []).filter(Boolean);
  if (problemas.length) falhas.push({ nome, problemas });
}

if (falhas.length) {
  console.error("regressões: voltou defeito que já estava corrigido");
  for (const { nome, problemas } of falhas) {
    console.error(`  ${nome}`);
    for (const p of problemas) console.error(`    - ${p}`);
  }
  process.exit(1);
}
console.log(`regressões: ${casos.length} casos, nenhum defeito antigo voltou`);

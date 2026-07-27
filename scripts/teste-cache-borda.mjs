// Página removida pelo painel some do ar? Mede de ponta a ponta, em produção.
//
// NÃO roda no build: publica de verdade. Cria um bairro, espera o deploy,
// aquece o cache de borda, remove o bairro, espera o deploy e cronometra quanto
// tempo a URL órfã ainda responde 200. Restaura o conteúdo original no fim,
// inclusive se der erro no meio.
//
// Em 27/07/2026 este teste REPROVOU: a página seguiu em 200 por mais de 10 min,
// com `Age` passando de 588s contra um `s-maxage=60` presente na resposta — o
// Cloudflare não revalida quando a origem passa a responder 404. Ver o achado
// R9#5 em docs/CORRECOES-QA.md. Refazer quando o domínio próprio entrar, junto
// com um passo de purge no deploy: aí sim há uma zona nossa para purgar.
//
// Uso (as credenciais NÃO ficam no repositório, que é público):
//   GUARUAR_EMAIL=... GUARUAR_SENHA=... node scripts/teste-cache-borda.mjs
import { execFileSync } from "node:child_process";

const BASE = process.env.GUARUAR_BASE || "https://guaru-ar-lc.pages.dev";
const EMAIL = process.env.GUARUAR_EMAIL;
const SENHA = process.env.GUARUAR_SENHA;
const BAIRRO = "Bairro Teste Cache Borda";
const URL_TESTE = `${BASE}/guaruja/bairro-teste-cache-borda/`;
const LIMITE_MIN = 10;

if (!EMAIL || !SENHA) {
  console.error("faltam GUARUAR_EMAIL e GUARUAR_SENHA no ambiente.");
  process.exit(2);
}

const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));

let cookie = "";
async function api(rota, opcoes = {}) {
  const r = await fetch(`${BASE}/api/${rota}`, {
    ...opcoes,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}), ...(opcoes.headers || {}) },
  });
  return { status: r.status, corpo: await r.json().catch(() => ({})), setCookie: r.headers.get("set-cookie") };
}

const runs = () =>
  JSON.parse(execFileSync("gh", ["run", "list", "--limit", "8", "--json", "headSha,status,conclusion"], { encoding: "utf8" }));

/** Espera o run DESTE commit: aceitar o mais recente pega o deploy anterior. */
async function esperarDeploy(rotulo, commit) {
  log(`${rotulo}: aguardando o run de ${commit.slice(0, 7)}...`);
  for (let i = 0; i < 45; i++) {
    const r = runs().find((x) => x.headSha === commit);
    if (r?.status === "completed") {
      log(`${rotulo}: deploy ${r.conclusion} em ~${i * 10}s`);
      return r.conclusion === "success";
    }
    await dormir(10000);
  }
  return false;
}

const cabecalhos = async (url) => {
  const r = await fetch(url, { headers: { "cache-control": "no-cache" } });
  return { status: r.status, cache: r.headers.get("cache-control"), cf: r.headers.get("cf-cache-status"), age: r.headers.get("age") };
};

let original = null;
let saida = 1;
try {
  const entrada = await api("login", { method: "POST", body: JSON.stringify({ email: EMAIL, password: SENHA }) });
  if (entrada.status !== 200) throw new Error(`login falhou: ${entrada.status}`);
  cookie = entrada.setCookie.split(";")[0];

  let atual = await api("content");
  original = JSON.parse(JSON.stringify(atual.corpo.content));
  log(`conteúdo original salvo (sha ${atual.corpo.sha.slice(0, 8)})`);

  const comBairro = JSON.parse(JSON.stringify(original));
  comBairro.neighborhoodGroups[0].neighborhoods.push(BAIRRO);
  let r = await api("content", { method: "POST", body: JSON.stringify({ content: comBairro, sha: atual.corpo.sha }) });
  if (r.status !== 200) throw new Error(`criação recusada: ${r.status} ${JSON.stringify(r.corpo)}`);
  if (!(await esperarDeploy("criação", r.corpo.commit))) throw new Error("deploy da criação não ficou verde");

  log("aquecendo o cache de borda...");
  let quente = false;
  for (let i = 0; i < 20 && !quente; i++) {
    if ((await cabecalhos(URL_TESTE)).status === 200) {
      for (let k = 0; k < 4; k++) await cabecalhos(URL_TESTE);
      const h = await cabecalhos(URL_TESTE);
      log(`  página no ar: cf=${h.cf ?? "-"} age=${h.age ?? "-"} | ${h.cache}`);
      quente = true;
    } else await dormir(8000);
  }
  if (!quente) throw new Error("a página nova nunca respondeu 200");

  atual = await api("content");
  r = await api("content", { method: "POST", body: JSON.stringify({ content: original, sha: atual.corpo.sha }) });
  if (r.status !== 200) throw new Error(`remoção recusada: ${r.status} ${JSON.stringify(r.corpo)}`);
  if (!(await esperarDeploy("remoção", r.corpo.commit))) throw new Error("deploy da remoção não ficou verde");

  const t0 = Date.now();
  log("cronometrando a queda da página órfã...");
  let caiu = null;
  for (let i = 0; i < (LIMITE_MIN * 60) / 15 && caiu === null; i++) {
    const h = await cabecalhos(URL_TESTE);
    const seg = Math.round((Date.now() - t0) / 1000);
    log(`  +${seg}s -> ${h.status} | cf=${h.cf ?? "-"} age=${h.age ?? "-"} | ${h.cache}`);
    if (h.status !== 200) caiu = seg;
    else await dormir(15000);
  }
  console.log("");
  if (caiu !== null) {
    console.log(`PASSOU: a página removida parou de responder 200 em ${caiu}s após o deploy verde.`);
    saida = 0;
  } else {
    console.log(`REPROVOU: após ${LIMITE_MIN} min a página removida ainda responde 200 do cache de borda.`);
  }
} catch (erro) {
  console.error("ERRO:", erro.message);
} finally {
  if (original && cookie) {
    const atual = await api("content");
    const sem = (o) => {
      const c = { ...o };
      delete c.updatedAt;
      return JSON.stringify(c);
    };
    if (sem(atual.corpo.content) !== sem(original)) {
      const r = await api("content", { method: "POST", body: JSON.stringify({ content: original, sha: atual.corpo.sha }) });
      log(`restauração do conteúdo original: ${r.status}`);
    } else log("conteúdo já estava no original");
  }
}
process.exit(saida);

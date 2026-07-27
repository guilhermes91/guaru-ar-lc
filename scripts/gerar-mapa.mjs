// Gera docs/MAPA-DO-SITE.md a partir do build (out/) e do content.json.
// Rodar depois de `npm run build`, sempre que rotas ou conteúdo mudarem.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";

function paginas(dir, achadas = []) {
  for (const item of readdirSync(dir)) {
    const caminho = join(dir, item);
    if (statSync(caminho).isDirectory()) paginas(caminho, achadas);
    else if (item === "index.html") achadas.push(caminho);
  }
  return achadas;
}

const semTags = (t) => (t ? t.replace(/<[^>]+>/g, "").trim() : "");
const pega = (html, re) => semTags(html.match(re)?.[1] || "");

const rotas = paginas("out")
  .map((p) => {
    const rel = relative("out", dirname(p)).replace(/\\/g, "/");
    const rota = rel === "" ? "/" : `/${rel}/`;
    const html = readFileSync(p, "utf8");
    return {
      rota,
      title: pega(html, /<title>([^<]*)<\/title>/),
      h1: pega(html, /<h1[^>]*>([\s\S]*?)<\/h1>/),
    };
  })
  .filter((r) => !r.rota.startsWith("/admin") && !r.rota.startsWith("/_not-found") && r.rota !== "/404/")
  .sort((a, b) => a.rota.localeCompare(b.rota));

const sitemap = readFileSync("out/sitemap.xml", "utf8");
const noSitemap = new Set(
  [...sitemap.matchAll(/<loc>https:\/\/guaruarguaruja\.com\.br([^<]*)<\/loc>/g)].map((m) => m[1] || "/"),
);

const conteudo = JSON.parse(readFileSync("src/data/content.json", "utf8"));

const grupo = (r) =>
  r.rota.startsWith("/servicos/") && r.rota !== "/servicos/"
    ? "Serviço"
    : r.rota.startsWith("/guaruja/")
      ? "Bairro"
      : "Institucional";

const L = [];
const bairros = conteudo.neighborhoodGroups.reduce((n, g) => n + g.neighborhoods.length, 0);

L.push("# Mapa do site — Guaru Ar LC\n");
L.push("Gerado do build de produção por `node scripts/gerar-mapa.mjs`.\n");
L.push(`- **Site:** https://guaruarguaruja.com.br · https://guaru-ar-lc.pages.dev`);
L.push(`- **Painel:** https://guaruarguaruja.com.br/admin/ (fora do índice)`);
L.push(`- **Páginas públicas:** ${rotas.length}`);
L.push(`- **URLs no sitemap.xml:** ${noSitemap.size}\n`);

for (const nome of ["Institucional", "Serviço", "Bairro"]) {
  const itens = rotas.filter((r) => grupo(r) === nome);
  L.push(`\n## ${nome} — ${itens.length} página${itens.length === 1 ? "" : "s"}\n`);
  L.push("| Rota | Título | H1 | Sitemap |");
  L.push("| --- | --- | --- | --- |");
  for (const r of itens) {
    L.push(`| \`${r.rota}\` | ${r.title} | ${r.h1} | ${noSitemap.has(r.rota) ? "sim" : "**NÃO**"} |`);
  }
}

L.push("\n## Fora do índice\n");
L.push("| Rota | Por quê |");
L.push("| --- | --- |");
L.push("| `/admin/` | Painel do cliente. `noindex, nofollow`, `Disallow` no robots.txt, `X-Frame-Options: DENY`, sem cache. |");
L.push("| `/api/*` | Rotas do painel. `noindex`, `no-store`, todas exigem sessão exceto login e recuperação. |");
L.push("| `/404`, `/_not-found/` | Página de erro. `noindex, follow`, sem canonical. |");

L.push("\n## API do painel\n");
L.push("| Rota | Método | Sessão | O que faz |");
L.push("| --- | --- | --- | --- |");
for (const [r, m, s, d] of [
  ["/api/login", "POST", "não", "Autentica e emite o cookie de sessão. 8 tentativas por IP a cada 10 min."],
  ["/api/logout", "POST", "não", "Apaga a sessão no KV e limpa o cookie."],
  ["/api/me", "GET", "sim", "Devolve o e-mail de quem está logado."],
  ["/api/content", "GET", "sim", "Lê o conteúdo publicado, ou o rascunho enquanto o deploy roda."],
  ["/api/content", "POST", "sim", "Valida, limpa e commita o content.json. Dispara o deploy."],
  ["/api/upload", "POST", "sim", "Recebe imagem (JPG/PNG/WebP até 3 MB, conferida por magic bytes) e commita."],
  ["/api/restore", "POST", "sim", "Copia content.default.json por cima do content.json."],
  ["/api/status", "GET", "sim", "Estado do último deploy no GitHub Actions, com o headSha."],
  ["/api/recover", "POST", "não", "Envia senha provisória de 30 min por e-mail. 1 envio por IP a cada 15 min."],
]) {
  L.push(`| \`${r}\` | ${m} | ${s} | ${d} |`);
}

L.push("\n## Onde cada coisa é editada no painel\n");
L.push("| Seção | O que muda | Aparece em |");
L.push("| --- | --- | --- |");
for (const [s, o, onde] of [
  ["Configurações", "Nome, razão social, endereço do site, telefone, WhatsApp, e-mail, endereço, horário, redes sociais", "Todas as páginas: cabeçalho, rodapé, botões de WhatsApp e dados estruturados"],
  ["Textos do site", "Título e frase do topo, bloco sobre, chamada final, descrição do rodapé", "Página inicial, /sobre/ e rodapé de todas"],
  ["Serviços", "Nome, resumo, descrição, preço, ícone e imagem de cada serviço", "Cards da home, /servicos/ e a página de cada serviço"],
  ["Produtos", "Nome, preço e as duas fotos de cada produto", "/produtos/"],
  ["Bairros e regiões", "Bairros em destaque com foto, regiões, texto de cada região, bairros e cidades atendidas", "Home, as páginas de bairro, rodapé e /assistencia-autorizada/"],
  ["Números, avaliações e FAQ", "Três números de destaque, depoimentos com foto e perguntas frequentes", "Página inicial"],
  ["Marcas atendidas", "Logos de ar-condicionado e de aquecedores", "/assistencia-autorizada/"],
  ["Usuário", "E-mail e senha de acesso, e restauração de fábrica", "Só o painel"],
]) {
  L.push(`| ${s} | ${o} | ${onde} |`);
}

L.push("\n## Navegação\n");
L.push("**Menu:** Início · Serviços (submenu com os três) · Produtos · Marcas · Como funciona · Sobre nós · Áreas de atendimento · Contato · botão de WhatsApp\n");
L.push("**Rodapé:** logo e descrição · redes sociais · navegação · lista de serviços · contato · botão de WhatsApp\n");

L.push(`\n## Cobertura — ${bairros} bairros, cada um com página própria\n`);
for (const g of conteudo.neighborhoodGroups) {
  L.push(`- **${g.region}** — ${g.neighborhoods.join(", ")}`);
}
L.push("\n## Cidades atendidas\n");
for (const g of conteudo.serviceAreaGroups) {
  L.push(`- **${g.region}** — ${g.cities.join(", ")}`);
}

writeFileSync("docs/MAPA-DO-SITE.md", L.join("\n") + "\n");
console.log(`docs/MAPA-DO-SITE.md: ${rotas.length} páginas, ${noSitemap.size} no sitemap`);
const fora = rotas.filter((r) => !noSitemap.has(r.rota)).map((r) => r.rota);
console.log("páginas fora do sitemap:", fora.length ? fora.join(", ") : "nenhuma");

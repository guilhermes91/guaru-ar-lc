// Exercita o painel de verdade, sem navegador.
//
// O painel é um <script type="module"> dentro de um HTML: o `next build` não o
// compila, o eslint não o lê e o checar-painel.mjs só confere sintaxe. Toda
// regressão de comportamento (estado que descola da tela, desfazer que some,
// seção que não desenha) só aparecia na auditoria seguinte. Este smoke roda os
// caminhos principais contra um DOM mínimo e falha o build se algum quebrar.
import { readFileSync } from "node:fs";

// ---------------------------------------------------------------- DOM mínimo
class No {
  constructor(tag = "#node") {
    this.tag = tag;
    this.filhos = [];
    this.style = {};
    this.dataset = {};
    this.ouvintes = {};
    this.disabled = false;
    this.hidden = false;
    this.value = "";
    this._texto = "";
    this.classList = {
      add: () => {},
      remove: () => {},
      toggle: () => {},
      contains: () => false,
    };
  }
  get textContent() {
    return this._texto || this.filhos.map((f) => f.textContent).join("");
  }
  set textContent(v) {
    this._texto = String(v ?? "");
    this.filhos = [];
  }
  get innerHTML() {
    return this.textContent;
  }
  set innerHTML(v) {
    this._texto = "";
    this.filhos = [];
    if (v) this._texto = String(v);
  }
  append(...itens) {
    for (const i of itens) if (i) this.filhos.push(i);
  }
  appendChild(i) {
    this.append(i);
  }
  addEventListener(evento, fn) {
    (this.ouvintes[evento] ||= []).push(fn);
  }
  disparar(evento, detalhe = {}) {
    for (const fn of this.ouvintes[evento] || []) fn({ preventDefault() {}, ...detalhe });
  }
  focus() {}
  scrollIntoView() {}
  /** Procura na árvore o primeiro nó cujo texto bate. */
  achar(texto) {
    if (this._texto === texto) return this;
    for (const f of this.filhos) {
      const achado = f.achar?.(texto);
      if (achado) return achado;
    }
    return null;
  }
  todos(tag) {
    const saida = this.tag === tag ? [this] : [];
    for (const f of this.filhos) saida.push(...(f.todos?.(tag) || []));
    return saida;
  }
}

const porId = new Map();
for (const id of [
  "tela-login", "tela-app", "form-login", "login-email", "login-senha", "login-aviso",
  "btn-entrar", "btn-esqueci", "menu", "titulo-secao", "estado", "secao", "aviso",
  "desfazer", "btn-publicar", "usuario-logado", "btn-sair", "modal", "modal-corpo",
  "modal-titulo", "modal-texto", "modal-confirmar", "modal-cancelar",
]) porId.set(id, new No(`#${id}`));

globalThis.document = {
  createElement: (tag) => new No(tag),
  querySelector: (sel) => porId.get(sel.replace("#", "")) || new No(sel),
  addEventListener: () => {},
  body: new No("body"),
};
globalThis.window = {
  addEventListener: () => {},
  matchMedia: () => ({ matches: false }),
  scrollTo: () => {},
};
globalThis.confirm = () => true;
globalThis.alert = () => {};
globalThis.URL = { createObjectURL: () => "blob:falso", revokeObjectURL: () => {} };
globalThis.FormData = class {
  append() {}
};
globalThis.File = class {
  constructor(partes, nome, opcoes) {
    this.name = nome;
    this.type = opcoes?.type;
  }
};

// ---------------------------------------------------------------- API falsa
const conteudo = JSON.parse(readFileSync("src/data/content.json", "utf8"));
const chamadas = [];
globalThis.fetch = async (url, opcoes = {}) => {
  chamadas.push({ url: String(url), metodo: opcoes.method || "GET" });
  const corpo = String(url).includes("/api/me")
    ? { email: "dono@exemplo.com" }
    : String(url).includes("/api/content") && (opcoes.method || "GET") === "GET"
      ? { content: JSON.parse(JSON.stringify(conteudo)), sha: "abc123", pending: false }
      : String(url).includes("/api/content")
        ? { ok: true, commit: "f".repeat(40), sha: "def456", updatedAt: "2026-01-01T00:00:00.000Z" }
        : String(url).includes("/api/status")
          ? { run: { status: "completed", conclusion: "success", headSha: "f".repeat(40) } }
          : { ok: true };
  return { ok: true, status: 200, json: async () => corpo, text: async () => "" };
};

// ---------------------------------------------------------------- Executa
const html = readFileSync("public/admin/index.html", "utf8");
const codigo = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const painel = await import(`data:text/javascript,${encodeURIComponent(codigo)}`).catch((erro) => {
  console.error("smoke: o script do painel não carrega\n" + erro.message);
  process.exit(1);
});
void painel;

await new Promise((ok) => setTimeout(ok, 50));

const falhas = [];
const checar = (condicao, oque) => {
  if (!condicao) falhas.push(oque);
};

const secao = porId.get("secao");
const menu = porId.get("menu");
const botoesMenu = menu.todos("button");

checar(chamadas.some((c) => c.url.includes("/api/me")), "não chamou /api/me ao iniciar");
checar(chamadas.some((c) => c.url.includes("/api/content")), "não carregou o conteúdo");
checar(botoesMenu.length === 8, `menu deveria ter 8 seções, tem ${botoesMenu.length}`);

// Desenha todas as seções: uma exceção aqui é tela branca para o cliente.
for (const botao of botoesMenu) {
  const nome = botao.textContent;
  try {
    botao.disparar("click");
  } catch (erro) {
    falhas.push(`seção "${nome}" estourou: ${erro.message}`);
    continue;
  }
  checar(secao.filhos.length > 0, `seção "${nome}" desenhou vazia`);
}

// Publicar precisa chegar no POST.
const antes = chamadas.length;
porId.get("btn-publicar").disparar("click");
await new Promise((ok) => setTimeout(ok, 50));
const posts = chamadas.slice(antes).filter((c) => c.metodo === "POST" && c.url.includes("/api/content"));
checar(posts.length === 1, `publicar deveria fazer 1 POST, fez ${posts.length}`);

if (falhas.length) {
  console.error("smoke do painel falhou:");
  for (const f of falhas) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`public/admin/index.html: smoke ok (${botoesMenu.length} seções desenhadas, publicar chega ao POST)`);

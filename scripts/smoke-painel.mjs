// Exercita o painel de verdade, sem navegador.
//
// O painel é um <script type="module"> dentro de um HTML: o `next build` não o
// compila, o eslint não o lê e o checar-painel.mjs só confere sintaxe. Toda
// regressão de comportamento (estado que descola da tela, desfazer que some,
// seção que não desenha) só aparecia na auditoria seguinte. Este smoke roda os
// caminhos principais contra um DOM mínimo e falha o build se algum quebrar.
//
// Roda duas vezes, e a diferença importa:
//
//  - sobre `content.default.json`, a base de fábrica, que é NOSSA e imutável:
//    aqui valem as asserções que dependem da forma do conteúdo (ter item
//    suficiente para remover, ter campo de lista). Amarrá-las ao conteúdo do
//    cliente transformava uma edição legítima — enxugar o site até uma lista de
//    um item só — em build vermelho, com o site congelado e toda publicação
//    seguinte falhando igual.
//  - sobre `content.json`, o conteúdo publicado: aqui só se cobra o que vale
//    para qualquer conteúdo — as 8 seções desenham e publicar chega ao POST.
//
// Aceita `--painel=<arquivo>` e `--conteudo=<arquivo>` para o
// `scripts/regressoes.mjs` poder rodá-lo contra cópias adulteradas e provar que
// ele REPROVA quando a correção é desfeita. Teste que nunca falhou não vale.
import { readFileSync } from "node:fs";

const argumento = (nome, padrao) => {
  const achado = process.argv.find((a) => a.startsWith(`--${nome}=`));
  return achado ? achado.slice(nome.length + 3) : padrao;
};
const PAINEL = argumento("painel", "public/admin/index.html");
const CONTEUDO = argumento("conteudo", "src/data/content.json");

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

const IDS = [
  "tela-login", "tela-app", "form-login", "login-email", "login-senha", "login-aviso",
  "btn-entrar", "btn-esqueci", "menu", "titulo-secao", "estado", "secao", "aviso",
  "desfazer", "btn-publicar", "usuario-logado", "btn-sair", "modal", "modal-corpo",
  "modal-titulo", "modal-texto", "modal-confirmar", "modal-cancelar",
];

const percorrer = (no, fn) => {
  fn(no);
  for (const filho of no.filhos || []) percorrer(filho, fn);
};
const acharBotao = (raiz, titulo) => {
  let achado = null;
  percorrer(raiz, (no) => {
    if (!achado && no.tag === "button" && no.title === titulo && !no.disabled) achado = no;
  });
  return achado;
};
const esperar = (ms = 50) => new Promise((ok) => setTimeout(ok, ms));

/**
 * Uma rodada completa do painel contra um conteúdo.
 * `estrito` liga as asserções que dependem da forma do conteúdo.
 */
async function rodar(nome, conteudo, { estrito }) {
  const falhas = [];
  const checar = (condicao, oque) => {
    if (!condicao) falhas.push(oque);
  };

  const porId = new Map();
  for (const id of IDS) porId.set(id, new No(`#${id}`));

  globalThis.document = {
    createElement: (tag) => new No(tag),
    querySelector: (sel) => porId.get(sel.replace("#", "")) || new No(sel),
    addEventListener: () => {},
    body: new No("body"),
  };
  globalThis.window = { addEventListener: () => {}, matchMedia: () => ({ matches: false }), scrollTo: () => {} };
  globalThis.confirm = () => true;
  globalThis.alert = () => {};
  globalThis.URL = { createObjectURL: () => "blob:falso", revokeObjectURL: () => {} };
  globalThis.FormData = class {
    append() {}
  };
  globalThis.File = class {
    constructor(partes, arquivo, opcoes) {
      this.name = arquivo;
      this.type = opcoes?.type;
    }
  };

  // ------------------------------------------------------------- API falsa
  const chamadas = [];
  // Quando ligado, o POST de publicação fica em voo até ser liberado: é assim
  // que se exercita o que o cliente faz enquanto a tela diz "Publicando…".
  let segurarPost = null;
  globalThis.fetch = async (url, opcoes = {}) => {
    const metodo = opcoes.method || "GET";
    chamadas.push({ url: String(url), metodo, corpo: opcoes.body });
    const resposta = (corpo) => ({ ok: true, status: 200, json: async () => corpo, text: async () => "" });
    if (String(url).includes("/api/me")) return resposta({ email: "dono@exemplo.com" });
    if (String(url).includes("/api/status")) {
      return resposta({ run: { status: "completed", conclusion: "success", headSha: "f".repeat(40) } });
    }
    if (String(url).includes("/api/content")) {
      if (metodo === "GET") return resposta({ content: JSON.parse(JSON.stringify(conteudo)), sha: "abc123", pending: false });
      if (segurarPost) await segurarPost;
      return resposta({ ok: true, commit: "f".repeat(40), sha: "def456", updatedAt: "2026-01-01T00:00:00.000Z" });
    }
    return resposta({ ok: true });
  };

  // -------------------------------------------------------------- Executa
  const html = readFileSync(PAINEL, "utf8");
  const codigo = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
  // O comentário no fim muda o especificador: sem isso a segunda rodada
  // reaproveitaria o módulo já carregado, com o estado da primeira.
  const painel = await import(`data:text/javascript,${encodeURIComponent(`${codigo}\n//${nome}`)}`).catch((erro) => {
    console.error(`smoke (${nome}): o script do painel não carrega\n${erro.message}`);
    process.exit(1);
  });
  void painel;

  await esperar();

  const secao = porId.get("secao");
  const menu = porId.get("menu");
  const desfazer = porId.get("desfazer");
  const publicar = porId.get("btn-publicar");
  const botoesMenu = menu.todos("button");

  checar(chamadas.some((c) => c.url.includes("/api/me")), "não chamou /api/me ao iniciar");
  checar(chamadas.some((c) => c.url.includes("/api/content")), "não carregou o conteúdo");
  checar(botoesMenu.length === 8, `menu deveria ter 8 seções, tem ${botoesMenu.length}`);

  // Desenha todas as seções: uma exceção aqui é tela branca para o cliente.
  for (const botao of botoesMenu) {
    const secaoNome = botao.textContent;
    try {
      botao.disparar("click");
    } catch (erro) {
      falhas.push(`seção "${secaoNome}" estourou: ${erro.message}`);
      continue;
    }
    checar(secao.filhos.length > 0, `seção "${secaoNome}" desenhou vazia`);
  }

  // Publicar precisa chegar no POST.
  const antesDoPublicar = chamadas.length;
  publicar.disparar("click");
  await esperar();
  const posts = chamadas.slice(antesDoPublicar).filter((c) => c.metodo === "POST" && c.url.includes("/api/content"));
  checar(posts.length === 1, `publicar deveria fazer 1 POST, fez ${posts.length}`);

  if (!estrito) return falhas;

  // ------------------------------------------------- regressões já pagas caro
  // Todas daqui para baixo dependem da forma do conteúdo, por isso só rodam
  // sobre a base de fábrica.

  /** Vai para a primeira seção com pelo menos `quantos` itens removíveis. */
  const irParaSecaoComRemoviveis = (quantos) => {
    for (const botao of botoesMenu) {
      botao.disparar("click");
      let habilitados = 0;
      percorrer(secao, (no) => {
        if (no.tag === "button" && no.title === "Remover" && !no.disabled) habilitados += 1;
      });
      if (habilitados >= quantos) return acharBotao(secao, "Remover");
    }
    return null;
  };
  const botoesDesfazer = () => desfazer.todos("button").filter((b) => b.textContent === "Desfazer");
  const contarDesfazeres = () => botoesDesfazer().length;
  const removiveis = () => {
    const saida = [];
    percorrer(secao, (no) => {
      if (no.tag === "button" && no.title === "Remover" && !no.disabled) saida.push(no);
    });
    return saida;
  };
  const titulosDaSecao = () => {
    const saida = [];
    percorrer(secao, (no) => {
      if (no.className === "cabeca" && no.filhos[0]) saida.push(no.filhos[0].textContent);
    });
    return saida;
  };

  // Desfazer é LIFO. O índice guardado em cada remoção é a posição de quando
  // ela aconteceu; desfazendo fora de ordem ele já não vale, e um item que
  // ninguém tocou trocava de lugar — e ia assim para o site. Só o mais recente
  // pode estar ativo, e desfazer os dois tem que devolver a ordem original.
  const paraOrdem = irParaSecaoComRemoviveis(3);
  checar(Boolean(paraOrdem), "não achei seção com três itens removíveis para o teste de ordem do desfazer");
  if (paraOrdem) {
    const ordemOriginal = titulosDaSecao();
    removiveis()[0].disparar("click");
    const restantes = removiveis();
    restantes[restantes.length - 1].disparar("click");
    const ativos = botoesDesfazer().filter((b) => !b.disabled);
    checar(
      ativos.length === 1,
      `com duas remoções pendentes só o desfazer mais recente pode estar ativo, há ${ativos.length} ativos: desfazer fora de ordem reordena item que ninguém tocou`,
    );
    // Duas voltas: a segunda entrada só fica clicável depois da primeira sair.
    for (let volta = 0; volta < 2; volta += 1) {
      const ativo = botoesDesfazer().find((b) => !b.disabled);
      if (ativo) ativo.disparar("click");
    }
    const ordemDepois = titulosDaSecao();
    checar(
      ordemDepois.join(" | ") === ordemOriginal.join(" | "),
      `desfazer as duas remoções não devolveu a ordem original:\n      antes:  ${ordemOriginal.join(" | ")}\n      depois: ${ordemDepois.join(" | ")}`,
    );
    checar(contarDesfazeres() === 0, "sobrou desfazer pendente depois de desfazer os dois");
  }

  // Remoção feita DURANTE o envio não foi publicada: o desfazer dela tem que
  // sobreviver. Zerar a fila inteira apagava a única volta de um "×" clicado
  // sem querer nos 2s de "Publicando…" — e o item sumia do painel sem estar
  // fora do site. Vem antes do teste seguinte porque precisa de dois itens
  // removíveis na mesma seção, e cada remoção encurta a lista.
  const removerA = irParaSecaoComRemoviveis(2);
  checar(Boolean(removerA), "não achei seção com dois itens removíveis para o teste de envio em voo");
  if (removerA) {
    removerA.disparar("click");
    let liberar;
    segurarPost = new Promise((ok) => (liberar = ok));
    publicar.disparar("click");
    await esperar();
    const removerB = acharBotao(secao, "Remover");
    checar(Boolean(removerB), "não achei um segundo item para remover durante o envio");
    if (removerB) {
      removerB.disparar("click");
      checar(contarDesfazeres() === 2, `durante o envio deveria haver 2 desfazeres, há ${contarDesfazeres()}`);
    }
    // Fora do `if`: sem liberar, o POST fica pendurado, `estado.publicando`
    // nunca volta a false e todo teste seguinte deixa de publicar em silêncio.
    liberar();
    await esperar();
    segurarPost = null;
    if (removerB) {
      const depois = contarDesfazeres();
      checar(
        depois === 1,
        `a remoção feita durante o envio perdeu o desfazer (sobraram ${depois} de 1): o item sumiu do painel sem ter saído do site`,
      );
    }
  }

  // A caixa de desfazer promete "só saem do site quando você publicar". Depois
  // da publicação ela precisa sumir: enquanto ficava na tela, dizia o contrário
  // do que tinha acontecido e o botão ressuscitava o item no meio do deploy.
  const remover = irParaSecaoComRemoviveis(1);
  checar(Boolean(remover), "não achei botão de remover para exercitar o desfazer");
  if (remover) {
    remover.disparar("click");
    checar(desfazer.textContent.includes("Desfazer"), "remover não ofereceu desfazer");
    publicar.disparar("click");
    await esperar();
    checar(desfazer.textContent === "", "a caixa de desfazer sobreviveu à publicação: o painel oferece desfazer de item que já foi ao ar");
  }

  // Bairro/cidade digitado e não confirmado com Enter tem que entrar na
  // publicação: era descartado em silêncio, com "Alterações enviadas" na tela.
  let entradaLista = null;
  for (const botao of botoesMenu) {
    botao.disparar("click");
    percorrer(secao, (no) => {
      if (!entradaLista && no.className === "adicionar") entradaLista = (no.filhos || []).find((f) => f.tag === "input");
    });
    if (entradaLista) break;
  }
  checar(Boolean(entradaLista), "não achei campo de lista (bairros/cidades) para exercitar");
  if (entradaLista) {
    entradaLista.value = "Bairro Do Smoke";
    entradaLista.disparar("blur");
    const antesDoEnvio = chamadas.length;
    publicar.disparar("click");
    await esperar();
    const enviado = chamadas.slice(antesDoEnvio).find((c) => c.metodo === "POST" && c.url.includes("/api/content"));
    checar(
      enviado && String(enviado.corpo).includes("Bairro Do Smoke"),
      "o que foi digitado no campo de lista não entrou na publicação",
    );
  }

  return falhas;
}

const rodadas = [
  ["padrão de fábrica", "src/data/content.default.json", { estrito: true }],
  ["conteúdo publicado", CONTEUDO, { estrito: false }],
];

let quebrou = false;
for (const [nome, caminho, opcoes] of rodadas) {
  const falhas = await rodar(nome, JSON.parse(readFileSync(caminho, "utf8")), opcoes);
  if (falhas.length) {
    quebrou = true;
    console.error(`smoke do painel falhou sobre ${nome} (${caminho}):`);
    for (const f of falhas) console.error(`  - ${f}`);
  }
}
if (quebrou) process.exit(1);
console.log("public/admin/index.html: smoke ok (fábrica com as regressões travadas, conteúdo publicado desenhando as 8 seções)");

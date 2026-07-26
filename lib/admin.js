// Helpers compartilhados pelas Functions do painel.
// Fica fora de /functions de propósito: só o que está em /functions vira rota HTTP.

const COOKIE = "gar_session";
const SESSION_TTL = 60 * 60 * 8; // 8 horas
const USER_KEY = "user";
const DRAFT_KEY = "content:draft";

// Nenhuma credencial mora no código: o repositório é público.
// O primeiro acesso nasce de ADMIN_EMAIL/ADMIN_PASSWORD (variáveis do Cloudflare),
// e a senha é gravada só como hash. Para redefinir, troque a variável e apague
// a chave "user" do KV — o próximo login volta a nascer do ambiente.
const PBKDF2_ITERATIONS = 600_000; // recomendação OWASP para PBKDF2-HMAC-SHA256
const TEMP_TTL_MS = 30 * 60 * 1000; // validade da senha provisória da recuperação

const hex = (buffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function hashPassword(password, salt, iteracoes = PBKDF2_ITERATIONS) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: iteracoes },
    key,
    256,
  );
  return hex(bits);
}

/** Compara sem vazar em quanto tempo as strings divergem. */
function sameSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function buildUser(email, password) {
  const salt = crypto.randomUUID();
  return {
    email: String(email).trim().toLowerCase(),
    salt,
    hash: await hashPassword(password, salt),
    // Gravado junto do hash: se um dia PBKDF2_ITERATIONS subir, os registros
    // antigos continuam sendo conferidos com o número que os gerou.
    iter: PBKDF2_ITERATIONS,
  };
}

/** Aceita a senha do usuário ou uma provisória ainda dentro da validade. */
export async function checkPassword(user, password) {
  if (typeof password !== "string" || password.length === 0) return false;
  const iter = user?.iter || 100_000; // registros anteriores ao campo

  if (user?.salt && user?.hash && sameSecret(await hashPassword(password, user.salt, iter), user.hash)) {
    return true;
  }
  if (user?.tempSalt && user?.tempHash && Date.parse(user.tempExpira || "") > Date.now()) {
    return sameSecret(await hashPassword(password, user.tempSalt, iter), user.tempHash);
  }
  return false;
}

/**
 * Guarda a senha provisória da recuperação AO LADO da atual, com validade curta.
 * Trocar a senha de verdade aqui deixaria qualquer visitante anônimo derrubar o
 * acesso do cliente só chamando /api/recover.
 */
export async function guardarSenhaProvisoria(env, user, senha) {
  const tempSalt = crypto.randomUUID();
  const iter = user?.iter || 100_000;
  await saveUser(env, {
    ...user,
    tempSalt,
    tempHash: await hashPassword(senha, tempSalt, iter),
    tempExpira: new Date(Date.now() + TEMP_TTL_MS).toISOString(),
  });
}

/** Remove a senha provisória — chamado quando o cliente define uma nova senha. */
export function semSenhaProvisoria(user) {
  const limpo = { ...user };
  delete limpo.tempSalt;
  delete limpo.tempHash;
  delete limpo.tempExpira;
  return limpo;
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

export function bad(message, status = 400) {
  return json({ error: message }, status);
}

/**
 * Envolve o handler da rota. Sem isso, uma exceção inesperada faz a Function
 * morrer e o Cloudflare responde `error code: 1101` em texto puro — o painel
 * não consegue ler, e o cliente fica sem saber o que aconteceu.
 */
export function rota(handler) {
  return async (contexto) => {
    try {
      return await handler(contexto);
    } catch (error) {
      return bad(error?.message || "Não consegui completar a ação. Tente de novo.", 500);
    }
  };
}

/** Corpo JSON com os campos esperados sempre como string. */
export async function corpoTexto(request, campos) {
  const corpo = await request.json().catch(() => ({}));
  const saida = {};
  for (const campo of campos) {
    saida[campo] = typeof corpo?.[campo] === "string" ? corpo[campo] : "";
  }
  return saida;
}

/**
 * Lê o usuário do KV. Só aceita registro com hash; qualquer coisa fora disso
 * (KV vazio ou registro antigo com senha em claro) é reconstruída do ambiente.
 */
export async function getUser(env) {
  const stored = await env.ADMIN_KV.get(USER_KEY, "json");
  if (stored?.email && stored?.salt && stored?.hash) return stored;

  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    throw new Error("Acesso ao painel não configurado. Defina ADMIN_EMAIL e ADMIN_PASSWORD.");
  }
  const user = await buildUser(env.ADMIN_EMAIL, env.ADMIN_PASSWORD);
  await env.ADMIN_KV.put(USER_KEY, JSON.stringify(user));
  return user;
}

export async function saveUser(env, user) {
  await env.ADMIN_KV.put(USER_KEY, JSON.stringify(user));
}

function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function createSession(env, email) {
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  await env.ADMIN_KV.put(`session:${token}`, email, { expirationTtl: SESSION_TTL });
  return token;
}

export function sessionCookie(token) {
  return `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL}`;
}

export function clearedCookie() {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

/** Retorna o e-mail da sessão válida ou null. */
export async function currentSession(request, env) {
  const token = readCookie(request, COOKIE);
  if (!token) return null;
  const email = await env.ADMIN_KV.get(`session:${token}`);
  return email ? { token, email } : null;
}

export async function destroySession(request, env) {
  const token = readCookie(request, COOKIE);
  if (token) await env.ADMIN_KV.delete(`session:${token}`);
}

/** Guarda de rota: devolve a sessão ou uma Response 401 pronta. */
export async function requireSession(request, env) {
  const session = await currentSession(request, env);
  return session || bad("Sessão expirada. Faça login novamente.", 401);
}

// ---------------------------------------------------------------- GitHub

const CONTENT_PATH = "src/data/content.json";

function ghHeaders(env) {
  return {
    authorization: `Bearer ${env.GITHUB_TOKEN}`,
    accept: "application/vnd.github+json",
    "user-agent": "guaru-ar-lc-admin",
    "content-type": "application/json",
  };
}

async function ghFetch(env, path, init = {}) {
  const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}${path}`, {
    ...init,
    headers: ghHeaders(env),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || `GitHub respondeu ${response.status}`);
  }
  return body;
}

const branch = (env) => env.GITHUB_BRANCH || "main";

/** Conteúdo publicado no repositório, com o sha necessário para o próximo commit. */
export async function fetchContent(env) {
  const file = await ghFetch(env, `/contents/${CONTENT_PATH}?ref=${branch(env)}`);
  const decoded = new TextDecoder().decode(
    Uint8Array.from(atob(file.content.replace(/\n/g, "")), (c) => c.charCodeAt(0)),
  );
  return { content: JSON.parse(decoded), sha: file.sha };
}

/** Grava um arquivo no repositório. `body` é string (texto) ou base64 puro. */
export async function commitFile(env, { path, base64, message, sha }) {
  return ghFetch(env, `/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({ message, content: base64, branch: branch(env), ...(sha ? { sha } : {}) }),
  });
}

export function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Rascunho no KV: o painel lê daqui enquanto o build do site não terminou. */
export const draft = {
  get: (env) => env.ADMIN_KV.get(DRAFT_KEY, "json"),
  put: (env, content) => env.ADMIN_KV.put(DRAFT_KEY, JSON.stringify(content)),
  clear: (env) => env.ADMIN_KV.delete(DRAFT_KEY),
};

/**
 * O deploy do commit feito em `desde` já terminou com sucesso?
 * Na dúvida (erro de rede, run ausente) devolve false: melhor o painel dizer
 * "publicando" a mais do que anunciar que o site já está atualizado sem estar.
 */
export async function deployConcluido(env, desde) {
  try {
    const run = await latestWorkflowRun(env);
    if (!run || run.status !== "completed" || run.conclusion !== "success") return false;
    if (!desde) return true;
    return new Date(run.createdAt).getTime() >= new Date(desde).getTime() - 60_000;
  } catch {
    return false;
  }
}

export async function latestWorkflowRun(env) {
  const data = await ghFetch(env, `/actions/runs?branch=${branch(env)}&per_page=1`);
  const run = (data.workflow_runs || [])[0];
  if (!run) return null;
  // headSha: sem ele o painel não tem como saber se o run que está vendo é o do
  // commit que ele acabou de criar, ou um anterior que já estava concluído.
  return {
    status: run.status,
    conclusion: run.conclusion,
    url: run.html_url,
    createdAt: run.created_at,
    headSha: run.head_sha,
  };
}

// ---------------------------------------------------------------- E-mail

export async function sendMail(env, { to, subject, text }) {
  if (!env.RESEND_API_KEY) throw new Error("Envio de e-mail não configurado.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM || "Guaru Ar LC <onboarding@resend.dev>", to, subject, text }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Falha ao enviar e-mail: ${detail}`);
  }
}

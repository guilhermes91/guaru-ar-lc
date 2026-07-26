// Helpers compartilhados pelas Functions do painel.
// Fica fora de /functions de propósito: só o que está em /functions vira rota HTTP.

const COOKIE = "gar_session";
const SESSION_TTL = 60 * 60 * 8; // 8 horas
const USER_KEY = "user";
const DRAFT_KEY = "content:draft";

export const DEFAULT_USER = {
  email: "guaruar@softuria.com",
  password: "guaruar@013",
};

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

export function bad(message, status = 400) {
  return json({ error: message }, status);
}

/** Lê o usuário do KV, caindo no padrão na primeira execução. */
export async function getUser(env) {
  const stored = await env.ADMIN_KV.get(USER_KEY, "json");
  if (stored && stored.email && stored.password) return stored;
  await env.ADMIN_KV.put(USER_KEY, JSON.stringify(DEFAULT_USER));
  return { ...DEFAULT_USER };
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

export async function latestWorkflowRun(env) {
  const data = await ghFetch(env, `/actions/runs?branch=${branch(env)}&per_page=1`);
  const run = (data.workflow_runs || [])[0];
  if (!run) return null;
  return { status: run.status, conclusion: run.conclusion, url: run.html_url, createdAt: run.created_at };
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

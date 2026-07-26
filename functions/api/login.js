import { bad, createSession, getUser, json, sessionCookie } from "../../lib/admin.js";

const MAX_ATTEMPTS = 8;
const WINDOW = 60 * 10; // 10 minutos

export async function onRequestPost({ request, env }) {
  const { email = "", password = "" } = await request.json().catch(() => ({}));

  const ip = request.headers.get("cf-connecting-ip") || "desconhecido";
  const key = `login-attempts:${ip}`;
  const attempts = Number((await env.ADMIN_KV.get(key)) || 0);
  if (attempts >= MAX_ATTEMPTS) {
    return bad("Muitas tentativas. Aguarde 10 minutos e tente novamente.", 429);
  }

  const user = await getUser(env);
  const ok = email.trim().toLowerCase() === user.email.toLowerCase() && password === user.password;

  if (!ok) {
    await env.ADMIN_KV.put(key, String(attempts + 1), { expirationTtl: WINDOW });
    return bad("E-mail ou senha incorretos.", 401);
  }

  await env.ADMIN_KV.delete(key);
  const token = await createSession(env, user.email);
  return json({ email: user.email }, 200, { "set-cookie": sessionCookie(token) });
}

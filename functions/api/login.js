import { bad, checkPassword, corpoTexto, createSession, getUser, json, rota, sessionCookie } from "../../lib/admin.js";

const MAX_ATTEMPTS = 10;
const WINDOW = 60 * 5; // 5 minutos

export const onRequestPost = rota(async ({ request, env }) => {
  const { email, password } = await corpoTexto(request, ["email", "password"]);

  const ip = request.headers.get("cf-connecting-ip") || "desconhecido";
  const key = `login-attempts:${ip}`;
  const attempts = Number((await env.ADMIN_KV.get(key)) || 0);

  // Bloqueio de verdade, antes de conferir a senha: se a checagem rodasse
  // sempre, o 429 seria só um texto e não haveria limite nenhum.
  // Janela curta (5 min) e teto folgado (10) para o dono não se trancar sozinho.
  if (attempts >= MAX_ATTEMPTS) {
    return bad("Muitas tentativas. Aguarde 5 minutos e tente novamente.", 429);
  }

  const user = await getUser(env);
  const ok =
    email.trim().toLowerCase() === user.email.toLowerCase() && (await checkPassword(user, password));

  if (!ok) {
    await env.ADMIN_KV.put(key, String(attempts + 1), { expirationTtl: WINDOW });
    return bad("E-mail ou senha incorretos.", 401);
  }

  // put em vez de delete: o KV é eventualmente consistente e um delete pode
  // demorar a propagar, deixando o cliente com 429 mesmo após acertar a senha.
  await env.ADMIN_KV.put(key, "0", { expirationTtl: 60 });
  const token = await createSession(env, user.email);
  return json({ email: user.email }, 200, { "set-cookie": sessionCookie(token) });
});

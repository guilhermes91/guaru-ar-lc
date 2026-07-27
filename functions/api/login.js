import { bad, checkPassword, corpoTexto, createSession, getUser, json, rota, sessionCookie } from "../../lib/admin.js";

const MAX_ATTEMPTS = 8;
const WINDOW = 60 * 10; // 10 minutos

export const onRequestPost = rota(async ({ request, env }) => {
  const { email, password } = await corpoTexto(request, ["email", "password"]);

  const ip = request.headers.get("cf-connecting-ip") || "desconhecido";
  const key = `login-attempts:${ip}`;
  const attempts = Number((await env.ADMIN_KV.get(key)) || 0);

  // A senha é conferida ANTES do bloqueio: quem acerta entra e zera o contador.
  // Barrar a credencial correta trancaria o dono por 10 minutos por causa dos
  // próprios erros de digitação — e num IP compartilhado, por erros de outros.
  const user = await getUser(env);
  const ok =
    email.trim().toLowerCase() === user.email.toLowerCase() && (await checkPassword(user, password));

  if (!ok) {
    await env.ADMIN_KV.put(key, String(attempts + 1), { expirationTtl: WINDOW });
    return attempts + 1 >= MAX_ATTEMPTS
      ? bad("Muitas tentativas. Aguarde 10 minutos e tente novamente.", 429)
      : bad("E-mail ou senha incorretos.", 401);
  }

  // Só o palpite errado é limitado. O acerto sempre passa.

  // put em vez de delete: o KV é eventualmente consistente e um delete pode
  // demorar a propagar, deixando o cliente com 429 mesmo após acertar a senha.
  await env.ADMIN_KV.put(key, "0", { expirationTtl: 60 });
  const token = await createSession(env, user.email);
  return json({ email: user.email }, 200, { "set-cookie": sessionCookie(token) });
});

import { bad, getUser, json, sendMail } from "../../lib/admin.js";

const WINDOW = 60 * 15; // 15 minutos entre envios, por IP

export async function onRequestPost({ request, env }) {
  const { email = "" } = await request.json().catch(() => ({}));

  const ip = request.headers.get("cf-connecting-ip") || "desconhecido";
  const key = `recover:${ip}`;
  if (await env.ADMIN_KV.get(key)) {
    return bad("Já enviamos um e-mail recentemente. Aguarde alguns minutos.", 429);
  }

  const user = await getUser(env);

  // Resposta idêntica com e-mail certo ou errado: não revela qual é o e-mail cadastrado.
  if (email.trim().toLowerCase() === user.email.toLowerCase()) {
    await env.ADMIN_KV.put(key, "1", { expirationTtl: WINDOW });
    try {
      await sendMail(env, {
        to: user.email,
        subject: "Guaru Ar LC — sua senha do painel",
        text: [
          "Você pediu para recuperar o acesso ao painel do site.",
          "",
          `Endereço: ${new URL(request.url).origin}/admin/`,
          `E-mail: ${user.email}`,
          `Senha: ${user.password}`,
          "",
          "Se não foi você, troque a senha em Usuário dentro do painel.",
        ].join("\n"),
      });
    } catch (error) {
      return bad(`Não consegui enviar o e-mail: ${error.message}`, 502);
    }
  }

  return json({ ok: true });
}

import { bad, buildUser, getUser, json, saveUser, sendMail } from "../../lib/admin.js";

const WINDOW = 60 * 15; // 15 minutos entre envios, por IP

// Alfabeto sem 0/O e 1/l/I: a senha vai ser lida de um e-mail e digitada à mão.
const ALFABETO = "abcdefghijkmnopqrstuvwxyz23456789";

function senhaProvisoria() {
  const sorteio = crypto.getRandomValues(new Uint8Array(12));
  const letras = [...sorteio].map((n) => ALFABETO[n % ALFABETO.length]);
  // Em blocos de 4 para facilitar a digitação: "abcd-efgh-ijkl".
  return [letras.slice(0, 4), letras.slice(4, 8), letras.slice(8, 12)].map((b) => b.join("")).join("-");
}

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

    // A senha guardada é um hash e não tem volta. Em vez de "lembrar" a antiga,
    // sorteamos uma nova e enviamos essa — o cliente entra e troca no painel.
    const provisoria = senhaProvisoria();
    try {
      await sendMail(env, {
        to: user.email,
        subject: "Guaru Ar LC — nova senha do painel",
        text: [
          "Você pediu para recuperar o acesso ao painel do site.",
          "",
          "Criamos uma senha nova. A senha anterior deixou de valer.",
          "",
          `Endereço: ${new URL(request.url).origin}/admin/`,
          `E-mail: ${user.email}`,
          `Senha: ${provisoria}`,
          "",
          "Entre com ela e troque por uma senha sua em Usuário, dentro do painel.",
          "Se não foi você que pediu, entre agora e troque a senha.",
        ].join("\n"),
      });
    } catch (error) {
      return bad(`Não consegui enviar o e-mail: ${error.message}`, 502);
    }

    // Só troca depois que o e-mail saiu: se o envio falhar, a senha atual continua valendo.
    await saveUser(env, await buildUser(user.email, provisoria));
  }

  return json({ ok: true });
}

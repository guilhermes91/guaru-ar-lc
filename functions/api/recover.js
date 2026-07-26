import { bad, getUser, guardarSenhaProvisoria, json, rota, sendMail } from "../../lib/admin.js";

const WINDOW = 60 * 15; // 15 minutos entre envios, por IP

// Alfabeto sem 0/O e 1/l/I: a senha vai ser lida de um e-mail e digitada à mão.
const ALFABETO = "abcdefghijkmnopqrstuvwxyz23456789";

function senhaProvisoria() {
  const sorteio = crypto.getRandomValues(new Uint8Array(12));
  const letras = [...sorteio].map((n) => ALFABETO[n % ALFABETO.length]);
  // Em blocos de 4 para facilitar a digitação: "abcd-efgh-ijkl".
  return [letras.slice(0, 4), letras.slice(4, 8), letras.slice(8, 12)].map((b) => b.join("")).join("-");
}

export const onRequestPost = rota(async ({ request, env }) => {
  const corpo = await request.json().catch(() => ({}));
  const email = typeof corpo?.email === "string" ? corpo.email : "";

  const ip = request.headers.get("cf-connecting-ip") || "desconhecido";
  const key = `recover:${ip}`;
  if (await env.ADMIN_KV.get(key)) {
    return bad("Já enviamos um e-mail recentemente. Aguarde alguns minutos.", 429);
  }
  // Grava a janela ANTES de olhar o e-mail. Se só gravasse quando acerta, o 429
  // seguinte diria "esse e-mail existe" — um oráculo de enumeração gratuito.
  await env.ADMIN_KV.put(key, "1", { expirationTtl: WINDOW });

  const user = await getUser(env);

  // Resposta idêntica com e-mail certo ou errado: não revela qual é o cadastrado.
  if (email.trim().toLowerCase() === user.email.toLowerCase()) {
    // A senha guardada é um hash e não tem volta, então sorteamos uma provisória.
    // Ela ENTRA AO LADO da senha atual, que continua valendo: assim quem dispara
    // esta rota sem ser o dono não consegue trancar o dono para fora.
    const provisoria = senhaProvisoria();
    try {
      await sendMail(env, {
        to: user.email,
        subject: "Guaru Ar LC — senha provisória do painel",
        text: [
          "Você pediu para recuperar o acesso ao painel do site.",
          "",
          `Endereço: ${new URL(request.url).origin}/admin/`,
          `E-mail: ${user.email}`,
          `Senha provisória: ${provisoria}`,
          "",
          "Ela vale por 30 minutos. Sua senha antiga continua funcionando.",
          "Entre e defina uma senha nova em Usuário, dentro do painel.",
          "",
          "Se não foi você que pediu, ignore este e-mail: nada mudou na sua conta.",
        ].join("\n"),
      });
    } catch (error) {
      // Devolver 502 aqui diria "esse e-mail existe" — o caminho do e-mail
      // errado responde 200. E `error.message` traz o corpo da API de e-mail.
      console.error("recover: falha ao enviar", error?.message);
      return json({ ok: true });
    }

    // Só grava depois que o e-mail saiu: se o envio falhar, nada muda.
    await guardarSenhaProvisoria(env, user, provisoria);
  }

  return json({ ok: true });
});

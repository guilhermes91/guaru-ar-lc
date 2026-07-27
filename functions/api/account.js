import {
  bad,
  buildUser,
  checkPassword,
  corpoTexto,
  encerrarOutrasSessoes,
  getUser,
  json,
  requireSession,
  rota,
  saveUser,
  semSenhaProvisoria,
  sendMail,
} from "../../lib/admin.js";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MIN_PASSWORD = 8;

export const onRequestPost = rota(async ({ request, env }) => {
  const session = await requireSession(request, env);
  if (session instanceof Response) return session;

  // corpoTexto força string: `{"password": 123}` tem length undefined e passaria
  // pelo mínimo de caracteres, gravando uma senha de 3 dígitos.
  // Lê o corpo cru antes: `corpoTexto` transforma não-string em "", e "" cai no
  // ramo "só troca o e-mail" — devolvendo 200 sem ter trocado a senha nenhuma.
  const cru = await request.clone().json().catch(() => ({}));
  if (cru?.password !== undefined && typeof cru.password !== "string") {
    return bad("A nova senha precisa ser um texto.");
  }

  const { currentPassword, email, password } = await corpoTexto(request, [
    "currentPassword",
    "email",
    "password",
  ]);
  const user = await getUser(env);

  if (!(await checkPassword(user, currentPassword))) return bad("A senha atual está incorreta.", 403);

  const nextEmail = (email.trim() || user.email).toLowerCase();
  if (!EMAIL.test(nextEmail)) return bad("Informe um e-mail válido.");

  // Recusas antes de qualquer envio: senha curta devolvia 400 sem gravar nada,
  // mas o e-mail de confirmação já tinha saído anunciando a troca.
  if (password && password.length < MIN_PASSWORD) {
    return bad(`A nova senha precisa ter ao menos ${MIN_PASSWORD} caracteres.`);
  }

  // Confirma que o endereço novo recebe ANTES de gravá-lo. É para ele que a
  // recuperação de senha passa a ir: se não entregar, o dono perde o painel
  // sem aviso e sem volta (o remetente de teste do Resend, por exemplo, só
  // entrega no e-mail dono da conta).
  if (nextEmail !== user.email) {
    try {
      await sendMail(env, {
        to: nextEmail,
        subject: "Guaru Ar LC — confirmação do e-mail do painel",
        text: [
          "Este endereço passou a ser o e-mail de acesso ao painel do site.",
          "",
          "É para cá que a recuperação de senha será enviada daqui em diante.",
          "Se você não reconhece esta mudança, avise quem cuida do site.",
        ].join("\n"),
      });
    } catch (error) {
      console.error("account: e-mail novo não recebe", error?.message);
      return bad(
        "Não consegui enviar a confirmação para esse e-mail, então não troquei o endereço. Confira se está escrito certo — é para ele que a recuperação de senha vai.",
        502,
      );
    }
  }

  // Sem senha nova, mantém o hash atual e só troca o e-mail.
  if (!password) {
    await saveUser(env, { ...user, email: nextEmail });
    return json({ ok: true, email: nextEmail });
  }

  if (password.length < MIN_PASSWORD) {
    return bad(`A nova senha precisa ter ao menos ${MIN_PASSWORD} caracteres.`);
  }

  // Definir senha nova encerra qualquer provisória em aberto.
  await saveUser(env, semSenhaProvisoria(await buildUser(nextEmail, password)));
  // E derruba as outras sessões: quem troca a senha por suspeita de invasão
  // espera que quem já estava dentro seja desconectado.
  await encerrarOutrasSessoes(env, session.token);
  return json({ ok: true, email: nextEmail });
});

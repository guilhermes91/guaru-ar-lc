import {
  bad,
  buildUser,
  checkPassword,
  corpoTexto,
  getUser,
  json,
  requireSession,
  rota,
  saveUser,
  semSenhaProvisoria,
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
  return json({ ok: true, email: nextEmail });
});

import { bad, buildUser, checkPassword, getUser, json, requireSession, saveUser } from "../../lib/admin.js";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MIN_PASSWORD = 8;

export async function onRequestPost({ request, env }) {
  const session = await requireSession(request, env);
  if (session instanceof Response) return session;

  const { currentPassword = "", email = "", password = "" } = await request.json().catch(() => ({}));
  const user = await getUser(env);

  if (!(await checkPassword(user, currentPassword))) return bad("A senha atual está incorreta.", 403);

  const nextEmail = email.trim() || user.email;
  if (!EMAIL.test(nextEmail)) return bad("Informe um e-mail válido.");

  // Sem senha nova, mantém o hash atual e só troca o e-mail.
  if (!password) {
    await saveUser(env, { ...user, email: nextEmail.toLowerCase() });
    return json({ ok: true, email: nextEmail.toLowerCase() });
  }

  if (password.length < MIN_PASSWORD) {
    return bad(`A nova senha precisa ter ao menos ${MIN_PASSWORD} caracteres.`);
  }

  await saveUser(env, await buildUser(nextEmail, password));
  return json({ ok: true, email: nextEmail.toLowerCase() });
}

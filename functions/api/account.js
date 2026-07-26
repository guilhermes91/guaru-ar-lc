import { bad, getUser, json, requireSession, saveUser } from "../../lib/admin.js";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function onRequestPost({ request, env }) {
  const session = await requireSession(request, env);
  if (session instanceof Response) return session;

  const { currentPassword = "", email = "", password = "" } = await request.json().catch(() => ({}));
  const user = await getUser(env);

  if (currentPassword !== user.password) return bad("A senha atual está incorreta.", 403);

  const nextEmail = email.trim() || user.email;
  if (!EMAIL.test(nextEmail)) return bad("Informe um e-mail válido.");

  const nextPassword = password || user.password;
  if (nextPassword.length < 6) return bad("A nova senha precisa ter ao menos 6 caracteres.");

  await saveUser(env, { ...user, email: nextEmail, password: nextPassword });
  return json({ ok: true, email: nextEmail });
}

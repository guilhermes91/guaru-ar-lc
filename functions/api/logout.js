import { clearedCookie, destroySession, json } from "../../lib/admin.js";

export async function onRequestPost({ request, env }) {
  await destroySession(request, env);
  return json({ ok: true }, 200, { "set-cookie": clearedCookie() });
}

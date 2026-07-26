import { clearedCookie, destroySession, json, rota } from "../../lib/admin.js";

export const onRequestPost = rota(async ({ request, env }) => {
  await destroySession(request, env);
  return json({ ok: true }, 200, { "set-cookie": clearedCookie() });
});

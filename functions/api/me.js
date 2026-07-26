import { bad, currentSession, json, rota } from "../../lib/admin.js";

export const onRequestGet = rota(async ({ request, env }) => {
  const session = await currentSession(request, env);
  if (!session) return bad("Não autenticado.", 401);
  return json({ email: session.email });
});

import { bad, currentSession, json } from "../../lib/admin.js";

export async function onRequestGet({ request, env }) {
  const session = await currentSession(request, env);
  if (!session) return bad("Não autenticado.", 401);
  return json({ email: session.email });
}

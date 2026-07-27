import { bad, currentSession, getUser, json, rota } from "../../lib/admin.js";

export const onRequestGet = rota(async ({ request, env }) => {
  const session = await currentSession(request, env);
  if (!session) return bad("Não autenticado.", 401);
  // Da conta, não da sessão: o e-mail gravado no login fica congelado, e o
  // painel reenviaria o antigo na próxima vez que salvasse Usuário.
  const user = await getUser(env);
  return json({ email: user.email });
});

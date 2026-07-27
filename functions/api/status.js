import { bad, json, latestWorkflowRun, requireSession, rota } from "../../lib/admin.js";

export const onRequestGet = rota(async ({ request, env }) => {
  const session = await requireSession(request, env);
  if (session instanceof Response) return session;

  // O painel informa o commit que publicou; sem ele, cai no run mais recente.
  const commit = new URL(request.url).searchParams.get("commit") || "";
  try {
    return json({ run: await latestWorkflowRun(env, /^[0-9a-f]{40}$/.test(commit) ? commit : undefined) });
  } catch (error) {
    return bad(error.message, 502);
  }
});

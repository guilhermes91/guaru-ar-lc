import { bad, json, latestWorkflowRun, requireSession } from "../../lib/admin.js";

export async function onRequestGet({ request, env }) {
  const session = await requireSession(request, env);
  if (session instanceof Response) return session;

  try {
    return json({ run: await latestWorkflowRun(env) });
  } catch (error) {
    return bad(error.message, 502);
  }
}

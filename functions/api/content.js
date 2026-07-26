import { bad, commitFile, draft, fetchContent, json, requireSession, toBase64 } from "../../lib/admin.js";
import { validateContent } from "../../lib/validate.js";

const PATH = "src/data/content.json";

export async function onRequestGet({ request, env }) {
  const session = await requireSession(request, env);
  if (session instanceof Response) return session;

  const published = await fetchContent(env).catch((error) => ({ error }));
  if (published.error) return bad(`Não consegui ler o conteúdo do site: ${published.error.message}`, 502);

  // Se existe rascunho salvo mais recente que o publicado, o painel mostra ele.
  const pending = await draft.get(env);
  const useDraft = pending && pending.sha === published.sha && pending.content;

  return json({
    content: useDraft ? pending.content : published.content,
    sha: published.sha,
    pending: Boolean(useDraft),
  });
}

export async function onRequestPost({ request, env }) {
  const session = await requireSession(request, env);
  if (session instanceof Response) return session;

  const body = await request.json().catch(() => null);
  if (!body || typeof body.content !== "object") return bad("Nada para salvar.");

  const errors = validateContent(body.content);
  if (errors.length) return json({ error: "Corrija antes de publicar:", details: errors }, 422);

  const published = await fetchContent(env).catch((error) => ({ error }));
  if (published.error) return bad(`Não consegui falar com o repositório: ${published.error.message}`, 502);

  const text = JSON.stringify(body.content, null, 2) + "\n";
  try {
    const result = await commitFile(env, {
      path: PATH,
      base64: toBase64(text),
      message: `conteudo: atualizacao pelo painel (${session.email})`,
      sha: published.sha,
    });
    await draft.put(env, { sha: result.content.sha, content: body.content });
    return json({ ok: true, commit: result.commit.sha.slice(0, 7) });
  } catch (error) {
    return bad(`Não consegui publicar: ${error.message}`, 502);
  }
}

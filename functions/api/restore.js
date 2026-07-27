import { bad, commitFile, draft, fetchContent, json, requireSession, rota, toBase64 } from "../../lib/admin.js";
import { validateContent } from "../../lib/validate.js";

// Restaura o site para a base de fábrica (src/data/content.default.json).
// Esse arquivo nunca é escrito pelo painel — é a referência imutável.
const PATH = "src/data/content.json";
const DEFAULT_PATH = "src/data/content.default.json";

export const onRequestPost = rota(async ({ request, env }) => {
  const session = await requireSession(request, env);
  if (session instanceof Response) return session;

  const branch = env.GITHUB_BRANCH || "main";
  const raw = await fetch(
    `https://raw.githubusercontent.com/${env.GITHUB_REPO}/${branch}/${DEFAULT_PATH}`,
    { headers: { authorization: `Bearer ${env.GITHUB_TOKEN}`, "user-agent": "guaru-ar-lc-admin" } },
  );
  if (!raw.ok) return bad("Não encontrei a base de fábrica no repositório.", 502);

  let content;
  try {
    content = JSON.parse(await raw.text());
  } catch {
    return bad("A base de fábrica está corrompida.", 500);
  }

  // Este é o último recurso do cliente quando algo quebra: publicar a base de
  // fábrica sem conferir seria justamente o botão de socorro derrubando o build.
  const erros = validateContent(content);
  if (erros.length) {
    return json({ error: "A base de fábrica está inválida e não foi publicada:", details: erros }, 500);
  }
  content.updatedAt = new Date().toISOString();
  const text = JSON.stringify(content, null, 2) + "\n";

  const published = await fetchContent(env).catch((error) => ({ error }));
  if (published.error) return bad(`Não consegui falar com o repositório: ${published.error.message}`, 502);

  try {
    const result = await commitFile(env, {
      path: PATH,
      base64: toBase64(text),
      message: `conteudo: restauracao para o padrao de fabrica (${session.email})`,
      sha: published.sha,
    });
    const commit = result.commit.sha.slice(0, 7);
    await draft.put(env, { sha: result.content.sha, content, at: new Date().toISOString(), commit });
    return json({ ok: true, content, commit, sha: result.content.sha });
  } catch (error) {
    return bad(`Não consegui restaurar: ${error.message}`, 502);
  }
});

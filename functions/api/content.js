import {
  arquivosPublicos,
  bad,
  commitFile,
  deployConcluido,
  draft,
  fetchContent,
  json,
  requireSession,
  rota,
  toBase64,
} from "../../lib/admin.js";
import { caminhosDeImagem, limparConteudo, validateContent } from "../../lib/validate.js";

const PATH = "src/data/content.json";

export const onRequestGet = rota(async ({ request, env }) => {
  const session = await requireSession(request, env);
  if (session instanceof Response) return session;

  const published = await fetchContent(env).catch((error) => ({ error }));
  if (published.error) return bad(`Não consegui ler o conteúdo do site: ${published.error.message}`, 502);

  // O rascunho existe só para cobrir a janela entre o commit e o fim do build.
  // Assim que o deploy daquele commit termina, ele é descartado — senão o painel
  // ficaria anunciando "publicação em andamento" para sempre.
  const rascunho = await draft.get(env);
  let pendente = Boolean(rascunho?.content && rascunho.sha === published.sha);

  if (pendente && (await deployConcluido(env, rascunho.at, rascunho.commit))) {
    await draft.clear(env);
    pendente = false;
  }

  return json({
    content: pendente ? rascunho.content : published.content,
    sha: published.sha,
    pending: pendente,
    // Commit da publicação em andamento: sem ele, um painel recarregado no meio
    // do deploy aceitaria qualquer run concluído e diria "Site atualizado" cedo.
    pendingCommit: pendente ? rascunho.commit : undefined,
  });
});

export const onRequestPost = rota(async ({ request, env }) => {
  const session = await requireSession(request, env);
  if (session instanceof Response) return session;

  const body = await request.json().catch(() => null);
  if (!body || typeof body.content !== "object" || Array.isArray(body.content)) {
    return bad("Nada para salvar.");
  }

  const errors = validateContent(body.content);
  if (errors.length) return json({ error: "Corrija antes de publicar:", details: errors }, 422);

  // A validação confere o formato do caminho, não o que existe no repositório:
  // um caminho bem-formado para arquivo ausente passava, o build ficava verde e
  // o card ia ao ar com a imagem em 404. Pelo painel não dá (o campo só recebe
  // o path que o upload devolveu), mas esta rota aceita qualquer JSON.
  // Árvore truncada devolve null: aí não dá para afirmar que falta, e recusar
  // uma publicação legítima seria pior do que deixar passar.
  const arquivos = await arquivosPublicos(env).catch(() => null);
  if (arquivos) {
    const ausentes = caminhosDeImagem(body.content).filter((caminho) => !arquivos.has(caminho));
    if (ausentes.length) {
      return json(
        { error: "Estas imagens não existem no site e apareceriam em branco. Envie-as de novo pelo painel:", details: ausentes },
        422,
      );
    }
  }

  const published = await fetchContent(env).catch((error) => ({ error }));
  if (published.error) return bad(`Não consegui falar com o repositório: ${published.error.message}`, 502);

  // Trava otimista: o painel devolve o sha que recebeu no GET. Se o publicado
  // mudou nesse meio-tempo, outra aba (ou outro aparelho) já publicou — e
  // sobrescrever apagaria o trabalho dela sem ninguém perceber.
  if (!body.sha) return bad("Recarregue o painel: esta tela está desatualizada.", 400);
  if (body.sha !== published.sha) {
    return json(
      {
        error:
          "O site foi atualizado em outro lugar depois que você abriu esta página. Recarregue o painel para não apagar o que foi publicado — suas alterações desta tela serão perdidas.",
        conflito: true,
      },
      409,
    );
  }

  // Carimba quando o conteúdo mudou de verdade: é isso que vira <lastmod> no
  // sitemap, em vez da data do build (que muda a cada deploy sem motivo).
  const conteudo = { ...limparConteudo(body.content), updatedAt: new Date().toISOString() };

  const text = JSON.stringify(conteudo, null, 2) + "\n";
  try {
    const result = await commitFile(env, {
      path: PATH,
      base64: toBase64(text),
      message: `conteudo: atualizacao pelo painel (${session.email})`,
      sha: published.sha,
    });
    // Sha completo: o filtro head_sha do GitHub recusa o abreviado, e o painel
    // ficava sem nunca ver o run — inclusive quando o build falhava.
    const commit = result.commit.sha;
    await draft.put(env, { sha: result.content.sha, content: conteudo, at: new Date().toISOString(), commit });
    // Devolve o sha novo: sem isso a próxima publicação da mesma aba bateria na
    // trava otimista contra o sha que ela mesma acabou de tornar obsoleto.
    // updatedAt volta para o painel confirmar no próprio site (via <lastmod> do
    // sitemap) que o conteúdo novo já está sendo servido, e não só que o build
    // terminou — entre uma coisa e outra há uns 15s de propagação.
    return json({ ok: true, commit, sha: result.content.sha, updatedAt: conteudo.updatedAt });
  } catch (error) {
    // 409 do GitHub = o arquivo mudou entre a leitura e o commit.
    if (/409|does not match|is at [0-9a-f]{40}/i.test(error.message || "")) {
      return json(
        { error: "Alguém publicou no mesmo instante. Recarregue o painel e refaça a alteração.", conflito: true },
        409,
      );
    }
    return bad(`Não consegui publicar: ${error.message}`, 502);
  }
});

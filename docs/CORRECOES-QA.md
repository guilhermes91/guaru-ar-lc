# Correções vindas das rodadas de QA

Registro do que foi achado, do que foi mudado e de **qual teste impede o defeito
de voltar**. Existe porque correção sem teste no repositório vale só a palavra de
quem corrigiu — e porque duas correções da rodada 8 criaram defeitos novos, que
só a rodada 9 pegou.

## Como conferir sem acreditar em ninguém

```bash
npm run build        # roda tudo: sintaxe do painel, smoke, regressões, build
npm run regressoes   # só a trava dos defeitos já corrigidos
npm run smoke        # só o painel, contra um DOM mínimo
```

`scripts/regressoes.mjs` tem um caso nomeado por achado. Os casos do painel são
**mutantes**: desfazem a correção numa cópia do arquivo e exigem que o smoke
reprove. Se a correção mudar de forma e o caso perder o alvo, ele falha dizendo
que ficou cego — nunca passa em silêncio.

## Como as rodadas funcionam

Rodadas cegas: três agentes recebem o projeto pela primeira vez, sem histórico e
sem lista de problemas conhecidos — painel+backend, site+build, e adversarial
pelo caminho de escrita ao vivo. Critério de encerramento: três rodadas seguidas
sem achado. Um achado só conta se for alcançável por quem usa de verdade (o dono
pelo painel, ou um visitante pelo navegador), tiver consequência visível e vier
com prova reproduzível.

Placar: rodada 4 = 8 achados · 5 = 5 · 6 = 7 · 7 = 7 · 8 = 9 · 9 = 5.

---

## Rodada 8

### 1. A fila de "Desfazer" sobrevivia à publicação
`public/admin/index.html`, handler de `#btn-publicar`. Zerava `removidos` sem
repintar a caixa. Depois de publicar, a tela seguia dizendo *"só saem do site
quando você publicar"* sobre item que já tinha saído, e o botão ressuscitava o
item no meio do deploy.
**Trava:** `R8#1` — mutante, tira o `pintarDesfazeres` e exige que o smoke reprove.

### 2. Teto de 200 itens só valia nas listas de primeiro nível
`lib/validate.js`. Ficavam de fora `brands.heating`, `brands.airConditioning`,
`neighborhoodGroups[].neighborhoods` e `serviceAreaGroups[].cities` — justamente
as que crescem. Junto: o tamanho era medido na forma compacta, e o commit grava
indentado (~1,5x maior), então 483 KB de compacto viravam 594 KB de arquivo.
Acima de ~1 MB a API do GitHub para de devolver o conteúdo inline e o painel
perde GET, POST **e** o restaurar de uma vez; só volta com `git push`.
**Trava:** `R8#2`, dois casos — listas aninhadas acima de 200, e a janela exata
em que o compacto passa e o arquivo commitado não.

### 3. Foco de teclado invisível em `/contato/`
`src/app/globals.css`. A regra `.socials a:focus-visible{outline:3px solid #fff}`
foi escrita para o rodapé, que é navy; em `/contato/` o mesmo seletor caía sobre
card branco, com contraste 1:1. Agora `.contact-socials a:focus-visible` usa
`--aqua-txt` (medido em 4,93:1) e o rodapé segue com o anel branco.

### 4. "Restaurar padrão de fábrica" quebrava com o `content.json` ilegível
`functions/api/restore.js` pedia o conteúdo inteiro (e o `JSON.parse`) para usar
só o `sha`. Era o único cenário em que esse botão é a última saída, e era nele
que ele falhava, com 502 culpando a conexão com o GitHub. Agora usa
`fetchContentSha()` (`lib/admin.js`), que lê só o `sha`.

### 5. Bairro digitado e não confirmado era descartado em silêncio
`public/admin/index.html`, `campoLista`. Só `keydown` Enter e clique em
"Adicionar". Quem digitava e clicava direto em Publicar perdia o texto, com
"Alterações enviadas" na tela. Agora há `blur`.
**Trava:** `R8#5` — mutante, tira o `blur` e exige que o smoke reprove.

### 6. `.container` colidia com a utility do Tailwind
`src/app/globals.css`. O `width` autoral vencia, mas o `max-width` do Tailwind
não tinha concorrente e estreitava a coluna entre 672px e 1280px. Resolvido com
`max-width:none`. Medido no Chrome: 653px em 700 e 1045px em 1100 (eram 640 e
1024).

### 7. Caminho de imagem inexistente era aceito
`lib/validate.js` confere o formato do caminho, nunca a existência: build verde e
imagem 404 no ar. Agora `POST /api/content` recusa com 422 listando os arquivos
que faltam, conferindo contra a árvore do repositório (`arquivosPublicos()` em
`lib/admin.js`, `caminhosDeImagem()` em `lib/validate.js`). Se a árvore vier
truncada ou a API do GitHub falhar, publica assim mesmo — recusar publicação
legítima seria pior.
**Trava:** `R8#7` — todo caminho de imagem da base de fábrica existe em `public/`.

### 8. `semRepetir` não cobria FAQ, números, marcas e cidades
`lib/validate.js`. Esses quatro também viram `key` de lista no React
(`src/app/page.tsx`), e duplicados saíam com a seção repetida no site.
**Trava:** `R8#8` — uma duplicata de cada tipo, quatro recusas.

### 9. `area` vazia e preço fracionário passavam
`lib/validate.js`. `reviews[].area = ""` publicava um `<span></span>` solto, e
`price = 0.5` ia para o site como "R$ 0,5", contra o que a própria mensagem de
erro prometia.
**Trava:** `R8#9`.

---

## Rodada 9

### 1. "Antes e depois" da home mostrava as fotos trocadas *(o mais grave)*
`src/components/before-after.tsx` e `src/app/globals.css`. O recorte
`inset(0 ${100-pos}% 0 0)` deixava a camada "depois" visível na metade
**esquerda**, e o selo "Depois" está à direita. Resultado: a piscina verde, o
aquecedor enferrujado e o ar-condicionado sujo apareciam rotulados como
**Depois** — a seção que existe para provar qualidade provava o contrário, desde
o lançamento, para todo visitante. Agora o recorte é `inset(0 0 0 ${pos}%)`.
Medido no Chrome nos três cards: foto "depois" à direita, selo "Depois" à
direita.

### 2. Remover item durante o envio apagava o desfazer dele
`public/admin/index.html`. O `×` fica a 30px do `↓`; nos ~2s de "Publicando…"
um toque errado removia um item que **não** entrava no payload — e a limpeza da
fila levava junto o desfazer dele. O item sumia do painel sem ter saído do site,
e a mensagem mandava publicar de novo, o que tornaria a remoção definitiva. Cada
remoção passou a carregar `estado.versao`, e a publicação só limpa o que já
estava na tela quando ela partiu.
**Trava:** `R9#2` — o smoke segura o POST em voo, remove um segundo item nesse
intervalo e exige que o desfazer dele sobreviva.

### 3. O smoke do build dependia do conteúdo do cliente
`scripts/smoke-painel.mjs`. Ele lia `src/data/content.json` e exigia achar um
item removível. Enxugar o site pelo painel até listas de um item — tudo
permitido — fazia o `npm run build` falhar: a publicação era aceita e commitada,
o build quebrava, o site congelava na versão anterior e toda publicação seguinte
falhava igual, sem saída a não ser restaurar a fábrica. Agora o smoke roda duas
vezes: as asserções que dependem da forma do conteúdo usam
`src/data/content.default.json`, que é nosso e imutável; sobre o conteúdo
publicado cobra-se só o que vale para qualquer conteúdo.
**Trava:** `R9#3` — monta um conteúdo enxuto ao mínimo e exige que o smoke passe.

### 4. Menu mobile: o Tab ia para trás do painel
`src/components/header.tsx`. Com o menu aberto (≤960px), o resto do documento
continuava na ordem de tabulação: o cursor sumia da tela e o Enter levava para
uma página não escolhida. Agora tudo que não é o cabeçalho recebe `inert`
enquanto o menu está aberto, e o foco entra no menu ao abrir. Medido no Chrome:
0 focáveis alcançáveis atrás do painel em 375px e 960px.

> Nota de método: a primeira versão desta correção listava `main`, `footer` e o
> botão flutuante — e ainda sobrava um link alcançável, porque o rodapé renderiza
> a chamada final como `<section>` irmã de `<footer>`, fora do `<main>`. Só
> apareceu porque foi medido. Por isso a regra virou "tudo que não é o cabeçalho".

### 5. Página removida continua no ar — **EM ABERTO, a correção não resolveu**
`public/_headers`. Removido um serviço ou bairro, a rota sai do deploy e a origem
responde 404 — mas o Cloudflare segue servindo a cópia guardada com **200 e a
página inteira** (`CF-Cache-Status: HIT`), inclusive para o Google, sem nenhum
aviso no painel.

Tentativa: dar TTL curto de borda (`s-maxage=60`) a `/servicos/*` e `/guaruja/*`,
as únicas rotas que o painel cria e remove.

**Medido de ponta a ponta e reprovado** (`scripts/teste-cache-borda.mjs`, ciclo
criar → aquecer o cache → remover → cronometrar, em 27/07/2026):

```
+46s  -> 200 | cf=HIT age=45  | public, max-age=0, must-revalidate, s-maxage=60
+302s -> 200 | cf=HIT age=302 | public, max-age=0, must-revalidate, s-maxage=60
+589s -> 200 | cf=HIT age=588 | public, max-age=0, must-revalidate, s-maxage=60
RESULTADO: apos 10 min a pagina removida AINDA responde 200 do cache de borda.
```

O cabeçalho **é** aplicado — aparece na resposta. O Cloudflare simplesmente não
revalida: o `Age` passa de 60 e continua crescendo, servindo a cópia velha
enquanto a origem já responde 404. A regra ficou no `_headers` porque 60s é uma
intenção mais correta que os 7 dias anteriores, mas **não** conserta o defeito.

**Caminho real da correção:** purgar o cache depois do deploy, pela API do
Cloudflare. Isso exige uma zona nossa — `pages.dev` é zona da Cloudflare e não dá
para purgar. Ou seja: **isto se resolve quando o domínio próprio entrar**, com um
passo de `purge_cache` no `.github/workflows/deploy.yml` (ou uma Cache Rule na
zona). Refazer `node scripts/teste-cache-borda.mjs` nessa hora para confirmar.

Enquanto isso, as URLs de teste que as auditorias deixaram cacheadas seguem
respondendo 200 até expirarem.

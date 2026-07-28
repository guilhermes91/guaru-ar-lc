# Correções vindas das revisões de QA

Registro do que foi achado, do que foi mudado e de **qual teste impede o defeito
de voltar**. Existe porque correção sem teste no repositório vale só a palavra de
quem corrigiu — e porque duas correções da revisão 8 criaram defeitos novos, que
só a revisão 9 pegou.

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

## Como as revisões funcionam

Cada revisão cobre três frentes, sempre partindo do zero, sem consultar a lista
de problemas já conhecidos: **painel + backend**, **site + build** e o **caminho
de escrita ao vivo** (login → publicar → deploy → no ar). Critério de
encerramento: três revisões seguidas sem achado.

Um achado só conta se passar nos três testes: ser alcançável por quem usa de
verdade (o dono pelo painel, ou um visitante pelo navegador), ter consequência
visível, e vir com prova reproduzível. Na dúvida, descarta-se.

Fora de escopo por decisão do dono, e não se reporta: fotos e logos de marca
(ele mesmo recortou e enviou os arquivos), depoimentos, números, preços, DNS e
domínio, quantidade e profundidade das páginas de bairro, e todo julgamento de
conteúdo, texto ou estratégia. Também fora: refatoração, nomenclatura, diferença
de layout que não quebra nada, valor limítrofe que só a API crua alcança, e o
que está registrado em `docs/DEBITO-TECNICO.md`.

Placar: revisão 4 = 8 achados · 5 = 5 · 6 = 7 · 7 = 7 · 8 = 9 · 9 = 5 · 10 = 1 ·
11 = 3.

**Onde as revisões rodam:** painel+backend e site+build rodam **local**, antes
de publicar — `npm run build` e `node scripts/servir-local.mjs`, que serve o
`out/` aplicando `_headers`, `_redirects`, a barra final e o 404 do Pages
(conferido rota a rota contra produção, 13 de 13 iguais). O caminho de escrita
ao vivo só pode ser exercitado **depois** do push, porque testa o que está
publicado. Motivo de rodar local: três correções nossas geraram defeitos novos e
os três chegaram ao ar antes de serem pegos — e os três eram detectáveis aqui.

---

## Revisão 8

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

## Revisão 9

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

---

## Revisão 10

Duas das três frentes fecharam sem achado — painel+backend, com os 139 campos
editáveis conferidos até o payload, e site+build, com 51 páginas, 95 assets,
contraste, teclado e 320px medidos sem falha. A terceira achou um defeito.

### 1. Desfazer fora de ordem reordenava um item que ninguém tocou
`public/admin/index.html`, `pintarDesfazeres()`. Cada entrada da fila guarda o
índice da posição **no momento daquela remoção**. Desfazendo fora da ordem
inversa, esse índice já não vale: removendo "Ar-condicionado" e depois
"Piscinas" e clicando primeiro no desfazer mais antigo, a lista voltava como
`Ar-condicionado | Piscinas | Aquecedores` — "Aquecedores" descia para último na
home, em `/servicos/`, no menu e no rodapé, e ia assim para o site. O painel
oferece o desfazer como a volta segura do "×" e não avisava nada.

Corrigido tornando o desfazer **LIFO**, como qualquer Ctrl+Z: só o mais recente
fica ativo, os outros aparecem desabilitados com a dica "Desfaça primeiro a
remoção mais recente", e a caixa passa a dizer "para desfazer, comece pelo mais
recente" quando há mais de um.

> Por que não "corrigir os índices": ajustar as entradas restantes conserta o
> caso acima e **quebra** outro que hoje funciona — remover B, depois A, e
> desfazer A primeiro. Na ordem inversa cada desfazer é o inverso exato do
> `splice` que removeu, então a lista volta idêntica sempre, sem caso especial.

**Trava:** `R10#1` — mutante, reabilita todos os botões e exige que o smoke
reprove; e o smoke remove dois itens de uma lista de três, desfaz os dois e
compara a ordem com a original.

---

## Revisão 11

### 1. O indicador anunciava deploy com alteração pendente na tela
`public/admin/index.html`, `acompanharDeploy()`. Quem edita algo nos 1-3s em que
a publicação está em voo ficava com o selo azul "Atualizando o site…" pelos ~2
min do deploy, enquanto havia alteração **não publicada** na memória — e é por
esse selo que o dono decide se já pode fechar a página. A função `selo()` existe
exatamente para isso, com o comentário explicando o porquê, e essa chamada a
contornava.
**Trava:** `R11#1` — mutante; e o smoke confere o selo depois de uma remoção
feita durante o envio.

### 2. O clique no "×" de um bairro era engolido
`public/admin/index.html`, `campoLista`. Regressão da correção R8#5: o `blur` do
campo dispara no `mousedown` do "×", e redesenhar todas as fichas destruía o
botão antes do `mouseup`. O bairro não era removido, o texto digitado entrava na
lista, e nada avisava — se já existisse, a publicação seguinte era recusada por
"Bairro repetido". Agora `adicionar()` acrescenta só a ficha nova.
**Trava:** `R11#2` — mutante; e o smoke exige que as fichas já na tela sejam os
mesmos nós depois de adicionar.

### 3. Cidade repetida em outra região passava
`lib/validate.js`. `semRepetir` rodava dentro do loop de cada grupo, então só
pegava repetição no mesmo grupo. "Santos" em "Baixada Santista" e em "SP Capital"
publicava com build verde e saía duas vezes na cobertura da home, do `/contato` e
de `/assistencia-especializada`, e duas vezes no `areaServed` do dado estruturado.
Bairro já tinha conjunto global (`paginasDeBairro`); cidade não tinha.
**Trava:** `R11#3` — põe a mesma cidade em duas regiões e exige a recusa.

**Descartado por escopo:** uma revisão reportou os logos de marca de
ar-condicionado (13 dos 26 arquivos trazem dois wordmarks empilhados ou a
palavra cortada). Imagem é decisão fechada do dono — ver a nota de escopo no
topo. Nenhum arquivo de `public/images/` foi alterado.

---

## Revisão 12 (local)

### 1. Menu mobile aberto + cruzar 960px congelava a página inteira
`src/components/header.tsx`. Regressão da correção R9#4: o efeito marca tudo
que não é o cabeçalho como `inert` e só desfaz quando o menu fecha. Acima de
960px o painel do menu não é desenhado e o ☰ vira `display:none`, mas o estado
continuava aberto — então girar o tablet ou maximizar a janela deixava a página
com aparência 100% normal e **nada respondendo**: nenhum card, link de rodapé ou
o botão flutuante do WhatsApp aceitava clique ou foco, e não havia botão para
desfazer. Agora um `matchMedia("(min-width: 961px)")` fecha o menu ao cruzar o
breakpoint, e o cleanup do efeito remove o `inert` sozinho.
**Trava:** `R12#1`, em `scripts/regressoes-navegador.mjs`.

---

## Revisão 13 (local)

### 1. O clique em "Publicar" caía no vazio, sem aviso nenhum
`public/admin/index.html`, CSS do `.estado`. O `blur` do campo de lista roda no
**mousedown**; ele confirma a ficha e chama `marcarSujo()`, que troca o selo do
cabeçalho de "Site em dia" para "Alterações não publicadas". O texto mais longo
alargava o selo, `header.topo` (com `flex-wrap:wrap`) quebrava a linha, o
cabeçalho ia de 70px para 111px e **tudo descia 41px entre o mousedown e o
mouseup**. O clique nunca chegava ao botão: **0 POSTs**, nenhuma mensagem, e o
selo dizendo "Alterações não publicadas" — que o dono lê como consequência do
próprio clique. Ele sai achando que publicou. O mesmo clique perdido derrubava
silenciosamente a remoção de um bairro e de uma região.

Medido em 5 larguras (380, 490, 560, 768, 810). Corrigido reservando largura
para o selo (`min-width:190px`), dimensionada pelo texto mais longo, de modo que
a decisão de quebra do cabeçalho não dependa mais do texto.
**Trava:** `R13#1` — mede a altura do cabeçalho e a posição do botão Publicar
com os 11 textos possíveis do selo, em 7 larguras, e exige que não variem.

### Falso positivo descartado — vale registrar o método
Foi reportado que o bairro digitado sumia quando um upload terminava no meio,
com prova de navegador. A explicação dada ("o Chrome não dispara `blur` ao
remover o elemento focado") foi verificada e é **falsa** — dispara. Reproduzi o
cenário e o texto de fato sumia, mas ao ligar `Emulation.setFocusEmulationEnabled`
(que faz o headless se comportar como janela focada) o texto **sobrevive com e
sem correção**: o campo perdia o foco sozinho antes do redesenho, artefato de
headless. A correção que eu já tinha aplicado foi revertida em vez de ficar no
código sem motivo.

> Regra que fica: prova de navegador que dependa de foco só vale com
> `Emulation.setFocusEmulationEnabled` ligado. Sem isso, `focus()` não se mantém
> entre tarefas e qualquer teste de blur/foco dá falso positivo.

---

## Revisão 14 (local)

### 1. O foco escapava para trás da tela de login
`public/admin/index.html`, `pedirLoginDeNovo()`. Quando a sessão de 8h cai, o
login reaparece **por cima** do painel, que continua desenhado por baixo de uma
camada opaca. Sem `inert`, o Tab caminhava para dentro dele: do 4º toque em
diante o foco sumia da vista e o Enter acionava botão invisível — inclusive o
**Sair**, que recarrega a página e joga fora exatamente o trabalho que essa tela
existe para preservar ("suas alterações continuam aqui").
**Trava:** `R14#1` — reabre o login por 401 e exige `inert` com 0 focáveis atrás.

### 2. A ficha nova deslocava a página no meio do clique
`public/admin/index.html`, `campoLista`. O `blur` roda no **mousedown**; a ficha
inserida na hora quebrava linha e empurrava tudo abaixo 34px antes do mouseup —
o clique caía fora e não era emitido. A 380px acontecia em todos os campos de
lista. O dado entra na hora (é o que garante que o texto vai para a publicação);
só a ficha na tela espera o `mouseup`.

> `setTimeout(0)` **não** resolve: dispara em milissegundos, antes do mouseup de
> um clique de verdade. Provado medindo.

Sem trava dedicada: encerrar isso num teste exigiria caçar qual campo faz a
ficha quebrar linha em qual largura, e o aparato ficou mais frágil que o
defeito. O smoke já cobre o essencial (as fichas existentes não são recriadas).

### 3. Botão de orçamento estourava a pílula a 320px
`src/app/globals.css`. O CTA do hero de bairro carrega o nome do bairro
("Pedir orçamento em Vicente de Carvalho"). Com o `white-space:nowrap` do
`.btn`, a 320px o ícone do WhatsApp ficava desenhado **fora** do botão, sobre o
fundo do hero, o rótulo passava da borda e uma das páginas ganhava rolagem
horizontal. Afetava 7 das 41 páginas de bairro. Resolvido deixando o texto
quebrar linha só nesse botão.
**Trava:** `R14#3` — mede a 320px e exige conteúdo dentro da pílula e 0 de
rolagem.

## Revisão 15 (local) — **LIMPA**

Os três ângulos voltaram `SEM ACHADOS`. Primeira revisão limpa da série (a 8ª
tinha 9 achados). Duas frentes independentes chegaram ao mesmo item de borda —
a ficha nova pode aparecer duplicada na tela se o "×" de outra ficha for
acionado **pelo teclado** dentro dos 400 ms do insert adiado — e **os dois
descartaram sozinhos** pela régua: não há caminho de mouse ou toque, o payload
não diverge e o primeiro redesenho corrige. Fica descartado de propósito.

---

## Revisão 16 (local)

### 1. O menu mobile não rolava
`src/app/globals.css`, regra `.navlinks.open`. O painel tem 630px e é
`position:absolute` dentro de um cabeçalho `sticky`: **rolar a página não o
move**. Em iPhone SE em pé (320×568) "Áreas de atendimento" e "Contato" ficavam
abaixo da tela e sem como tocar; em celular deitado, 6 dos 11 itens. Resolvido
com `max-height:calc(100dvh - 70px)` e `overflow-y:auto` — duas propriedades na
regra que já existia.
**Trava:** `R16#1` — mede em 320×568 e 667×375, rolando **dentro** do painel, e
exige 0 itens inalcançáveis.

### 2. O upload redesenhava a seção inteira no meio da edição
`public/admin/index.html`. Ao terminar, o upload chamava `desenharSecao()`, que
troca todos os nós da seção — enquanto a pessoa ainda estava usando. O campo em
edição saía da árvore, o foco ia para o `<body>` e o que ela digitasse depois ia
para o vazio; clique já iniciado em outro item era engolido. O redesenho total
existe para **um** caso: outra coisa ter redesenhado durante o upload. Agora um
contador detecta esse caso, e no caminho normal só a miniatura é repintada.
Três linhas. De quebra, a mensagem "Pronto" parou de ser apagada.
**Trava:** `R16#2` — foca um campo, dispara o upload e exige que o campo
continue na árvore e com o foco.

> Nota de método: a primeira medição da correção do menu disse que ela não tinha
> funcionado — porque rolava a **página**, e a rolagem passou a ser **dentro do
> menu**. Antes de desconfiar do código, desconfie da medição.

### Simplificação: limitar em vez de sustentar
O teto por lista caiu de **200 para 60 itens**. O uso real é bem menor: a maior
lista tem 26 (marcas de ar-condicionado) e a maior região tem 14 bairros. 60 dá
mais que o dobro de folga e apaga de uma vez a classe "conteúdo grande demais
tira o painel do ar" — o pior conteúdo que o painel aceita agora gera um arquivo
muito abaixo do limite da API do GitHub. O critério está escrito para o cliente
em `docs/GUIA-DO-CLIENTE.md`, e o caso `R8#2` vigia a folga: se alguém subir o
teto sem pensar, ele denuncia.

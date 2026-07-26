# Guaru Ar LC — guaruarguaruja.com.br

Site institucional e vitrine da Guaru Ar LC, com painel de edição próprio.

- **Site:** https://guaruarguaruja.com.br · https://guaru-ar-lc.pages.dev
- **Painel:** https://guaruarguaruja.com.br/admin/ (funciona também no endereço `.pages.dev`)

Next.js 16 com exportação estática, publicado no Cloudflare Pages. As rotas do
painel rodam como Cloudflare Pages Functions (`functions/api/`).

## Como o conteúdo do site é atualizado

Todo o conteúdo editável fica em um único arquivo: **`src/data/content.json`**.

1. O cliente edita no painel `/admin/` e clica em **Publicar alterações**.
2. A API grava o novo `content.json` no repositório (um commit por publicação).
3. O push dispara o GitHub Actions (`.github/workflows/deploy.yml`).
4. O Actions builda o site e publica no Cloudflare Pages.

Leva cerca de 2 minutos entre publicar e o site estar no ar. O painel acompanha
o andamento e avisa quando termina.

Imagens enviadas pelo painel vão para `public/images/uploads/`, também por commit.

### Restaurar padrão de fábrica

`src/data/content.default.json` é a base original entregue. **O painel nunca
escreve nesse arquivo.** O botão *Restaurar padrão* copia ele por cima de
`content.json`, devolvendo o site exatamente ao estado da entrega.

## Seções do painel

| Seção | O que edita |
| --- | --- |
| Configurações | Nome, telefone, WhatsApp, e-mail, endereço, horário, redes sociais |
| Textos do site | Título e frase do topo, bloco "sobre", chamada final, rodapé |
| Serviços | Nome, resumo, descrição, preço e imagem de cada serviço |
| Produtos | Nome, preço e fotos dos produtos |
| Bairros e regiões | Bairros em destaque (com foto), todos os bairros e as cidades atendidas |
| Números, avaliações e FAQ | Provas sociais e perguntas frequentes |
| Marcas atendidas | Logos de ar-condicionado e aquecedores |
| Usuário | E-mail e senha de acesso, e restauração de fábrica |

Todos os campos têm limite de caracteres e validação. Preços aceitam só números
e identificadores de página são gerados automaticamente — o cliente não
consegue quebrar o layout nem as rotas.

Imagens só entram por upload e são normalizadas no navegador antes de subir
(`MEDIDAS` em `public/admin/index.html`), casando com o espaço que cada slot
tem no CSS:

| Slot | Saída | Modo | CSS correspondente |
| --- | --- | --- | --- |
| Serviço | 1200×675 WebP | recorte central | `.svc-media` 210px `cover` |
| Produto (foto principal) | 1200×675 WebP | encolhe, sem cortar | `.prod-frame` 200px `contain` |
| Produto (foto em uso) | 1200×675 WebP | recorte central | `.prod-frame` 200px `cover` |
| Bairro | 1200×750 WebP | recorte central | `.area-card` 150px `cover` |
| Avaliação | 256×256 WebP | recorte central | `.who img` 44×44 `cover` |
| Logo de marca | até 400×200 PNG | encolhe, sem cortar | `.brand-logo-card img` 60px `contain` |

Isso importa porque o site é export estático com `images.unoptimized`: sem a
normalização, o arquivo original iria inteiro para o visitante.

## Desenvolvimento

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # gera ./out
npx wrangler pages dev   # site + rotas do painel (precisa de .dev.vars)
```

Para testar o painel local, crie um `.dev.vars` (não versionado):

```
GITHUB_TOKEN=...
GITHUB_REPO=guilhermes91/guaru-ar-lc
GITHUB_BRANCH=main
RESEND_API_KEY=...
MAIL_FROM=Guaru Ar LC <onboarding@resend.dev>
ADMIN_EMAIL=guaruar@softuria.com
ADMIN_PASSWORD=...
```

## Infraestrutura

| Item | Onde |
| --- | --- |
| Hospedagem | Cloudflare Pages — projeto `guaru-ar-lc` |
| Dados do painel (usuário, sessões) | Cloudflare KV — binding `ADMIN_KV` |
| Deploy | GitHub Actions → `wrangler pages deploy` |
| E-mail de recuperação de senha | Resend |

Segredos no repositório (*Settings → Secrets → Actions*):
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

Variáveis no projeto do Cloudflare Pages (*Settings → Environment variables*):
`GITHUB_REPO`, `GITHUB_BRANCH`, `MAIL_FROM`, `ADMIN_EMAIL` e os segredos
`GITHUB_TOKEN`, `RESEND_API_KEY`, `ADMIN_PASSWORD`. Elas ficam só no Cloudflare
— o deploy é upload puro e não sobrescreve nada. Por isso o projeto não tem
`wrangler.toml`.

### Credenciais do painel

O repositório é público: **nenhuma senha mora no código**. O primeiro acesso
nasce de `ADMIN_EMAIL` + `ADMIN_PASSWORD`, e o KV guarda só um hash PBKDF2
(100.000 iterações, com salt próprio — 100k é o **teto do Cloudflare Workers**,
que recusa valores maiores; a recomendação OWASP de 600k não roda nessa
plataforma). O número usado fica gravado junto do hash, então subir o teto no
futuro não invalida a senha existente. Depois que o cliente troca a senha pelo
painel, as variáveis deixam de ser consultadas.

Para redefinir o acesso (cliente perdeu a senha e o e-mail de recuperação):
troque `ADMIN_PASSWORD` no Cloudflare, apague a chave `user` do KV `ADMIN_KV` e
dispare um deploy. O próximo login volta a nascer do ambiente.

`Esqueci minha senha` **não devolve a senha antiga** — ela é um hash e não tem
volta. O e-mail traz uma senha provisória sorteada na hora, válida por 30
minutos, que passa a valer **ao lado** da senha atual. A senha atual continua
funcionando: se a troca fosse imediata, qualquer visitante anônimo derrubaria o
acesso do cliente só chamando a rota. Definir uma senha nova no painel encerra
a provisória.

> Enquanto o domínio não estiver apontado, `MAIL_FROM` usa o remetente de teste
> do Resend (`onboarding@resend.dev`), que **só entrega no e-mail dono da conta
> Resend**. Para a recuperação chegar em `guaruar@softuria.com`, verifique o
> domínio no Resend e troque `MAIL_FROM` para `no-reply@guaruarguaruja.com.br`.

> ### `GITHUB_TOKEN` — sem vencimento
>
> É o PAT fine-grained `guaru-ar-lc`, com `Contents: Read and write` e
> `Actions: Read-only`, criado sem data de expiração. A API do GitHub não expõe
> a validade de um PAT: isso só se confere na tela de tokens do GitHub.
>
> Se um dia ele for revogado, **o painel para de salvar**: o cliente clica em
> Publicar e recebe `Bad credentials`. Para trocar, substitua o valor de
> `GITHUB_TOKEN` no projeto do Cloudflare. **A variável só passa a valer no
> próximo deploy** — dispare o workflow `Deploy` depois de trocar.

## SEO

- Metadados por página e JSON-LD de negócio local
- `robots.txt` e `sitemap.xml` gerados no build
- Página estática por serviço e por bairro atendido
- `/admin/` e `/api/` ficam fora do índice

## Registro de decisões

Consulte `docs/DECISIONS.md` e `CHANGELOG.md` antes de continuar o trabalho.

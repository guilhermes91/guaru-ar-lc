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
| Produtos | Nome, preço e fotos dos produtos, além das categorias da vitrine |
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
| Produto | 1200×675 WebP | recorte central | `.product-card img` 210px `cover` |
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
MAIL_FROM=Guaru Ar LC <no-reply@guaruarguaruja.com.br>
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
`GITHUB_REPO`, `GITHUB_BRANCH`, `MAIL_FROM` e os segredos `GITHUB_TOKEN`,
`RESEND_API_KEY`. Elas ficam só no Cloudflare — o deploy é upload puro e não
sobrescreve nada. Por isso o projeto não tem `wrangler.toml`.

> ### ⚠️ `GITHUB_TOKEN` vence em 25/08/2026
>
> É o PAT fine-grained `guaru-ar-lc`, com `Contents: Read and write` e
> `Actions: Read-only`. **Quando vencer, o painel para de salvar** — o cliente
> clica em Publicar e recebe erro.
>
> Para renovar: gere outro PAT com as mesmas permissões e substitua o valor de
> `GITHUB_TOKEN` no projeto do Cloudflare. **A variável só passa a valer no
> próximo deploy** — dispare o workflow `Deploy` depois de trocar.
>
> Prefira a maior validade disponível, ou migre para um GitHub App (tokens de
> 1 hora gerados sob demanda, sem renovação manual).

## SEO

- Metadados por página e JSON-LD de negócio local
- `robots.txt` e `sitemap.xml` gerados no build
- Página estática por serviço e por bairro atendido
- `/admin/` e `/api/` ficam fora do índice

## Registro de decisões

Consulte `docs/DECISIONS.md` e `CHANGELOG.md` antes de continuar o trabalho.

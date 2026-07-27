# Changelog

## [1.0.0] - 2026-07-27

### Adicionado

- Painel de edição em `/admin/`: o cliente altera textos, serviços, produtos,
  bairros, marcas, provas sociais e os próprios dados de acesso. Publicação por
  commit no GitHub, com deploy automático (~50s do clique ao ar).
- Cloudflare Pages Functions em `functions/api/` com sessão em KV, senha em
  hash PBKDF2, recuperação por senha provisória e restauração de fábrica.
- Página de assistência especializada multimarcas, com 48 logos.
- Hub `/guaruja/` e página própria para cada um dos 41 bairros atendidos.
- Open Graph e canonical por página; `docs/MAPA-DO-SITE.md` gerado do build.
- `scripts/checar-painel.mjs`: valida a sintaxe do script do painel no build.

### Alterado

- Cobertura passou de 12 para 41 bairros do Guarujá.
- Preço agora existe só em produtos; serviço é orçamento sob avaliação.
- Imagens do site reduzidas de ~6,5 MB para ~1,5 MB.

### Removido

- Versão Google Sites, substituída pelo site no Cloudflare Pages.

## [0.2.0] - 2026-07-04

### Adicionado

- Versão autocontida em HTML/CSS compatível com incorporação no Google Sites.
- Guia de instalação e mapa de páginas nativas para SEO.
- Branch dedicada que preserva a implementação Next.js original.

## [0.1.0] - 2026-07-04

### Adicionado

- Homepage responsiva fiel ao conceito aprovado.
- Navegação desktop e mobile.
- Páginas de serviços, produtos, sobre e contato.
- Vitrine estática com CTAs para WhatsApp.
- Páginas locais para 12 bairros/regiões do Guarujá.
- Sitemap, robots, metadados e dados estruturados.
- Documentação de desenvolvimento e continuidade.

# Imagens da Home (otimizadas)

Arquivos **WebP** otimizados (sharp, q80), servidos a partir de `/images/home-generated/`.
Os PNGs originais (~40 MB) ficam em `_source-images/home-generated/` (fora do Git e fora do deploy) como backup.

Para regerar os WebP a partir de novos PNGs: coloque os `.png` aqui e rode o script de conversão (sharp) novamente, depois mova os PNGs para `_source-images/`.

## Principais
- `hero-guaruar.webp`
- `equipe-guaruar.webp`
- `card-ar-condicionado.webp`
- `card-aquecedor.webp`
- `card-piscina.webp`

## Antes e depois
- `antes-ac.webp` / `depois-ac.webp`
- `antes-piscina.webp` / `depois-piscina.webp`
- `antes-aquecedor.webp` / `depois-aquecedor.webp`

## Áreas de atendimento
- `area-enseada.webp`, `area-pitangueiras.webp`, `area-pernambuco.webp`, `area-tombo.webp`,
  `area-asturias.webp`, `area-jardim-acapulco.webp`, `area-vicente-de-carvalho.webp`

## Onde são usadas
- **Site principal (Next/Cloudflare):** referenciadas por caminho relativo `/images/home-generated/...` em `src/data/site.ts`, `src/app/globals.css` e `src/app/page.tsx`.
- **Google Sites (`google-sites/home.html`):** referenciadas por URL absoluta `https://guaruarguaruja.com.br/images/home-generated/...` (o iframe roda no domínio do Google, então precisa de URL absoluta — depende do site principal estar publicado nesse domínio).

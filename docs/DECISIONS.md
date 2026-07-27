# Decisões técnicas

## 2026-07-04 — Base do projeto

- Next.js App Router com TypeScript para gerar páginas rápidas, indexáveis e fáceis de hospedar.
- CSS próprio para reproduzir o layout aprovado sem dependência de um kit visual genérico.
- Conteúdo comercial centralizado em `src/data/content.json`, editado pelo painel `/admin/`. `src/data/site.ts` só reexporta.
- Vitrine sem checkout: o CTA abre o WhatsApp oficial com mensagem contextual.
- SEO local com páginas pré-renderizadas por bairro, evitando páginas vazias ou geradas apenas para palavras-chave.
- Dados de contato recuperados da versão pública indexada do site antigo; devem ser confirmados pelo cliente antes da publicação.
- Imagens geradas por IA para o projeto e hospedadas localmente; o cliente confirmou que são de uso próprio (27/07/2026).

## Continuidade

1. Leia `README.md`, `CHANGELOG.md` e este arquivo.
2. Rode `npm install`, `npm run lint` e `npm run build`.
3. Catálogo, preços, marcas e horários mudam pelo painel `/admin/`, não no código.
4. Registre decisões relevantes aqui e mudanças entregues no changelog.

## 2026-07-27 — Rodada de QA às cegas

- Duas auditorias independentes, sem histórico dos achados anteriores, para
  remover o viés de quem já sabia onde tinha mexido. Encontraram 13 defeitos
  que quatro rodadas informadas não viram.
- `/assistencia-autorizada` virou `/assistencia-especializada`: a URL afirmava
  uma autorização que o texto da própria página evitava, com 44 marcas
  expostas. Redirect 301 em `public/_redirects`.
- Criado `/guaruja/` como hub: 11 dos 41 bairros não recebiam link interno
  nenhum, inclusive o da sede da empresa.
- `@import "tailwindcss"` faz o Tailwind gerar utilities a partir de qualquer
  token encontrado no JSX. `.outline` colidiu com `.btn.outline`. Ao nomear
  classe própria, evite nomes que existam no Tailwind.

# Decisões técnicas

## 2026-07-04 — Base do projeto

- Next.js App Router com TypeScript para gerar páginas rápidas, indexáveis e fáceis de hospedar.
- CSS próprio para reproduzir o layout aprovado sem dependência de um kit visual genérico.
- Conteúdo comercial centralizado em `src/data/site.ts` para manutenção simples.
- Vitrine sem checkout: o CTA abre o WhatsApp oficial com mensagem contextual.
- SEO local com páginas pré-renderizadas por bairro, evitando páginas vazias ou geradas apenas para palavras-chave.
- Dados de contato recuperados da versão pública indexada do site antigo; devem ser confirmados pelo cliente antes da publicação.
- Imagens atuais são editoriais remotas e precisam ser substituídas por fotos próprias/licenciadas antes do lançamento definitivo.

## Continuidade

1. Leia `README.md`, `CHANGELOG.md` e este arquivo.
2. Rode `npm install`, `npm run lint` e `npm run build`.
3. Atualize `src/data/site.ts` quando o cliente confirmar catálogo, preços, marcas e horários.
4. Registre decisões relevantes aqui e mudanças entregues no changelog.

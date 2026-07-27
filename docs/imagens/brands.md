# Assets de marcas e atendimento

Imagens geradas a partir das referências enviadas pelo cliente.

## O que o site usa

**`standard/`** — os 4 banners exibidos em `/assistencia-especializada`, em
**1200×675 px** (16:9):

- `standard/01-marcas-aquecedores.png` — card da seção de aquecedores
- `standard/02-marcas-ar-condicionado.png` — card da seção de climatização
- `standard/03-marcas-multimarcas.png` — banner do topo da página
- `standard/04-atendimento-litoral-sp.png` — mapa da área de atendimento

**`logos/aquecedores/`** e **`logos/ar-condicionado/`** — os logos individuais,
em **420×226 px**, exibidos a 60 px de altura com `object-fit: contain`. Os
caminhos ficam em `src/data/content.json` (`brands.heating` e
`brands.airConditioning`) e são trocáveis pelo painel, em *Marcas atendidas*.

`atendimento-litoral-sp.png`, na raiz desta pasta, é a versão antiga do mapa —
o site usa a de `standard/`.

## Formato

PNG com paleta indexada de 255 cores e transparência preservada, dimensionados
para o dobro do espaço que ocupam no CSS. O site é export estático com
`images.unoptimized`: o arquivo vai inteiro para o visitante, então subir algo
maior que isso só aumenta o tempo de carregamento.

> Cinco colagens soltas (`logos-*-limpo.png`, `marcas-*-card.png`,
> `marcas-multimarcas-guaruar.png`) foram removidas em 26/07/2026: somavam
> 2,6 MB, nenhuma página as referenciava, e ficavam públicas no repositório.
> O conteúdo delas está nos banners de `standard/`.

## Comunicação recomendada

Use termos como:

- “Especialistas multimarcas”
- “Trabalhamos com as principais marcas”
- “Atendimento técnico em equipamentos das principais marcas”

Evite usar “autorizada” sem certificado/contrato formal de cada fabricante.

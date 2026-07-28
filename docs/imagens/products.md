# Imagens dos produtos (vitrine "chamariz")

Especificação das **7 imagens** de produto, estilo **foto de e-commerce realista**:
fundo branco/neutro de estúdio, produto centralizado e em destaque, sombra suave,
iluminação limpa, alta nitidez, aparência de marca brasileira top de mercado.

- **Proporção:** 4:3 (ex.: 1000×750 px) ou quadrada (1000×1000).
- **Formato:** PNG (depois eu converto para WebP otimizado, como fiz com as da home).
- **Onde salvar:** nesta pasta (`public/images/products/`), com **exatamente** estes nomes:

## Lista para gerar

1. `ar-completo.png` — Ar-condicionado Split Hi-Wall **completo (evaporadora + condensadora)**, estilo **Samsung**, branco, moderno, foto de produto em fundo neutro.
2. `condensadora.png` — **Condensadora** (unidade externa/motor) de ar-condicionado, estilo **Philco**, branca, vista frontal, foto de produto em fundo neutro.
3. `evaporadora.png` — **Evaporadora** (unidade interna Hi-Wall de parede) de ar-condicionado, estilo **LG**, branca, slim, foto de produto em fundo neutro.
4. `aquecedor-gas.png` — **Aquecedor a gás de passagem**, estilo **Rinnai**, branco/prata, painel digital, foto de produto em fundo neutro.
5. `piscinas.png` — **Bomba/motobomba para piscina**, estilo **Jacuzzi**, azul e preta, foto de produto em fundo neutro.
6. `filtros.png` — **Filtro de areia para piscina** (tanque redondo), estilo **Nautilus**, azul/cinza, foto de produto em fundo neutro.
7. `acessorios.png` — **Kit de acessórios/limpeza para piscina** (cabo telescópico, peneira, escova, aspirador), foto de produto em fundo neutro.

## Versão "em uso" (troca automática a cada 5s)

Para cada produto, gere também uma versão **instalado / em uso** (ambiente real, não estúdio),
com o mesmo enquadramento aproximado. Salve com o sufixo `-emuso`:

1. `ar-completo-emuso.png` — Split instalado na parede de uma sala/quarto moderno e aconchegante, ligado.
2. `condensadora-emuso.png` — Condensadora instalada na parede externa de uma casa, com tubulação.
3. `evaporadora-emuso.png` — Evaporadora instalada na parede de um ambiente residencial.
4. `aquecedor-gas-emuso.png` — Aquecedor instalado na parede de uma área de serviço/lavanderia.
5. `piscinas-emuso.png` — Bomba instalada na casa de máquinas ao lado de uma piscina.
6. `filtros-emuso.png` — Filtro de areia instalado ao lado da piscina, conectado à tubulação.
7. `acessorios-emuso.png` — Kit de limpeza sendo usado para limpar/aspirar uma piscina.

Assim que essas imagens existirem, o card passa a **alternar (crossfade) entre estúdio e em uso a cada 5s**
automaticamente no próximo build (a página só ativa a troca se o arquivo `-emuso.webp` existir).

## Depois de gerar

Me avise. Eu:
1. Converto os PNG para WebP otimizado nesta pasta.
2. Troco o campo `image` de cada produto em `src/data/site.ts` de placeholder (Unsplash)
   para `/images/products/<id>.webp`.

Obs.: o objetivo é a **aparência realista** do tipo de produto daquela marca, não
a reprodução exata da logomarca.

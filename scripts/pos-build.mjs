// O Next exporta a página de erro em três lugares: out/404.html (que é o que o
// Cloudflare Pages usa como handler de 404) e mais out/404/ e out/_not-found/,
// que viram URLs respondendo HTTP 200 com conteúdo de erro — soft-404 para
// qualquer crawler ou monitor de uptime que bata nelas.
import { rmSync, existsSync } from "node:fs";

for (const pasta of ["out/404", "out/_not-found"]) {
  if (existsSync(pasta)) {
    rmSync(pasta, { recursive: true, force: true });
    console.log(`pos-build: removido ${pasta}`);
  }
}

if (!existsSync("out/404.html")) {
  console.error("pos-build: out/404.html sumiu — o Pages ficaria sem página de erro.");
  process.exit(1);
}
console.log("pos-build: out/404.html preservado");

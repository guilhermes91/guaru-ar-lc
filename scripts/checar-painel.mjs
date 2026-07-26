// O painel é um HTML com <script type="module"> embutido. Nem o eslint nem o
// next build olham para public/, então um erro de sintaxe aqui passa por todos
// os gates e chega em produção com a tela de login travada — foi o que
// aconteceu no commit bd8291c. Este check fecha esse buraco.
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";

const ARQUIVO = "public/admin/index.html";
const html = readFileSync(ARQUIVO, "utf8");
const scripts = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)];

if (scripts.length === 0) {
  console.error(`${ARQUIVO}: nenhum <script> embutido encontrado.`);
  process.exit(1);
}

let falhou = false;
scripts.forEach(([, corpo], i) => {
  const temp = `.painel-check-${i}.mjs`;
  writeFileSync(temp, corpo);
  try {
    execFileSync(process.execPath, ["--check", temp], { stdio: "pipe" });
    console.log(`${ARQUIVO}: script ${i + 1} ok (${corpo.length} bytes)`);
  } catch (erro) {
    falhou = true;
    console.error(`${ARQUIVO}: script ${i + 1} com erro de sintaxe\n${erro.stderr?.toString() || erro.message}`);
  } finally {
    unlinkSync(temp);
  }
});

process.exit(falhou ? 1 : 0);

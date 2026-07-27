// Confere a sintaxe do que nenhum outro gate olha.
//
// 1. O painel é um HTML com <script type="module"> embutido: nem o eslint nem o
//    `next build` leem public/, então um erro ali chega em produção com a tela
//    de login travada — foi o que aconteceu no commit bd8291c.
// 2. As Functions e a lib rodam no Cloudflare, não no build do Next: um erro de
//    sintaxe passa pelo build inteiro e só aparece como API quebrada no ar.
//    O `npm run lint` pega, mas o workflow de deploy não roda lint.
import { readFileSync, writeFileSync, unlinkSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const PAINEL = "public/admin/index.html";

function jsDe(dir, achados = []) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const caminho = join(dir, item.name);
    if (item.isDirectory()) jsDe(caminho, achados);
    else if (item.name.endsWith(".js")) achados.push(caminho);
  }
  return achados;
}

let falhou = false;
let contador = 0;

/**
 * Sempre por arquivo .mjs temporário: `node --check` num .js com sintaxe de
 * módulo não acusa o erro de forma confiável — testado, deixou passar uma
 * string não fechada. Com a extensão .mjs ele parseia como ESM e acusa.
 */
function conferir(rotulo, codigo) {
  const temp = `.check-${contador++}.mjs`;
  writeFileSync(temp, codigo);
  try {
    execFileSync(process.execPath, ["--check", temp], { stdio: "pipe" });
    return true;
  } catch (erro) {
    falhou = true;
    console.error(`${rotulo}: erro de sintaxe\n${erro.stderr?.toString() || erro.message}`);
    return false;
  } finally {
    unlinkSync(temp);
  }
}

const html = readFileSync(PAINEL, "utf8");
const scripts = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)];
if (scripts.length === 0) {
  console.error(`${PAINEL}: nenhum <script> embutido encontrado.`);
  process.exit(1);
}
scripts.forEach(([, corpo], i) => {
  if (conferir(`${PAINEL} (script ${i + 1})`, corpo)) {
    console.log(`${PAINEL}: script ${i + 1} ok (${corpo.length} bytes)`);
  }
});

const modulos = [...jsDe("functions"), ...jsDe("lib")];
for (const caminho of modulos) conferir(caminho, readFileSync(caminho, "utf8"));
if (!falhou) console.log(`functions/ e lib/: ${modulos.length} arquivos, sintaxe ok`);

process.exit(falhou ? 1 : 0);

import { bad, commitFile, json, requireSession, rota } from "../../lib/admin.js";
import { slugify } from "../../lib/validate.js";

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB
const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const casa = (bytes, assinatura, offset = 0) =>
  assinatura.every((byte, i) => bytes[offset + i] === byte);

/** Extensão deduzida dos primeiros bytes do arquivo, ou null se não for imagem. */
function assinatura(bytes) {
  if (bytes.length < 12) return null;
  if (casa(bytes, [0xff, 0xd8, 0xff])) return "jpg";
  if (casa(bytes, PNG)) return "png";
  // WebP: "RIFF" .... "WEBP"
  if (casa(bytes, [0x52, 0x49, 0x46, 0x46]) && casa(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  return null;
}

export const onRequestPost = rota(async ({ request, env }) => {
  const session = await requireSession(request, env);
  if (session instanceof Response) return session;

  const form = await request.formData().catch(() => null);
  const file = form && form.get("file");
  if (!file || typeof file === "string") return bad("Selecione uma imagem.");

  const ext = TYPES[file.type];
  if (!ext) return bad("Formato não aceito. Envie JPG, PNG ou WebP.");
  if (file.size > MAX_BYTES) return bad("Imagem muito grande. O limite é 3 MB.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  // `file.type` é só o que o navegador declarou. Confere a assinatura do arquivo
  // antes de commitar: o repositório é público e serve o que estiver nele.
  if (assinatura(bytes) !== ext) return bad("Esse arquivo não é uma imagem JPG, PNG ou WebP.");

  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }

  // O nome vem do disco do cliente. Sem teto, um arquivo de 300 caracteres
  // gera um path acima do limite de 255 bytes por componente do ext4, e o
  // actions/checkout do deploy passa a falhar para sempre.
  const base =
    slugify(String(file.name || "imagem").replace(/\.[^.]+$/, ""))
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 60) || "imagem";
  const path = `public/images/uploads/${base}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  try {
    await commitFile(env, {
      path,
      base64: btoa(binary),
      message: `midia: upload pelo painel (${session.email})`,
    });
  } catch (error) {
    return bad(`Não consegui enviar a imagem: ${error.message}`, 502);
  }

  // O site serve /public como raiz — o caminho usado no conteúdo não leva "public".
  return json({ ok: true, path: path.replace(/^public/, "") });
});

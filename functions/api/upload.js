import { bad, commitFile, json, requireSession } from "../../lib/admin.js";
import { slugify } from "../../lib/validate.js";

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB
const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function onRequestPost({ request, env }) {
  const session = await requireSession(request, env);
  if (session instanceof Response) return session;

  const form = await request.formData().catch(() => null);
  const file = form && form.get("file");
  if (!file || typeof file === "string") return bad("Selecione uma imagem.");

  const ext = TYPES[file.type];
  if (!ext) return bad("Formato não aceito. Envie JPG, PNG ou WebP.");
  if (file.size > MAX_BYTES) return bad("Imagem muito grande. O limite é 3 MB.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }

  const base = slugify(String(file.name || "imagem").replace(/\.[^.]+$/, "")).replace(/[^a-z0-9-]/g, "") || "imagem";
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
}

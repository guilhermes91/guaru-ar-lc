import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/data/site";

// Sem isto a rota /_not-found/ é exportada e servida com HTTP 200, virando um
// soft-404 indexável com canonical apontando para ela mesma.
export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: true },
  alternates: { canonical: undefined },
};

export default function NaoEncontrada() {
  return (
    <section className="section">
      <div className="container content">
        <h1>Página não encontrada</h1>
        <p>O endereço que você abriu não existe ou foi movido.</p>
        <p>
          <Link href="/">Voltar para a página inicial</Link> · <Link href="/servicos/">Serviços</Link> ·{" "}
          <Link href="/contato/">Contato</Link>
        </p>
        <p>
          <a className="btn whatsapp" href={site.whatsapp()} target="_blank" rel="noopener">
            Falar no WhatsApp
          </a>
        </p>
      </div>
    </section>
  );
}

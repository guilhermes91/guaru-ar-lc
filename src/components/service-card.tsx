import Link from "next/link";
import { ArrowRight, Flame, Snowflake, Waves, Wrench } from "lucide-react";

// Todo ícone aqui precisa existir também em ICONES, em lib/validate.js: é o que
// impede o painel de salvar um serviço com ícone que o site não sabe desenhar.
const icons = { Snowflake, Flame, Waves, Wrench };
const accent = { Snowflake: "ac", Flame: "heat", Waves: "pool", Wrench: "tool" } as const;

export function ServiceCard({ service }: { service: { slug: string; title: string; icon: string; short: string; image: string } }) {
  const Icon = icons[service.icon as keyof typeof icons] ?? Wrench;
  const cor = accent[service.icon as keyof typeof accent] ?? "tool";
  return (
    <Link href={`/servicos/${service.slug}`} className="svc" data-accent={cor}>
      <div className="svc-media" style={{ backgroundImage: `url(${service.image})` }}>
        <span className="svc-icon"><Icon /></span>
      </div>
      <div className="svc-info">
        <h3>{service.title}</h3>
        <p>{service.short}</p>
      </div>
      <span className="svc-go"><ArrowRight /></span>
    </Link>
  );
}

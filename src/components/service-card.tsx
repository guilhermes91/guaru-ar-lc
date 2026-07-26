import Link from "next/link";
import { ArrowRight, Flame, Snowflake, Waves } from "lucide-react";

const icons = { Snowflake, Flame, Waves };
const accent = { Snowflake: "ac", Flame: "heat", Waves: "pool" } as const;

export function ServiceCard({ service }: { service: { slug: string; title: string; icon: string; short: string; image: string } }) {
  const Icon = icons[service.icon as keyof typeof icons];
  return (
    <Link href={`/servicos/${service.slug}`} className="svc" data-accent={accent[service.icon as keyof typeof accent]}>
      <div className="svc-media" style={{ backgroundImage: `url(${service.image})` }}>
        <span className="svc-icon">{Icon && <Icon />}</span>
      </div>
      <div className="svc-info">
        <h3>{service.title}</h3>
        <p>{service.short}</p>
      </div>
      <span className="svc-go"><ArrowRight /></span>
    </Link>
  );
}

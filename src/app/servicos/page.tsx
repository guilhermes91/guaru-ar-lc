import type { Metadata } from "next"; import { ServiceCard } from "@/components/service-card"; import { services } from "@/data/site";
import { metaDaPagina } from "@/app/seo";
export const metadata: Metadata = metaDaPagina({
  title: "Serviços",
  description: "Manutenção, limpeza, instalação e reparos em ar-condicionado, aquecedores e piscinas no Guarujá.",
});
export default function Services(){return <><section className="page-hero"><div className="container"><span className="eyebrow">Soluções completas</span><h1>Serviços Guaru Ar LC</h1><p>Cuidado técnico para manter seus ambientes confortáveis, seguros e funcionando bem durante todo o ano.</p></div></section><section className="section"><div className="container"><h2 className="sr-only">Nossos serviços</h2><div className="svc-grid">{services.map(s=><ServiceCard key={s.slug} service={s}/>)}</div></div></section></>}

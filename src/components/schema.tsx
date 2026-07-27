import { serviceAreaCities } from "@/data/brands";
import { site, texts } from "@/data/site";

// JSON.stringify não escapa "<": sem isso, um "</script>" digitado no painel
// fecharia a tag e injetaria HTML em todas as páginas do site.
const seguro = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");

export function LocalBusinessSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: site.legalName,
    url: site.url,
    logo: `${site.url}/logo-guaruar.png`,
    // `image` é obrigatório para rich result de LocalBusiness.
    image: [`${site.url}/og-guaruar.jpg`],
    description: texts.heroSubtitle,
    // Campo vazio no painel viraria sameAs: [""] — URL inválida no dado estruturado.
    sameAs: [site.social.facebook, site.social.instagram].filter(Boolean),
    telephone: `+${site.phone}`,
    email: site.email,
    // Endereço vem inteiro do painel: quebrar em campos fixos aqui faria o dado
    // estruturado descolar do que o site mostra quando o cliente mudar de sede.
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address,
      addressCountry: "BR",
    },
    areaServed: serviceAreaCities.map((city) => ({ "@type": "City", name: city })),
    priceRange: "$$",
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: seguro(data) }} />;
}

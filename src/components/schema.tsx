import { serviceAreaCities } from "@/data/brands";
import { site } from "@/data/site";

export function LocalBusinessSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: site.legalName,
    url: site.url,
    logo: `${site.url}/logo-guaruar-transparente.png`,
    sameAs: [site.social.facebook, site.social.instagram],
    telephone: `+${site.phone}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Av. Rio Amazonas, 397",
      addressLocality: "Guarujá",
      addressRegion: "SP",
      postalCode: "11446-131",
      addressCountry: "BR",
    },
    areaServed: serviceAreaCities.map((city) => ({ "@type": "City", name: city })),
    priceRange: "$$",
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

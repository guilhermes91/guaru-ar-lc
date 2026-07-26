import { site } from "@/data/site";
import { WhatsAppIcon } from "./logo";

export function WhatsAppFloat() {
  return (
    <a className="wa-float" href={site.whatsapp()} target="_blank" rel="noopener" aria-label="Falar com a Guaru Ar LC pelo WhatsApp">
      <WhatsAppIcon />
    </a>
  );
}

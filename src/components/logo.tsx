import Link from "next/link";
import { site } from "@/data/site";

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label={`${site.name} - início`}>
      <img
        className="logo-img"
        src="/logo-guaruar.png"
        alt={site.name}
        width="308"
        height="195"
        decoding="async"
        style={{
          display: "block",
          width: "clamp(132px, 14vw, 154px)",
          height: "clamp(58px, 6.2vw, 68px)",
          objectFit: "contain",
          objectPosition: "left center",
          filter: "drop-shadow(0 4px 10px rgba(10, 43, 82, .14))",
        }}
      />
    </Link>
  );
}

export function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 8.5V7c0-.9.6-1 1-1h2V3h-3c-2.4 0-4 1.6-4 4v1.5H8V12h2v9h3v-9h2.4l.6-3.5H13z" />
    </svg>
  );
}

export function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 3C9 3 3.5 8.5 3.5 15.4c0 2.4.7 4.7 1.9 6.7L3 29l7.2-2.3c1.9 1 4 1.6 6.1 1.6 6.9 0 12.5-5.5 12.5-12.4S22.9 3 16 3zm0 22.6c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.3 1.4 1.4-4.1-.2-.4c-1.1-1.7-1.6-3.6-1.6-5.6C5.7 9.8 10.3 5.3 16 5.3s10.3 4.5 10.3 10.1S21.7 25.6 16 25.6zm5.6-7.5c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-.9 1.2-.3.2-.6.1c-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1s0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5s0-.4 0-.5-.7-1.7-1-2.3c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1.1 1-1.1 2.5 1.1 2.9 1.3 3.1c.2.2 2.2 3.4 5.4 4.8.8.3 1.3.5 1.8.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4z" />
    </svg>
  );
}

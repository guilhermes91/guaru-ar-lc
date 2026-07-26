"use client";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo, WhatsAppIcon } from "./logo";
import { services, site } from "@/data/site";

export function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <header className="header">
      <div className="container nav">
        <Logo />
        <nav className={open ? "navlinks open" : "navlinks"}>
          <Link href="/" onClick={close}>Início</Link>
          <div className="drop">
            <span>Serviços <ChevronDown size={15} /></span>
            <div className="drop-menu">
              {services.map((s) => (
                <Link key={s.slug} href={`/servicos/${s.slug}`} onClick={close}>{s.title}</Link>
              ))}
            </div>
          </div>
          <Link href="/produtos" onClick={close}>Produtos</Link>
          <Link href="/assistencia-autorizada" onClick={close}>Marcas</Link>
          <Link href="/#como-funciona" onClick={close}>Como funciona</Link>
          <Link href="/#sobre" onClick={close}>Sobre nós</Link>
          <Link href="/#areas" onClick={close}>Áreas de atendimento</Link>
          <Link href="/contato" onClick={close}>Contato</Link>
        </nav>
        <a className="btn whatsapp nav-cta" href={site.whatsapp()} target="_blank" rel="noopener">
          <WhatsAppIcon /> Solicitar orçamento
        </a>
        <div className="nav-mobile">
          <a className="wa-btn" href={site.whatsapp()} target="_blank" rel="noopener" aria-label="WhatsApp">
            <WhatsAppIcon />
          </a>
          <button className="burger" aria-label="Abrir menu" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}

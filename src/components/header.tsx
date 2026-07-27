"use client";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo, WhatsAppIcon } from "./logo";
import { services, site } from "@/data/site";

export function Header() {
  const [open, setOpen] = useState(false);
  const [servicos, setServicos] = useState(false);
  const botaoServicos = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);
  const cabecalho = useRef<HTMLElement>(null);
  const close = () => {
    setOpen(false);
    setServicos(false);
  };

  // No mobile o menu aberto é um painel branco opaco por cima da página, mas o
  // resto do documento continuava na ordem de tabulação: quem abria o menu pelo
  // teclado e apertava Tab caminhava por links invisíveis atrás do painel — o
  // cursor sumia da tela e o Enter levava para uma página que ninguém escolheu.
  // `inert` tira do alcance do teclado tudo que está atrás, e o foco entra no
  // menu para o Tab percorrer o que está de fato visível.
  // Tudo que não é o cabeçalho sai do alcance do teclado. Listar as tags não
  // resolve: o rodapé renderiza a chamada final como <section> irmã de
  // <footer>, fora do <main>, e ela continuava alcançável por Tab.
  useEffect(() => {
    if (!open) return;
    const atras = [...document.body.children].filter(
      (no) => no !== cabecalho.current && !no.hasAttribute("inert"),
    );
    for (const no of atras) no.setAttribute("inert", "");
    menu.current?.querySelector("a")?.focus();
    return () => {
      for (const no of atras) no.removeAttribute("inert");
    };
  }, [open]);

  return (
    <header ref={cabecalho} className="header">
      <div className="container nav">
        <Logo />
        <nav ref={menu} className={open ? "navlinks open" : "navlinks"}>
          <Link href="/" onClick={close}>Início</Link>
          {/* Botão, não span: no desktop o submenu abre no :hover e no :focus-within,
              então quem navega por teclado alcança os serviços pelo Tab.
              No mobile o CSS deixa a lista sempre visível — por isso o aria-expanded
              considera o menu aberto, senão o leitor de tela anunciaria "recolhido"
              com os links à mostra. */}
          <div
            className="drop"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setServicos(false);
            }}
            onKeyDown={(e) => {
              if (e.key !== "Escape") return;
              setServicos(false);
              // Tirar o foco de dentro do submenu é o que realmente fecha:
              // o CSS o mantém aberto enquanto :focus-within casar.
              botaoServicos.current?.focus();
            }}
          >
            <button
              ref={botaoServicos}
              type="button"
              aria-expanded={open || servicos}
              aria-controls="submenu-servicos"
              onClick={() => setServicos(!servicos)}
            >
              Serviços <ChevronDown size={15} />
            </button>
            <div id="submenu-servicos" className="drop-menu" data-aberto={servicos ? "sim" : undefined}>
              {services.map((s) => (
                <Link key={s.slug} href={`/servicos/${s.slug}`} onClick={close}>{s.title}</Link>
              ))}
            </div>
          </div>
          <Link href="/produtos" onClick={close}>Produtos</Link>
          <Link href="/assistencia-especializada" onClick={close}>Marcas</Link>
          <Link href="/#como-funciona" onClick={close}>Como funciona</Link>
          <Link href="/#sobre" onClick={close}>Sobre nós</Link>
          <Link href="/guaruja/" onClick={close}>Áreas de atendimento</Link>
          <Link href="/contato" onClick={close}>Contato</Link>
        </nav>
        <a className="btn whatsapp nav-cta" href={site.whatsapp()} target="_blank" rel="noopener">
          <WhatsAppIcon /> Solicitar orçamento
        </a>
        <div className="nav-mobile">
          <a className="wa-btn" href={site.whatsapp()} target="_blank" rel="noopener" aria-label="WhatsApp">
            <WhatsAppIcon />
          </a>
          <button
            className="burger"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}

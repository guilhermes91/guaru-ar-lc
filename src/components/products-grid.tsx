"use client";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { WhatsAppIcon } from "./logo";
import { site } from "@/data/site";

type Item = { id: string; name: string; price: number; images: string[] };

const SLATS = 7;          // nº de "lâminas" da persiana
const STEP_MS = 820;      // ~duração da persiana: cada produto emenda no próximo (cascata contínua)

// estúdio (índice 0) usa contain (produto em fundo branco); em uso usa cover.
const fitOf = (i: number) => (i === 0 ? "contain" : "cover");

function ProductCard({ item, turn }: { item: Item; turn: number }) {
  const swappable = item.images.length > 1;
  // idx e pulse derivam do turno em vez de virem de setState dentro de um efeito:
  // menos estado, e sem a cascata de renders que o react-hooks aponta.
  const idx = swappable ? turn % item.images.length : 0;
  const pulse = swappable ? turn : 0;

  const outgoing = item.images[(idx + item.images.length - 1) % item.images.length];
  const outFit = fitOf((idx + item.images.length - 1) % item.images.length);

  return (
    <a
      className="prod-card"
      target="_blank"
      rel="noopener"
      href={site.whatsapp(`Olá! Vi "${item.name}" na vitrine da Guaru Ar LC e gostaria de saber mais.`)}
    >
      <div className="prod-media" role="img" aria-label={item.name}>
        <span className="prod-frame" style={{ backgroundImage: `url(${item.images[idx]})`, backgroundSize: fitOf(idx) }} />
        {pulse > 0 && (
          <div className="slats" key={pulse} aria-hidden="true">
            {Array.from({ length: SLATS }).map((_, s) => (
              <span className="slat" key={s} style={{ "--i": s } as CSSProperties}>
                <span
                  className="slat-img"
                  style={{ backgroundImage: `url(${outgoing})`, backgroundSize: outFit, width: `${SLATS * 100}%`, left: `${-s * 100}%` }}
                />
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="prod-body">
        <h3>{item.name}</h3>
        <div className="prod-price"><span>a partir de</span><b>R$ {item.price.toLocaleString("pt-BR")}</b></div>
        <span className="prod-cta"><WhatsAppIcon /> Consultar no WhatsApp</span>
      </div>
    </a>
  );
}

export function ProductsGrid({ items }: { items: Item[] }) {
  // turnos[i] incrementa quando é a vez do card i (troca sequencial, em cascata)
  const [turns, setTurns] = useState<number[]>(() => items.map(() => 0));
  const cursor = useRef(0);

  useEffect(() => {
    if (items.length === 0) return;
    // Quem pediu "reduzir movimento" no sistema não recebe a troca automática:
    // o CSS já encurta a animação das lâminas, mas o timer continuava rodando.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      const i = cursor.current % items.length;
      cursor.current += 1;
      setTurns((prev) => {
        const next = [...prev];
        next[i] += 1;
        return next;
      });
    }, STEP_MS);
    return () => clearInterval(t);
  }, [items.length]);

  return (
    <div className="prod-grid">
      {items.map((item, i) => <ProductCard key={item.id} item={item} turn={turns[i]} />)}
    </div>
  );
}

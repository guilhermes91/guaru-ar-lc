"use client";
import { ChevronsLeftRight } from "lucide-react";
import { useState } from "react";

export function BeforeAfter({ before, after, label }: { before: string; after: string; label: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="ba">
      <div className="ba-slider">
        <div className="ba-layer ba-before" style={{ backgroundImage: `url(${before})` }} />
        {/* Recorta pela ESQUERDA: a camada "depois" tem que ficar do lado direito,
            que é onde está o selo "Depois". Recortando pela direita ela aparecia
            sob o selo "Antes", e os três cards da home anunciavam o equipamento
            sujo como sendo o resultado do serviço. */}
        <div className="ba-layer ba-after" style={{ backgroundImage: `url(${after})`, clipPath: `inset(0 0 0 ${pos}%)` }} />
        <span className="ba-tag b">Antes</span>
        <span className="ba-tag a">Depois</span>
        <div className="ba-handle" style={{ left: `${pos}%` }} />
        <div className="ba-knob" style={{ left: `${pos}%` }}><ChevronsLeftRight /></div>
        <input
          className="ba-range"
          type="range"
          min={0}
          max={100}
          value={pos}
          aria-label={`Antes e depois — ${label}`}
          onChange={(e) => setPos(Number(e.target.value))}
        />
      </div>
      <div className="ba-label">{label}</div>
    </div>
  );
}

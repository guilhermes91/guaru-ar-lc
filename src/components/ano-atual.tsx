"use client";
import { useSyncExternalStore } from "react";

const ANO_DO_BUILD = new Date().getFullYear();

// getSnapshot precisa devolver sempre o mesmo valor entre chamadas — e devolve,
// dentro do mesmo ano.
const semInscricao = () => () => {};
const anoNoNavegador = () => new Date().getFullYear();
const anoNoBuild = () => ANO_DO_BUILD;

/**
 * O site é export estático: `new Date()` num Server Component congela o ano no
 * momento do build. Se o cliente passar um ano inteiro sem publicar nada, o
 * rodapé afirma um ano errado em todas as páginas. O HTML sai com o ano do
 * build (para o crawler e para quem está sem JS) e o navegador corrige na
 * virada do ano.
 */
export function AnoAtual() {
  return <>{useSyncExternalStore(semInscricao, anoNoNavegador, anoNoBuild)}</>;
}

/**
 * Renderiza um título destacando a primeira ocorrência de `highlight` com <em>.
 * Se a palavra não existir no texto, o título sai inteiro — nunca quebra.
 */
export function HighlightedTitle({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight) return <>{text}</>;

  const at = text.indexOf(highlight);
  if (at < 0) return <>{text}</>;

  return (
    <>
      {text.slice(0, at)}
      <em>{highlight}</em>
      {text.slice(at + highlight.length)}
    </>
  );
}

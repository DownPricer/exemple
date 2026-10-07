/** Remplace le contenu intérieur d’un élément identifié par id (balises imbriquées gérées). */
export function replaceInnerById(html, id, inner) {
  const openRe = new RegExp(`<([a-z][a-z0-9]*)[^>]*\\sid=["']${id}["'][^>]*>`, "i");
  const m = openRe.exec(html);
  if (!m) return html;
  const tag = m[1].toLowerCase();
  const contentStart = m.index + m[0].length;
  const closeStart = findMatchingCloseTagIndex(html, contentStart, tag);
  if (closeStart === -1) return html;
  return html.slice(0, contentStart) + inner + html.slice(closeStart);
}

export function findMatchingCloseTagIndex(html, from, tag) {
  const openRe = new RegExp(`<${tag}(\\s[^>]*)?>`, "gi");
  const closeRe = new RegExp(`</${tag}>`, "gi");
  let depth = 1;
  let pos = from;
  while (depth > 0 && pos < html.length) {
    openRe.lastIndex = pos;
    closeRe.lastIndex = pos;
    const openMatch = openRe.exec(html);
    const closeMatch = closeRe.exec(html);
    if (!closeMatch) return -1;
    if (openMatch && openMatch.index < closeMatch.index) {
      depth += 1;
      pos = openMatch.index + openMatch[0].length;
    } else {
      depth -= 1;
      if (depth === 0) return closeMatch.index;
      pos = closeMatch.index + closeMatch[0].length;
    }
  }
  return -1;
}
